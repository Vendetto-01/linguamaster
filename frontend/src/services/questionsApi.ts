// frontend/src/services/questionsApi.ts - GÜNCELLENMİŞ VERSİYON

import type {
  Question,
  QuestionGenerationConfig,
  QuestionGenerationResponse,
  QuestionFilterParams,
  QuestionSortParams,
  PaginatedQuestionsResponse,
  BulkActionResponse,
  QuestionStats,
  QuestionContentQuality,
  QuestionValidationResponse,
  GeneratedQuestionPayload
} from '../types/questions';
import { handleApiError } from '../utils/apiUtils'; // Ortak handleApiError import edildi

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

// Yerel handleApiError fonksiyonu kaldırıldı.

export const questionsApi = {
  // Soruları getir (filtreli, sıralı, sayfalama ile)
  getQuestions: async (
    params: QuestionFilterParams & QuestionSortParams & { page?: number; limit?: number }
  ): Promise<PaginatedQuestionsResponse> => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });

    const response = await fetch(`${API_BASE_URL}/api/questions?${queryParams.toString()}`);
    if (!response.ok) {
      await handleApiError(response); // Ortak fonksiyon kullanılıyor
    }
    return response.json();
  },

  // Tek bir soruyu getir
  getQuestionById: async (id: string): Promise<Question> => {
    const response = await fetch(`${API_BASE_URL}/api/questions/${id}`);
    if (!response.ok) {
      await handleApiError(response); // Ortak fonksiyon kullanılıyor
    }
    return response.json();
  },

  // Yeni soru oluştur (manuel)
  createQuestion: async (questionData: Partial<Question>): Promise<Question> => {
    const response = await fetch(`${API_BASE_URL}/api/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(questionData),
    });
    if (!response.ok) {
      await handleApiError(response); // Ortak fonksiyon kullanılıyor
    }
    return response.json();
  },

  // Soruyu güncelle
  updateQuestion: async (id: string, updates: Partial<Question>): Promise<Question> => {
    const response = await fetch(`${API_BASE_URL}/api/questions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      await handleApiError(response); // Ortak fonksiyon kullanılıyor
    }
    return response.json();
  },

  // Soruyu sil
  deleteQuestion: async (id: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/questions/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      await handleApiError(response); // Ortak fonksiyon kullanılıyor
    }
    return response.json();
  },

  // AI ile soru üret
  generateQuestions: async (
    config: QuestionGenerationConfig
  ): Promise<QuestionGenerationResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/questions/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!response.ok) {
      await handleApiError(response); // Ortak fonksiyon kullanılıyor
    }
    return response.json();
  },

  // Üretilen soruları kaydet
  saveGeneratedQuestions: async (
    questionsToSave: GeneratedQuestionPayload[]
  ): Promise<BulkActionResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/questions/save-generated`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: questionsToSave }),
    });
    if (!response.ok) {
        await handleApiError(response); // Ortak fonksiyon kullanılıyor
    }
    return response.json();
  },

  // Toplu soru silme
  bulkDeleteQuestions: async (questionIds: string[]): Promise<BulkActionResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/questions/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionIds }),
    });
    if (!response.ok) {
        await handleApiError(response); // Ortak fonksiyon kullanılıyor
    }
    return response.json();
  },
  
  // Soru istatistiklerini getir
  getQuestionStats: async (): Promise<QuestionStats> => {
    const response = await fetch(`${API_BASE_URL}/api/questions/stats`);
    if (!response.ok) {
        await handleApiError(response); // Ortak fonksiyon kullanılıyor
    }
    return response.json();
  },

  // Bir sorunun içerik kalitesini değerlendir
  assessQuestionQuality: async (questionId: string): Promise<QuestionContentQuality> => {
    const response = await fetch(`${API_BASE_URL}/api/questions/${questionId}/assess-quality`, {
        method: 'POST' 
    });
    if (!response.ok) {
        await handleApiError(response); // Ortak fonksiyon kullanılıyor
    }
    return response.json();
  },

  // Bir soruyu doğrula/onayla
  validateQuestion: async (questionId: string, isValid: boolean, comments?: string): Promise<QuestionValidationResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/questions/${questionId}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isValid, comments }),
    });
    if (!response.ok) {
        await handleApiError(response); // Ortak fonksiyon kullanılıyor
    }
    return response.json();
  }
};