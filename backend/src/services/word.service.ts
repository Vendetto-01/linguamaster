import { WordEntry } from '../types/word.types';
import { supabase } from '../config/supabaseClient';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("CRITICAL: Gemini API key (GEMINI_API_KEY) is not configured in .env file.");
  throw new Error("Gemini API key must be provided in .env file for the application to function.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" }); // Consider gemini-1.5-pro for complex JSON generation if flash struggles

const generationConfig = {
  temperature: 0.7, // May need adjustment for complex structured JSON
  topK: 1,
  topP: 1,
  maxOutputTokens: 3072, // Increased further due to more complex per-definition data
  responseMimeType: "application/json",
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// Details for each definition, now including its own quiz options
interface GeminiDefinitionDetail {
  definition_text: string;
  part_of_speech: string;
  difficulty_level: string; 
  example_sentence: string;
  option_a: string; // Correct answer for this specific definition
  option_b: string; // Distractor
  option_c: string; // Distractor
  option_d: string; // Distractor
}

// Updated main response structure from Gemini
interface GeminiWordResponse {
  definitions: GeminiDefinitionDetail[]; // Array of detailed definition objects, each with its own quiz options
}

export const addWordService = async (wordSubmission: { word: string }): Promise<WordEntry[]> => {
  const { word } = wordSubmission;

  console.log(`Calling Gemini API for: ${word}`);

  const prompt = `
    For the English vocabulary word "${word}", provide a JSON object with a single top-level key: "definitions".
    The value of "definitions" must be an array of objects. Each object in this array represents a distinct meaning of the word and must contain the following fields:
    1.  "definition_text": A distinct dictionary-style definition for this specific meaning of the word.
    2.  "part_of_speech": The specific part of speech for this definition (e.g., noun, verb, adjective).
    3.  "difficulty_level": The CEFR difficulty level for this definition (e.g., A1, A2, B1, B2, C1, C2).
    4.  "example_sentence": A unique example sentence using the word that specifically matches this "definition_text", "part_of_speech", and "difficulty_level".
    5.  "option_a": This exact "definition_text" (or a very close, accurate paraphrase of it), serving as the correct multiple-choice answer.
    6.  "option_b": An incorrect but plausible multiple-choice option (a distractor) relevant to this specific "definition_text".
    7.  "option_c": Another distinct incorrect but plausible multiple-choice option for this "definition_text".
    8.  "option_d": A third distinct incorrect but plausible multiple-choice option for this "definition_text".

    The question for these options will be: "What is the meaning of the word '${word}' used in the following sentence?" 
    (The frontend will dynamically generate the sentence part of the question using the "example_sentence" from this object).
    
    Output ONLY the JSON object. Ensure each "example_sentence" is unique and relevant to its corresponding "definition_text", and that all quiz options are tailored to that specific definition.
  `;

  try {
    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
        safetySettings,
    });
    const responseText = result.response.text();
    const geminiData = JSON.parse(responseText) as GeminiWordResponse;

    if (!geminiData || !Array.isArray(geminiData.definitions) || geminiData.definitions.length === 0) {
        throw new Error('Gemini API response must be an object with a non-empty "definitions" array.');
    }
    
    const wordEntriesToInsert: Omit<WordEntry, 'id' | 'created_at' | 'updated_at'>[] = [];

    for (const detail of geminiData.definitions) {
      const requiredDetailKeys: Array<keyof GeminiDefinitionDetail> = [
        'definition_text', 'part_of_speech', 'difficulty_level', 'example_sentence',
        'option_a', 'option_b', 'option_c', 'option_d'
      ];
      let isValidDetail = true;
      for (const key of requiredDetailKeys) {
        if (!(key in detail) || typeof detail[key] !== 'string' || detail[key].trim() === '') {
          console.warn(`Skipping a definition for word "${word}" due to missing or empty field: ${key} in`, detail);
          isValidDetail = false;
          break; 
        }
      }
      if (!isValidDetail) continue;

      wordEntriesToInsert.push({
        word: word, // The original submitted word
        part_of_speech: detail.part_of_speech.trim(),
        definition: detail.definition_text.trim(),
        difficulty_level: detail.difficulty_level.trim(),
        example_sentence: detail.example_sentence.trim(),
        option_a: detail.option_a.trim(), 
        option_b: detail.option_b.trim(),
        option_c: detail.option_c.trim(),
        option_d: detail.option_d.trim(),
        update_note: null,
        placeholder_1: null,
        placeholder_2: null,
      });
    }

    if (wordEntriesToInsert.length === 0) {
      throw new Error(`No valid definitions with complete quiz options found for word "${word}" after processing Gemini response. Check Gemini output structure and content.`);
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
        if (error.message.includes("JSON at position")) {
             console.error("Gemini response was likely not valid JSON. Raw response text might be logged by Gemini client if enabled, or inspect 'responseText' variable if debugging. Prompt complexity might be a factor.");
        }
        throw new Error(`Failed to process word "${word}": ${error.message}`);
    }
    throw new Error(`An unknown error occurred while processing word "${word}".`);
  }
};