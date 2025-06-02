// frontend/src/types/index.ts - TEMİZLENMİŞ VERSİYON

// Base API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
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

// Processing log
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

// Processor Stats
export interface ProcessorStats {
  isProcessing: boolean;
  processedCount: number;
  errorCount: number;
  startTime: string | null;
  elapsedTime: number;
  analysisMethod: string;
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

// Component props types
export interface FileUploadProps {
  onFileUploaded: (result: FileUploadResponse) => void;
}

export interface QueueStatusProps {
  batchId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// Processing result types
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

// UI State types
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  error?: string;
}

export interface ComponentState extends LoadingState, ErrorState {
  data?: any;
}

// Theme/UI types
export interface TabConfig {
  id: 'file' | 'queue'; // Sadece bu iki tab kaldı
  label: string;
  icon: string;
  component: React.ComponentType<any>;
}

// Event handler types
export type ProgressEventHandler = (progress: UploadProgress) => void;
export type ErrorEventHandler = (error: string) => void;
export type SuccessEventHandler = (result: any) => void;

// Utility types
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type AnalysisMethod = 'step-by-step' | 'legacy';

// Configuration types
export interface AppConfig {
  apiBaseUrl: string;
  maxWordsPerBatch: number;
  maxFileSize: number;
  supportedFileTypes: string[];
  refreshIntervals: {
    queueStats: number;
    processorStats: number;
  };
  analysisConfig: {
    maxMeaningsPerWord: number;
    stepTimeout: number;
    enableStepByStep: boolean;
  };
}

// Environment specific types
export interface Environment {
  NODE_ENV: 'development' | 'production' | 'test';
  REACT_APP_BACKEND_URL?: string;
  REACT_APP_MAX_UPLOAD_SIZE?: string;
}

export default {};