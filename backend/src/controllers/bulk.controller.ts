import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabaseClient';
import { BulkWordsSubmissionRequest, BulkJob } from '../types/bulk.types';

const MAX_BULK_WORDS_PER_REQUEST = 20000; // Increased limit for initial submission

export const submitBulkWordsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { words } = req.body as BulkWordsSubmissionRequest;

    if (!Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ message: 'Request body must contain a non-empty "words" array.' });
    }

    if (words.some(word => typeof word !== 'string' || word.trim() === '')) {
      return res.status(400).json({ message: 'All items in the "words" array must be non-empty strings.' });
    }
    
    if (words.length > MAX_BULK_WORDS_PER_REQUEST) {
      return res.status(400).json({ message: `Too many words submitted. Maximum allowed is ${MAX_BULK_WORDS_PER_REQUEST} per request. Please submit in smaller batches.` });
    }

    // 1. Create a new bulk job entry
    const { data: jobData, error: jobError } = await supabase
      .from('bulk_jobs')
      .insert({ 
        total_words: words.length,
        status: 'pending' 
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating bulk job:', jobError);
      throw new Error(`Failed to create bulk job: ${jobError.message}`);
    }

    if (!jobData) {
      throw new Error('Failed to create bulk job: No data returned after insert.');
    }

    const newJob = jobData as BulkJob;

    // 2. Prepare individual word entries for the bulk_job_words table
    // For very large arrays (e.g., 10k+), this map operation can consume memory.
    // Consider batching inserts to Supabase if this becomes an issue.
    const jobWordsToInsert = words.map(wordText => ({
      job_id: newJob.id,
      word_text: wordText.trim(),
      status: 'pending'
    }));

    // 3. Insert all words into bulk_job_words
    // Supabase client has its own internal batching for large inserts, but monitor performance.
    const { error: wordsError } = await supabase
      .from('bulk_job_words')
      .insert(jobWordsToInsert);

    if (wordsError) {
      console.error('Error inserting words into bulk_job_words:', wordsError);
      // Attempt to roll back or mark the job as failed
      await supabase.from('bulk_jobs').update({ status: 'failed', error_message: `Failed to queue words: ${wordsError.message}` }).eq('id', newJob.id);
      throw new Error(`Failed to queue words for processing: ${wordsError.message}`);
    }

    res.status(202).json({ 
      message: `Bulk job submitted successfully with ${words.length} words. Processing will start in the background.`,
      jobId: newJob.id,
      status: newJob.status,
      totalWords: newJob.total_words
    });

  } catch (error) {
    next(error); // Pass errors to the error handling middleware
  }
};