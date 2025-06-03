import { supabase } from '../config/supabaseClient';
import { addWordService } from './word.service'; // The existing service to process a single word
import type { BulkJob, BulkJobWord } from '../types/bulk.types';
import type { WordEntry } from '../types/word.types';

const BATCH_SIZE = 5; // Number of words to process in one go
const DELAY_BETWEEN_WORDS_MS = 2000; // 2 seconds delay to respect Gemini API rate limits (60 QPM means 1 QPS)
const DELAY_BETWEEN_BATCHES_MS = 5000; // 5 seconds delay if no words found, before polling again

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const processPendingWords = async (): Promise<void> => {
  console.log('Worker: Checking for pending words...');

  const { data: pendingWords, error: fetchError } = await supabase
    .from('bulk_job_words')
    .select(`
      *,
      bulk_jobs (
        id, status
      )
    `)
    .eq('status', 'pending')
    .limit(BATCH_SIZE);

  if (fetchError) {
    console.error('Worker: Error fetching pending words:', fetchError);
    return;
  }

  if (!pendingWords || pendingWords.length === 0) {
    console.log('Worker: No pending words found.');
    return;
  }

  console.log(`Worker: Found ${pendingWords.length} pending word(s) to process.`);

  for (const jobWord of pendingWords as (BulkJobWord & { bulk_jobs: Pick<BulkJob, 'id' | 'status'> })[]) {
    // Ensure the parent job is still in a processable state
    if (jobWord.bulk_jobs?.status !== 'pending' && jobWord.bulk_jobs?.status !== 'in_progress') {
        console.log(`Worker: Skipping word ID ${jobWord.id} as parent job ID ${jobWord.job_id} is not in a processable state (${jobWord.bulk_jobs?.status}).`);
        // Optionally mark this word as failed or re-queued if job status is unexpected
        await supabase.from('bulk_job_words').update({ status: 'failed', error_message: 'Parent job not processable.' }).eq('id', jobWord.id);
        continue;
    }
    
    // Mark job as in_progress if it's the first word of a pending job
    if (jobWord.bulk_jobs?.status === 'pending') {
        await supabase.from('bulk_jobs').update({ status: 'in_progress' }).eq('id', jobWord.job_id);
    }

    console.log(`Worker: Processing word ID ${jobWord.id}: "${jobWord.word_text}" for job ID ${jobWord.job_id}`);
    await supabase.from('bulk_job_words').update({ status: 'processing', processed_at: new Date().toISOString() }).eq('id', jobWord.id);

    try {
      const createdEntries: WordEntry[] = await addWordService({ word: jobWord.word_text });
      
      // Assuming addWordService is successful if it doesn't throw and returns entries
      // For simplicity, we'll link the first created entry's ID.
      // A more complex scenario might involve handling multiple entries from addWordService differently for a single bulk_job_word.
      // However, our current addWordService creates multiple rows in 'words' for one submitted word if it has multiple definitions.
      // This means one 'bulk_job_words' item can result in multiple 'words' table entries.
      // We'll mark the bulk_job_word as completed if any entries were made.
      
      await supabase
        .from('bulk_job_words')
        .update({ 
          status: 'completed', 
          processed_at: new Date().toISOString(),
          // Link the ID of the first entry created for this word, if available
          word_entry_id: createdEntries.length > 0 ? createdEntries[0].id : null 
        })
        .eq('id', jobWord.id);

      // Increment succeeded_words count on the parent job
      await supabase.rpc('increment_job_processed_counts', {
        job_id_param: jobWord.job_id,
        succeeded_increment: 1,
        failed_increment: 0
      });

      console.log(`Worker: Successfully processed word ID ${jobWord.id}: "${jobWord.word_text}". ${createdEntries.length} entries created in 'words' table.`);

    } catch (processingError: any) {
      console.error(`Worker: Error processing word ID ${jobWord.id} ("${jobWord.word_text}"):`, processingError.message);
      await supabase
        .from('bulk_job_words')
        .update({ 
          status: 'failed', 
          error_message: processingError.message.substring(0, 250), // Truncate error message if too long
          processed_at: new Date().toISOString()
        })
        .eq('id', jobWord.id);

      // Increment failed_words count on the parent job
      await supabase.rpc('increment_job_processed_counts', {
        job_id_param: jobWord.job_id,
        succeeded_increment: 0,
        failed_increment: 1
      });
    }
    await delay(DELAY_BETWEEN_WORDS_MS); // Rate limit per word
  }
  // After processing a batch, check if the job is complete
  await checkAndFinalizeJobs();
};

// Function to increment processed and succeeded/failed counts on a bulk_job
// This should be a Supabase database function for atomicity
export const createIncrementJobCountsFunctionSQL = `
CREATE OR REPLACE FUNCTION increment_job_processed_counts(job_id_param BIGINT, succeeded_increment INT, failed_increment INT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.bulk_jobs
  SET
    processed_words = processed_words + succeeded_increment + failed_increment,
    succeeded_words = succeeded_words + succeeded_increment,
    failed_words = failed_words + failed_increment,
    updated_at = now()
  WHERE id = job_id_param;
END;
$$ LANGUAGE plpgsql;
`;

// Function to check and finalize jobs
const checkAndFinalizeJobs = async () => {
    const { data: jobsToCheck, error: fetchJobsError } = await supabase
        .from('bulk_jobs')
        .select('id, total_words, processed_words, status')
        .in('status', ['in_progress']);

    if (fetchJobsError) {
        console.error('Worker: Error fetching jobs to finalize:', fetchJobsError);
        return;
    }

    for (const job of jobsToCheck as Pick<BulkJob, 'id' | 'total_words' | 'processed_words' | 'status'>[]) {
        if (job.processed_words >= job.total_words) {
            const { data: failedWordsInJob, error: countError } = await supabase
                .from('bulk_job_words')
                .select('id', { count: 'exact' })
                .eq('job_id', job.id)
                .eq('status', 'failed');
            
            let finalStatus: BulkJob['status'] = 'completed';
            if (countError) {
                console.error(`Worker: Error counting failed words for job ${job.id}:`, countError);
                finalStatus = 'completed_with_errors'; // Or some other error status
            } else if (failedWordsInJob && failedWordsInJob.length > 0) {
                finalStatus = 'completed_with_errors';
            }

            console.log(`Worker: Finalizing job ID ${job.id} with status ${finalStatus}.`);
            await supabase
                .from('bulk_jobs')
                .update({ status: finalStatus, completed_at: new Date().toISOString() })
                .eq('id', job.id);
        }
    }
};


// Basic loop to run the worker periodically (for local testing or a simple worker setup)
// In a Render Background Worker, you might have this loop or trigger it via an HTTP endpoint.
let isWorkerRunning = false;
export const startWorkerLoop = (intervalMs = DELAY_BETWEEN_BATCHES_MS) => {
  if (isWorkerRunning) {
    console.log("Worker loop is already running.");
    return;
  }
  isWorkerRunning = true;
  console.log(`Starting worker loop with interval ${intervalMs}ms...`);
  
  const run = async () => {
    if (!isWorkerRunning) {
        console.log("Worker loop stopping.");
        return;
    }
    try {
      await processPendingWords();
    } catch (e) {
      console.error("Error in worker loop:", e);
    }
    if (isWorkerRunning) {
        setTimeout(run, intervalMs);
    }
  };
  run();
};

export const stopWorkerLoop = () => {
    console.log("Attempting to stop worker loop...");
    isWorkerRunning = false;
};

// You would call startWorkerLoop() from your main application entry point (e.g., index.ts)
// or from a dedicated worker script if deploying as a separate Render Background Worker.