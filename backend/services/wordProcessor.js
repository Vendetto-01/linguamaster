const axios = require('axios');

class WordProcessor {
  constructor(supabase) {
    this.supabase = supabase;
    this.isProcessing = false;
    this.processedCount = 0;
    this.errorCount = 0;
    this.startTime = null;
  }

  // Dictionary API'den kelime bilgilerini çek
  async fetchWordFromAPI(word) {
    try {
      const response = await axios.get(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`,
        { timeout: 15000 } // 15 saniye timeout
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
  parseWordData(apiData, originalWord) {
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
                synonyms: meaning.synonyms?.slice(0, 5) || [], // Max 5 synonym
                antonyms: meaning.antonyms?.slice(0, 5) || [], // Max 5 antonym
                source: 'file-upload',
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

  // Tek bir kelimeyi işle
  async processOneWord() {
    try {
      // Queue'dan bir kelime al
      const { data: pendingWord, error: fetchError } = await this.supabase
        .from('pending_words')
        .select('*')
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

      try {
        // API'den kelime verilerini çek
        const apiData = await this.fetchWordFromAPI(pendingWord.word);
        const parsedWords = this.parseWordData(apiData, pendingWord.word);

        if (parsedWords.length === 0) {
          console.log(`⚠️ ${pendingWord.word} için API'den veri alınamadı`);
          
          // Pending'den sil (başarısız olsa da)
          await this.supabase
            .from('pending_words')
            .delete()
            .eq('id', pendingWord.id);

          this.errorCount++;
          return { 
            status: 'failed', 
            word: pendingWord.word, 
            reason: 'API\'den veri alınamadı' 
          };
        }

        // İlk anlamı words tablosuna kaydet
        const wordToSave = parsedWords[0];

        // Her anlamı ayrı ayrı kontrol et ve kaydet (manuel süreçle aynı)
        let wordProcessed = false;
        for (const wordData of parsedWords) {
          try {
            // Üçlü kombinasyon kontrolü: word + part_of_speech + definition
            const { data: existing, error: checkError } = await this.supabase
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
              // Bu kombinasyon zaten mevcut
              if (!wordProcessed) {
                console.log(`📝 ${pendingWord.word} (${wordData.part_of_speech}) zaten mevcut, atlandı`);
                wordProcessed = true;
              }
              continue;
            }
            
            // Yeni kayıt ekle
            const { error: insertError } = await this.supabase
              .from('words')
              .insert([wordData]);
            
            if (insertError) {
              throw insertError;
            }
            
            console.log(`✅ ${pendingWord.word} (${wordData.part_of_speech}) başarıyla eklendi`);
            wordProcessed = true;
            break; // İlk başarılı kayıttan sonra bu kelime için dur
            
          } catch (saveError) {
            console.error(`❌ ${wordData.word} kaydetme hatası:`, saveError);
            if (!wordProcessed) {
              throw saveError; // İlk hata ise yukardaki catch'e geç
            }
          }
        }

        // Pending'den sil
        await this.supabase
          .from('pending_words')
          .delete()
          .eq('id', pendingWord.id);

        this.processedCount++;
        return { 
          status: 'success', 
          word: pendingWord.word,
          definitions: parsedWords.length
        };

      } catch (wordError) {
        console.error(`❌ ${pendingWord.word} işlenirken hata:`, wordError.message);
        
        // Hatalı kelimeyi pending'den sil
        await this.supabase
          .from('pending_words')
          .delete()
          .eq('id', pendingWord.id);

        this.errorCount++;
        return { 
          status: 'failed', 
          word: pendingWord.word, 
          reason: wordError.message 
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

    console.log('🚀 Word Processing başlatıldı');

    try {
      while (this.isProcessing) {
        const result = await this.processOneWord();

        if (result.status === 'queue_empty') {
          console.log('🏁 Queue boş, processing tamamlandı');
          break;
        }

        // Her 10 kelimede bir istatistik yazdır
        if ((this.processedCount + this.errorCount) % 10 === 0) {
          const elapsed = (new Date() - this.startTime) / 1000;
          const rate = (this.processedCount + this.errorCount) / elapsed;
          console.log(`📊 İşlenen: ${this.processedCount}, Hata: ${this.errorCount}, Hız: ${rate.toFixed(2)} kelime/saniye`);
        }

        // Rate limiting - API'yi zorlamayalım
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 saniye bekle
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