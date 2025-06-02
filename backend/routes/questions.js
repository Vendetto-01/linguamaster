// backend/routes/questions.js - SORU YÖNETİMİ ROUTES
const express = require('express');
const axios = require('axios');
const router = express.Router();

// Question Generator Class
class QuestionGenerator {
  constructor(geminiApiKey) {
    this.geminiApiKey = geminiApiKey;
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent';
  }

  async generateQuestionForWord(word) {
    const prompt = `Create a multiple choice question for the English word: "${word.word}"

Context: Use this example sentence: "${word.english_example}"
Turkish meaning: "${word.turkish_meaning}"
Part of speech: "${word.part_of_speech}"
Difficulty: "${word.final_difficulty}"

Requirements:
- Question should test understanding of the word in context
- 4 options (A, B, C, D) with only one correct answer
- 3 distractors should be plausible but clearly wrong
- Include a brief explanation for the correct answer
- Match the difficulty level: ${word.final_difficulty}

Return ONLY a JSON object with this exact structure:
{
  "question_text": "Complete question here",
  "option_a": "First option",
  "option_b": "Second option", 
  "option_c": "Third option",
  "option_d": "Fourth option",
  "correct_answer": "A/B/C/D",
  "explanation": "Why this answer is correct",
  "difficulty": "${word.final_difficulty}"
}`;

    try {
      console.log(`🤖 Soru oluşturuluyor: ${word.word}`);

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
          timeout: 30000,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const geminiResponse = response.data;
      
      if (!geminiResponse.candidates || geminiResponse.candidates.length === 0) {
        throw new Error('Gemini API\'den geçersiz yanıt');
      }

      const generatedText = geminiResponse.candidates[0].content.parts[0].text;
      
      // JSON cleaning
      const cleanedText = generatedText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const questionData = JSON.parse(cleanedText);
      
      // Validation
      if (!this.isValidQuestionFormat(questionData)) {
        throw new Error('Geçersiz soru formatı');
      }

      console.log(`✅ Soru oluşturuldu: ${word.word}`);
      return { success: true, data: questionData };

    } catch (error) {
      console.error(`❌ ${word.word} için soru oluşturma hatası:`, error.message);
      return { success: false, error: error.message };
    }
  }

  isValidQuestionFormat(data) {
    const requiredFields = [
      'question_text', 'option_a', 'option_b', 'option_c', 'option_d',
      'correct_answer', 'explanation', 'difficulty'
    ];
    
    return requiredFields.every(field => data[field]) &&
           ['A', 'B', 'C', 'D'].includes(data.correct_answer) &&
           ['beginner', 'intermediate', 'advanced'].includes(data.difficulty);
  }
}

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

    if (wordIds.length > 50) {
      return res.status(400).json({
        error: 'Çok fazla kelime',
        message: 'Bir seferde maksimum 50 kelime için soru oluşturabilirsiniz'
      });
    }

    // Seçili kelimeleri getir
    const { data: words, error: fetchError } = await req.supabase
      .from('words')
      .select('*')
      .in('id', wordIds)
      .eq('is_active', true);

    if (fetchError) {
      throw fetchError;
    }

    if (!words || words.length === 0) {
      return res.status(404).json({
        error: 'Kelime bulunamadı',
        message: 'Seçili kelimeler bulunamadı'
      });
    }

    console.log(`📝 ${words.length} kelime için soru oluşturma başlatılıyor...`);

    const questionGenerator = new QuestionGenerator(process.env.GEMINI_API_KEY);
    const results = {
      successful: [],
      failed: [],
      total: words.length
    };

    // Sequential processing with rate limiting
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      
      try {
        // Mevcut soruyu kontrol et
        const { data: existingQuestion } = await req.supabase
          .from('questions')
          .select('id')
          .eq('word_id', word.id)
          .eq('is_active', true)
          .single();

        if (existingQuestion) {
          results.failed.push({
            word: word.word,
            wordId: word.id,
            reason: 'Bu kelime için zaten soru mevcut'
          });
          continue;
        }

        // Soru oluştur
        const questionResult = await questionGenerator.generateQuestionForWord(word);
        
        if (questionResult.success) {
          // Soruyu veritabanına kaydet
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
              paragraph: word.english_example,
              times_shown: 0,
              times_correct: 0,
              is_active: true,
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
            processingTime: 0
          });

          console.log(`✅ Soru kaydedildi: ${word.word}`);
        } else {
          results.failed.push({
            word: word.word,
            wordId: word.id,
            reason: questionResult.error
          });
        }

        // Rate limiting - 1 saniye bekle
        if (i < words.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (wordError) {
        console.error(`❌ ${word.word} işlenirken hata:`, wordError);
        results.failed.push({
          word: word.word,
          wordId: word.id,
          reason: wordError.message
        });
      }
    }

    // Sonuç özeti
    const summary = {
      generated: results.successful.length,
      failed: results.failed.length,
      duplicate: 0,
      total: results.total
    };

    console.log(`🎉 Soru oluşturma tamamlandı: ${summary.generated} başarılı, ${summary.failed} başarısız`);

    res.json({
      message: 'Soru oluşturma işlemi tamamlandı',
      results: {
        ...results,
        successCount: results.successful.length,
        failureCount: results.failed.length,
        processingTime: 0
      },
      summary
    });

  } catch (error) {
    console.error('❌ Soru oluşturma hatası:', error);
    res.status(500).json({
      error: 'Soru oluşturma hatası',
      message: error.message
    });
  }
});

// GET /api/questions - Soru listesi
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search;
    const difficulty = req.query.difficulty;
    const isActive = req.query.isActive;
    
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    // Base query with JOIN to get word information
    let query = req.supabase
      .from('questions')
      .select(`
        *,
        words!inner (
          word,
          meaning_id,
          part_of_speech,
          meaning_description,
          turkish_meaning,
          final_difficulty
        )
      `, { count: 'exact' });
    
    // Filters
    if (search) {
      query = query.or(`question_text.ilike.%${search}%,words.word.ilike.%${search}%`);
    }
    
    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }
    
    if (isActive !== undefined) {
      query = query.eq('is_active', isActive === 'true');
    }
    
    // Sorting
    query = query.order('created_at', { ascending: false });
    
    // Pagination
    query = query.range(from, to);
    
    const { data: questions, error, count } = await query;
    
    if (error) {
      throw error;
    }
    
    res.json({
      questions: questions || [],
      pagination: {
        currentPage: page,
        totalPages: Math.ceil((count || 0) / limit),
        totalQuestions: count || 0,
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
    // Toplam soru sayısı
    const { count: totalQuestions, error: totalError } = await req.supabase
      .from('questions')
      .select('*', { count: 'exact', head: true });

    // Aktif soru sayısı
    const { count: activeQuestions, error: activeError } = await req.supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Zorluk dağılımı
    const { data: difficultyData, error: difficultyError } = await req.supabase
      .from('questions')
      .select('difficulty')
      .eq('is_active', true);

    if (totalError || activeError || difficultyError) {
      throw totalError || activeError || difficultyError;
    }

    // Zorluk dağılımını hesapla
    const difficultyBreakdown = {
      beginner: 0,
      intermediate: 0,
      advanced: 0
    };

    if (difficultyData) {
      difficultyData.forEach(item => {
        if (difficultyBreakdown.hasOwnProperty(item.difficulty)) {
          difficultyBreakdown[item.difficulty]++;
        }
      });
    }

    // Son 24 saatte oluşturulan sorular
    const { count: recentQuestions } = await req.supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    res.json({
      totalQuestions: totalQuestions || 0,
      activeQuestions: activeQuestions || 0,
      difficultyBreakdown,
      partOfSpeechBreakdown: {},
      recentQuestions: recentQuestions || 0,
      averageCorrectRate: 0,
      mostShownWords: []
    });

  } catch (error) {
    console.error('❌ Soru istatistikleri hatası:', error);
    res.status(500).json({
      error: 'Soru istatistikleri alınamadı',
      message: error.message
    });
  }
});

// PUT /api/questions/:id - Soru güncelle
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Güvenlik için sadece belirli alanların güncellenmesine izin ver
    const allowedFields = [
      'question_text', 'option_a', 'option_b', 'option_c', 'option_d',
      'correct_answer', 'explanation', 'is_active'
    ];
    
    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });
    
    filteredUpdates.updated_at = new Date().toISOString();
    
    const { data, error } = await req.supabase
      .from('questions')
      .update(filteredUpdates)
      .eq('id', id)
      .select()
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
    
    res.json({
      message: 'Soru başarıyla güncellendi',
      question: data
    });
    
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
    
    const { error } = await req.supabase
      .from('questions')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw error;
    }
    
    res.json({
      message: 'Soru başarıyla silindi'
    });
    
  } catch (error) {
    console.error('❌ Soru silme hatası:', error);
    res.status(500).json({
      error: 'Soru silinirken hata oluştu',
      message: error.message
    });
  }
});

// POST /api/questions/bulk - Toplu soru işlemleri
router.post('/bulk', async (req, res) => {
  try {
    const { questionIds, operation } = req.body;
    
    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({
        error: 'Soru ID listesi gerekli',
        message: 'Lütfen işlem yapılacak soruları seçin'
      });
    }

    if (!['activate', 'deactivate', 'delete'].includes(operation)) {
      return res.status(400).json({
        error: 'Geçersiz işlem',
        message: 'İşlem activate, deactivate veya delete olmalıdır'
      });
    }

    let result;

    switch (operation) {
      case 'activate':
        result = await req.supabase
          .from('questions')
          .update({ is_active: true, updated_at: new Date().toISOString() })
          .in('id', questionIds);
        break;
        
      case 'deactivate':
        result = await req.supabase
          .from('questions')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .in('id', questionIds);
        break;
        
      case 'delete':
        result = await req.supabase
          .from('questions')
          .delete()
          .in('id', questionIds);
        break;
    }

    if (result.error) {
      throw result.error;
    }

    res.json({
      message: `${questionIds.length} soru için ${operation} işlemi tamamlandı`,
      affected: questionIds.length,
      failed: 0,
      operation
    });

  } catch (error) {
    console.error('❌ Toplu soru işlemi hatası:', error);
    res.status(500).json({
      error: 'Toplu işlem başarısız',
      message: error.message
    });
  }
});

// POST /api/questions/:id/toggle-active - Soru aktiflik durumunu değiştir
router.post('/:id/toggle-active', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Önce mevcut durumu al
    const { data: currentQuestion, error: fetchError } = await req.supabase
      .from('questions')
      .select('is_active')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      throw fetchError;
    }
    
    if (!currentQuestion) {
      return res.status(404).json({
        error: 'Soru bulunamadı',
        message: 'Belirtilen soru bulunamadı'
      });
    }
    
    // Durumu tersine çevir
    const newStatus = !currentQuestion.is_active;
    
    const { data, error } = await req.supabase
      .from('questions')
      .update({ 
        is_active: newStatus, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    res.json({
      message: `Soru ${newStatus ? 'aktif hale getirildi' : 'pasif hale getirildi'}`,
      question: data,
      newStatus
    });
    
  } catch (error) {
    console.error('❌ Soru durum değiştirme hatası:', error);
    res.status(500).json({
      error: 'Soru durumu değiştirilemedi',
      message: error.message
    });
  }
});

module.exports = router;