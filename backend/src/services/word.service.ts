import { WordEntry } from '../types/word.types';
import { supabase } from '../config/supabaseClient';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  // Log an error or throw, but allow server to start if GEMINI_API_KEY is optional for some flows
  // For this application, it's critical, so we should throw.
  console.error("CRITICAL: Gemini API key (GEMINI_API_KEY) is not configured in .env file.");
  throw new Error("Gemini API key must be provided in .env file for the application to function.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
// Using a more recent model, ensure it's available or adjust as needed.
// gemini-1.5-flash-latest is a good candidate for speed and capability.
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

const generationConfig = {
  temperature: 0.7, // Adjust for creativity vs. predictability
  topK: 1,
  topP: 1,
  maxOutputTokens: 2048, // Adjust as needed for expected response size
  responseMimeType: "application/json", // Request JSON output
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// Define the expected JSON structure from Gemini
interface GeminiWordResponse {
  part_of_speech: string;
  definition: string; // Bullet points as a single string
  difficulty_level: string;
  example_sentence: string;
  option_a: string; // Correct
  option_b: string;
  option_c: string;
  option_d: string;
}


export const addWordService = async (wordSubmission: { word: string }): Promise<WordEntry> => {
  const { word } = wordSubmission;

  // 1. Call Gemini API
  console.log(`Calling Gemini API for: ${word}`);

  const prompt = `
    For the English vocabulary word "${word}", provide the following information in JSON format:
    1.  "part_of_speech": The part of speech (e.g., noun, verb, adjective).
    2.  "definition": Dictionary-style definitions, formatted as bullet points within a single string (e.g., "• Definition 1.\n• Definition 2.").
    3.  "difficulty_level": The CEFR difficulty level (e.g., A1, A2, B1, B2, C1, C2).
    4.  "example_sentence": An example sentence using the word that matches the difficulty level and part of speech.
    5.  "option_a": The correct definition or a close synonym, suitable as a multiple-choice correct answer.
    6.  "option_b": An incorrect multiple-choice option.
    7.  "option_c": Another incorrect multiple-choice option.
    8.  "option_d": A third incorrect multiple-choice option.

    Ensure the example sentence is appropriate for the given difficulty level.
    The question for these options will be: "What is the meaning of the word '${word}' used in the following sentence?"
    
    Output ONLY the JSON object.
  `;

  try {
    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
        safetySettings,
    });
    const responseText = result.response.text();
    const geminiData = JSON.parse(responseText) as GeminiWordResponse;

    // Validate that all expected fields are present
    const requiredKeys: Array<keyof GeminiWordResponse> = ['part_of_speech', 'definition', 'difficulty_level', 'example_sentence', 'option_a', 'option_b', 'option_c', 'option_d'];
    for (const key of requiredKeys) {
        if (!(key in geminiData) || geminiData[key] === undefined || geminiData[key] === '') {
            throw new Error(`Gemini API response missing or has empty required field: ${key}`);
        }
    }
    
    const wordEntryData: Omit<WordEntry, 'id' | 'created_at' | 'updated_at'> = {
      word: word,
      part_of_speech: geminiData.part_of_speech,
      definition: geminiData.definition,
      difficulty_level: geminiData.difficulty_level,
      example_sentence: geminiData.example_sentence,
      option_a: geminiData.option_a,
      option_b: geminiData.option_b,
      option_c: geminiData.option_c,
      option_d: geminiData.option_d,
      update_note: null,
      placeholder_1: null,
      placeholder_2: null,
    };

    // 2. Save to Supabase
    const { data, error: supabaseError } = await supabase
      .from('words') // Assuming your table is named 'words'
      .insert([wordEntryData])
      .select()
      .single();

    if (supabaseError) {
      console.error('Error inserting word into Supabase:', supabaseError);
      throw new Error(`Failed to save word to database: ${supabaseError.message}`);
    }

    if (!data) {
      throw new Error('Failed to save word to database: No data returned after insert.');
    }

    console.log('Word saved to Supabase:', data);
    return data as WordEntry;

  } catch (error) {
    console.error(`Error processing word "${word}":`, error);
    if (error instanceof Error) {
        throw new Error(`Failed to process word "${word}": ${error.message}`);
    }
    throw new Error(`An unknown error occurred while processing word "${word}".`);
  }
};