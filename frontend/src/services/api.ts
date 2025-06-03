// frontend/src/services/api.ts - YENİ ŞEMA DESTEKLİ

// YENİ: Import updated types (Tüm importlar dosyanın en başında)
import type {
  Word,
  WordGroup,
  WordListResponse,
  WordStats,
  QueueStats,
  QueueStatus,
  BulkAddResponse,
  FileUploadResponse,
  RandomWordsResponse,
  ProcessorStats
} from '../types'; // '../types' yolunun projenize göre doğru olduğundan emin olun.

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

// API Response Types - AYNI
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

// Tüm API fonksiyonlarını burada topla - GÜNCELLEME
export const wordApi = {
  // Kelime ekleme (Queue'ya) - AYNI
  addWords: async (words: string[]): Promise<BulkAddResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/words/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ words }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Bir hata oluştu');
    }

    return response.json();
  },

  // Dosya yükleme - AYNI
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

  // Stream ile kelime ekleme - AYNI
  addWordsStreamPost: async (
    words: string[],
    onProgress: (data: any) => void,
    onComplete: (data: any) => void,
    onError: (error: string) => void
  ): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/words/bulk-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ words }),
      });

      if (!response.ok) {
        throw new Error('Stream başlatılamadı');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Response reader alınamadı');
      }

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'complete') {
                onComplete(data);
              } else if (data.type === 'error') {
                onError(data.message);
              } else if (data.type === 'end') {
                return; // Stream sonlandığında fonksiyondan çık
              } else {
                onProgress(data);
              }
            } catch (parseError) {
              console.warn('JSON parse hatası:', parseError);
            }
          }
        }
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Bilinmeyen hata');
    }
  },

  // YENİ: Kelime listesi getir - Gruplu Format Desteği
  getWords: async (
    page = 1,
    limit = 20,
    search?: string,
    difficulty?: string,
    difficultyType: 'initial' | 'final' = 'final',
    groupByWord: boolean = false
  ): Promise<WordListResponse> => {
    let url = `${API_BASE_URL}/api/words?page=${page}&limit=${limit}&difficultyType=${difficultyType}&groupByWord=${groupByWord}`;

    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }

    if (difficulty) {
      url += `&difficulty=${encodeURIComponent(difficulty)}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Kelimeler yüklenemedi');
    }

    return response.json();
  },

  // YENİ: Gelişmiş istatistikler getir
  getStats: async (): Promise<WordStats> => {
    const response = await fetch(`${API_BASE_URL}/api/words/stats`);

    if (!response.ok) {
      throw new Error('İstatistikler yüklenemedi');
    }

    return response.json();
  },

  // Queue durumu getir - AYNI
  getQueueStatus: async (batchId: string): Promise<QueueStatus> => {
    const response = await fetch(`${API_BASE_URL}/api/words/queue-status/${batchId}`);

    if (!response.ok) {
      throw new Error('Queue durumu alınamadı');
    }

    return response.json();
  },

  // Genel queue istatistikleri - AYNI
  getQueueStats: async (): Promise<QueueStats> => {
    const response = await fetch(`${API_BASE_URL}/api/words/queue-stats`);

    if (!response.ok) {
      throw new Error('Queue istatistikleri alınamadı');
    }

    return response.json();
  },

  // YENİ: Rastgele kelimeler getir - Gruplu Format
  getRandomWords: async (
    limit = 10,
    difficulty?: string,
    groupByWord: boolean = true
  ): Promise<RandomWordsResponse> => {
    let url = `${API_BASE_URL}/api/words/random?limit=${limit}&groupByWord=${groupByWord}`;

    if (difficulty) {
      url += `&difficulty=${encodeURIComponent(difficulty)}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Rastgele kelimeler yüklenemedi');
    }

    return response.json();
  },

  // YENİ: Belirli kelime grubu getir
  getWordGroup: async (word: string): Promise<WordGroup> => {
    const response = await fetch(`${API_BASE_URL}/api/words/group/${encodeURIComponent(word)}`);

    if (!response.ok) {
      throw new Error('Kelime grubu yüklenemedi');
    }

    return response.json();
  },

  // YENİ: Anlam bazında kelime getir
  getWordMeaning: async (word: string, meaningId: number): Promise<Word> => {
    const response = await fetch(`${API_BASE_URL}/api/words/${encodeURIComponent(word)}/meaning/${meaningId}`);

    if (!response.ok) {
      throw new Error('Kelime anlamı yüklenemedi');
    }

    return response.json();
  },

  // Processor kontrolü - GÜNCELLEME
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
  },

  // YENİ: System info endpoint
  getSystemInfo: async (): Promise<{
    appName: string;
    version: string;
    aiModel: string;
    lastUpdated: string;
    features: string[];
    database: string;
    environment: string;
  }> => {
    const response = await fetch(`${API_BASE_URL}/api/system/info`);

    if (!response.ok) {
      throw new Error('System info alınamadı');
    }

    return response.json();
  },

  // Development endpoint'leri - AYNI
  dev: {
    clearAll: async (): Promise<{ message: string }> => {
      const response = await fetch(`${API_BASE_URL}/api/words/clear`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Temizleme işlemi başarısız');
      }

      return response.json();
    }
  }
};