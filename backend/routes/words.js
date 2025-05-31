const express = require('express');
const router = express.Router();
const axios = require('axios');

// Dictionary API'den kelime bilgilerini çek
async function fetchWordFromAPI(word) {
  try {
    const response = await axios.get(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`,
      { timeout: 30000 } // 30 saniye timeout
    );
    
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      throw new Error(`Kelime bulunamadı: ${word}`);
    }
    if (error.code === 'ECONNABORTED') {
      throw new Error(`Zaman aşımı: ${word}`);
    }
    throw new Error(`API hatası: ${error.message}`);
  }
}

// Kelime verilerini parse et ve Supabase formatına dönüştür
function parseWordData(apiData, originalWord) {
  const results = [];
  
  if (!apiData || !Array.isArray(apiData) || apiData.length === 0) {
    return results;
  }
  
  apiData.forEach(entry => {
    const word = entry.word || originalWord;
    const phonetic = entry.phonetic || '';
    
    if (entry.meanings && Array.isArray(entry.meanings)) {
      entry.meanings.forEach(meaning => {
        const partOfSpeech = meaning.partOfSpeech || 'unknown';
        
        if (meaning.definitions && Array.isArray(meaning.definitions)) {
          meaning.definitions.forEach(def => {
            const wordData = {
              word: word.toLowerCase(),
              part_of_speech: partOfSpeech.toLowerCase(),
              definition: def.definition,
              phonetic: phonetic || null,
              example: def.example || null,
              synonyms: meaning.synonyms || [],
              antonyms: meaning.antonyms || [],
              source: 'dictionary-api',
              times_shown: 0,
              times_correct: 0,
              difficulty: 'medium',
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            results.push(wordData);
          });
        }
      });
    }
  });
  
  return results;
}

// POST /api/words/bulk-stream - Real-time progress ile toplu kelime ekleme
router.post('/bulk-stream', async (req, res) => {
  try {
    const { words } = req.body;
    
    if (!words || !Array.isArray(words) || words.length === 0) {
      return res.status(400).json({
        error: 'Kelime listesi gerekli',
        message: 'Lütfen bir kelime dizisi gönderin'
      });
    }
    
    if (words.length > 50) {
      return res.status(400).json({
        error: 'Çok fazla kelime',
        message: 'Bir seferde maksimum 50 kelime ekleyebilirsiniz'
      });
    }

    // Server-Sent Events için header ayarları
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    const results = {
      success: [],
      failed: [],
      duplicate: [],
      total: words.length
    };

    // Başlangıç mesajı gönder
    res.write(`data: ${JSON.stringify({
      type: 'start',
      total: words.length,
      message: 'Kelime işleme başladı...'
    })}\n\n`);

    // Her kelime için API'den veri çek
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      
      try {
        // Progress update gönder
        res.write(`data: ${JSON.stringify({
          type: 'progress',
          current: i + 1,
          total: words.length,
          currentWord: word,
          message: `İşleniyor: ${word}`
        })}\n\n`);

        console.log(`📖 İşleniyor: ${word} (${i + 1}/${words.length})`);
        
        // API'den kelime verilerini çek
        const apiData = await fetchWordFromAPI(word);
        const parsedWords = parseWordData(apiData, word);
        
        if (parsedWords.length === 0) {
          results.failed.push({
            word,
            reason: 'API\'den veri alınamadı'
          });
          
          // Başarısız kelime update'i gönder
          res.write(`data: ${JSON.stringify({
            type: 'word_failed',
            word: word,
            reason: 'API\'den veri alınamadı',
            current: i + 1,
            total: words.length
          })}\n\n`);
          
          continue;
        }
        
        // Her anlam için Supabase'e kaydet
        let wordProcessed = false;
        for (const wordData of parsedWords) {
          try {
            // Önce aynı kombinasyonun var olup olmadığını kontrol et
            const { data: existing, error: checkError } = await req.supabase
              .from('words')
              .select('id')
              .eq('word', wordData.word)
              .eq('part_of_speech', wordData.part_of_speech)
              .eq('definition', wordData.definition)
              .single();
            
            if (checkError && checkError.code !== 'PGRST116') {
              throw checkError;
            }
            
            if (existing) {
              // Duplicate
              if (!wordProcessed) {
                results.duplicate.push({
                  word: wordData.word,
                  partOfSpeech: wordData.part_of_speech,
                  reason: 'Bu kelime + anlam kombinasyonu zaten mevcut'
                });
                
                // Duplicate update gönder
                res.write(`data: ${JSON.stringify({
                  type: 'word_duplicate',
                  word: wordData.word,
                  partOfSpeech: wordData.part_of_speech,
                  current: i + 1,
                  total: words.length
                })}\n\n`);
                
                wordProcessed = true;
              }
              continue;
            }
            
            // Yeni kayıt ekle
            const { data: insertData, error: insertError } = await req.supabase
              .from('words')
              .insert([wordData])
              .select()
              .single();
            
            if (insertError) {
              throw insertError;
            }
            
            results.success.push({
              word: wordData.word,
              partOfSpeech: wordData.part_of_speech,
              definition: wordData.definition.substring(0, 100) + '...'
            });
            
            // Başarılı kelime update'i gönder
            res.write(`data: ${JSON.stringify({
              type: 'word_success',
              word: wordData.word,
              partOfSpeech: wordData.part_of_speech,
              definition: wordData.definition.substring(0, 100) + '...',
              current: i + 1,
              total: words.length
            })}\n\n`);
            
            wordProcessed = true;
            break; // İlk başarılı kayıttan sonra bu kelime için dur
            
          } catch (saveError) {
            console.error('❌ Kelime kaydetme hatası:', saveError);
            if (!wordProcessed) {
              results.failed.push({
                word: wordData.word,
                reason: `Veritabanı hatası: ${saveError.message}`
              });
              
              // Başarısız kayıt update'i gönder
              res.write(`data: ${JSON.stringify({
                type: 'word_failed',
                word: wordData.word,
                reason: `Veritabanı hatası: ${saveError.message}`,
                current: i + 1,
                total: words.length
              })}\n\n`);
              
              wordProcessed = true;
            }
          }
        }
        
        // Rate limiting için kısa bekleme
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (wordError) {
        results.failed.push({
          word,
          reason: wordError.message
        });
        
        // Kelime hatası update'i gönder
        res.write(`data: ${JSON.stringify({
          type: 'word_failed',
          word: word,
          reason: wordError.message,
          current: i + 1,
          total: words.length
        })}\n\n`);
      }
    }

    // Tamamlanma mesajı gönder
    const summary = {
      success: results.success.length,
      failed: results.failed.length,
      duplicate: results.duplicate.length,
      total: results.total
    };

    res.write(`data: ${JSON.stringify({
      type: 'complete',
      results,
      summary,
      message: 'Toplu kelime ekleme işlemi tamamlandı'
    })}\n\n`);

    // Bağlantıyı kapat
    res.write(`data: ${JSON.stringify({ type: 'end' })}\n\n`);
    res.end();
    
  } catch (error) {
    console.error('❌ Toplu kelime ekleme hatası:', error);
    
    // Hata mesajı gönder
    res.write(`data: ${JSON.stringify({
      type: 'error',
      error: 'Sunucu hatası',
      message: error.message
    })}\n\n`);
    
    res.end();
  }
});

// POST /api/words/bulk - Eski endpoint (geriye uyumluluk için)
router.post('/bulk', async (req, res) => {
  try {
    const { words } = req.body;
    
    if (!words || !Array.isArray(words) || words.length === 0) {
      return res.status(400).json({
        error: 'Kelime listesi gerekli',
        message: 'Lütfen bir kelime dizisi gönderin'
      });
    }
    
    if (words.length > 50) {
      return res.status(400).json({
        error: 'Çok fazla kelime',
        message: 'Bir seferde maksimum 50 kelime ekleyebilirsiniz'
      });
    }
    
    const results = {
      success: [],
      failed: [],
      duplicate: [],
      total: words.length
    };
    
    // Her kelime için API'den veri çek
    for (const word of words) {
      try {
        console.log(`📖 İşleniyor: ${word}`);
        
        // API'den kelime verilerini çek
        const apiData = await fetchWordFromAPI(word);
        const parsedWords = parseWordData(apiData, word);
        
        if (parsedWords.length === 0) {
          results.failed.push({
            word,
            reason: 'API\'den veri alınamadı'
          });
          continue;
        }
        
        // Her anlam için Supabase'e kaydet
        for (const wordData of parsedWords) {
          try {
            // Önce aynı kombinasyonun var olup olmadığını kontrol et
            const { data: existing, error: checkError } = await req.supabase
              .from('words')
              .select('id')
              .eq('word', wordData.word)
              .eq('part_of_speech', wordData.part_of_speech)
              .eq('definition', wordData.definition)
              .single();
            
            if (checkError && checkError.code !== 'PGRST116') {
              // Başka bir hata varsa
              throw checkError;
            }
            
            if (existing) {
              // Duplicate
              results.duplicate.push({
                word: wordData.word,
                partOfSpeech: wordData.part_of_speech,
                reason: 'Bu kelime + anlam kombinasyonu zaten mevcut'
              });
              continue;
            }
            
            // Yeni kayıt ekle
            const { data: insertData, error: insertError } = await req.supabase
              .from('words')
              .insert([wordData])
              .select()
              .single();
            
            if (insertError) {
              throw insertError;
            }
            
            results.success.push({
              word: wordData.word,
              partOfSpeech: wordData.part_of_speech,
              definition: wordData.definition.substring(0, 100) + '...'
            });
            
          } catch (saveError) {
            console.error('❌ Kelime kaydetme hatası:', saveError);
            results.failed.push({
              word: wordData.word,
              reason: `Veritabanı hatası: ${saveError.message}`
            });
          }
        }
        
        // Rate limiting için kısa bekleme
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (wordError) {
        results.failed.push({
          word,
          reason: wordError.message
        });
      }
    }
    
    res.json({
      message: 'Toplu kelime ekleme işlemi tamamlandı',
      results,
      summary: {
        success: results.success.length,
        failed: results.failed.length,
        duplicate: results.duplicate.length,
        total: results.total
      }
    });
    
  } catch (error) {
    console.error('❌ Toplu kelime ekleme hatası:', error);
    res.status(500).json({
      error: 'Sunucu hatası',
      message: error.message
    });
  }
});

// GET /api/words - Tüm kelimeleri listele (sayfalama ile)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    let query = req.supabase
      .from('words')
      .select('id, word, part_of_speech, definition, phonetic, example, created_at', { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(from, to);
    
    // Arama filtresi
    if (req.query.search) {
      query = query.or(`word.ilike.%${req.query.search}%,definition.ilike.%${req.query.search}%`);
    }
    
    const { data: words, error, count } = await query;
    
    if (error) {
      throw error;
    }
    
    const totalPages = Math.ceil(count / limit);
    
    res.json({
      words: words || [],
      pagination: {
        currentPage: page,
        totalPages,
        totalWords: count,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
    
  } catch (error) {
    console.error('❌ Kelime listesi hatası:', error);
    
    if (error.code === 'PGRST116') {
      return res.status(404).json({
        error: 'Tablo bulunamadı',
        message: 'Lütfen "words" tablosunu Supabase dashboard\'tan oluşturun',
        words: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalWords: 0,
          hasNext: false,
          hasPrev: false
        }
      });
    }
    
    res.status(500).json({
      error: 'Kelimeler yüklenirken hata oluştu',
      message: error.message
    });
  }
});

// GET /api/words/stats - İstatistikler
router.get('/stats', async (req, res) => {
  try {
    // Toplam kelime sayısı
    const { count: totalWords, error: countError } = await req.supabase
      .from('words')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    
    if (countError && countError.code !== 'PGRST116') {
      throw countError;
    }
    
    // Kelime türü istatistikleri
    const { data: partOfSpeechData, error: posError } = await req.supabase
      .from('words')
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
    
    // Zorluk istatistikleri
    const { data: difficultyData, error: diffError } = await req.supabase
      .from('words')
      .select('difficulty')
      .eq('is_active', true);
    
    let difficultyStats = [];
    if (!diffError && difficultyData) {
      const grouped = difficultyData.reduce((acc, item) => {
        const diff = item.difficulty || 'medium';
        acc[diff] = (acc[diff] || 0) + 1;
        return acc;
      }, {});
      
      difficultyStats = Object.entries(grouped)
        .map(([difficulty, count]) => ({ _id: difficulty, count }));
    }
    
    res.json({
      totalWords: totalWords || 0,
      totalDefinitions: totalWords || 0,
      partOfSpeechStats,
      difficultyStats,
      lastUpdated: new Date().toISOString(),
      database: 'Supabase PostgreSQL'
    });
    
  } catch (error) {
    console.error('❌ İstatistik hatası:', error);
    
    if (error.code === 'PGRST116') {
      return res.json({
        totalWords: 0,
        totalDefinitions: 0,
        partOfSpeechStats: [],
        difficultyStats: [],
        lastUpdated: new Date().toISOString(),
        database: 'Supabase PostgreSQL',
        message: 'Tablo henüz oluşturulmamış'
      });
    }
    
    res.status(500).json({
      error: 'İstatistikler yüklenirken hata oluştu',
      message: error.message
    });
  }
});

// GET /api/words/random - Rastgele kelimeler (quiz için)
router.get('/random', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const difficulty = req.query.difficulty; // easy, medium, hard
    
    let query = req.supabase
      .from('words')
      .select('*')
      .eq('is_active', true);
    
    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }
    
    const { data: words, error } = await query;
    
    if (error) {
      throw error;
    }
    
    // Rastgele karıştır ve sınırla
    const shuffled = words
      .sort(() => Math.random() - 0.5)
      .slice(0, limit);
    
    res.json({
      words: shuffled,
      count: shuffled.length,
      requested: limit
    });
    
  } catch (error) {
    console.error('❌ Rastgele kelime hatası:', error);
    res.status(500).json({
      error: 'Rastgele kelimeler yüklenirken hata oluştu',
      message: error.message
    });
  }
});

// DELETE /api/words/clear - Tüm kelimeleri temizle (geliştirme için)
router.delete('/clear', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        error: 'Bu işlem production ortamında kullanılamaz'
      });
    }
    
    const { error } = await req.supabase
      .from('words')
      .delete()
      .neq('id', 0); // Tüm kayıtları sil
    
    if (error) {
      throw error;
    }
    
    res.json({
      message: 'Tüm kelimeler silindi',
      database: 'Supabase'
    });
    
  } catch (error) {
    console.error('❌ Temizleme hatası:', error);
    res.status(500).json({
      error: 'Temizleme sırasında hata oluştu',
      message: error.message
    });
  }
});

module.exports = router;