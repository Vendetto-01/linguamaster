// frontend/src/types/questions.ts - SORU YÖNETİMİ TYPE TANIMLARI

// Question entity
export interface Question {
  id: number;
  word_id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  paragraph: string; // example sentence used for context
  times_shown: number;
  times_correct: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // İlişkili kelime bilgileri (JOIN ile gelir)
  word?: {
    word: string;
    meaning_id: number;
    part_of_speech: string;
    meaning_description: string;
    turkish_meaning: string;
    final_difficulty: string;
  };
}

// Question generation request
export interface QuestionGenerationRequest {
  wordIds: number[];
}

// Question generation response
export interface QuestionGenerationResponse {
  message: string;
  results: {
    successful: QuestionGenerationResult[];
    failed: QuestionGenerationFailure[];
    total: number;
    successCount: number;
    failureCount: number;
    processingTime: number;
  };
  summary: {
    generated: number;
    failed: number;
    duplicate: number;
    total: number;
  };
}

// Single question generation result
export interface QuestionGenerationResult {
  word: string;
  wordId: number;
  questionId: number;
  processingTime: number;
}

// Question generation failure
export interface QuestionGenerationFailure {
  word: string;
  wordId: number;
  reason: string;
  error?: string;
}

// Questions API response with pagination
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

// Question management filters
export interface QuestionFilters {
  search?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | '';
  partOfSpeech?: string;
  isActive?: boolean;
  sortBy?: 'created_at' | 'word' | 'difficulty' | 'times_shown';
  sortOrder?: 'asc' | 'desc';
}

// Question statistics
export interface QuestionStats {
  totalQuestions: number;
  activeQuestions: number;
  difficultyBreakdown: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
  partOfSpeechBreakdown: Record<string, number>;
  recentQuestions: number; // Son 24 saatte oluşturulan
  averageCorrectRate: number;
  mostShownWords: Array<{
    word: string;
    times_shown: number;
    times_correct: number;
    success_rate: number;
  }>;
}

// Bulk question operations
export interface BulkQuestionOperation {
  questionIds: number[];
  operation: 'activate' | 'deactivate' | 'delete';
}

export interface BulkQuestionResponse {
  message: string;
  affected: number;
  failed: number;
  errors?: string[];
}

// Question validation
export interface QuestionValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Component props types
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
  refreshKey: number;
}

export interface QuestionCardProps {
  question: Question;
  onUpdate?: (question: Question) => void;
  onDelete?: (questionId: number) => void;
  onToggleActive?: (questionId: number, isActive: boolean) => void;
  showActions?: boolean;
}

// Progress tracking for question generation
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

// Question generation settings
export interface QuestionGenerationSettings {
  maxConcurrent: number;
  retryAttempts: number;
  timeoutMs: number;
  rateLimit: number; // milliseconds between requests
  validateQuality: boolean;
  autoActivate: boolean;
}

// Question quality metrics
export interface QuestionQuality {
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

// Export default empty object to make it a module
export default {};