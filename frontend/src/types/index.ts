// frontend/src/types/index.ts - TAMAMLANMIŞ VERSİYON

// === WORD RELATED TYPES ===
export interface Word {
  id: number;
  word: string;
  meaning_id: number;
  part_of_speech: string;
  meaning_description: string;
  english_example: string;
  turkish_meaning: string;
  turkish_sentence?: string;
  initial_difficulty?: string;
  final_difficulty: string;
  difficulty_reasoning?: string;
  analysis_method?: string;
  source?: string;
  times_shown?: number;
  times_correct?: number;
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface WordsResponse {
  words: Word[];
  wordGroups?: Array<{
    word: string;
    meanings: Word[];
    totalMeanings: number;
    difficultyRange: {
        initial: string;
        final: string;
        min?: string;
        max?: string;
    };
    partOfSpeechSummary?: string[];
    analysisMethod?: string;
    createdAt?: string;
  }>;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalWords: number;
    totalMeanings: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface WordFilters {
  page?: number;
  limit?: number;
  search?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | '';
  partOfSpeech?: string;
  groupByWord?: boolean;
  difficultyType?: 'initial' | 'final';
}

// === MODULE & TAB TYPES ===
export type ModuleType = 'words' | 'questions';
export type WordsModuleTabId = 'file' | 'queue' | 'database';
export type QuestionsModuleTabId = 'selection' | 'generation' | 'management';

// === FILE UPLOAD TYPES ===
export interface FileUploadResponse {
  message: string;
  status: string;
  results: {
    fileName: string;
    batchId: string;
    totalWords: number;
    queued: number;
    duplicates: number;
    failed: number;
  };
  nextStep: string;
}

export interface FileUploadProps {
  onFileUploaded: (result: FileUploadResponse) => void;
}

export interface UploadProgress {
  current: number;
  total: number;
  percentage: number;
  stage: 'starting' | 'reading' | 'uploading' | 'generating' | 'processing' | 'validating' | 'saving' | 'complete' | 'error';
  message: string;
}

// === QUEUE & PROCESSOR TYPES ===
export interface ProcessorStats {
  isProcessing: boolean;
  processedCount: number;
  errorCount: number;
  elapsedTime: number;
  analysisMethod?: string;
}

export interface QueueStats {
  totalPendingWords: number;
  totalProcessingWords: number;
  totalFailedWords: number;
  activeBatches: number;
  oldestPendingWord: {
    word: string;
    created_at: string;
  } | null;
  isQueueActive: boolean;
  processorStats: ProcessorStats;
}

export interface QueueStatus {
  batchId: string;
  pending: number;
  processing: number;
  processed: number;
  failed: number;
  status: string;
  lastUpdate: string;
}

// === QUESTION RELATED TYPES ===
export interface QuestionOption {
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: number;
  word_id?: number; // Associated word
  word_text?: string; // Denormalized word text for easier display
  question_text: string;
  options: QuestionOption[] | string[]; // Flexible for different option structures
  option_a?: string; // Added for compatibility with QuestionCard
  option_b?: string; // Added for compatibility with QuestionCard
  option_c?: string; // Added for compatibility with QuestionCard
  option_d?: string; // Added for compatibility with QuestionCard
  correct_answer: string; // Could be the text of the correct option
  question_type: 'multiple_choice' | 'fill_in_the_blank' | 'true_false' | string; // Example types
  difficulty: 'easy' | 'medium' | 'hard' | string; // Example difficulties
  part_of_speech?: string; // Added for compatibility with QuestionCard
  source: 'ai_generated' | 'manual' | string;
  is_active: boolean;
  times_answered?: number;
  times_correct?: number;
  explanation?: string; // Added for QuestionCard
  paragraph?: string; // Added for QuestionCard
  created_at: string;
  updated_at?: string;
  analysis_details?: Record<string, any>; // For AI generation details
}

export interface QuestionStats {
  totalQuestions: number;
  activeQuestions: number;
  inactiveQuestions: number;
  questionsByType: Record<string, number>;
  questionsByDifficulty: Record<string, number>;
  questionsBySource: Record<string, number>;
}

export interface GenerateQuestionsPayload {
  word_ids?: number[]; // Generate for specific words
  word_texts?: string[]; // Or specific word texts
  count?: number; // Number of questions to generate per word or in total
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
  question_types?: Array<'multiple_choice' | 'fill_in_the_blank' | 'true_false'>;
  generation_config?: Record<string, any>; // Advanced AI parameters
}

export interface GenerateQuestionsResponse {
  message: string;
  generated_count: number;
  failed_count: number;
  questions?: Question[]; // Optional: return generated questions directly
  batch_id?: string; // If generation is asynchronous
}

export interface QuestionsResponse {
  questions: Question[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalQuestions: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface QuestionFilters {
  page?: number;
  limit?: number;
  search?: string; // Search in question_text or word_text
  word_id?: number;
  question_type?: string;
  difficulty?: string;
  is_active?: boolean;
  source?: string;
  sortBy?: 'created_at' | 'updated_at' | 'difficulty' | 'word_text';
  sortOrder?: 'asc' | 'desc';
}

export type BulkQuestionAction = 'activate' | 'deactivate' | 'delete' | 'set_difficulty' | 'set_type';

export interface BulkQuestionsPayload {
  action: BulkQuestionAction;
  question_ids: number[];
  value?: string; // For actions like 'set_difficulty' or 'set_type'
}

export interface BulkQuestionsResponse {
  message: string;
  success_count: number;
  failed_count: number;
  details?: Array<{ id: number; status: 'success' | 'failed'; error?: string }>;
}

export interface ToggleActiveResponse {
  message: string;
  question: Question; // The updated question
}

// === QUESTION GENERATION UI TYPES ===
export interface QuestionGenerationComponentProps {
  selectedWords: Word[];
  onQuestionsGenerated: (questions: Question[]) => void;
  onBackToSelection: () => void;
}

export interface QuestionGenerationProgress {
  current: number;
  total: number;
  percentage: number;
  stage: 'starting' | 'processing' | 'validating' | 'saving' | 'complete' | 'error';
  message: string;
  successful: number;
  failed: number;
  timeElapsed: number; // in seconds
}

// === CONFIG TYPES ===
export interface ModuleConfigApp {
  id: ModuleType;
  title: string;
  icon: string;
  description: string;
  color: string;
}

export interface WordsTabConfigApp {
  id: WordsModuleTabId;
  label: string;
  icon: string;
  description: string;
}

export interface QuestionsTabConfigApp {
  id: QuestionsModuleTabId;
  label: string;
  icon: string;
  description: string;
}

export default {};