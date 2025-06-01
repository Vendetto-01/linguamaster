// frontend/src/types/index.ts

// Base API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Word related types
export interface Word {
  id: number;
  word: string;
  turkish_meaning: string;
  part_of_speech: string;
  english_example: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  source: string;
  times_shown: number;
  times_correct: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Pending word (queue) types
export interface PendingWord {
  id: number;
  word: string;
  upload_batch_id: string;
  status: 'pending' | 'processing' | 'failed';
  retry_count: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

// Processing log types
export interface WordProcessingLog {
  id: number;
  word: string;
  status: 'success' | 'failed' | 'skipped';
  processing_time_ms: number;
  error_message?: string;
  gemini_response?: any;
  meanings_added: number;
  processed_at: string;
}

// Queue related result types
export interface QueuedWordResult {
  word: string;
  batchId: string;
}

export interface FailedWordResult {
  word: string;
  reason: string;
}

export interface DuplicateWordResult {
  word: string;
  reason: string;
}

// Bulk add response (manuel ekleme)
export interface BulkAddResponse {
  message: string;
  results: {
    queued: QueuedWordResult[];
    failed: FailedWordResult[];
    duplicate: DuplicateWordResult[];
  };
  summary: {
    queued: number;
    failed: number;
    duplicate: number;
    total: number;
  };
  batchId: string;
  nextStep: string;
}

// File upload response
export interface FileUploadResponse {
  message: string;
  results: {
    fileName: string;
    batchId: string;
    totalWords: number;
    queued: number;
    duplicates: number;
    failed: number;
  };
  status: string;
  nextStep: string;
}

// Stream event types (real-time progress)
export interface StreamEventBase {
  type: string;
}

export interface StreamStartEvent extends StreamEventBase {
  type: 'start';
  total: number;
  message: string;
}

export interface StreamProgressEvent extends StreamEventBase {
  type: 'progress';
  current: number;
  total: number;
  currentWord: string;
  message: string;
}

export interface StreamWordQueuedEvent extends StreamEventBase {
  type: 'word_queued';
  word: string;
  batchId: string;
  current: number;
  total: number;
}

export interface StreamWordFailedEvent extends StreamEventBase {
  type: 'word_failed';
  word: string;
  reason: string;
  current: number;
  total: number;
}

export interface StreamWordDuplicateEvent extends StreamEventBase {
  type: 'word_duplicate';
  word: string;
  reason: string;
  current: number;
  total: number;
}

export interface StreamCompleteEvent extends StreamEventBase {
  type: 'complete';
  results: {
    queued: QueuedWordResult[];
    failed: FailedWordResult[];
    duplicate: DuplicateWordResult[];
    total: number;
  };
  summary: {
    queued: number;
    failed: number;
    duplicate: number;
    total: number;
  };
  batchId: string;
  message: string;
}

export interface StreamErrorEvent extends StreamEventBase {
  type: 'error';
  error: string;
  message: string;
}

export interface StreamEndEvent extends StreamEventBase {
  type: 'end';
}

export type StreamEvent = 
  | StreamStartEvent 
  | StreamProgressEvent 
  | StreamWordQueuedEvent 
  | StreamWordFailedEvent 
  | StreamWordDuplicateEvent 
  | StreamCompleteEvent 
  | StreamErrorEvent 
  | StreamEndEvent;

// Queue status types
export interface QueueStatus {
  batchId: string;
  pending: number;
  processing: number;
  processed: number;
  failed: number;
  status: 'processing' | 'completed';
  lastUpdate: string;
}

export interface ProcessorStats {
  isProcessing: boolean;
  processedCount: number;
  errorCount: number;
  startTime: string | null;
  elapsedTime: number;
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
  lastUpdate: string;
}

// Statistics types
export interface PartOfSpeechStat {
  _id: string;
  count: number;
}

export interface DifficultyStat {
  _id: 'beginner' | 'intermediate' | 'advanced';
  count: number;
}

export interface QueueStatsMinimal {
  pending: number;
  processing: number;
  failed: number;
}

export interface WordStats {
  totalWords: number;
  totalDefinitions: number;
  partOfSpeechStats: PartOfSpeechStat[];
  difficultyStats: DifficultyStat[];
  queueStats: QueueStatsMinimal;
  lastUpdated: string;
  database: string;
  apiSource: string;
}

// Word list response
export interface WordListResponse {
  words: Word[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalWords: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Random words response
export interface RandomWordsResponse {
  words: Word[];
  count: number;
  requested: number;
}

// Component props types
export interface WordFormProps {
  onWordsAdded: (result: BulkAddResponse) => void;
}

export interface FileUploadProps {
  onFileUploaded: (result: FileUploadResponse) => void;
}

export interface QueueStatusProps {
  batchId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// Gemini API related types
export interface GeminiWordMeaning {
  turkish_meaning: string;
  part_of_speech: string;
  english_example: string;
}

export interface GeminiWordResponse {
  word: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  meanings: GeminiWordMeaning[];
}

// Processing result types (backend'den gelecek)
export interface ProcessingResult {
  status: 'success' | 'failed' | 'queue_empty';
  word?: string;
  addedDefinitions?: number;
  duplicateDefinitions?: number;
  totalDefinitions?: number;
  processingTime?: number;
  reason?: string;
  retryCount?: number;
}

// Upload progress tracking
export interface UploadProgress {
  current: number;
  total: number;
  percentage: number;
  currentItem?: string;
  stage: 'reading' | 'uploading' | 'queueing' | 'complete' | 'error';
  message: string;
}

// Form validation types
export interface ValidationResult {
  isValid: boolean;
  error: string;
  words: string[];
}

// Filter types
export interface WordFilter {
  search?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  partOfSpeech?: string;
  page?: number;
  limit?: number;
}

// UI State types
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  error?: string;
}

// Common component state
export interface ComponentState extends LoadingState, ErrorState {
  data?: any;
}

// Theme/UI types
export interface TabConfig {
  id: string;
  label: string;
  icon: string;
  component: React.ComponentType<any>;
}

// Event handler types
export type StreamEventHandler = (event: StreamEvent) => void;
export type ProgressEventHandler = (progress: UploadProgress) => void;
export type ErrorEventHandler = (error: string) => void;
export type SuccessEventHandler = (result: any) => void;

// Utility types
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type PartOfSpeech = 'noun' | 'verb' | 'adjective' | 'adverb' | 'preposition' | 'conjunction' | 'interjection';
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type QueueEventType = 'word_queued' | 'word_failed' | 'word_duplicate' | 'batch_complete';

// Configuration types
export interface AppConfig {
  apiBaseUrl: string;
  maxWordsPerBatch: number;
  maxFileSize: number;
  supportedFileTypes: string[];
  refreshIntervals: {
    queueStats: number;
    processorStats: number;
    wordList: number;
  };
}

// Environment specific types
export interface Environment {
  NODE_ENV: 'development' | 'production' | 'test';
  REACT_APP_BACKEND_URL?: string;
  REACT_APP_MAX_UPLOAD_SIZE?: string;
}

export default {};