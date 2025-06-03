import { supabase } from '../config/supabaseClient';
import type { Report } from '../types/report.types';
import type { WordEntry } from '../types/word.types'; // For fetching word details
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// Gemini API Configuration (Copied from word.service.ts)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("CRITICAL: ReportWorker: Gemini API key (GEMINI_API_KEY) is not configured in .env file.");
  // We might not want to throw here to allow other parts of the app to run,
  // but the worker itself will be non-functional for AI tasks.
  // For now, let's log and the worker will fail to process reports needing AI.
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-05-20" }) : null; // Using the same model

const generationConfig = {
  temperature: 0.7,
  topK: 1,
  topP: 1,
  maxOutputTokens: 3072, // Adjust if needed for report processing
  responseMimeType: "application/json",
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// Interfaces for Gemini response (similar to word.service.ts)
interface GeminiDefinitionDetail {
  definition_text: string;
  part_of_speech: string;
  difficulty_level: string;
  example_sentence: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
}

interface GeminiWordResponse {
  definitions: GeminiDefinitionDetail[];
  error?: string; // Added error field for direct error reporting from Gemini
}

const BATCH_SIZE = 5; // Reduced batch size for potentially longer AI processing per report
const DELAY_BETWEEN_REPORTS_MS = 1000; // Delay between processing individual reports (if needed)
const DELAY_BETWEEN_BATCHES_MS = 15000; // 15 seconds delay if no reports found, before polling again

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const processPendingReports = async (): Promise<void> => {
  console.log('ReportWorker: Checking for pending reports...');

  const { data: pendingReports, error: fetchError } = await supabase
    .from('reports')
    .select('*')
    // .eq('status', 'pending') // Removed status check as per new requirement
    .eq('ai_check', false)   // Only check for ai_check === false
    .limit(BATCH_SIZE);

  if (fetchError) {
    console.error('ReportWorker: Error fetching reports for AI check:', fetchError);
    return;
  }

  if (!pendingReports || pendingReports.length === 0) {
    console.log('ReportWorker: No reports found needing AI check.');
    return;
  }

  console.log(`ReportWorker: Found ${pendingReports.length} report(s) needing AI check.`);

  for (const report of pendingReports as Report[]) {
    console.log(`ReportWorker: Processing report ID ${report.id} for word ID ${report.word_id}`);
    // Mark report as 'in_progress'
    const { error: updateError } = await supabase
      .from('reports')
      .update({ status: 'in_progress' }) // Assuming 'in_progress' is a valid status
      .eq('id', report.id);

    if (updateError) {
      console.error(`ReportWorker: Error updating report ID ${report.id} to in_progress:`, updateError);
      // Optionally, skip this report or retry later
      continue;
    }

    let reportStatus: Report['status'] = 'failed'; // Default to failed
    let adminNoteMessage = `AI processing attempted for report ${report.id}.`;
    let aiChecked = false;

    try {
      if (!model || !genAI) {
        throw new Error("Gemini AI model is not initialized. Check API Key.");
      }

      // 1. Fetch Word Details
      const { data: wordData, error: wordFetchError } = await supabase
        .from('words')
        .select('*')
        .eq('id', report.word_id)
        .single();

      if (wordFetchError || !wordData) {
        throw new Error(`Failed to fetch word details for word_id ${report.word_id}: ${wordFetchError?.message || 'Word not found'}`);
      }
      const currentWordEntry = wordData as WordEntry;

      // 2. Construct Gemini Prompt (to regenerate the word entry from scratch)
      // We use currentWordEntry.word to get the base word for regeneration.
      const prompt = `
        For the English vocabulary word "${currentWordEntry.word}", provide a JSON object with a single top-level key: "definitions".
        The value of "definitions" must be an array of objects. Each object in this array represents a distinct meaning of the word and must contain the following fields:
        1.  "definition_text": A distinct dictionary-style definition for this specific meaning of the word.
        2.  "part_of_speech": The specific part of speech for this definition (e.g., noun, verb, adjective).
        3.  "difficulty_level": The CEFR difficulty level for this definition (e.g., A1, A2, B1, B2, C1, C2).
        4.  "example_sentence": A unique example sentence using the word that specifically matches this "definition_text", "part_of_speech", and "difficulty_level".
        5.  "option_a": This exact "definition_text" (or a very close, accurate paraphrase of it), serving as the correct multiple-choice answer.
        6.  "option_b": An incorrect but plausible multiple-choice option (a distractor) relevant to this specific "definition_text".
        7.  "option_c": Another distinct incorrect but plausible multiple-choice option for this "definition_text".
        8.  "option_d": A third distinct incorrect but plausible multiple-choice option for this "definition_text".

        The question for these options will be: "What is the meaning of the word '${currentWordEntry.word}' used in the following sentence?"
        (The frontend will dynamically generate the sentence part of the question using the "example_sentence" from this object).
        
        If you cannot process this request or the word is problematic, return a JSON object with a single key "error" and a brief explanation string as its value.
        Output ONLY the JSON object. Ensure each "example_sentence" is unique and relevant to its corresponding "definition_text", and that all quiz options are tailored to that specific definition.
      `;

      // 3. Call Gemini API
      console.log(`ReportWorker: Calling Gemini to regenerate word ID ${report.word_id} ("${currentWordEntry.word}") for report ID ${report.id}`);
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
        safetySettings,
      });
      const responseText = result.response.text();
      // Use the correct GeminiWordResponse interface
      const geminiResponse = JSON.parse(responseText) as GeminiWordResponse;

      if (geminiResponse.error) {
        throw new Error(`Gemini reported an error for word "${currentWordEntry.word}": ${geminiResponse.error}`);
      }

      if (!geminiResponse.definitions || !Array.isArray(geminiResponse.definitions) || geminiResponse.definitions.length === 0) {
        throw new Error(`Gemini response for word "${currentWordEntry.word}" must be an object with a non-empty "definitions" array.`);
      }
      
      // We are updating a specific word_id, so we'll use the first valid definition from Gemini's response.
      const firstValidDefinition = geminiResponse.definitions.find(def => {
        const requiredKeys: Array<keyof GeminiDefinitionDetail> = [ // Use GeminiDefinitionDetail here
          'definition_text', 'part_of_speech', 'difficulty_level', 'example_sentence',
          'option_a', 'option_b', 'option_c', 'option_d'
        ];
        for (const key of requiredKeys) {
          if (!(key in def) || typeof def[key] !== 'string' || def[key].trim() === '') {
            console.warn(`ReportWorker: Skipping a definition for word "${currentWordEntry.word}" (report ID ${report.id}) due to missing/empty field: ${String(key)}`); // Use String(key) for logging
            return false;
          }
        }
        return true;
      });

      if (!firstValidDefinition) {
        throw new Error(`No valid definitions with complete quiz options found for word "${currentWordEntry.word}" (report ID ${report.id}) after processing Gemini response.`);
      }
      
      // 4. Update 'words' Table with the first valid definition
      const { error: updateWordError } = await supabase
        .from('words')
        .update({
          // word: currentWordEntry.word, // Word text itself should not change based on this process
          part_of_speech: firstValidDefinition.part_of_speech.trim(),
          definition: firstValidDefinition.definition_text.trim(),
          difficulty_level: firstValidDefinition.difficulty_level.trim(),
          example_sentence: firstValidDefinition.example_sentence.trim(),
          option_a: firstValidDefinition.option_a.trim(),
          option_b: firstValidDefinition.option_b.trim(),
          option_c: firstValidDefinition.option_c.trim(),
          option_d: firstValidDefinition.option_d.trim(),
          updated_at: new Date().toISOString(),
          // Update note reflects regeneration due to report, not the original report reason directly in Gemini's context
          update_note: `AI regenerated based on report ID ${report.id}. Original report reason: ${report.report_reason ? report.report_reason.substring(0,100) : 'N/A'}`
        })
        .eq('id', report.word_id); // Ensure we update the correct existing entry

      if (updateWordError) {
        throw new Error(`Failed to update word ID ${report.word_id} ("${currentWordEntry.word}") in words table: ${updateWordError.message}`);
      }
      
      console.log(`ReportWorker: Successfully regenerated and updated word ID ${report.word_id} ("${currentWordEntry.word}") based on report ID ${report.id}.`);
      reportStatus = 'resolved';
      adminNoteMessage = `AI regenerated and resolved report ${report.id}. Word ID ${report.word_id} ("${currentWordEntry.word}") updated.`;
      aiChecked = true;

    } catch (processingError: any) {
      console.error(`ReportWorker: Error processing report ID ${report.id} for word ID ${report.word_id}:`, processingError.message);
      reportStatus = 'failed'; // Keep as failed or set a specific AI_failed status
      adminNoteMessage = `AI processing failed for report ${report.id}: ${processingError.message.substring(0, 200)}`;
      // ai_check will be updated to true even on failure to prevent reprocessing the same error,
      // unless it's a transient error we want to retry. For now, mark as checked.
      aiChecked = true;
    }

    // 5. Update 'reports' Table
    const { error: updateReportError } = await supabase
      .from('reports')
      .update({
        status: reportStatus,
        admin_notes: adminNoteMessage,
        ai_check: aiChecked, // Mark as AI checked
        processed_at: new Date().toISOString() // Add a processed_at timestamp if you have one, or use admin_notes timestamp
      })
      .eq('id', report.id);
    
    if (updateReportError) {
      console.error(`ReportWorker: Error updating report ID ${report.id} final status:`, updateReportError);
    } else {
      console.log(`ReportWorker: Finalized processing for report ID ${report.id} with status ${reportStatus}.`);
    }
    await delay(DELAY_BETWEEN_REPORTS_MS); // Delay before next report
  }
};

let isReportWorkerRunning = false;
export const startReportWorkerLoop = (intervalMs = DELAY_BETWEEN_BATCHES_MS): void => {
  if (isReportWorkerRunning) {
    console.log("ReportWorker loop is already running.");
    return;
  }
  isReportWorkerRunning = true;
  console.log(`Starting ReportWorker loop with interval ${intervalMs}ms...`);

  const run = async () => {
    if (!isReportWorkerRunning) {
      console.log("ReportWorker loop stopping.");
      return;
    }
    try {
      await processPendingReports();
    } catch (e) {
      console.error("Error in ReportWorker loop:", e);
    }
    if (isReportWorkerRunning) {
      setTimeout(run, intervalMs);
    }
  };
  run();
};

export const stopReportWorkerLoop = (): void => {
  console.log("Attempting to stop ReportWorker loop...");
  isReportWorkerRunning = false;
};

// This worker would be started similarly to the bulkWorker in src/index.ts