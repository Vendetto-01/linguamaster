// frontend/src/services/api.ts - TEMİZLENMİŞ VERSİYON

import type {
  QueueStats,
  QueueStatus,
  FileUploadResponse,
  ProcessorStats
} from '../types';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

// Tüm API fonksiyonlarını burada topla - TEMİZLENMİŞ
export const wordApi = {
  // Dosya yükleme
  uploadFile: async (words: string[], fileName: string): Promise<FileUploadResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/words/upload-file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ words, fileName }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Dosya yükleme hatası');
    }

    return response.json();
  },

  // Queue durumu getir
  getQueueStatus: async (batchId: string): Promise<QueueStatus> => {
    const response = await fetch(`${API_BASE_URL}/api/words/queue-status/${batchId}`);

    if (!response.ok) {
      throw new Error('Queue durumu alınamadı');
    }

    return response.json();
  },

  // Genel queue istatistikleri
  getQueueStats: async (): Promise<QueueStats> => {
    const response = await fetch(`${API_BASE_URL}/api/words/queue-stats`);

    if (!response.ok) {
      throw new Error('Queue istatistikleri alınamadı');
    }

    return response.json();
  },

  // Processor kontrolü
  processor: {
    start: async (): Promise<{ message: string; stats: ProcessorStats }> => {
      const response = await fetch(`${API_BASE_URL}/api/processor/start`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Processor başlatılamadı');
      }

      return response.json();
    },

    stop: async (): Promise<{ message: string; stats: ProcessorStats }> => {
      const response = await fetch(`${API_BASE_URL}/api/processor/stop`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Processor durdurulamadı');
      }

      return response.json();
    },

    getStats: async (): Promise<{ stats: ProcessorStats; timestamp: string }> => {
      const response = await fetch(`${API_BASE_URL}/api/processor/stats`);

      if (!response.ok) {
        throw new Error('Processor istatistikleri alınamadı');
      }

      return response.json();
    }
  }
};