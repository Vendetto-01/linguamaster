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
  maxOutputTokens: 2048,
  responseMimeType: "application/json",
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

interface GeminiWordResponse {
  part_of_speech: string;
  definitions: string[]; // Changed from 'definition: string' to 'definitions: string[]'
  difficulty_level: string;
  example_sentence: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
}

// The service will now return an array of WordEntry objects
export const addWordService = async (wordSubmission: { word: string }): Promise<WordEntry[]> => {
  const { word } = wordSubmission;

  console.log(`Calling Gemini API for: ${word}`);

  const prompt = `
    For the English vocabulary word "${word}", provide the following information in JSON format:
    1.  "part_of_speech": The part of speech (e.g., noun, verb, adjective).
    2.  "definitions": An array of strings, where each string is a distinct dictionary-style definition. Do not use bullet points within the strings.
    3.  "difficulty_level": The CEFR difficulty level (e.g., A1, A2, B1, B2, C1, C2).
    4.  "example_sentence": An example sentence using the word that matches the difficulty level and part of speech. This sentence should ideally relate to one of the primary definitions.
    5.  "option_a": The correct definition (choose one of the provided definitions) or a close synonym, suitable as a multiple-choice correct answer.
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

    const requiredKeys: Array<keyof GeminiWordResponse> = ['part_of_speech', 'definitions', 'difficulty_level', 'example_sentence', 'option_a', 'option_b', 'option_c', 'option_d'];
    for (const key of requiredKeys) {
        if (!(key in geminiData) || geminiData[key] === undefined) { // Allow empty string for some fields if Gemini might return that
            throw new Error(`Gemini API response missing required field: ${key}`);
        }
    }
    if (!Array.isArray(geminiData.definitions) || geminiData.definitions.length === 0) {
        throw new Error('Gemini API response "definitions" must be a non-empty array.');
    }
    
    const wordEntriesToInsert: Omit<WordEntry, 'id' | 'created_at' | 'updated_at'>[] = [];

    for (const singleDefinition of geminiData.definitions) {
      if (typeof singleDefinition !== 'string' || singleDefinition.trim() === '') {
        console.warn(`Skipping empty or invalid definition for word "${word}"`);
        continue;
      }
      wordEntriesToInsert.push({
        word: word,
        part_of_speech: geminiData.part_of_speech,
        definition: singleDefinition.trim(), // Use the individual definition here
        difficulty_level: geminiData.difficulty_level,
        example_sentence: geminiData.example_sentence, // Example sentence will be the same for all definitions of this word
        option_a: geminiData.option_a, // Options will be the same
        option_b: geminiData.option_b,
        option_c: geminiData.option_c,
        option_d: geminiData.option_d,
        update_note: null,
        placeholder_1: null,
        placeholder_2: null,
      });
    }

    if (wordEntriesToInsert.length === 0) {
      throw new Error(`No valid definitions found for word "${word}" after processing Gemini response.`);
    }

    // 2. Save to Supabase
    const { data, error: supabaseError } = await supabase
      .from('words')
      .insert(wordEntriesToInsert) // Insert an array of records
      .select(); // Select all inserted records

    if (supabaseError) {
      console.error('Error inserting word entries into Supabase:', supabaseError);
      throw new Error(`Failed to save word entries to database: ${supabaseError.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('Failed to save word entries to database: No data returned after insert.');
    }

    console.log(`${data.length} word entries saved to Supabase for "${word}":`, data);
    return data as WordEntry[]; // Return array of WordEntry

  } catch (error) {
    console.error(`Error processing word "${word}":`, error);
    if (error instanceof Error) {
        throw new Error(`Failed to process word "${word}": ${error.message}`);
    }
    throw new Error(`An unknown error occurred while processing word "${word}".`);
  }
};