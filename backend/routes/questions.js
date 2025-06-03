// backend/routes/questions.js - UPDATED FOR EXTERNAL PROMPT
const express = require('express');
const axios = require('axios');
const router = express.Router();
const { QUESTION_GENERATOR_PROMPT_TEMPLATE } = require('../config/prompts'); // Yeni import

// Question Generator Class
class QuestionGenerator {
  constructor(geminiApiKey) {
    this.geminiApiKey = geminiApiKey;
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent';
  }

  async generateQuestionForWord(wordContext) { // 'word' objesi yerine 'wordContext' gibi daha açıklayıcı bir isim
    const prompt = QUESTION_GENERATOR_PROMPT_TEMPLATE(wordContext); // Prompt'u buradan çağırıyoruz

    try {
      console.log(`🤖 Soru oluşturuluyor: ${wordContext.word}`);

      const response = await axios.post(
        `${this.apiUrl}?key=${this.geminiApiKey}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        },
        {
          timeout: 30000, // 30 saniye timeout
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const geminiResponse = response.data;
      
      if (!geminiResponse.candidates || geminiResponse.candidates.length === 0) {
        throw new Error('Gemini API\'den geçersiz yanıt (soru üretimi)');
      }

      const generatedText = geminiResponse.candidates[0].content.parts[0].text;
      
      const cleanedText = generatedText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const questionData = JSON.parse(cleanedText);
      
      if (!this.isValidQuestionFormat(questionData)) {
        console.error('Geçersiz Soru Formatı Gelen Veri:', JSON.stringify(questionData, null, 2));
        throw new Error(`Geçersiz soru formatı Gemini'den alındı: ${wordContext.word}`);
      }

      console.log(`✅ Soru oluşturuldu: ${wordContext.word}`);
      return { success: true, data: questionData };

    } catch (error) {
      console.error(`❌ ${wordContext.word} için soru oluşturma hatası:`, error.message);
      // Hata durumunda, Gemini'den gelen ham yanıtı loglamak faydalı olabilir (eğer varsa)
      if (error.response && error.response.data) {
        console.error('Gemini Hata Detayı:', JSON.stringify(error.response.data, null, 2));
      }
      return { success: false, error: error.message };
    }
  }

  isValidQuestionFormat(data) {
    const requiredFields = [
      'question_text', 'option_a', 'option_b', 'option_c', 'option_d',
      'correct_answer', 'explanation', 'difficulty'
    ];
    
    const hasAllFields = requiredFields.every(field => data && typeof data[field] === 'string' && data[field].trim() !== '');
    const isCorrectAnswerValid = data && ['A', 'B', 'C', 'D'].includes(data.correct_answer);
    const isDifficultyValid = data && ['beginner', 'intermediate', 'advanced'].includes(data.difficulty);

    if (!hasAllFields) console.warn('Eksik alanlar:', data);
    if (!isCorrectAnswerValid) console.warn('Geçersiz doğru cevap:', data?.correct_answer);
    if (!isDifficultyValid) console.warn('Geçersiz zorluk:', data?.difficulty);
    
    return hasAllFields && isCorrectAnswerValid && isDifficultyValid;
  }
}

// ... (geri kalan route handler'lar aynı)
// POST /api/questions/generate - Seçili kelimeler için soru oluştur
router.post('/generate', async (req, res) => {
  try {
    const { wordIds } = req.body;
    
    if (!wordIds || !Array.isArray(wordIds) || wordIds.length === 0) {
      return res.status(400).json({
        error: 'Kelime ID listesi gerekli',
        message: 'Lütfen soru oluşturulacak kelimeleri seçin'
      });
    }

    if (wordIds.length > 50) { // Sınır isteğe bağlı
      return res.status(400).json({
        error: 'Çok fazla kelime',
        message: 'Bir seferde maksimum 50 kelime için soru oluşturabilirsiniz'
      });
    }

    const { data: words, error: fetchError } = await req.supabase
      .from('words')
      .select('id, word, english_example, turkish_meaning, part_of_speech, final_difficulty') // Sadece gerekli alanları çek
      .in('id', wordIds)
      .eq('is_active', true);

    if (fetchError) {
      throw fetchError;
    }

    if (!words || words.length === 0) {
      return res.status(404).json({
        error: 'Kelime bulunamadı',
        message: 'Seçili ve aktif kelimeler bulunamadı veya istenen detaylara sahip değil.'
      });
    }

    console.log(`📝 ${words.length} kelime için soru oluşturma başlatılıyor...`);

    const questionGenerator = new QuestionGenerator(process.env.GEMINI_API_KEY);
    const results = {
      successful: [],
      failed: [],
      total: words.length,
      processingTime: 0 // Genel işlem süresi için
    };
    const overallStartTime = Date.now();

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const singleWordStartTime = Date.now();
      
      try {
        const { data: existingQuestion, error: checkError } = await req.supabase
          .from('questions')
          .select('id')
          .eq('word_id', word.id)
          .maybeSingle(); // .single() yerine .maybeSingle() kullanmak, kayıt yoksa hata vermez

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116: No rows found
          throw checkError;
        }
        
        if (existingQuestion) {
          results.failed.push({
            word: word.word,
            wordId: word.id,
            reason: 'Bu kelime için zaten aktif bir soru mevcut'
          });
          continue;
        }

        const questionResult = await questionGenerator.generateQuestionForWord(word); // 'word' objesini direkt yolla
        
        if (questionResult.success) {
          const { data: insertedQuestion, error: insertError } = await req.supabase
            .from('questions')
            .insert([{
              word_id: word.id,
              question_text: questionResult.data.question_text,
              option_a: questionResult.data.option_a,
              option_b: questionResult.data.option_b,
              option_c: questionResult.data.option_c,
              option_d: questionResult.data.option_d,
              correct_answer: questionResult.data.correct_answer,
              explanation: questionResult.data.explanation,
              difficulty: questionResult.data.difficulty,
              paragraph: word.english_example, // Context cümlesi
              times_shown: 0,
              times_correct: 0,
              is_active: true, // Varsayılan olarak aktif
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }])
            .select()
            .single();

          if (insertError) {
            throw insertError;
          }

          results.successful.push({
            word: word.word,
            wordId: word.id,
            questionId: insertedQuestion.id,
            processingTime: Date.now() - singleWordStartTime
          });
        } else {
          results.failed.push({
            word: word.word,
            wordId: word.id,
            reason: questionResult.error
          });
        }
        
        if (i < words.length - 1) {
          await new Promise(resolve => setTimeout(resolve, process.env.QUESTION_GENERATION_DELAY_MS || 1000));
        }

      } catch (wordError) {
        console.error(`❌ ${word.word} için soru işleme/kaydetme hatası:`, wordError);
        results.failed.push({
          word: word.word,
          wordId: word.id,
          reason: wordError.message,
          error: wordError.stack // Daha detaylı hata için
        });
      }
    }
    results.processingTime = Date.now() - overallStartTime;

    const summary = {
      generated: results.successful.length,
      failed: results.failed.length,
      // duplicate: 0, // Bu senaryoda duplicate kontrolü (aynı word_id için soru var mı) yapıldı
      total: results.total
    };

    console.log(`🎉 Soru oluşturma tamamlandı: ${summary.generated} başarılı, ${summary.failed} başarısız. Süre: ${results.processingTime}ms`);

    res.json({
      message: 'Soru oluşturma işlemi tamamlandı',
      results: { // Frontend'in beklediği yapıya uygun
        successful: results.successful,
        failed: results.failed,
        successCount: results.successful.length,
        failureCount: results.failed.length,
        total: results.total,
        processingTime: results.processingTime
      },
      summary
    });

  } catch (error) {
    console.error('❌ Genel soru oluşturma API hatası:', error);
    res.status(500).json({
      error: 'Soru oluşturma sırasında sunucu hatası',
      message: error.message,
      detail: error.stack // Geliştirme ortamında detaylı hata
    });
  }
});


// GET /api/questions - Soru listesi (JOIN ile kelime bilgisi dahil)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10; // Frontend'deki useQuestionManagementLogic'e uygun
    const searchTerm = req.query.searchTerm;
    const difficulty = req.query.difficulty;
    const type = req.query.type; // Soru tipi (multiple_choice, fill_in_the_blank vb.)
    const source = req.query.source; // Soru kaynağı (AI, manual vb.)
    const hasEmbedding = req.query.hasEmbedding; // Embedding var mı yok mu?
    const sortBy = req.query.sortBy || 'created_at';
    const sortOrder = req.query.sortOrder || 'desc';

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    let query = req.supabase
      .from('questions')
      .select(`
        *,
        word:words!inner ( 
          id, word, meaning_id, part_of_speech, 
          meaning_description, turkish_meaning, final_difficulty
        )
      `, { count: 'exact' }); // `word:words(...)` alias kullanımı
    
    // Filtreler
    if (searchTerm) {
      query = query.or(`question_text.ilike.%${searchTerm}%,words.word.ilike.%${searchTerm}%,explanation.ilike.%${searchTerm}%`);
    }
    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }
    if (type) {
      // 'type' alanı 'questions' tablosunda varsa bu filtre eklenebilir
      // query = query.eq('type', type); 
      console.warn("Soru tipi (type) filtresi 'questions' tablosunda tanımlı değil gibi, bu filtre atlanıyor.");
    }
    if (source) {
      // 'source' alanı 'questions' tablosunda varsa bu filtre eklenebilir
      // query = query.eq('source', source);
      console.warn("Soru kaynağı (source) filtresi 'questions' tablosunda tanımlı değil gibi, bu filtre atlanıyor.");
    }
    if (hasEmbedding !== undefined) {
      // 'has_embedding' alanı 'questions' tablosunda varsa bu filtre eklenebilir
      // query = query.eq('has_embedding', hasEmbedding === 'true');
      console.warn("Soru embedding (hasEmbedding) filtresi 'questions' tablosunda tanımlı değil gibi, bu filtre atlanıyor.");
    }
    
    // Sıralama
    const sortOptions = { ascending: sortOrder === 'asc' };
    if (sortBy === 'word') {
      query = query.order('word', { foreignTable: 'words', ...sortOptions });
    } else {
      query = query.order(sortBy, sortOptions);
    }
    
    query = query.range(from, to);
    
    const { data: questionsData, error, count } = await query;
    
    if (error) {
      throw error;
    }
    
    res.json({
      // Frontend hook'unun beklediği "data" ve "pagination" alanları
      data: questionsData || [], 
      pagination: {
        currentPage: page,
        totalPages: Math.ceil((count || 0) / limit),
        totalItems: count || 0, // totalQuestions yerine totalItems
        itemsPerPage: limit, // itemsPerPage eklendi
        hasNext: page < Math.ceil((count || 0) / limit),
        hasPrev: page > 1
      }
    });
    
  } catch (error) {
    console.error('❌ Soru listesi hatası:', error);
    res.status(500).json({
      error: 'Sorular yüklenirken hata oluştu',
      message: error.message
    });
  }
});

// GET /api/questions/stats - Soru istatistikleri
router.get('/stats', async (req, res) => {
  try {
    const { count: totalQuestions, error: totalError } = await req.supabase
      .from('questions')
      .select('*', { count: 'exact', head: true });

    const { count: activeQuestions, error: activeError } = await req.supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    const { data: difficultyData, error: difficultyError } = await req.supabase
      .from('questions')
      .select('difficulty')
      .eq('is_active', true);

    // kelime türü dağılımı için join
    const { data: partOfSpeechData, error: posError } = await req.supabase
        .from('questions')
        .select('words!inner(part_of_speech)')
        .eq('is_active', true);


    if (totalError || activeError || difficultyError || posError) {
      console.error("Stats fetch error:", totalError || activeError || difficultyError || posError);
      throw totalError || activeError || difficultyError || posError;
    }

    const difficultyBreakdown = { beginner: 0, intermediate: 0, advanced: 0 };
    if (difficultyData) {
      difficultyData.forEach(item => {
        if (difficultyBreakdown.hasOwnProperty(item.difficulty)) {
          difficultyBreakdown[item.difficulty]++;
        }
      });
    }
    
    const partOfSpeechBreakdown = {};
    if (partOfSpeechData) {
        partOfSpeechData.forEach(item => {
            const pos = item.words.part_of_speech;
            partOfSpeechBreakdown[pos] = (partOfSpeechBreakdown[pos] || 0) + 1;
        });
    }


    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: recentQuestions, error: recentError } = await req.supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', twentyFourHoursAgo);

    if (recentError) throw recentError;

    // Ortalama doğru cevaplama oranı ve en çok gösterilen kelimeler için
    // 'question_attempts' gibi bir tabloya veya 'questions' tablosundaki
    // 'times_shown', 'times_correct' alanlarına ihtiyaç var. Şimdilik placeholder.
    const averageCorrectRate = 0; 
    const mostShownWords = [];

    res.json({
      totalQuestions: totalQuestions || 0,
      activeQuestions: activeQuestions || 0,
      difficultyBreakdown,
      partOfSpeechBreakdown,
      recentQuestions: recentQuestions || 0,
      averageCorrectRate,
      mostShownWords
    });

  } catch (error) {
    console.error('❌ Soru istatistikleri hatası:', error);
    res.status(500).json({
      error: 'Soru istatistikleri alınamadı',
      message: error.message
    });
  }
});

// PUT /api/questions/:id - Soru güncelle (QuestionManagement.tsx'deki modal ile uyumlu)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Frontend'den gelen options ve correct_options alanlarını ana tabloya uygun hale getir
    const questionUpdates = { ...updates };
    if (updates.options && Array.isArray(updates.options)) {
      questionUpdates.option_a = updates.options[0] || null;
      questionUpdates.option_b = updates.options[1] || null;
      questionUpdates.option_c = updates.options[2] || null;
      questionUpdates.option_d = updates.options[3] || null;
      delete questionUpdates.options;
    }
    
    // correct_options genellikle tek bir değer ('A', 'B', 'C', 'D') veya metin olarak gelir.
    // Eğer metin olarak geliyorsa, 'A', 'B', 'C', 'D' formatına dönüştürülmeli.
    // Şimdilik frontend'den doğru formatta ('A'|'B'|'C'|'D') geldiğini varsayıyoruz.
    if (updates.correct_options && Array.isArray(updates.correct_options) && updates.correct_options.length > 0) {
        // Eğer frontend option metnini gönderiyorsa, bunu 'A', 'B', 'C', 'D'ye çevir.
        // Bu kısım daha karmaşık olabilir, frontend'in ne gönderdiğine bağlı.
        // Şimdilik, 'correct_answer' alanının doğrudan güncellendiğini varsayalım.
        // Eğer correct_options bir array ise ve içinde ['A'] gibi bir değer varsa:
        if (['A', 'B', 'C', 'D'].includes(updates.correct_options[0])) {
            questionUpdates.correct_answer = updates.correct_options[0];
        }
        delete questionUpdates.correct_options;
    }


    // Güvenlik için sadece belirli alanların güncellenmesine izin ver
    const allowedFields = [
      'question_text', 'option_a', 'option_b', 'option_c', 'option_d',
      'correct_answer', 'explanation', 'is_active', 'difficulty', 'paragraph' 
      // 'type' alanı eğer eklenirse buraya da eklenmeli
    ];
    
    const filteredUpdates = {};
    for (const key in questionUpdates) {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = questionUpdates[key];
      }
    }
    
    filteredUpdates.updated_at = new Date().toISOString();
    
    const { data, error } = await req.supabase
      .from('questions')
      .update(filteredUpdates)
      .eq('id', id)
      .select(`*, word:words!inner (id, word, meaning_id, part_of_speech, meaning_description, turkish_meaning, final_difficulty)`)
      .single();
    
    if (error) {
      throw error;
    }
    
    if (!data) {
      return res.status(404).json({
        error: 'Soru bulunamadı',
        message: 'Güncellenecek soru bulunamadı'
      });
    }
    
    res.json(data); // Frontend'in beklediği gibi güncellenmiş soruyu döndür
    
  } catch (error) {
    console.error('❌ Soru güncelleme hatası:', error);
    res.status(500).json({
      error: 'Soru güncellenirken hata oluştu',
      message: error.message
    });
  }
});


// DELETE /api/questions/:id - Soru sil
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await req.supabase
      .from('questions')
      .delete()
      .eq('id', id)
      .select() // Silinen kaydı (veya sayısını) döndürmek için
      .single(); // Tek kayıt silindiği için
    
    if (error) {
      throw error;
    }

    if (!data) { // Eğer data null ise kayıt bulunamamış ve silinememiştir
        return res.status(404).json({
            error: 'Soru bulunamadı',
            message: 'Silinecek soru bulunamadı'
        });
    }
    
    res.json({
      message: `Soru (ID: ${id}) başarıyla silindi`,
      deletedQuestionId: id
    });
    
  } catch (error) {
    console.error('❌ Soru silme hatası:', error);
    res.status(500).json({
      error: 'Soru silinirken hata oluştu',
      message: error.message
    });
  }
});

// POST /api/questions/bulk-delete - Toplu soru silme (hook ile uyumlu)
router.post('/bulk-delete', async (req, res) => {
  try {
    const { questionIds } = req.body;

    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({ error: 'Soru ID listesi gerekli' });
    }

    const { data, error, count } = await req.supabase
      .from('questions')
      .delete()
      .in('id', questionIds);

    if (error) {
      throw error;
    }
    
    // `count` Supabase v2'de delete için doğrudan dönmeyebilir, `data`'nın uzunluğuna bakılabilir (eğer select ile dönülürse)
    // Veya frontend'e sadece başarı durumu iletmek yeterli olabilir.
    // Supabase-js v2 delete() by default returns no data unless .select() is chained.
    // The `count` returned from delete is usually the number of rows matched, not necessarily deleted successfully without RLS issues.
    // For simplicity, we assume success if no error.

    res.json({
      message: `${questionIds.length} soru silme isteği gönderildi.`,
      deletedCount: questionIds.length, // Bu, eşleşen satır sayısıdır, RLS'e bağlı olarak silinmeyebilir.
      failedCount: 0, // Basit bir implementasyon, daha detaylı hata takibi eklenebilir.
      errors: []
    });

  } catch (error) {
    console.error('❌ Toplu soru silme hatası:', error);
    res.status(500).json({
      error: 'Toplu silme işlemi başarısız',
      message: error.message,
      failedCount: req.body.questionIds?.length || 0,
      errors: [error.message]
    });
  }
});

module.exports = router;