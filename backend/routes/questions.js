// backend/routes/questions.js - TAMAMEN YENİLENMİŞ
const express = require('express');
const router = express.Router();

// GET /api/questions - Soru listesi (sayfalama, filtreleme ile)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const word = req.query.word;
    const difficulty = req.query.difficulty;
    const meaningId = req.query.meaningId;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    // Temel query
    let query = req.supabase
      .from('questions')
      .select(`
        id, word, meaning_id, question_text,
        option_a, option_b, option_c, option_d,
        correct_answer, explanation, difficulty,
        part_of_speech, source, times_shown, times_correct,
        is_active, created_at, updated_at
      `, { count: 'exact' })
      .eq('is_active', true);
    
    // Filtreler
    if (word) {
      query = query.eq('word', word.toLowerCase());
    }

    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    if (meaningId) {
      query = query.eq('meaning_id', parseInt(meaningId));
    }
    
    // Sıralama ve sayfalama
    query = query
      .order('created_at', { ascending: false })
      .range(from, to);
    
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
    
    if (error.code === 'PGRST116') {
      return res.status(404).json({
        error: 'Questions tablosu bulunamadı',
        message: 'Lütfen "questions" tablosunu Supabase dashboard\'tan oluşturun',
        questions: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalQuestions: 0,
          hasNext: false,
          hasPrev: false
        }
      });
    }
    
    res.status(500).json({
      error: 'Sorular yüklenirken hata oluştu',
      message: error.message
    });
  }
});

// GET /api/questions/:id - Belirli bir soru
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: question, error } = await req.supabase
      .from('questions')
      .select('*')
      .eq('id', parseInt(id))
      .eq('is_active', true)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Soru bulunamadı',
          message: `ID ${id} ile eşleşen soru bulunamadı`
        });
      }
      throw error;
    }
    
    res.json(question);
    
  } catch (error) {
    console.error('❌ Soru getirme hatası:', error);
    res.status(500).json({
      error: 'Soru yüklenirken hata oluştu',
      message: error.message
    });
  }
});

// GET /api/questions/word/:word - Belirli kelime için tüm sorular
router.get('/word/:word', async (req, res) => {
  try {
    const { word } = req.params;
    
    const { data: questions, error } = await req.supabase
      .from('questions')
      .select('*')
      .eq('word', word.toLowerCase())
      .eq('is_active', true)
      .order('meaning_id', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    if (!questions || questions.length === 0) {
      return res.status(404).json({
        error: 'Soru bulunamadı',
        message: `"${word}" kelimesi için soru bulunamadı`
      });
    }
    
    // Meaning ID'ye göre grupla
    const groupedByMeaning = questions.reduce((acc, question) => {
      if (!acc[question.meaning_id]) {
        acc[question.meaning_id] = [];
      }
      acc[question.meaning_id].push(question);
      return acc;
    }, {});
    
    res.json({
      word: word.toLowerCase(),
      totalQuestions: questions.length,
      questionsByMeaning: groupedByMeaning,
      allQuestions: questions
    });
    
  } catch (error) {
    console.error('❌ Kelime soruları hatası:', error);
    res.status(500).json({
      error: 'Kelime soruları yüklenirken hata oluştu',
      message: error.message
    });
  }
});

// GET /api/questions/random - Rastgele sorular
router.get('/random', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const difficulty = req.query.difficulty;
    const word = req.query.word;
    
    let query = req.supabase
      .from('questions')
      .select('*')
      .eq('is_active', true);
    
    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }
    
    if (word) {
      query = query.eq('word', word.toLowerCase());
    }
    
    const { data: questions, error } = await query;
    
    if (error) {
      throw error;
    }
    
    // Rastgele karıştır ve istenen sayıda al
    const shuffled = questions ? questions.sort(() => Math.random() - 0.5) : [];
    const randomQuestions = shuffled.slice(0, limit);
    
    res.json({
      questions: randomQuestions,
      count: randomQuestions.length,
      requested: limit,
      totalAvailable: questions ? questions.length : 0
    });
    
  } catch (error) {
    console.error('❌ Rastgele soru hatası:', error);
    res.status(500).json({
      error: 'Rastgele sorular yüklenirken hata oluştu',
      message: error.message
    });
  }
});

// GET /api/questions/stats - Soru istatistikleri
router.get('/stats', async (req, res) => {
  try {
    // Toplam soru sayısı
    const { count: totalQuestions, error: countError } = await req.supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    
    if (countError && countError.code !== 'PGRST116') {
      throw countError;
    }
    
    // Zorluk dağılımı
    const { data: difficultyData, error: diffError } = await req.supabase
      .from('questions')
      .select('difficulty')
      .eq('is_active', true);
    
    let difficultyStats = [];
    if (!diffError && difficultyData) {
      const grouped = difficultyData.reduce((acc, item) => {
        const diff = item.difficulty || 'intermediate';
        acc[diff] = (acc[diff] || 0) + 1;
        return acc;
      }, {});
      
      difficultyStats = Object.entries(grouped)
        .map(([difficulty, count]) => ({ _id: difficulty, count }));
    }
    
    // Kelime türü dağılımı
    const { data: partOfSpeechData, error: posError } = await req.supabase
      .from('questions')
      .select('part_of_speech')
      .eq('is_active', true);
    
    let partOfSpeechStats = [];
    if (!posError && partOfSpeechData) {
      const grouped = partOfSpeechData.reduce((acc, item) => {
        const pos = item.part_of_speech || 'unknown';
        acc[pos] = (acc[pos] || 0) + 1;
        return acc;
      }, {});
      
      partOfSpeechStats = Object.entries(grouped)
        .map(([pos, count]) => ({ _id: pos, count }))
        .sort((a, b) => b.count - a.count);
    }
    
    // Kelime başına ortalama soru sayısı
    const { data: uniqueWords, error: uniqueError } = await req.supabase
      .from('questions')
      .select('word')
      .eq('is_active', true);
    
    const totalUniqueWords = uniqueWords ? [...new Set(uniqueWords.map(q => q.word))].length : 0;
    const averageQuestionsPerWord = totalUniqueWords > 0 ? (totalQuestions || 0) / totalUniqueWords : 0;
    
    res.json({
      totalQuestions: totalQuestions || 0,
      totalUniqueWords: totalUniqueWords,
      averageQuestionsPerWord: parseFloat(averageQuestionsPerWord.toFixed(2)),
      difficultyStats,
      partOfSpeechStats,
      lastUpdated: new Date().toISOString(),
      database: 'Supabase PostgreSQL',
      source: 'Gemini 2.0 Flash API'
    });
    
  } catch (error) {
    console.error('❌ Soru istatistikleri hatası:', error);
    
    if (error.code === 'PGRST116') {
      return res.json({
        totalQuestions: 0,
        totalUniqueWords: 0,
        averageQuestionsPerWord: 0,
        difficultyStats: [],
        partOfSpeechStats: [],
        lastUpdated: new Date().toISOString(),
        database: 'Supabase PostgreSQL',
        source: 'Gemini 2.0 Flash API',
        message: 'Questions tablosu henüz oluşturulmamış'
      });
    }
    
    res.status(500).json({
      error: 'Soru istatistikleri yüklenirken hata oluştu',
      message: error.message
    });
  }
});

// POST /api/questions - Yeni soru ekleme (manuel)
router.post('/', async (req, res) => {
  try {
    const {
      word,
      meaning_id,
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer,
      explanation,
      difficulty,
      part_of_speech
    } = req.body;
    
    // Validasyon
    if (!word || !meaning_id || !question_text || !option_a || !option_b || !option_c || !option_d || !correct_answer) {
      return res.status(400).json({
        error: 'Eksik alanlar',
        message: 'Tüm gerekli alanları doldurun'
      });
    }
    
    if (!['A', 'B', 'C', 'D'].includes(correct_answer)) {
      return res.status(400).json({
        error: 'Geçersiz doğru cevap',
        message: 'Doğru cevap A, B, C veya D olmalıdır'
      });
    }
    
    const questionData = {
      word: word.toLowerCase(),
      meaning_id: parseInt(meaning_id),
      question_text: question_text.trim(),
      option_a: option_a.trim(),
      option_b: option_b.trim(),
      option_c: option_c.trim(),
      option_d: option_d.trim(),
      correct_answer,
      explanation: explanation ? explanation.trim() : 'Manuel soru',
      difficulty: difficulty || 'intermediate',
      part_of_speech: part_of_speech || 'unknown',
      source: 'manual',
      times_shown: 0,
      times_correct: 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: insertedQuestion, error: insertError } = await req.supabase
      .from('questions')
      .insert([questionData])
      .select('*')
      .single();
    
    if (insertError) {
      throw insertError;
    }
    
    console.log(`✅ Manuel soru eklendi: ${word} (meaning_id: ${meaning_id})`);
    
    res.status(201).json({
      message: 'Soru başarıyla eklendi',
      question: insertedQuestion
    });
    
  } catch (error) {
    console.error('❌ Soru ekleme hatası:', error);
    res.status(500).json({
      error: 'Soru eklenirken hata oluştu',
      message: error.message
    });
  }
});

// PUT /api/questions/:id - Soru güncelleme
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Güncelleme zamanını ekle
    updateData.updated_at = new Date().toISOString();
    
    const { data: updatedQuestion, error } = await req.supabase
      .from('questions')
      .update(updateData)
      .eq('id', parseInt(id))
      .select('*')
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Soru bulunamadı',
          message: `ID ${id} ile eşleşen soru bulunamadı`
        });
      }
      throw error;
    }
    
    console.log(`✅ Soru güncellendi: ID ${id}`);
    
    res.json({
      message: 'Soru başarıyla güncellendi',
      question: updatedQuestion
    });
    
  } catch (error) {
    console.error('❌ Soru güncelleme hatası:', error);
    res.status(500).json({
      error: 'Soru güncellenirken hata oluştu',
      message: error.message
    });
  }
});

// DELETE /api/questions/:id - Soru silme (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: deletedQuestion, error } = await req.supabase
      .from('questions')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', parseInt(id))
      .select('*')
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Soru bulunamadı',
          message: `ID ${id} ile eşleşen soru bulunamadı`
        });
      }
      throw error;
    }
    
    console.log(`✅ Soru silindi (soft delete): ID ${id}`);
    
    res.json({
      message: 'Soru başarıyla silindi',
      question: deletedQuestion
    });
    
  } catch (error) {
    console.error('❌ Soru silme hatası:', error);
    res.status(500).json({
      error: 'Soru silinirken hata oluştu',
      message: error.message
    });
  }
});

// DELETE /api/questions/clear - Tüm soruları temizle (development)
router.delete('/clear', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        error: 'Bu işlem production ortamında kullanılamaz'
      });
    }
    
    const { error } = await req.supabase
      .from('questions')
      .delete()
      .neq('id', 0); // Tüm kayıtları sil
    
    if (error) {
      throw error;
    }
    
    console.log('🗑️ Tüm sorular temizlendi');
    
    res.json({
      message: 'Tüm sorular temizlendi',
      database: 'Supabase'
    });
    
  } catch (error) {
    console.error('❌ Soru temizleme hatası:', error);
    res.status(500).json({
      error: 'Soru temizleme sırasında hata oluştu',
      message: error.message
    });
  }
});

// PATCH /api/questions/:id/answer - Soru yanıtlandığında istatistik güncelle
router.patch('/:id/answer', async (req, res) => {
  try {
    const { id } = req.params;
    const { isCorrect } = req.body;
    
    // Mevcut istatistikleri al
    const { data: question, error: fetchError } = await req.supabase
      .from('questions')
      .select('times_shown, times_correct')
      .eq('id', parseInt(id))
      .single();
    
    if (fetchError) {
      throw fetchError;
    }
    
    // İstatistikleri güncelle
    const updateData = {
      times_shown: (question.times_shown || 0) + 1,
      times_correct: isCorrect ? (question.times_correct || 0) + 1 : (question.times_correct || 0),
      updated_at: new Date().toISOString()
    };
    
    const { data: updatedQuestion, error: updateError } = await req.supabase
      .from('questions')
      .update(updateData)
      .eq('id', parseInt(id))
      .select('*')
      .single();
    
    if (updateError) {
      throw updateError;
    }
    
    res.json({
      message: 'Soru istatistikleri güncellendi',
      question: updatedQuestion,
      success_rate: updateData.times_shown > 0 ? 
        ((updateData.times_correct / updateData.times_shown) * 100).toFixed(1) + '%' : 
        '0%'
    });
    
  } catch (error) {
    console.error('❌ Soru istatistik güncelleme hatası:', error);
    res.status(500).json({
      error: 'Soru istatistikleri güncellenirken hata oluştu',
      message: error.message
    });
  }
});

module.exports = router;