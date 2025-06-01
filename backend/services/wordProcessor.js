// backend/services/wordProcessor.js
const axios = require('axios');

class WordProcessor {
  constructor(supabase) {
    this.supabase = supabase;
    this.isProcessing = false;
    this.processedCount = 0;
    this.errorCount = 0;
    this.startTime = null;
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (!this.geminiApiKey) {
      console.error('❌ GEMINI_API_KEY environment variable gerekli');
    }
  }

  // Gemini API'den kelime bilgilerini çek
  async fetchWordFromGeminiAPI(word) {
    try {
      const prompt = `Analyze the English word "${word}" and provide comprehensive information in Turkish. I need:

1. The difficulty level of this word for English learners (beginner/intermediate/advanced)
2. All Turkish meanings/translations of this word
3. For each Turkish meaning, specify its part of speech (noun, verb, adjective, adverb, preposition, etc.)
4. For each Turkish meaning, provide a clear example sentence in English that demonstrates the usage

Please respond ONLY with a valid JSON object in this exact format:
{
  "word": "${word}",
  "difficulty": "beginner|intermediate|advanced",
  "meanings": [
    {
      "turkish_meaning": "Turkish translation here",
      "part_of_speech": "noun|verb|adjective|adverb|etc",
      "english_example": "Example sentence in English using the word ${word}"
    }
  ]
}

Important rules:
- Include ALL common meanings of the word
- Use standard part of speech terms in English (noun, verb, adjective, adverb, preposition, conjunction, interjection)
- Example sentences must be natural and demonstrate clear usage
- Difficulty should reflect general English learning progression
- Return ONLY the JSON, no additional text
- Ensure valid JSON syntax`;

      console.log(`🤖 Gemini API'ye istek gönderiliyor: ${word}`);

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        },
        {
          timeout: 30000, // 30 saniye timeout
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Gemini yanıtını parse et
      const geminiResponse = response.data;
      
      if (!geminiResponse.candidates || geminiResponse.candidates.length === 0) {
        throw new Error('Gemini API\'den geçersiz yanıt');
      }

      const generatedText = geminiResponse.candidates[0].content.parts[0].text;
      console.log(`📝 Gemini yanıtı alındı: ${word}`);

      // JSON parse et
      let parsedData;
      try {
        // Bazen Gemini markdown formatında yanıt verebilir, temizle
        const cleanedText = generatedText
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
        
        parsedData = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('❌ JSON parse hatası:', parseError);
        console.error('Gemini yanıtı:', generatedText);
        throw new Error(`JSON parse hatası: ${parseError.message}`);
      }

      // Veri doğrulama
      if (!parsedData.word || !parsedData.difficulty || !parsedData.meanings) {
        throw new Error('Gemini yanıtında gerekli alanlar eksik');
      }

      if (!Array.isArray(parsedData.meanings) || parsedData.meanings.length === 0) {
        throw new Error('Gemini yanıtında geçerli meanings bulunamadı');
      }

      // Zorluk seviyesi doğrulama
      const validDifficulties = ['beginner', 'intermediate', 'advanced'];
      if (!validDifficulties.includes(parsedData.difficulty)) {
        console.warn(`⚠️ Geçersiz difficulty: ${parsedData.difficulty}, 'intermediate' olarak ayarlanıyor`);
        parsedData.difficulty = 'intermediate';
      }

      console.log(`✅ ${word} başarıyla işlendi: ${parsedData.meanings.length} anlam, zorluk: ${parsedData.difficulty}`);
      
      return {
        rawResponse: geminiResponse,
        parsedData: parsedData
      };

    } catch (error) {
      if (error.response) {
        // Gemini API hatası
        console.error('❌ Gemini API hatası:', error.response.status, error.response.data);
        throw new Error(`Gemini API hatası: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
      
      if (error.code === 'ECONNABORTED') {
        throw new Error(`Zaman aşımı: ${word}`);
      }
      
      throw new Error(`Gemini API çağrısı başarısız: ${error.message}`);
    }
  }

  // Gemini verilerini Supabase formatına dönüştür
  parseGeminiDataForSupabase(geminiData, originalWord) {
    const results = [];
    const { parsedData } = geminiData;
    
    if (!parsedData || !parsedData.meanings) {
      return results;
    }

    parsedData.meanings.forEach(meaning => {
      const wordData = {
        word: originalWord.toLowerCase(),
        turkish_meaning: meaning.turkish_meaning,
        part_of_speech: meaning.part_of_speech.toLowerCase(),
        english_example: meaning.english_example,
        difficulty: parsedData.difficulty,
        source: 'gemini-api',
        times_shown: 0,
        times_correct: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      results.push(wordData);
    });
    
    return results;
  }

  // Tek bir kelimeyi işle
  async processOneWord() {
    const startTime = Date.now();
    
    try {
      // Queue'dan bir kelime al
      const { data: pendingWord, error: fetchError } = await this.supabase
        .from('pending_words')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // Queue boş
          return { status: 'queue_empty' };
        }
        throw fetchError;
      }

      if (!pendingWord) {
        return { status: 'queue_empty' };
      }

      console.log(`🔄 İşleniyor: ${pendingWord.word}`);

      // Pending word'ü processing olarak işaretle
      await this.supabase
        .from('pending_words')
        .update({ 
          status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', pendingWord.id);

      try {
        // Gemini API'den kelime verilerini çek
        const geminiData = await this.fetchWordFromGeminiAPI(pendingWord.word);
        const parsedWords = this.parseGeminiDataForSupabase(geminiData, pendingWord.word);

        if (parsedWords.length === 0) {
          throw new Error('Gemini\'den alınan veri işlenemedi');
        }

        // Her anlamı words tablosuna kaydet
        let addedCount = 0;
        let duplicateCount = 0;
        
        for (const wordData of parsedWords) {
          try {
            // Üçlü kombinasyon kontrolü: word + turkish_meaning + part_of_speech
            const { data: existing, error: checkError } = await this.supabase
              .from('words')
              .select('id')
              .eq('word', wordData.word)
              .eq('turkish_meaning', wordData.turkish_meaning)
              .eq('part_of_speech', wordData.part_of_speech)
              .single();
            
            if (checkError && checkError.code !== 'PGRST116') {
              throw checkError;
            }
            
            if (existing) {
              duplicateCount++;
              console.log(`⚠️ Duplicate atlandı: ${wordData.word} - ${wordData.turkish_meaning}`);
              continue;
            }
            
            // Yeni kayıt ekle
            const { error: insertError } = await this.supabase
              .from('words')
              .insert([wordData]);
            
            if (insertError) {
              throw insertError;
            }
            
            addedCount++;
            
          } catch (saveError) {
            console.error(`❌ ${wordData.word} (${wordData.part_of_speech}) kaydetme hatası:`, saveError);
            continue;
          }
        }

        const processingTime = Date.now() - startTime;
        
        // Processing log'u kaydet
        await this.supabase
          .from('word_processing_logs')
          .insert([{
            word: pendingWord.word,
            status: 'success',
            processing_time_ms: processingTime,
            gemini_response: geminiData.rawResponse,
            meanings_added: addedCount,
            processed_at: new Date().toISOString()
          }]);

        // Pending'den sil
        await this.supabase
          .from('pending_words')
          .delete()
          .eq('id', pendingWord.id);

        console.log(`✅ ${pendingWord.word}: ${addedCount} anlam eklendi, ${duplicateCount} duplicate atlandı (${processingTime}ms)`);

        this.processedCount++;
        return { 
          status: 'success', 
          word: pendingWord.word,
          addedDefinitions: addedCount,
          duplicateDefinitions: duplicateCount,
          totalDefinitions: parsedWords.length,
          processingTime: processingTime
        };

      } catch (wordError) {
        const processingTime = Date.now() - startTime;
        
        console.error(`❌ ${pendingWord.word} işlenirken hata:`, wordError.message);
        
        // Retry logic
        const newRetryCount = (pendingWord.retry_count || 0) + 1;
        
        if (newRetryCount <= 3) {
          // 3 denemeye kadar tekrar dene
          await this.supabase
            .from('pending_words')
            .update({ 
              status: 'pending',
              retry_count: newRetryCount,
              error_message: wordError.message,
              updated_at: new Date().toISOString()
            })
            .eq('id', pendingWord.id);
          
          console.log(`🔄 ${pendingWord.word} tekrar deneme kuyruğuna eklendi (${newRetryCount}/3)`);
        } else {
          // Max retry aşıldı, failed olarak işaretle
          await this.supabase
            .from('pending_words')
            .update({ 
              status: 'failed',
              error_message: wordError.message,
              updated_at: new Date().toISOString()
            })
            .eq('id', pendingWord.id);
        }

        // Error log'u kaydet
        await this.supabase
          .from('word_processing_logs')
          .insert([{
            word: pendingWord.word,
            status: 'failed',
            processing_time_ms: processingTime,
            error_message: wordError.message,
            meanings_added: 0,
            processed_at: new Date().toISOString()
          }]);

        this.errorCount++;
        return { 
          status: 'failed', 
          word: pendingWord.word, 
          reason: wordError.message,
          retryCount: newRetryCount
        };
      }

    } catch (error) {
      console.error('❌ processOneWord genel hatası:', error);
      throw error;
    }
  }

  // Ana processing loop
  async startProcessing() {
    if (this.isProcessing) {
      console.log('⚠️ Processing zaten çalışıyor');
      return;
    }

    this.isProcessing = true;
    this.startTime = new Date();
    this.processedCount = 0;
    this.errorCount = 0;

    console.log('🚀 Gemini Word Processing başlatıldı');

    try {
      while (this.isProcessing) {
        const result = await this.processOneWord();

        if (result.status === 'queue_empty') {
          console.log('🏁 Queue boş, processing tamamlandı');
          break;
        }

        // Her 5 kelimede bir istatistik yazdır
        if ((this.processedCount + this.errorCount) % 5 === 0) {
          const elapsed = (new Date() - this.startTime) / 1000;
          const rate = (this.processedCount + this.errorCount) / elapsed;
          console.log(`📊 İşlenen: ${this.processedCount}, Hata: ${this.errorCount}, Hız: ${rate.toFixed(2)} kelime/saniye`);
        }

        // Gemini API rate limiting - daha uzun bekleme
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5 saniye bekle
      }

    } catch (error) {
      console.error('❌ Processing döngüsü hatası:', error);
    } finally {
      this.isProcessing = false;
      const totalTime = (new Date() - this.startTime) / 1000;
      console.log(`🏁 Processing tamamlandı - Toplam süre: ${totalTime.toFixed(2)}s, İşlenen: ${this.processedCount}, Hata: ${this.errorCount}`);
    }
  }

  // Processing'i durdur
  stopProcessing() {
    console.log('🛑 Processing durduruluyor...');
    this.isProcessing = false;
  }

  // İstatistikleri al
  getStats() {
    return {
      isProcessing: this.isProcessing,
      processedCount: this.processedCount,
      errorCount: this.errorCount,
      startTime: this.startTime,
      elapsedTime: this.startTime ? (new Date() - this.startTime) / 1000 : 0
    };
  }
}

module.exports = WordProcessor;