const express = require('express');
const router = express.Router();

// POST /api/words/bulk-stream - Real-time progress ile toplu kelime ekleme - AYNI
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
      queued: [],
      duplicate: [],
      failed: [],
      total: words.length
    };

    // Başlangıç mesajı gönder
    res.write(`data: ${JSON.stringify({
      type: 'start',
      total: words.length,
      message: 'Kelimeler queue\'ya ekleniyor...'
    })}\n\n`);

    // Batch ID oluştur
    const batchId = require('crypto').randomUUID();

    // Her kelime için queue'ya ekle
    for (let i = 0; i < words.length; i++) {
      const word = words[i].toString().trim().toLowerCase();
      
      try {
        // Progress update gönder
        res.write(`data: ${JSON.stringify({
          type: 'progress',
          current: i + 1,
          total: words.length,
          currentWord: word,
          message: `Queue'ya ekleniyor: ${word}`
        })}\n\n`);

        console.log(`📝 Queue'ya ekleniyor: ${word} (${i + 1}/${words.length})`);
        
        // Kelime validasyonu
        if (!word || word.length === 0 || word.length > 50) {
          results.failed.push({
            word,
            reason: 'Geçersiz kelime formatı'
          });
          
          res.write(`data: ${JSON.stringify({
            type: 'word_failed',
            word: word,
            reason: 'Geçersiz kelime formatı',
            current: i + 1,
            total: words.length
          })}\n\n`);
          
          continue;
        }

        // Sadece harf, tire, apostrof kabul et
        if (!/^[a-zA-Z\s\-']+$/.test(word)) {
          results.failed.push({
            word,
            reason: 'Sadece İngilizce harfler kabul edilir'
          });
          
          res.write(`data: ${JSON.stringify({
            type: 'word_failed',
            word: word,
            reason: 'Sadece İngilizce harfler kabul edilir',
            current: i + 1,
            total: words.length
          })}\n\n`);
          
          continue;
        }
        
        // Pending words'e ekle
        try {
          const { data: insertData, error: insertError } = await req.supabase
            .from('pending_words')
            .insert([{
              word: word,
              upload_batch_id: batchId,
              status: 'pending',
              created_at: new Date().toISOString()
            }])
            .select()
            .single();
          
          if (insertError) {
            // Duplicate key hatası kontrolü
            if (insertError.code === '23505') {
              results.duplicate.push({
                word: word,
                reason: 'Bu kelime zaten queue\'da'
              });
              
              res.write(`data: ${JSON.stringify({
                type: 'word_duplicate',
                word: word,
                reason: 'Bu kelime zaten queue\'da',
                current: i + 1,
                total: words.length
              })}\n\n`);
              
              continue;
            }
            throw insertError;
          }
          
          results.queued.push({
            word: word,
            batchId: batchId
          });
          
          // Başarılı kelime update'i gönder
          res.write(`data: ${JSON.stringify({
            type: 'word_queued',
            word: word,
            batchId: batchId,
            current: i + 1,
            total: words.length
          })}\n\n`);
          
        } catch (saveError) {
          console.error('❌ Queue\'ya ekleme hatası:', saveError);
          results.failed.push({
            word: word,
            reason: `Veritabanı hatası: ${saveError.message}`
          });
          
          res.write(`data: ${JSON.stringify({
            type: 'word_failed',
            word: word,
            reason: `Veritabanı hatası: ${saveError.message}`,
            current: i + 1,
            total: words.length
          })}\n\n`);
        }
        
      } catch (wordError) {
        results.failed.push({
          word,
          reason: wordError.message
        });
        
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
      queued: results.queued.length,
      failed: results.failed.length,
      duplicate: results.duplicate.length,
      total: results.total
    };

    res.write(`data: ${JSON.stringify({
      type: 'complete',
      results,
      summary,
      batchId: batchId,
      message: 'Kelimeler queue\'ya eklendi, aşamalı background processing başlayacak'
    })}\n\n`);

    // Bağlantıyı kapat
    res.write(`data: ${JSON.stringify({ type: 'end' })}\n\n`);
    res.end();

    // Background processor'ı başlat (eğer çalışmıyorsa)
    if (results.queued.length > 0 && !req.wordProcessor.getStats().isProcessing) {
      console.log('🚀 Aşamalı Background processor başlatılıyor...');
      req.wordProcessor.startProcessing().catch(error => {
        console.error('❌ Background processor başlatma hatası:', error);
      });
    }
    
  } catch (error) {
    console.error('❌ Toplu kelime ekleme hatası:', error);
    
    res.write(`data: ${JSON.stringify({
      type: 'error',
      error: 'Sunucu hatası',
      message: error.message
    })}\n\n`);
    
    res.end();
  }
});

// POST /api/words/bulk - Eski endpoint (geriye uyumluluk için) - AYNI
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
      queued: [],
      duplicate: [],
      failed: [],
      total: words.length
    };

    // Batch ID oluştur
    const batchId = require('crypto').randomUUID();
    
    // Her kelime için queue'ya ekle
    for (const wordInput of words) {
      const word = wordInput.toString().trim().toLowerCase();
      
      try {
        console.log(`📝 Queue'ya ekleniyor: ${word}`);
        
        // Kelime validasyonu
        if (!word || word.length === 0 || word.length > 50) {
          results.failed.push({
            word,
            reason: 'Geçersiz kelime formatı'
          });
          continue;
        }

        if (!/^[a-zA-Z\s\-']+$/.test(word)) {
          results.failed.push({
            word,
            reason: 'Sadece İngilizce harfler kabul edilir'
          });
          continue;
        }
        
        // Pending words'e ekle
        const { data: insertData, error: insertError } = await req.supabase
          .from('pending_words')
          .insert([{
            word: word,
            upload_batch_id: batchId,
            status: 'pending',
            created_at: new Date().toISOString()
          }])
          .select()
          .single();
        
        if (insertError) {
          if (insertError.code === '23505') {
            results.duplicate.push({
              word: word,
              reason: 'Bu kelime zaten queue\'da'
            });
            continue;
          }
          throw insertError;
        }
        
        results.queued.push({
          word: word,
          batchId: batchId
        });
        
      } catch (wordError) {
        results.failed.push({
          word,
          reason: wordError.message
        });
      }
    }
    
    // Background processor'ı başlat (eğer çalışmıyorsa)
    if (results.queued.length > 0 && !req.wordProcessor.getStats().isProcessing) {
      console.log('🚀 Aşamalı Background processor başlatılıyor...');
      req.wordProcessor.startProcessing().catch(error => {
        console.error('❌ Background processor başlatma hatası:', error);
      });
    }

    res.json({
      message: 'Kelimeler queue\'ya eklendi',
      results,
      summary: {
        queued: results.queued.length,
        failed: results.failed.length,
        duplicate: results.duplicate.length,
        total: results.total
      },
      batchId: batchId,
      nextStep: 'Aşamalı background processing ile Gemini 2.0 Flash API\'den veriler çekilecek'
    });
    
  } catch (error) {
    console.error('❌ Toplu kelime ekleme hatası:', error);
    res.status(500).json({
      error: 'Sunucu hatası',
      message: error.message
    });
  }
});

// YENİ: GET /api/words - Gelişmiş kelime listesi (gruplu format destekli)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const groupByWord = req.query.groupByWord === 'true';
    const difficultyType = req.query.difficultyType || 'final'; // 'initial' or 'final'
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    // Temel query
    let selectFields = `
      id, word, meaning_id, part_of_speech, meaning_description,
      english_example, turkish_sentence, turkish_meaning,
      initial_difficulty, final_difficulty, difficulty_reasoning,
      analysis_method, source, times_shown, times_correct, 
      is_active, created_at, updated_at
    `;
    
    let query = req.supabase
      .from('words')
      .select(selectFields, { count: 'exact' })
      .eq('is_active', true);
    
    // Arama filtresi
    if (req.query.search) {
      query = query.or(`word.ilike.%${req.query.search}%,turkish_meaning.ilike.%${req.query.search}%,meaning_description.ilike.%${req.query.search}%`);
    }

    // Zorluk filtresi
    if (req.query.difficulty) {
      const difficultyField = difficultyType === 'initial' ? 'initial_difficulty' : 'final_difficulty';
      query = query.eq(difficultyField, req.query.difficulty);
    }
    
    // Kelime türü filtresi
    if (req.query.partOfSpeech) {
      query = query.eq('part_of_speech', req.query.partOfSpeech);
    }
    
    // Sıralama
    if (groupByWord) {
      query = query.order('word', { ascending: true }).order('meaning_id', { ascending: true });
    } else {
      query = query.order('created_at', { ascending: false });
    }
    
    // Sayfalama
    query = query.range(from, to);
    
    const { data: words, error, count } = await query;
    
    if (error) {
      throw error;
    }
    
    let response = {
      words: words || [],
      wordGroups: [],
      pagination: {
        currentPage: page,
        totalPages: Math.ceil((count || 0) / limit),
        totalWords: 0,
        totalMeanings: count || 0,
        hasNext: page < Math.ceil((count || 0) / limit),
        hasPrev: page > 1
      }
    };
    
    // Gruplu format istenmişse
    if (groupByWord && words && words.length > 0) {
      const grouped = words.reduce((acc, word) => {
        if (!acc[word.word]) {
          acc[word.word] = {
            word: word.word,
            meanings: [],
            totalMeanings: 0,
            difficultyRange: {
              initial: word.initial_difficulty || 'intermediate',
              final: word.final_difficulty
            }
          };
        }
        
        acc[word.word].meanings.push(word);
        acc[word.word].totalMeanings++;
        
        return acc;
      }, {});
      
      response.wordGroups = Object.values(grouped);
      response.pagination.totalWords = Object.keys(grouped).length;
    }
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ Kelime listesi hatası:', error);
    
    if (error.code === 'PGRST116') {
      return res.status(404).json({
        error: 'Tablo bulunamadı',
        message: 'Lütfen "words" tablosunu Supabase dashboard\'tan oluşturun',
        words: [],
        wordGroups: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalWords: 0,
          totalMeanings: 0,
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

// YENİ: GET /api/words/group/:word - Belirli kelimenin tüm anlamları
router.get('/group/:word', async (req, res) => {
  try {
    const { word } = req.params;
    
    const { data: meanings, error } = await req.supabase
      .from('words')
      .select('*')
      .eq('word', word.toLowerCase())
      .eq('is_active', true)
      .order('meaning_id', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    if (!meanings || meanings.length === 0) {
      return res.status(404).json({
        error: 'Kelime bulunamadı',
        message: `"${word}" kelimesi veritabanında bulunamadı`
      });
    }
    
    // Difficulty range hesapla
    const difficulties = meanings.map(m => m.final_difficulty);
    const difficultyOrder = ['beginner', 'intermediate', 'advanced'];
    const minDiff = difficulties.reduce((min, curr) => 
      difficultyOrder.indexOf(curr) < difficultyOrder.indexOf(min) ? curr : min
    );
    const maxDiff = difficulties.reduce((max, curr) => 
      difficultyOrder.indexOf(curr) > difficultyOrder.indexOf(max) ? curr : max
    );
    
    const wordGroup = {
      word: word.toLowerCase(),
      meanings: meanings,
      totalMeanings: meanings.length,
      difficultyRange: {
        initial: meanings[0].initial_difficulty || 'intermediate',
        final: meanings[0].final_difficulty,
        min: minDiff,
        max: maxDiff
      },
      partOfSpeechSummary: [...new Set(meanings.map(m => m.part_of_speech))],
      analysisMethod: meanings[0].analysis_method,
      createdAt: meanings[0].created_at
    };
    
    res.json(wordGroup);
    
  } catch (error) {
    console.error('❌ Kelime grubu hatası:', error);
    res.status(500).json({
      error: 'Kelime grubu yüklenirken hata oluştu',
      message: error.message
    });
  }
});

// YENİ: GET /api/words/:word/meaning/:meaningId - Belirli anlam
router.get('/:word/meaning/:meaningId', async (req, res) => {
  try {
    const { word, meaningId } = req.params;
    
    const { data: meaning, error } = await req.supabase
      .from('words')
      .select('*')
      .eq('word', word.toLowerCase())
      .eq('meaning_id', parseInt(meaningId))
      .eq('is_active', true)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Anlam bulunamadı',
          message: `"${word}" kelimesinin ${meaningId} numaralı anlamı bulunamadı`
        });
      }
      throw error;
    }
    
    res.json(meaning);
    
  } catch (error) {
    console.error('❌ Kelime anlamı hatası:', error);
    res.status(500).json({
      error: 'Kelime anlamı yüklenirken hata oluştu',
      message: error.message
    });
  }
});

// YENİ: GET /api/words/random - Gelişmiş rastgele kelimeler
router.get('/random', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const difficulty = req.query.difficulty; // beginner, intermediate, advanced
    const groupByWord = req.query.groupByWord === 'true';
    const difficultyType = req.query.difficultyType || 'final';
    
    let query = req.supabase
      .from('words')
      .select('*')
      .eq('is_active', true);
    
    if (difficulty) {
      const difficultyField = difficultyType === 'initial' ? 'initial_difficulty' : 'final_difficulty';
      query = query.eq(difficultyField, difficulty);
    }
    
    const { data: words, error } = await query;
    
    if (error) {
      throw error;
    }
    
    // Rastgele karıştır
    const shuffled = words ? words.sort(() => Math.random() - 0.5) : [];
    
    let response = {
      words: [],
      wordGroups: [],
      count: 0,
      requested: limit
    };
    
    if (groupByWord) {
      // Kelime bazında grupla ve rastgele seç
      const grouped = shuffled.reduce((acc, word) => {
        if (!acc[word.word]) {
          acc[word.word] = {
            word: word.word,
            meanings: [],
            totalMeanings: 0,
            difficultyRange: {
              initial: word.initial_difficulty || 'intermediate',
              final: word.final_difficulty
            }
          };
        }
        
        acc[word.word].meanings.push(word);
        acc[word.word].totalMeanings++;
        
        return acc;
      }, {});
      
      const wordGroupsArray = Object.values(grouped);
      response.wordGroups = wordGroupsArray.slice(0, limit);
      response.count = response.wordGroups.length;
      
      // Düz liste için de hazırla
      response.words = response.wordGroups.flatMap(group => group.meanings);
    } else {
      // Normal düz liste
      response.words = shuffled.slice(0, limit);
      response.count = response.words.length;
    }
    
    res.json(response);
    
  } catch (error) {
    res.status(500).json({
      error: 'Rastgele kelimeler yüklenirken hata oluştu',
      message: error.message
    });
  }
});

// POST /api/words/upload-file - Dosyadan kelime yükleme - AYNI
router.post('/upload-file', async (req, res) => {
  try {
    const { words, fileName } = req.body;
    
    // Validasyon
    if (!words || !Array.isArray(words) || words.length === 0) {
      return res.status(400).json({
        error: 'Kelime listesi gerekli',
        message: 'Lütfen geçerli bir kelime dizisi gönderin'
      });
    }
    
    if (words.length > 50000) {
      return res.status(400).json({
        error: 'Çok fazla kelime',
        message: 'Maksimum 50.000 kelime yükleyebilirsiniz'
      });
    }

    // Kelimeleri temizle ve unique yap
    const cleanWords = [...new Set(
      words
        .map(word => word.toString().trim().toLowerCase())
        .filter(word => word.length > 0 && word.length <= 50)
        .filter(word => /^[a-zA-Z\s\-']+$/.test(word)) // Sadece harf, tire, apostrof
    )];

    if (cleanWords.length === 0) {
      return res.status(400).json({
        error: 'Geçerli kelime bulunamadı',
        message: 'Dosyada işlenebilir kelime bulunamadı'
      });
    }

    // Batch ID oluştur
    const batchId = require('crypto').randomUUID();

    // Pending words tablosuna toplu ekleme
    const pendingWordsData = cleanWords.map(word => ({
      word: word,
      upload_batch_id: batchId,
      status: 'pending',
      created_at: new Date().toISOString()
    }));

    console.log(`📁 ${fileName || 'Unknown'} dosyasından ${cleanWords.length} kelime queue'ya ekleniyor...`);

    // Supabase'e toplu ekleme (1000'lik gruplar halinde)
    const batchSize = 1000;
    let totalInserted = 0;
    let duplicateCount = 0;

    for (let i = 0; i < pendingWordsData.length; i += batchSize) {
      const batch = pendingWordsData.slice(i, i + batchSize);
      
      try {
        const { data, error } = await req.supabase
          .from('pending_words')
          .insert(batch)
          .select('id');

        if (error) {
          // Duplicate key hatası ise devam et
          if (error.code === '23505') {
            duplicateCount += batch.length;
            console.log(`⚠️ ${batch.length} duplicate kelime atlandı`);
            continue;
          }
          throw error;
        }

        totalInserted += data?.length || 0;
        console.log(`✅ Batch ${Math.floor(i/batchSize) + 1} eklendi (${data?.length || 0} kelime)`);
        
      } catch (batchError) {
        console.error(`❌ Batch ${Math.floor(i/batchSize) + 1} hatası:`, batchError);
        continue;
      }
    }

    // Background processor'ı başlat (eğer çalışmıyorsa)
    if (totalInserted > 0 && !req.wordProcessor.getStats().isProcessing) {
      console.log('🚀 Aşamalı Background processor başlatılıyor...');
      req.wordProcessor.startProcessing().catch(error => {
        console.error('❌ Background processor başlatma hatası:', error);
      });
    }

    // Sonuçları döndür
    res.json({
      message: 'Dosya başarıyla yüklendi ve queue\'ya eklendi',
      results: {
        fileName: fileName || 'Unknown',
        batchId: batchId,
        totalWords: cleanWords.length,
        queued: totalInserted,
        duplicates: duplicateCount,
        failed: cleanWords.length - totalInserted - duplicateCount
      },
      status: 'queued',
      nextStep: 'Aşamalı background processing ile Gemini 2.0 Flash API\'den veriler çekilecek'
    });

    console.log(`🎉 Dosya yükleme tamamlandı: ${totalInserted} kelime queue'ya eklendi`);
    
  } catch (error) {
    console.error('❌ Dosya yükleme hatası:', error);
    res.status(500).json({
      error: 'Dosya yükleme hatası',
      message: error.message
    });
  }
});

// GET /api/words/queue-status/:batchId - Queue durumunu kontrol et - AYNI
router.get('/queue-status/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;

    // Kalan kelime sayısı
    const { count: remainingCount, error: countError } = await req.supabase
      .from('pending_words')
      .select('*', { count: 'exact', head: true })
      .eq('upload_batch_id', batchId)
      .eq('status', 'pending');

    if (countError) {
      throw countError;
    }

    // İşlenmiş kelime sayısı (bu batch'ten)
    const { count: processedCount, error: processedError } = await req.supabase
      .from('word_processing_logs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'success')
      .gte('processed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Son 24 saat

    if (processedError && processedError.code !== 'PGRST116') {
      throw processedError;
    }

    // Başarısız kelime sayısı
    const { count: failedCount, error: failedError } = await req.supabase
      .from('pending_words')
      .select('*', { count: 'exact', head: true })
      .eq('upload_batch_id', batchId)
      .eq('status', 'failed');

    // Processing durumu
    const { count: processingCount, error: processingCountError } = await req.supabase
      .from('pending_words')
      .select('*', { count: 'exact', head: true })
      .eq('upload_batch_id', batchId)
      .eq('status', 'processing');

    res.json({
      batchId,
      pending: remainingCount || 0,
      processing: processingCount || 0,
      processed: processedCount || 0,
      failed: failedCount || 0,
      status: (remainingCount || 0) > 0 ? 'processing' : 'completed',
      lastUpdate: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Queue status hatası:', error);
    res.status(500).json({
      error: 'Queue status alınamadı',
      message: error.message
    });
  }
});

// GET /api/words/queue-stats - Genel queue istatistikleri - GÜNCELLEME
router.get('/queue-stats', async (req, res) => {
  try {
    // Toplam pending kelimeler
    const { count: totalPending, error: pendingError } = await req.supabase
      .from('pending_words')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Processing kelimeler
    const { count: totalProcessing, error: processingError } = await req.supabase
      .from('pending_words')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'processing');

    // Failed kelimeler
    const { count: totalFailed, error: failedError } = await req.supabase
      .from('pending_words')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed');

    if (pendingError || processingError || failedError) {
      throw pendingError || processingError || failedError;
    }

    // Batch sayısı
    const { data: batches, error: batchError } = await req.supabase
      .from('pending_words')
      .select('upload_batch_id')
      .limit(1000);

    if (batchError) {
      throw batchError;
    }

    const uniqueBatches = [...new Set(batches?.map(b => b.upload_batch_id) || [])];

    // En eski pending kelime
    const { data: oldestWord, error: oldestError } = await req.supabase
      .from('pending_words')
      .select('created_at, word')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    // Processor durumu - GÜNCELLEME
    const processorStats = req.wordProcessor.getStats();

    res.json({
      totalPendingWords: totalPending || 0,
      totalProcessingWords: totalProcessing || 0,
      totalFailedWords: totalFailed || 0,
      activeBatches: uniqueBatches.length,
      oldestPendingWord: oldestWord || null,
      isQueueActive: (totalPending || 0) > 0,
      processorStats: {
        ...processorStats,
        analysisMethod: 'step-by-step' // YENİ
      },
      lastUpdate: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Queue stats hatası:', error);
    res.status(500).json({
      error: 'Queue istatistikleri alınamadı',
      message: error.message
    });
  }
});

// backend/routes/words.js dosyasının sonuna eklenecek - SORU YÖNETİMİ ENDPOINT'LERİ

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

      const response = await require('axios').post(
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
    console.error('❌ Soru silme hatası:', error);
    res.status(500).json({
      error: 'Soru silinirken hata oluştu',
      message: error.message
    });
  }
});

// POST /api/words/questions/bulk - Toplu soru işlemleri
router.post('/questions/bulk', async (req, res) => {
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
    let affected = 0;

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

    affected = questionIds.length; // Supabase doesn't return affected count easily

    res.json({
      message: `${affected} soru için ${operation} işlemi tamamlandı`,
      affected,
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

// POST /api/words/questions/:id/toggle-active - Soru aktiflik durumunu değiştir
router.post('/questions/:id/toggle-active', async (req, res) => {
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

module.exports = router;error) {
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

// POST /api/words/questions/generate - Seçili kelimeler için soru oluştur
router.post('/questions/generate', async (req, res) => {
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
            processingTime: 0 // Will be calculated if needed
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
      duplicate: 0, // Burada hesaplanabilir
      total: results.total
    };

    console.log(`🎉 Soru oluşturma tamamlandı: ${summary.generated} başarılı, ${summary.failed} başarısız`);

    res.json({
      message: 'Soru oluşturma işlemi tamamlandı',
      results: {
        ...results,
        successCount: results.successful.length,
        failureCount: results.failed.length,
        processingTime: 0 // Will be calculated if needed
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

// GET /api/words/questions - Soru listesi
router.get('/questions', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search;
    const difficulty = req.query.difficulty;
    const isActive = req.query.isActive;
    const sortBy = req.query.sortBy || 'created_at';
    const sortOrder = req.query.sortOrder || 'desc';
    
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
    const allowedSortFields = ['created_at', 'difficulty', 'times_shown'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const ascending = sortOrder === 'asc';
    
    query = query.order(sortField, { ascending });
    
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

// GET /api/words/questions/stats - Soru istatistikleri
router.get('/questions/stats', async (req, res) => {
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
      partOfSpeechBreakdown: {}, // Bu sonra hesaplanabilir
      recentQuestions: recentQuestions || 0,
      averageCorrectRate: 0, // Bu sonra hesaplanabilir
      mostShownWords: [] // Bu sonra hesaplanabilir
    });

  } catch (error) {
    console.error('❌ Soru istatistikleri hatası:', error);
    res.status(500).json({
      error: 'Soru istatistikleri alınamadı',
      message: error.message
    });
  }
});

// PUT /api/words/questions/:id - Soru güncelle
router.put('/questions/:id', async (req, res) => {
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

// DELETE /api/words/questions/:id - Soru sil
router.delete('/questions/:id', async (req, res) => {
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
    
  } catch (

module.exports = router;