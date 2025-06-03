// frontend/src/types/questions.ts - TEMİZLENMİŞ VE DÜZELTİLMİŞ VERSİYON

// Ana Question entity
export interface Question {
  id: string; // Backend'de number, frontend'de string olarak handle ediliyor
  word_id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  paragraph: string;
  times_shown: number;
  times_correct: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // İlişkili kelime bilgileri (JOIN ile gelir)
  word?: {
    id: number;
    word: string;
    meaning_id: number;
    part_of_speech: string;
    meaning_description: string;
    turkish_meaning: string;
    final_difficulty: string;
  };

  // Frontend için ek alanlar (opsiyonel)
  options?: string[];
  correct_options?: string[];
  type?: string;
}

// API Request/Response Types
export interface QuestionGenerationConfig {
  wordIds: number[];
  // Ek konfigürasyon seçenekleri eklenebilir
  maxConcurrent?: number;
  validateQuality?: boolean;
}

export type QuestionGenerationRequest = QuestionGenerationConfig;

export interface QuestionGenerationResult {
  word: string;
  wordId: number;
  questionId: number;
  processingTime?: number;
}

export interface QuestionGenerationFailure {
  word: string;
  wordId: number;
  reason: string;
  error?: string;
}

export interface QuestionGenerationResponse {
  message: string;
  results: {
    successful: QuestionGenerationResult[];
    failed: QuestionGenerationFailure[];
    total: number;
    successCount: number;
    failureCount: number;
    processingTime?: number;
  };
  summary: {
    generated: number;
    failed: number;
    total: number;
  };
}

// Pagination ve Filtering
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface QuestionFilterParams {
  searchTerm?: string;
  difficulty?: string;
  type?: string;
  source?: string;
  hasEmbedding?: boolean;
  page?: number;
  limit?: number;
}

export interface QuestionSortParams {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface PaginatedQuestionsResponse {
  data: Question[];
  pagination: PaginationInfo;
}

// Bulk Operations
export interface BulkActionResponse {
  message: string;
  deletedCount: number;
  failedCount: number;
  errors: string[];
}

// Statistics
export interface QuestionStats {
  totalQuestions: number;
  activeQuestions: number;
  difficultyBreakdown: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
  partOfSpeechBreakdown: Record<string, number>;
  recentQuestions: number;
  averageCorrectRate: number;
  mostShownWords: Array<{
    word: string;
    times_shown: number;
    times_correct: number;
    success_rate: number;
  }>;
}

// Content Quality Assessment
export interface QuestionContentQuality {
  score: number; // 0-100
  factors: {
    clarityScore: number;
    difficultyAlignment: number;
    distractorQuality: number;
    explanationQuality: number;
  };
  suggestions: string[];
  isAcceptable: boolean;
}

export interface QuestionValidationResponse {
  isValid: boolean;
  validationId: string;
  timestamp: string;
  comments?: string;
}

export interface GeneratedQuestionPayload {
  word_id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  paragraph: string;
}

// Component Props (temizlenmiş)
export interface QuestionGenerationProps {
  selectedWords: Array<{
    id: number;
    word: string;
    meaning_id: number;
    part_of_speech: string;
    meaning_description: string;
    english_example: string;
    turkish_meaning: string;
    final_difficulty: string;
  }>;
  onQuestionsGenerated: (count: number) => void;
  onBackToSelection: () => void;
}

export interface QuestionManagementProps {
  refreshKey?: number;
}

export interface QuestionCardProps {
  question: Question;
  isSelected: boolean;
  onSelect: (questionId: string) => void;
  onToggleActive: (questionId: string) => void;
  onDelete: (questionId: string) => void;
  isUpdating?: boolean;
}

// Progress Tracking
export interface QuestionGenerationProgress {
  current: number;
  total: number;
  percentage: number;
  currentWord?: string;
  stage: 'starting' | 'generating' | 'saving' | 'complete' | 'error';
  message: string;
  successful: number;
  failed: number;
  timeElapsed: number;
  estimatedTimeRemaining?: number;
}

// Re-export for backward compatibility
export type QuestionFilters = QuestionFilterParams;