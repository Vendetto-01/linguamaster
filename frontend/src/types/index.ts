// frontend/src/types/index.ts

// API response types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Word types
export interface Word {
  id: number;
  word: string;
  part_of_speech: string;
  definition: string;
  phonetic?: string;
  example?: string;
  synonyms: string[];
  antonyms: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  created_at: string;
}

// Kelime ekleme sonucu
export interface WordResult {
  word: string;
  partOfSpeech: string;
  definition: string;
}

export interface FailedWord {
  word: string;
  reason: string;
}

export interface AddWordResponse {
  message: string;
  results: {
    success: WordResult[];
    failed: FailedWord[];
    duplicate: WordResult[];
  };
  summary: {
    success: number;
    failed: number;
    duplicate: number;
    total: number;
  };
}

// Component props
export interface WordFormProps {
  onWordsAdded: () => void;
}

// Stats types
export interface WordStats {
  totalWords: number;
  partOfSpeechStats: Array<{
    _id: string;
    count: number;
  }>;
  difficultyStats: Array<{
    _id: string;
    count: number;
  }>;
}