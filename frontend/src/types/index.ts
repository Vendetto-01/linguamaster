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
  stage: 'starting' | 'reading' | 'uploading' | 'complete' | 'error';
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