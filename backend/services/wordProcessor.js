// backend/services/wordProcessor.js - SORU KAYDETME DESTEKLİ
const axios = require('axios');
const { WORD_PROCESSOR_PROMPT_TEMPLATE } = require('../config/prompts');

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
      const prompt = WORD_PROCESSOR_PROMPT_TEMPLATE(word);

      console.log(`🤖 Gemini 2.0 Flash - Aşamalı analiz başlatılıyor: ${word}`);

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${this.geminiApiKey}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        },
        {
          timeout: 45000, // 45 saniye timeout
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
      console.log(`📝 Gemini 2.0 Flash aşamalı analiz tamamlandı: ${word}`);

      // JSON parse et
      let parsedData;
      try {
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
      if (!parsedData.word || !parsedData.step4_final_difficulty || !parsedData.step2_meanings) {
        throw new Error('Gemini yanıtında gerekli step alanları eksik (word, step4_final_difficulty, step2_meanings)');
      }

      if (!Array.isArray(parsedData.step2_meanings) || parsedData.step2_meanings.length === 0) {
        throw new Error('Gemini yanıtında geçerli meanings bulunamadı (step2_meanings)');
      }

      // Zorluk seviyesi doğrulama
      const validDifficulties = ['beginner', 'intermediate', 'advanced'];
      if (!validDifficulties.includes(parsedData.step4_final_difficulty)) {
        console.warn(`⚠️ Geçersiz final difficulty: ${parsedData.step4_final_difficulty}, 'intermediate' olarak ayarlanıyor`);
        parsedData.step4_final_difficulty = 'intermediate';
      }

      const meaningCount = parsedData.step2_meanings.length;
      const questionCount = parsedData.step7_questions ? parsedData.step7_questions.length : 0;
      const initialDiff = parsedData.step1_initial_difficulty; 
      const finalDiff = parsedData.step4_final_difficulty;
      
      console.log(`✅ ${word} aşamalı analiz başarılı: ${meaningCount} anlam, ${questionCount} soru, İlk Zorluk: ${initialDiff}, Son Zorluk: ${finalDiff}`);
      
      return {
        rawResponse: geminiResponse,
        parsedData: parsedData
      };

    } catch (error) {
      if (error.response) {
        console.error('❌ Gemini API hatası:', error.response.status, error.response.data);
        throw new Error(`Gemini API hatası: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
      
      if (error.code === 'ECONNABORTED') {
        throw new Error(`Zaman aşımı: ${word}`);
      }
      
      throw new Error(`Gemini API çağrısı başarısız: ${error.message}`);
    }
  }

  // Soruları parse et ve doğrula
  parseQuestions(parsedData, word) {
    const questions = [];

    if (!parsedData.step7_questions || !Array.isArray(parsedData.step7_questions)) {
      console.warn(`⚠️ ${word} için soru bulunamadı (step7_questions eksik)`);
      return questions;
    }

    console.log(`📚 ${word} için ${parsedData.step7_questions.length} soru işleniyor...`);

    parsedData.step7_questions.forEach((question, index) => {
      try {
        // Gerekli alanları kontrol et
        const requiredFields = ['meaning_id', 'question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer'];
        const missingFields = requiredFields.filter(field => !question[field]);
        
        if (missingFields.length > 0) {
          console.error(`❌ ${word} - Soru ${index + 1} eksik alanlar: ${missingFields.join(', ')}`);
          return;
        }

        // Correct answer doğrulama
        if (!['A', 'B', 'C', 'D'].includes(question.correct_answer)) {
          console.error(`❌ ${word} - Soru ${index + 1} geçersiz correct_answer: ${question.correct_answer}`);
          return;
        }

        // Difficulty doğrulama
        const validDifficulties = ['beginner', 'intermediate', 'advanced'];
        let difficulty = question.difficulty;
        if (!validDifficulties.includes(difficulty)) {
          difficulty = parsedData.step4_final_difficulty || 'intermediate';
          console.warn(`⚠️ ${word} - Soru ${index + 1} geçersiz difficulty, ${difficulty} olarak ayarlandı`);
        }

        const questionData = {
          word: word.toLowerCase(),
          meaning_id: question.meaning_id,
          question_text: question.question_text.trim(),
          option_a: question.option_a.trim(),
          option_b: question.option_b.trim(),
          option_c: question.option_c.trim(),
          option_d: question.option_d.trim(),
          correct_answer: question.correct_answer,
          explanation: question.explanation ? question.explanation.trim() : 'Açıklama mevcut değil',
          difficulty: difficulty,
          part_of_speech: parsedData.step2_meanings.find(m => m.meaning_id === question.meaning_id)?.part_of_speech || 'unknown',
          source: 'gemini-2.0-flash-001',
          times_shown: 0,
          times_correct: 0,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        questions.push(questionData);
        console.log(`✅ Soru ${index + 1} hazırlandı (meaning_id: ${question.meaning_id}): ${question.question_text.substring(0, 50)}...`);
        
      } catch (questionError) {
        console.error(`❌ ${word} - Soru ${index + 1} işlenirken hata:`, questionError);
      }
    });

    return questions;
  }

  // Soruları veritabanına kaydet
  async saveQuestionsToDatabase(questions, word) {
    if (!questions || questions.length === 0) {
      console.warn(`⚠️ ${word} için kaydedilecek soru yok`);
      return { saved: 0, failed: 0 };
    }

    let savedCount = 0;
    let failedCount = 0;

    console.log(`💾 ${word} için ${questions.length} soru veritabanına kaydediliyor...`);

    for (const [index, question] of questions.entries()) {
      try {
        // Duplicate control
        const { data: existing, error: checkError } = await this.supabase
          .from('questions')
          .select('id')
          .eq('word', question.word)
          .eq('meaning_id', question.meaning_id)
          .eq('question_text', question.question_text)
          .single();
        
        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }
        
        if (existing) {
          console.log(`⚠️ ${word} - Soru ${index + 1} zaten mevcut (meaning_id: ${question.meaning_id})`);
          continue;
        }

        // Soruyu kaydet
        const { data: insertedQuestion, error: insertError } = await this.supabase
          .from('questions')
          .insert([question])
          .select('id')
          .single();

        if (insertError) {
          if (insertError.code === '23505') { // Unique constraint violation
            console.log(`⚠️ ${word} - Soru ${index + 1} duplicate key hatası`);
            continue;
          }
          throw insertError;
        }

        savedCount++;
        console.log(`✅ ${word} - Soru ${index + 1} kaydedildi (ID: ${insertedQuestion.id}, meaning_id: ${question.meaning_id})`);
        
      } catch (saveError) {
        failedCount++;
        console.error(`❌ ${word} - Soru ${index + 1} kaydetme hatası (meaning_id: ${question.meaning_id}):`, saveError);
      }
    }

    console.log(`📊 ${word} soru kaydetme özeti: ${savedCount} başarılı, ${failedCount} başarısız`);
    return { saved: savedCount, failed: failedCount };
  }

  // Gemini verilerini Supabase formatına dönüştür
  parseGeminiDataForSupabase(geminiData, originalWord) {
    const results = [];
    const { parsedData } = geminiData;

    if (!parsedData || !parsedData.step2_meanings) {
      console.error('❌ Gemini parsedData.step2_meanings eksik veya hatalı');
      return results;
    }

    console.log(`🔄 ${originalWord} için ${parsedData.step2_meanings.length} anlam işleniyor...`);

    parsedData.step2_meanings.forEach(meaning => {
      try {
        const example = parsedData.step3_examples?.find(ex => ex.meaning_id === meaning.meaning_id);
        const translation = parsedData.step5_turkish_translations?.find(tr => tr.meaning_id === meaning.meaning_id);
        const mapping = parsedData.step6_word_mappings?.find(map => map.meaning_id === meaning.meaning_id);
        
        const wordData = {
          word: originalWord.toLowerCase(),
          meaning_id: meaning.meaning_id,
          part_of_speech: meaning.part_of_speech ? meaning.part_of_speech.toLowerCase() : 'unknown',
          meaning_description: meaning.meaning_description || 'No description provided',
          english_example: example ? example.english_sentence : 'No example provided',
          turkish_sentence: translation ? translation.turkish_sentence : 'Çeviri bulunamadı',
          turkish_meaning: mapping ? mapping.turkish_equivalent : 'Eşleştirme bulunamadı',
          initial_difficulty: parsedData.step1_initial_difficulty || null,
          final_difficulty: parsedData.step4_final_difficulty || 'intermediate',
          difficulty_reasoning: parsedData.step4_difficulty_reasoning || 'No reasoning provided',
          analysis_method: 'step-by-step',
          source: 'gemini-2.0-flash-001',
          times_shown: 0,
          times_correct: 0,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        results.push(wordData);
        console.log(`✅ Anlam ${meaning.meaning_id}: ${meaning.part_of_speech} - ${mapping?.turkish_equivalent || 'N/A'}`);
        
      } catch (meaningError) {
        console.error(`❌ ${originalWord} - meaning_id ${meaning.meaning_id} işlenirken hata:`, meaningError);
      }
    });

    return results;
  }

  // Tek bir kelimeyi işle
  async processOneWord() {
    const startTime = Date.now();
    
    try {
      const { data: pendingWord, error: fetchError } = await this.supabase
        .from('pending_words')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          return { status: 'queue_empty' };
        }
        throw fetchError;
      }

      if (!pendingWord) {
        return { status: 'queue_empty' };
      }

      console.log(`🔄 Aşamalı analiz başlatılıyor: ${pendingWord.word}`);

      await this.supabase
        .from('pending_words')
        .update({ 
          status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', pendingWord.id);

      try {
        // Gemini'den veri çek
        const geminiData = await this.fetchWordFromGeminiAPI(pendingWord.word);
        const parsedWords = this.parseGeminiDataForSupabase(geminiData, pendingWord.word);

        if (parsedWords.length === 0) {
          throw new Error('Gemini\'den alınan veri işlenemedi');
        }

        let addedCount = 0;
        let duplicateCount = 0;
        
        // Words tablosuna kaydet
        for (const wordData of parsedWords) {
          try {
            const { data: existing, error: checkError } = await this.supabase
              .from('words')
              .select('id')
              .eq('word', wordData.word)
              .eq('meaning_id', wordData.meaning_id)
              .eq('part_of_speech', wordData.part_of_speech)
              .single();
            
            if (checkError && checkError.code !== 'PGRST116') {
              throw checkError;
            }
            
            if (existing) {
              duplicateCount++;
              console.log(`⚠️ Duplicate atlandı: ${wordData.word} (meaning_id: ${wordData.meaning_id})`);
              continue;
            }
            
            const { data: insertedWord, error: insertError } = await this.supabase
              .from('words')
              .insert([wordData])
              .select('*');
            
            if (insertError) {
              if (insertError.code === '23505') {
                duplicateCount++;
                console.log(`⚠️ DB Unique constraint: ${wordData.word} (meaning_id: ${wordData.meaning_id})`);
                continue;
              }
              throw insertError;
            }
            
            addedCount++;
            console.log(`✅ Eklendi: ${wordData.word} - ${wordData.turkish_meaning} (${wordData.part_of_speech})`);
          } catch (saveError) {
            console.error(`❌ ${wordData.word} (meaning_id: ${wordData.meaning_id}) kaydetme hatası:`, saveError);
            continue;
          }
        }

        // Soruları parse et ve kaydet - YENİ
        const questions = this.parseQuestions(geminiData.parsedData, pendingWord.word);
        const questionResult = await this.saveQuestionsToDatabase(questions, pendingWord.word);

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

        // Pending word'u sil
        await this.supabase
          .from('pending_words')
          .delete()
          .eq('id', pendingWord.id);

        console.log(`✅ ${pendingWord.word}: ${addedCount} anlam, ${questionResult.saved} soru eklendi, ${duplicateCount} duplicate atlandı (${processingTime}ms)`);

        this.processedCount++;
        return { 
          status: 'success', 
          word: pendingWord.word,
          addedDefinitions: addedCount,
          addedQuestions: questionResult.saved, // YENİ
          duplicateDefinitions: duplicateCount,
          totalDefinitions: parsedWords.length,
          processingTime: processingTime
        };

      } catch (wordError) {
        const processingTime = Date.now() - startTime;
        console.error(`❌ ${pendingWord.word} işlenirken hata:`, wordError.message);
        
        const newRetryCount = (pendingWord.retry_count || 0) + 1;
        
        if (newRetryCount <= 3) {
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
          await this.supabase
            .from('pending_words')
            .update({ 
              status: 'failed',
              error_message: wordError.message,
              updated_at: new Date().toISOString()
            })
            .eq('id', pendingWord.id);
        }

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

    console.log('🚀 Word processor aşamalı analiz sistemi başlatıldı');

    try {
      while (this.isProcessing) {
        try {
          const result = await this.processOneWord();

          if (result.status === 'queue_empty') {
            console.log('📭 Queue boş, processing durduruluyor');
            break;
          }

          if (result.status === 'success') {
            console.log(`✅ Başarılı: ${result.word} (${result.addedDefinitions} anlam, ${result.addedQuestions || 0} soru)`);
          } else if (result.status === 'failed') {
            console.log(`❌ Başarısız: ${result.word} - ${result.reason}`);
          }

          // Rate limiting - 2 saniye bekle
          await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (processingError) {
          console.error('❌ Processing döngüsü hatası:', processingError);
          this.errorCount++;
          
          // Hata durumunda 5 saniye bekle
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    } catch (fatalError) {
      console.error('❌ Fatal processing hatası:', fatalError);
    } finally {
      this.isProcessing = false;
      const endTime = new Date();
      const totalTime = this.startTime ? (endTime.getTime() - this.startTime.getTime()) / 1000 : 0;
      
      console.log(`🏁 Processing durduruldu. ${this.processedCount} kelime işlendi, ${this.errorCount} hata. Toplam süre: ${totalTime}s`);
    }
  }

  // Processing'i durdur
  stopProcessing() {
    if (!this.isProcessing) {
      console.log('⚠️ Processing zaten durmuş');
      return;
    }

    console.log('🛑 Word processor durduruluyor...');
    this.isProcessing = false;
  }

  // Durum bilgisi al
  getStats() {
    const now = new Date();
    const elapsedTime = this.startTime ? (now.getTime() - this.startTime.getTime()) / 1000 : 0;

    return {
      isProcessing: this.isProcessing,
      processedCount: this.processedCount,
      errorCount: this.errorCount,
      startTime: this.startTime ? this.startTime.toISOString() : null,
      elapsedTime: elapsedTime,
      analysisMethod: 'step-by-step'
    };
  }
}

module.exports = WordProcessor;