// frontend/src/services/api.ts - GÜNCELLENMİŞ VERSİYON

import type {
  QueueStats,
  QueueStatus,
  FileUploadResponse,
  ProcessorStats,
  WordsResponse,
  WordFilters
} from '../types';
import { handleApiError } from '../utils/apiUtils'; // Ortak handleApiError import edildi

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

// Yerel handleApiError fonksiyonu kaldırıldı.

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
      await handleApiError(response); // Ortak fonksiyon kullanılıyor
    }
    return response.json();
  },

  getQueueStatus: async (batchId: string): Promise<QueueStatus> => {
    const response = await fetch(`${API_BASE_URL}/api/words/queue-status/${batchId}`);
    if (!response.ok) {
      await handleApiError(response); // Ortak fonksiyon kullanılıyor
    }
    return response.json();
  },

  getQueueStats: async (): Promise<QueueStats> => {
    const response = await fetch(`${API_BASE_URL}/api/words/queue-stats`);
    if (!response.ok) {
      await handleApiError(response); // Ortak fonksiyon kullanılıyor
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

    const response = await fetch(`${API_BASE_URL}/api/words?${params.toString()}`); // .toString() eklendi
    if (!response.ok) {
      await handleApiError(response); // Ortak fonksiyon kullanılıyor
    }
    return response.json();
  },

  processor: {
    start: async (): Promise<{ message: string; stats: ProcessorStats }> => {
      const response = await fetch(`${API_BASE_URL}/api/processor/start`, {
        method: 'POST',
      });
      if (!response.ok) {
        await handleApiError(response); // Ortak fonksiyon kullanılıyor
      }
      return response.json();
    },

    stop: async (): Promise<{ message: string; stats: ProcessorStats }> => {
      const response = await fetch(`${API_BASE_URL}/api/processor/stop`, {
        method: 'POST',
      });
      if (!response.ok) {
        await handleApiError(response); // Ortak fonksiyon kullanılıyor
      }
      return response.json();
    },

    getStats: async (): Promise<{ stats: ProcessorStats; timestamp: string }> => {
      const response = await fetch(`${API_BASE_URL}/api/processor/stats`);
      if (!response.ok) {
        await handleApiError(response); // Ortak fonksiyon kullanılıyor
      }
      return response.json();
    }
  }
};