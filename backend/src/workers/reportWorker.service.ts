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

// Interface for the expected Gemini response for a single definition update
interface GeminiReportUpdateDetail {
  definition_text: string;
  part_of_speech: string;
  difficulty_level: string;
  example_sentence: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  update_applied?: boolean; // Optional: Gemini can indicate if it applied a change
  error?: string; // Optional: Gemini can return an error message
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
    .eq('status', 'pending') // Still want to process only pending reports
    .eq('ai_check', false)   // And only those not yet checked by AI
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

      // 2. Construct Gemini Prompt
      const prompt = `
        A user has reported an issue with the following English vocabulary word entry:
        Word: "${currentWordEntry.word}"
        Part of Speech: ${currentWordEntry.part_of_speech}
        Current Definition: "${currentWordEntry.definition}"
        Current Difficulty: ${currentWordEntry.difficulty_level}
        Current Example Sentence: "${currentWordEntry.example_sentence}"
        Current Quiz Options:
          A: "${currentWordEntry.option_a}"
          B: "${currentWordEntry.option_b}"
          C: "${currentWordEntry.option_c}"
          D: "${currentWordEntry.option_d}"

        User's Report Reason: "${report.report_reason}"
        User's Report Details (if any): "${report.report_details || 'N/A'}"

        Task:
        1. Review the word entry based on the user's report.
        2. If the report is valid and a correction is needed, provide an updated JSON object for this single word definition.
           The JSON object MUST contain ALL of the following fields, even if some are unchanged:
           'definition_text', 'part_of_speech', 'difficulty_level', 'example_sentence', 'option_a', 'option_b', 'option_c', 'option_d'.
           The 'option_a' MUST be the correct definition or a very close paraphrase.
        3. If the report is invalid, or no changes are necessary, return the ORIGINAL word data in the exact same JSON format described above.
        4. If you cannot process this request, or the report seems malicious/spam, return a JSON object with a single key "error" and a brief explanation string as its value.

        Output ONLY the JSON object. Do not include any other text, explanations, or markdown formatting.
      `;

      // 3. Call Gemini API
      console.log(`ReportWorker: Calling Gemini for report ID ${report.id}, word ID ${report.word_id}`);
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
        safetySettings,
      });
      const responseText = result.response.text();
      const geminiResponse = JSON.parse(responseText) as GeminiReportUpdateDetail;

      if (geminiResponse.error) {
        throw new Error(`Gemini reported an error: ${geminiResponse.error}`);
      }

      // Validate Gemini response structure (basic check)
      const requiredKeys: Array<keyof Omit<GeminiReportUpdateDetail, 'update_applied' | 'error'>> = [
        'definition_text', 'part_of_speech', 'difficulty_level', 'example_sentence',
        'option_a', 'option_b', 'option_c', 'option_d'
      ];
      for (const key of requiredKeys) {
        if (!(key in geminiResponse) || typeof geminiResponse[key] !== 'string' || geminiResponse[key].trim() === '') {
          throw new Error(`Gemini response for report ${report.id} is missing or has an empty required field: ${key}`);
        }
      }
      
      // 4. Update 'words' Table
      const { error: updateWordError } = await supabase
        .from('words')
        .update({
          definition: geminiResponse.definition_text.trim(),
          part_of_speech: geminiResponse.part_of_speech.trim(),
          difficulty_level: geminiResponse.difficulty_level.trim(),
          example_sentence: geminiResponse.example_sentence.trim(),
          option_a: geminiResponse.option_a.trim(),
          option_b: geminiResponse.option_b.trim(),
          option_c: geminiResponse.option_c.trim(),
          option_d: geminiResponse.option_d.trim(),
          updated_at: new Date().toISOString(), // Update timestamp
          update_note: `AI corrected based on report ID ${report.id}. Reason: ${report.report_reason.substring(0,100)}`
        })
        .eq('id', report.word_id);

      if (updateWordError) {
        throw new Error(`Failed to update word ID ${report.word_id} in words table: ${updateWordError.message}`);
      }
      
      console.log(`ReportWorker: Successfully updated word ID ${report.word_id} based on Gemini response for report ID ${report.id}.`);
      reportStatus = 'resolved';
      adminNoteMessage = `AI processed and resolved report ${report.id}. Word ID ${report.word_id} updated.`;
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