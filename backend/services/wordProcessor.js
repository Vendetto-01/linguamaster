// backend/services/wordProcessor.js - UPDATED FOR NEW SCHEMA
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

  // Gemini API'den kelime bilgilerini çek - YENİ AŞAMALI SİSTEM
  async fetchWordFromGeminiAPI(word) {
    try {
      const prompt = `Analyze the English word "${word}" step by step. Follow these exact steps:

STEP 1: Initial difficulty assessment
Determine the difficulty level of this word for English learners (beginner/intermediate/advanced).

STEP 2: Meaning identification  
Identify all different meanings and uses of this word in English. For each meaning, specify:
- The part of speech (noun, verb, adjective, adverb, preposition, conjunction, interjection)
- A brief description of that specific meaning

STEP 3: Example sentence creation
For each meaning identified in Step 2, create a clear, natural English example sentence that demonstrates that specific usage.

STEP 4: Context-based difficulty verification
Look at the example sentences you created. Based on the context and complexity of these sentences, verify or adjust the initial difficulty level.

STEP 5: Turkish translation of sentences
Translate each English example sentence into natural, fluent Turkish.

STEP 6: Word-to-word mapping
For each English sentence and its Turkish translation, identify exactly which Turkish word(s) correspond to the original English word being analyzed.

Respond ONLY with a valid JSON object in this exact format:
{
  "word": "${word}",
  "step1_initial_difficulty": "beginner|intermediate|advanced",
  "step2_meanings": [
    {
      "meaning_id": 1,
      "part_of_speech": "noun|verb|adjective|etc",
      "meaning_description": "brief description of this specific meaning"
    }
  ],
  "step3_examples": [
    {
      "meaning_id": 1,
      "english_sentence": "example sentence in English"
    }
  ],
  "step4_final_difficulty": "beginner|intermediate|advanced",
  "step4_difficulty_reasoning": "explanation for the final difficulty decision",
  "step5_turkish_translations": [
    {
      "meaning_id": 1,
      "english_sentence": "same English sentence from step 3",
      "turkish_sentence": "Turkish translation of the sentence"
    }
  ],
  "step6_word_mappings": [
    {
      "meaning_id": 1,
      "english_word": "${word}",
      "turkish_equivalent": "the specific Turkish word(s) that correspond to the English word in this context"
    }
  ]
}

Important rules:
- Include ALL common meanings of the word (maximum 6 meanings)
- Use standard part of speech terms
- Example sentences must be natural and demonstrate clear usage
- Turkish translations must be fluent and natural
- Word mappings should be precise
- Ensure valid JSON syntax`;

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

      // Veri doğrulama - yeni format
      if (!parsedData.word || !parsedData.step4_final_difficulty || !parsedData.step2_meanings) {
        throw new Error('Gemini yanıtında gerekli step alanları eksik');
      }

      if (!Array.isArray(parsedData.step2_meanings) || parsedData.step2_meanings.length === 0) {
        throw new Error('Gemini yanıtında geçerli meanings bulunamadı');
      }

      // Zorluk seviyesi doğrulama
      const validDifficulties = ['beginner', 'intermediate', 'advanced'];
      if (!validDifficulties.includes(parsedData.step4_final_difficulty)) {
        console.warn(`⚠️ Geçersiz final difficulty: ${parsedData.step4_final_difficulty}, 'intermediate' olarak ayarlanıyor`);
        parsedData.step4_final_difficulty = 'intermediate';
      }

      const meaningCount = parsedData.step2_meanings.length;
      const initialDiff = parsedData.step1_initial_difficulty;
      const finalDiff = parsedData.step4_final_difficulty;
      
      console.log(`✅ ${word} aşamalı analiz başarılı: ${meaningCount} anlam, ${initialDiff} → ${finalDiff}`);
      
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

  // Gemini verilerini Supabase formatına dönüştür - YENİ ŞEMA
  parseGeminiDataForSupabase(geminiData, originalWord) {
    const results = [];
    const { parsedData } = geminiData;
    
    if (!parsedData || !parsedData.step2_meanings) {
      console.error('❌ Gemini parsedData eksik veya hatalı');
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
    
    console.log(`📊 ${originalWord}: ${results.length}/${parsedData.step2_meanings.length} anlam başarıyla işlendi`);
    return results;
  }

  // Tek bir kelimeyi işle - GÜNCELLENEN DUPLICATE KONTROL
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
        const geminiData = await this.fetchWordFromGeminiAPI(pendingWord.word);
        const parsedWords = this.parseGeminiDataForSupabase(geminiData, pendingWord.word);

        if (parsedWords.length === 0) {
          throw new Error('Gemini\'den alınan veri işlenemedi');
        }

        let addedCount = 0;
        let duplicateCount = 0;
        
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
            
            const { error: insertError } = await this.supabase
              .from('words')
              .insert([wordData]);
            
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

        const processingTime = Date.now() - startTime;
        
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