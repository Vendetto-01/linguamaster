// frontend/src/services/api.ts - DÜZELTİLMİŞ İMPORTLAR

import type {
  QueueStats,
  QueueStatus,
  FileUploadResponse,
  ProcessorStats,
  WordsResponse,
  WordFilters,
  // Question Types - YENİ EKLENDİ
  Question,
  QuestionStats as ApiQuestionStats, // Alias to avoid conflict if any local QuestionStats type exists
  GenerateQuestionsPayload,
  GenerateQuestionsResponse,
  QuestionsResponse,
  QuestionFilters as ApiQuestionFilters, // Alias
  BulkQuestionsPayload,
  BulkQuestionsResponse,
  ToggleActiveResponse
} from '../types';
import { handleApiError } from '../utils/apiUtils';
import { API_BASE_URL } from '../config/appConfig';

export const wordApi = {
  uploadFile: async (words: string[], fileName: string): Promise<FileUploadResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/words/upload-file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ words, fileName }),
    });

    if (!response.ok) {
      await handleApiError(response);
    }
    return response.json();
  },

  getQueueStatus: async (batchId: string): Promise<QueueStatus> => {
    const response = await fetch(`${API_BASE_URL}/api/words/queue-status/${batchId}`);
    if (!response.ok) {
      await handleApiError(response);
    }
    return response.json();
  },

  getQueueStats: async (): Promise<QueueStats> => {
    const response = await fetch(`${API_BASE_URL}/api/words/queue-stats`);
    if (!response.ok) {
      await handleApiError(response);
    }
    return response.json();
  },

  getWords: async (filters: WordFilters = {}): Promise<WordsResponse> => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.difficulty) params.append('difficulty', filters.difficulty);
    if (filters.partOfSpeech) params.append('partOfSpeech', filters.partOfSpeech);
    if (filters.groupByWord !== undefined) params.append('groupByWord', filters.groupByWord.toString());
    if (filters.difficultyType) params.append('difficultyType', filters.difficultyType);

    const response = await fetch(`${API_BASE_URL}/api/words?${params.toString()}`);
    if (!response.ok) {
      await handleApiError(response);
    }
    return response.json();
  },

  processor: {
    start: async (): Promise<{ message: string; stats: ProcessorStats }> => {
      const response = await fetch(`${API_BASE_URL}/api/processor/start`, {
        method: 'POST',
      });
      if (!response.ok) {
        await handleApiError(response);
      }
      return response.json();
    },

    stop: async (): Promise<{ message: string; stats: ProcessorStats }> => {
      const response = await fetch(`${API_BASE_URL}/api/processor/stop`, {
        method: 'POST',
      });
      if (!response.ok) {
        await handleApiError(response);
      }
      return response.json();
    },

    getStats: async (): Promise<{ stats: ProcessorStats; timestamp: string }> => {
      const response = await fetch(`${API_BASE_URL}/api/processor/stats`);
      if (!response.ok) {
        await handleApiError(response);
      }
      return response.json();
    }
  }
};

export const questionApi = {
  generateQuestions: async (payload: GenerateQuestionsPayload): Promise<GenerateQuestionsResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/questions/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  getQuestions: async (filters: ApiQuestionFilters = {}): Promise<QuestionsResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    const response = await fetch(`${API_BASE_URL}/api/questions?${params.toString()}`);
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  getQuestionStats: async (): Promise<ApiQuestionStats> => {
    const response = await fetch(`${API_BASE_URL}/api/questions/stats`);
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  updateQuestion: async (id: number, data: Partial<Question>): Promise<Question> => {
    const response = await fetch(`${API_BASE_URL}/api/questions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  deleteQuestion: async (id: number): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/questions/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  bulkUpdateQuestions: async (payload: BulkQuestionsPayload): Promise<BulkQuestionsResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/questions/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  toggleQuestionActive: async (id: number): Promise<ToggleActiveResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/questions/${id}/toggle-active`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }, // Ensure content type if backend expects it, even for empty body
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },
};