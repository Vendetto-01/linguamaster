export interface BulkWordsSubmissionRequest {
  words: string[]; // An array of words to process
}

export interface BulkJob {
  id: number;
  status: 'pending' | 'in_progress' | 'completed' | 'completed_with_errors' | 'failed';
  submitted_at: Date;
  completed_at?: Date | null;
  total_words: number;
  processed_words: number;
  succeeded_words: number;
  failed_words: number;
  error_message?: string | null;
  // user_id?: string | null; 
  created_at: Date;
  updated_at: Date;
}

export interface BulkJobWord {
  id: number;
  job_id: number;
  word_text: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processed_at?: Date | null;
  error_message?: string | null;
  word_entry_id?: number | null;
  created_at: Date;
  updated_at: Date;
}