// frontend/src/types/questions.ts
export interface WordForGeneration {
  id: number;
  word: string;
  meaning_id: number;
  part_of_speech: string;
  meaning_description: string;
  english_example: string;
  turkish_meaning: string;
  final_difficulty: string;
}

export interface Question {
  id: string;
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
  word?: WordInfo;
}

export interface WordInfo {
  id: number;
  word: string;
  meaning_id: number;
  part_of_speech: string;
  meaning_description: string;
  turkish_meaning: string;
  final_difficulty: string;
}

export interface QuestionGenerationConfig {
  wordIds: number[];
  maxConcurrent?: number;
  validateQuality?: boolean;
}

export interface QuestionGenerationComponentProps {
  selectedWords: WordForGeneration[];
  onQuestionsGenerated: (count: number) => void;
  onBackToSelection: () => void;
}

export interface QuestionGenerationProgress {
  current: number;
  total: number;
  percentage: number;
  stage: 'starting' | 'generating' | 'saving' | 'complete' | 'error';
  message: string;
  successful: number;
  failed: number;
  timeElapsed: number;
  estimatedTimeRemaining?: number;
}

export interface GenerationResult {
  word: string;
  wordId: number;
  questionId: number;
  processingTime?: number;
}

export interface GenerationFailure {
  word: string;
  wordId: number;
  reason: string;
  error?: string;
}

export interface QuestionGenerationResponse {
  message: string;
  results: {
    successful: GenerationResult[];
    failed: GenerationFailure[];
    successCount: number;
    failureCount: number;
    processingTime?: number;
  };
}

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
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface QuestionSortParams {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface BulkActionResponse {
  success: boolean;
  message: string;
  affectedCount: number;
  errors?: string[];
}