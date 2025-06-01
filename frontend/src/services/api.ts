// frontend/src/services/api.ts
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

// API Response Types
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

export interface BulkAddResponse {
  message: string;
  results: {
    queued: QueuedWordResult[];
    failed: FailedWordResult[];
    duplicate: DuplicateWordResult[];
  };
  summary: {
    queued: number;
    failed: number;
    duplicate: number;
    total: number;
  };
  batchId: string;
  nextStep: string;
}

export interface FileUploadResponse {
  message: string;
  results: {
    fileName: string;
    batchId: string;
    totalWords: number;
    queued: number;
    duplicates: number;
    failed: number;
  };
  status: string;
  nextStep: string;
}

export interface QueueStatus {
  batchId: string;
  pending: number;
  processing: number;
  processed: number;
  failed: number;
  status: 'processing' | 'completed';
  lastUpdate: string;
}

export interface QueueStats {
  totalPendingWords: number;
  totalProcessingWords: number;
  totalFailedWords: number;
  activeBatches: number;
  oldestPendingWord: {
    word: string;
    created_at: string;
  } | null;
  isQueueActive: boolean;
  processorStats: {
    isProcessing: boolean;
    processedCount: number;
    errorCount: number;
    startTime: string | null;
    elapsedTime: number;
  };
  lastUpdate: string;
}

export interface WordStats {
  totalWords: number;
  totalDefinitions: number;
  partOfSpeechStats: Array<{
    _id: string;
    count: number;
  }>;
  difficultyStats: Array<{
    _id: string;
    count: number;
  }>;
  queueStats: {
    pending: number;
    processing: number;
    failed: number;
  };
  lastUpdated: string;
  database: string;
  apiSource: string;
}

export interface Word {
  id: number;
  word: string;
  turkish_meaning: string;
  part_of_speech: string;
  english_example: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  source: string;
  times_shown: number;
  times_correct: number;
  is_active: boolean;
  created_at: string;
}

export interface WordListResponse {
  words: Word[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalWords: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Tüm API fonksiyonlarını burada topla
export const wordApi = {
  // Kelime ekleme (Queue'ya)
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

  // Stream ile kelime ekleme (Real-time progress)
  addWordsStream: (words: string[]): EventSource => {
    const eventSource = new EventSource(`${API_BASE_URL}/api/words/bulk-stream`, {
      // POST data'yı query string olarak gönderemeyiz, bu endpoint'i farklı kullanacağız
    });

    // Bu endpoint için POST yapmamız gerekiyor, EventSource ile POST yapamayız
    // Bu yüzden bu fonksiyonu fetch ile yapacağız
    return eventSource;
  },

  // Stream endpoint'i için özel fonksiyon
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
                return;
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

  // Kelime listesi getir
  getWords: async (page = 1, limit = 20, search?: string, difficulty?: string): Promise<WordListResponse> => {
    let url = `${API_BASE_URL}/api/words?page=${page}&limit=${limit}`;
    
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

  // İstatistikler getir
  getStats: async (): Promise<WordStats> => {
    const response = await fetch(`${API_BASE_URL}/api/words/stats`);
    
    if (!response.ok) {
      throw new Error('İstatistikler yüklenemedi');
    }
    
    return response.json();
  },

  // Queue durumu getir (belirli batch için)
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

  // Rastgele kelimeler getir
  getRandomWords: async (limit = 10, difficulty?: string): Promise<{ words: Word[]; count: number; requested: number }> => {
    let url = `${API_BASE_URL}/api/words/random?limit=${limit}`;
    
    if (difficulty) {
      url += `&difficulty=${encodeURIComponent(difficulty)}`;
    }

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Rastgele kelimeler yüklenemedi');
    }
    
    return response.json();
  },

  // Processor kontrolü
  processor: {
    start: async (): Promise<{ message: string; stats: any }> => {
      const response = await fetch(`${API_BASE_URL}/api/processor/start`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Processor başlatılamadı');
      }
      
      return response.json();
    },

    stop: async (): Promise<{ message: string; stats: any }> => {
      const response = await fetch(`${API_BASE_URL}/api/processor/stop`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Processor durdurulamadı');
      }
      
      return response.json();
    },

    getStats: async (): Promise<{ stats: any; timestamp: string }> => {
      const response = await fetch(`${API_BASE_URL}/api/processor/stats`);
      
      if (!response.ok) {
        throw new Error('Processor istatistikleri alınamadı');
      }
      
      return response.json();
    }
  },

  // Development endpoint'leri
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