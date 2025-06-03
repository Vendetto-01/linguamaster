import { WordEntry } from '../types/word.types';
import { supabase } from '../config/supabaseClient';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("CRITICAL: Gemini API key (GEMINI_API_KEY) is not configured in .env file.");
  throw new Error("Gemini API key must be provided in .env file for the application to function.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

const generationConfig = {
  temperature: 0.7,
  topK: 1,
  topP: 1,
  maxOutputTokens: 2048, // Increased slightly in case of many definitions with unique examples
  responseMimeType: "application/json",
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// Details for each definition
interface GeminiDefinitionDetail {
  definition_text: string;
  part_of_speech: string;
  difficulty_level: string; 
  example_sentence: string;
}

// Updated main response structure from Gemini
interface GeminiWordResponse {
  definitions: GeminiDefinitionDetail[]; // Array of detailed definition objects
  // Quiz options remain top-level as they apply to the word overall
  option_a: string; // This should be one of the definition_text values
  option_b: string;
  option_c: string;
  option_d: string;
}

export const addWordService = async (wordSubmission: { word: string }): Promise<WordEntry[]> => {
  const { word } = wordSubmission;

  console.log(`Calling Gemini API for: ${word}`);

  const prompt = `
    For the English vocabulary word "${word}", provide the following information in JSON format:
    1.  "definitions": An array of objects. Each object must contain:
        a.  "definition_text": A distinct dictionary-style definition for the word.
        b.  "part_of_speech": The specific part of speech for this definition (e.g., noun, verb, adjective).
        c.  "difficulty_level": The CEFR difficulty level for this definition (e.g., A1, A2, B1, B2, C1, C2).
        d.  "example_sentence": A unique example sentence using the word that specifically matches this definition_text, part_of_speech, and difficulty_level.
    2.  "option_a": The text of one of the "definition_text" values provided above, suitable as a multiple-choice correct answer.
    3.  "option_b": An incorrect multiple-choice option (a plausible but wrong definition or synonym).
    4.  "option_c": Another incorrect multiple-choice option.
    5.  "option_d": A third incorrect multiple-choice option.

    The question for these options will be: "What is the meaning of the word '${word}' used in the following sentence?" 
    (The frontend will dynamically generate the sentence part of the question using one of the example_sentence values).
    
    Output ONLY the JSON object. Ensure each "example_sentence" is unique and relevant to its corresponding "definition_text".
  `;

  try {
    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
        safetySettings,
    });
    const responseText = result.response.text();
    const geminiData = JSON.parse(responseText) as GeminiWordResponse;

    // Validate top-level quiz options
    const requiredQuizKeys: Array<keyof Pick<GeminiWordResponse, 'option_a' | 'option_b' | 'option_c' | 'option_d'>> = ['option_a', 'option_b', 'option_c', 'option_d'];
    for (const key of requiredQuizKeys) {
        if (!(key in geminiData) || typeof geminiData[key] !== 'string' || geminiData[key].trim() === '') {
            throw new Error(`Gemini API response missing or has empty required quiz option field: ${key}`);
        }
    }

    if (!Array.isArray(geminiData.definitions) || geminiData.definitions.length === 0) {
        throw new Error('Gemini API response "definitions" must be a non-empty array of objects.');
    }
    
    const wordEntriesToInsert: Omit<WordEntry, 'id' | 'created_at' | 'updated_at'>[] = [];

    for (const detail of geminiData.definitions) {
      // Validate each definition detail object
      const requiredDetailKeys: Array<keyof GeminiDefinitionDetail> = ['definition_text', 'part_of_speech', 'difficulty_level', 'example_sentence'];
      for (const key of requiredDetailKeys) {
        if (!(key in detail) || typeof detail[key] !== 'string' || detail[key].trim() === '') {
          console.warn(`Skipping a definition for word "${word}" due to missing or empty field: ${key} in`, detail);
          continue; // Skip this definition object
        }
      }

      wordEntriesToInsert.push({
        word: word,
        part_of_speech: detail.part_of_speech.trim(),
        definition: detail.definition_text.trim(),
        difficulty_level: detail.difficulty_level.trim(),
        example_sentence: detail.example_sentence.trim(),
        // Quiz options are the same for all entries of this word submission
        option_a: geminiData.option_a.trim(), 
        option_b: geminiData.option_b.trim(),
        option_c: geminiData.option_c.trim(),
        option_d: geminiData.option_d.trim(),
        update_note: null,
        placeholder_1: null,
        placeholder_2: null,
      });
    }

    if (wordEntriesToInsert.length === 0) {
      throw new Error(`No valid definitions found for word "${word}" after processing Gemini response. Check Gemini output structure and content.`);
    }

    const { data, error: supabaseError } = await supabase
      .from('words')
      .insert(wordEntriesToInsert)
      .select();

    if (supabaseError) {
      console.error('Error inserting word entries into Supabase:', supabaseError);
      throw new Error(`Failed to save word entries to database: ${supabaseError.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('Failed to save word entries to database: No data returned after insert.');
    }

    console.log(`${data.length} word entries saved to Supabase for "${word}":`, data);
    return data as WordEntry[];

  } catch (error) {
    console.error(`Error processing word "${word}":`, error);
    if (error instanceof Error) {
        // Check if it's a JSON parsing error, which might indicate Gemini didn't return valid JSON
        if (error.message.includes("JSON at position")) {
             console.error("Gemini response was likely not valid JSON. Raw response text might be logged by Gemini client if enabled, or inspect 'responseText' variable if debugging.");
        }
        throw new Error(`Failed to process word "${word}": ${error.message}`);
    }
    throw new Error(`An unknown error occurred while processing word "${word}".`);
  }
};