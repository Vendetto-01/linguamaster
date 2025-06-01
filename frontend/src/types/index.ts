// frontend/src/types/index.ts - YENİ ŞEMA İÇİN GÜNCELLEME

// Base API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// YENİ: Güncellenmiş Word interface
export interface Word {
  id: number;
  word: string;
  meaning_id: number; // YENİ: Anlam ID'si
  part_of_speech: string;
  meaning_description: string; // YENİ: Anlam açıklaması
  english_example: string;
  turkish_sentence: string; // YENİ: Tam Türkçe cümle
  turkish_meaning: string; // Kelime karşılığı
  initial_difficulty: 'beginner' | 'intermediate' | 'advanced' | null; // YENİ: İlk zorluk
  final_difficulty: 'beginner' | 'intermediate' | 'advanced'; // YENİ: Son zorluk
  difficulty_reasoning: string; // YENİ: Zorluk gerekçesi
  analysis_method: string; // YENİ: Analiz metodu
  source: string;
  times_shown: number;
  times_correct: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// YENİ: Kelime grupları interface (aynı kelime farklı anlamlar)
export interface WordGroup {
  word: string;
  meanings: Word[];
  totalMeanings: number;
  difficultyRange: {
    initial: 'beginner' | 'intermediate' | 'advanced';
    final: 'beginner' | 'intermediate' | 'advanced';
  };
}

// Pending word (queue) types - AYNI
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

// YENİ: Güncellenmiş Processing log
export interface WordProcessingLog {
  id: number;
  word: string;
  status: 'success' | 'failed' | 'skipped';
  processing_time_ms: number;
  error_message?: string;
  gemini_response?: any;
  meanings_added: number; // Kaç anlam eklendi
  processed_at: string;
}

// Queue related result types - AYNI
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

// Bulk add response - AYNI
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

// File upload response - AYNI
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

// Stream event types - AYNI
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

// Queue status types - AYNI
export interface QueueStatus {
  batchId: string;
  pending: number;
  processing: number;
  processed: number;
  failed: number;
  status: 'processing' | 'completed';
  lastUpdate: string;
}

// YENİ: Güncellenmiş Processor Stats
export interface ProcessorStats {
  isProcessing: boolean;
  processedCount: number;
  errorCount: number;
  startTime: string | null;
  elapsedTime: number;
  analysisMethod: string; // YENİ: step-by-step
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

// YENİ: Güncellenmiş Statistics
export interface PartOfSpeechStat {
  _id: string;
  count: number;
}

export interface DifficultyStat {
  _id: 'beginner' | 'intermediate' | 'advanced';
  count: number;
  type: 'initial' | 'final'; // YENİ: İlk mi son zorluk mu
}

export interface QueueStatsMinimal {
  pending: number;
  processing: number;
  failed: number;
}

export interface WordStats {
  totalWords: number; // Toplam unique kelime
  totalDefinitions: number; // Toplam anlam sayısı
  totalMeanings: number; // YENİ: Toplam meaning sayısı
  averageMeaningsPerWord: number; // YENİ: Kelime başına ortalama anlam
  partOfSpeechStats: PartOfSpeechStat[];
  initialDifficultyStats: DifficultyStat[]; // YENİ: İlk zorluk dağılımı
  finalDifficultyStats: DifficultyStat[]; // YENİ: Son zorluk dağılımı
  difficultyChangeStats: { // YENİ: Zorluk değişimi istatistikleri
    upgraded: number; // beginner → intermediate/advanced
    downgraded: number; // advanced → intermediate/beginner
    unchanged: number;
  };
  queueStats: QueueStatsMinimal;
  lastUpdated: string;
  database: string;
  apiSource: string;
  analysisMethod: string; // YENİ: step-by-step
}

// YENİ: Word list response - gruplu format
export interface WordListResponse {
  words: Word[];
  wordGroups: WordGroup[]; // YENİ: Gruplu görünüm
  pagination: {
    currentPage: number;
    totalPages: number;
    totalWords: number; // Unique kelime sayısı
    totalMeanings: number; // Toplam anlam sayısı
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Random words response - GÜNCELLEME
export interface RandomWordsResponse {
  words: Word[];
  wordGroups: WordGroup[]; // YENİ: Gruplu format
  count: number;
  requested: number;
}

// Component props types - AYNI
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

// YENİ: Gemini Step Analysis related types
export interface GeminiStepMeaning {
  meaning_id: number;
  part_of_speech: string;
  meaning_description: string;
}

export interface GeminiStepExample {
  meaning_id: number;
  english_sentence: string;
}

export interface GeminiStepTranslation {
  meaning_id: number;
  english_sentence: string;
  turkish_sentence: string;
}

export interface GeminiStepMapping {
  meaning_id: number;
  english_word: string;
  turkish_equivalent: string;
}

export interface GeminiStepResponse {
  word: string;
  step1_initial_difficulty: 'beginner' | 'intermediate' | 'advanced';
  step2_meanings: GeminiStepMeaning[];
  step3_examples: GeminiStepExample[];
  step4_final_difficulty: 'beginner' | 'intermediate' | 'advanced';
  step4_difficulty_reasoning: string;
  step5_turkish_translations: GeminiStepTranslation[];
  step6_word_mappings: GeminiStepMapping[];
}

// Processing result types - GÜNCELLEME
export interface ProcessingResult {
  status: 'success' | 'failed' | 'queue_empty';
  word?: string;
  addedDefinitions?: number; // Kaç anlam eklendi
  duplicateDefinitions?: number;
  totalDefinitions?: number; // Toplam analiz edilen anlam
  processingTime?: number;
  reason?: string;
  retryCount?: number;
}

// Upload progress tracking - AYNI
export interface UploadProgress {
  current: number;
  total: number;
  percentage: number;
  currentItem?: string;
  stage: 'reading' | 'uploading' | 'queueing' | 'complete' | 'error';
  message: string;
}

// Form validation types - AYNI
export interface ValidationResult {
  isValid: boolean;
  error: string;
  words: string[];
}

// YENİ: Word filter - güncellenmiş
export interface WordFilter {
  search?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  difficultyType?: 'initial' | 'final'; // YENİ: Hangi zorluk
  partOfSpeech?: string;
  meaningId?: number; // YENİ: Belirli anlam filtresi
  analysisMethod?: string; // YENİ: step-by-step vs legacy
  page?: number;
  limit?: number;
  groupByWord?: boolean; // YENİ: Kelime bazında grupla
}

// UI State types - AYNI
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

// Theme/UI types - AYNI
export interface TabConfig {
  id: string;
  label: string;
  icon: string;
  component: React.ComponentType<any>;
}

// Event handler types - AYNI
export type StreamEventHandler = (event: StreamEvent) => void;
export type ProgressEventHandler = (progress: UploadProgress) => void;
export type ErrorEventHandler = (error: string) => void;
export type SuccessEventHandler = (result: any) => void;

// Utility types - GÜNCELLEME
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type DifficultyType = 'initial' | 'final'; // YENİ
export type PartOfSpeech = 'noun' | 'verb' | 'adjective' | 'adverb' | 'preposition' | 'conjunction' | 'interjection';
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type QueueEventType = 'word_queued' | 'word_failed' | 'word_duplicate' | 'batch_complete';
export type AnalysisMethod = 'step-by-step' | 'legacy'; // YENİ

// Configuration types - GÜNCELLEME
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
  analysisConfig: { // YENİ
    maxMeaningsPerWord: number;
    stepTimeout: number;
    enableStepByStep: boolean;
  };
}

// Environment specific types - AYNI
export interface Environment {
  NODE_ENV: 'development' | 'production' | 'test';
  REACT_APP_BACKEND_URL?: string;
  REACT_APP_MAX_UPLOAD_SIZE?: string;
}

export default {};