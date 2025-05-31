// frontend/src/services/api.ts
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

// Tüm API fonksiyonlarını burada topla
export const wordApi = {
  // Kelime ekleme
  addWords: async (words: string[]) => {
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

  // Kelime listesi getir
  getWords: async (page = 1, limit = 20) => {
    const response = await fetch(`${API_BASE_URL}/api/words?page=${page}&limit=${limit}`);
    
    if (!response.ok) {
      throw new Error('Kelimeler yüklenemedi');
    }
    
    return response.json();
  },

  // İstatistikler getir
  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/api/words/stats`);
    
    if (!response.ok) {
      throw new Error('İstatistikler yüklenemedi');
    }
    
    return response.json();
  }
};