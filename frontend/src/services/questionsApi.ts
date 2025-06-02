// frontend/src/services/questionsApi.ts - SORU YÖNETİMİ API SERVİSLERİ

import type {
  Question,
  QuestionGenerationRequest,
  QuestionGenerationResponse,
  QuestionsResponse,
  QuestionStats,
  QuestionFilters,
  BulkQuestionOperation,
  BulkQuestionResponse
} from '../types/questions';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

// Error handling helper
const handleApiError = async (response: Response): Promise<never> => {
  const error = await response.json();
  throw new Error(error.message || `API Error: ${response.status}`);
};

// Questions API servisleri
export const questionsApi = {
  // 🤖 Soru Oluşturma
  generateQuestions: async (wordIds: number[]): Promise<QuestionGenerationResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/questions/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ wordIds }),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  // 📋 Soru Listesi
  getQuestions: async (filters: QuestionFilters & { page?: number; limit?: number } = {}): Promise<QuestionsResponse> => {
    const params = new URLSearchParams();
    
    // Pagination
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    
    // Filters
    if (filters.search) params.append('search', filters.search);
    if (filters.difficulty) params.append('difficulty', filters.difficulty);
    if (filters.partOfSpeech) params.append('partOfSpeech', filters.partOfSpeech);
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await fetch(`${API_BASE_URL}/api/questions?${params}`);

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  // 📊 Soru İstatistikleri
  getQuestionStats: async (): Promise<QuestionStats> => {
    const response = await fetch(`${API_BASE_URL}/api/questions/stats`);

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  // 📝 Tekil Soru İşlemleri
  getQuestion: async (id: number): Promise<Question> => {
    const response = await fetch(`${API_BASE_URL}/api/questions/${id}`);

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  updateQuestion: async (id: number, data: Partial<Question>): Promise<Question> => {
    const response = await fetch(`${API_BASE_URL}/api/questions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  deleteQuestion: async (id: number): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/questions/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  // ⚡ Soru Durum Değiştirme
  toggleQuestionActive: async (id: number): Promise<{ 
    message: string; 
    question: Question; 
    newStatus: boolean 
  }> => {
    const response = await fetch(`${API_BASE_URL}/api/questions/${id}/toggle-active`, {
      method: 'POST',
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  // 🗂️ Toplu İşlemler
  bulkOperation: async (questionIds: number[], operation: 'activate' | 'deactivate' | 'delete'): Promise<BulkQuestionResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/questions/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ questionIds, operation }),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  // 🔍 Gelişmiş Arama ve Filtreleme
  searchQuestions: async (query: string, filters?: Omit<QuestionFilters, 'search'>): Promise<QuestionsResponse> => {
    return questionsApi.getQuestions({ 
      search: query, 
      ...filters 
    });
  },

  getQuestionsByWord: async (wordId: number): Promise<Question[]> => {
    const response = await fetch(`${API_BASE_URL}/api/questions/by-word/${wordId}`);

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  getQuestionsByDifficulty: async (difficulty: 'beginner' | 'intermediate' | 'advanced'): Promise<QuestionsResponse> => {
    return questionsApi.getQuestions({ difficulty });
  },

  // 📈 Performans İstatistikleri
  getQuestionPerformance: async (id: number): Promise<{
    questionId: number;
    timesShown: number;
    timesCorrect: number;
    successRate: number;
    lastShown?: string;
  }> => {
    const response = await fetch(`${API_BASE_URL}/api/questions/${id}/performance`);

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  // 🔄 Soru Kalitesi ve Validasyon
  validateQuestion: async (questionData: Partial<Question>): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> => {
    const response = await fetch(`${API_BASE_URL}/api/questions/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(questionData),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  // 📊 Dashboard İstatistikleri
  getDashboardStats: async (): Promise<{
    totalQuestions: number;
    activeQuestions: number;
    recentlyGenerated: number;
    popularWords: Array<{
      word: string;
      questionCount: number;
    }>;
    difficultyDistribution: {
      beginner: number;
      intermediate: number;
      advanced: number;
    };
  }> => {
    const response = await fetch(`${API_BASE_URL}/api/questions/dashboard-stats`);

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  }
};

// Export default for easier imports
export default questionsApi;