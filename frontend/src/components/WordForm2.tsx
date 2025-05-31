import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

interface WordFormProps {
  onWordsAdded: () => void;
}

interface AddWordResponse {
  message: string;
  results: {
    success: Array<{
      word: string;
      partOfSpeech: string;
      definition: string;
    }>;
    failed: Array<{
      word: string;
      reason: string;
    }>;
    duplicate: Array<{
      word: string;
      partOfSpeech: string;
      reason: string;
    }>;
  };
  summary: {
    success: number;
    failed: number;
    duplicate: number;
    total: number;
  };
}

const WordForm: React.FC<WordFormProps> = ({ onWordsAdded }) => {
  const [words, setWords] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AddWordResponse | null>(null);
  const [error, setError] = useState<string>('');
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!words.trim()) {
      setError('Lütfen en az bir kelime girin');
      return;
    }

    // Kelimeleri ayırıp temizle
    const wordList = words
      .split(/[,\n\s]+/)
      .map(word => word.trim().toLowerCase())
      .filter(word => word.length > 0);

    if (wordList.length === 0) {
      setError('Geçerli kelime bulunamadı');
      return;
    }

    if (wordList.length > 50) {
      setError('Bir seferde maksimum 50 kelime ekleyebilirsiniz');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult(null);
    setProgress({ current: 0, total: wordList.length });

    try {
      const response = await axios.post<AddWordResponse>(
        `${API_BASE_URL}/api/words/bulk`,
        { words: wordList },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 60000, // 60 saniye timeout
        }
      );

      setResult(response.data);
      onWordsAdded(); // Parent component'e bildir
      
      // Başarılı olduysa formu temizle
      if (response.data.summary.success > 0) {
        setWords('');
      }

    } catch (err: any) {
      console.error('Kelime ekleme hatası:', err);
      
      if (err.code === 'ECONNABORTED') {
        setError('İstek zaman aşımına uğradı. Lütfen tekrar deneyin.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Kelime eklenirken bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } finally {
      setIsLoading(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const renderResults = () => {
    if (!result) return null;

    const { summary, results } = result;

    return (
      <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h3>İşlem Sonucu</h3>
        
        {/* Özet */}
        <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '3px' }}>
          <p><strong>Toplam kelime:</strong> {summary.total}</p>
          <p style={{ color: 'green' }}><strong>Başarılı:</strong> {summary.success}</p>
          <p style={{ color: 'orange' }}><strong>Tekrar:</strong> {summary.duplicate}</p>
          <p style={{ color: 'red' }}><strong>Başarısız:</strong> {summary.failed}</p>
        </div>

        {/* Başarılı kelimeler */}
        {results.success.length > 0 && (
          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ color: 'green' }}>✅ Başarıyla eklenen kelimeler ({results.success.length})</h4>
            <div style={{ maxHeight: '150px', overflowY: 'auto', fontSize: '14px' }}>
              {results.success.slice(0, 10).map((item, index) => (
                <div key={index} style={{ padding: '5px', borderBottom: '1px solid #eee' }}>
                  <strong>{item.word}</strong> ({item.partOfSpeech}) - {item.definition}
                </div>
              ))}
              {results.success.length > 10 && (
                <p style={{ fontStyle: 'italic', color: '#666' }}>
                  ... ve {results.success.length - 10} kelime daha
                </p>
              )}
            </div>
          </div>
        )}

        {/* Tekrar eden kelimeler */}
        {results.duplicate.length > 0 && (
          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ color: 'orange' }}>⚠️ Zaten mevcut kelimeler ({results.duplicate.length})</h4>
            <div style={{ maxHeight: '100px', overflowY: 'auto', fontSize: '14px' }}>
              {results.duplicate.slice(0, 5).map((item, index) => (
                <div key={index} style={{ padding: '3px' }}>
                  {item.word} ({item.partOfSpeech})
                </div>
              ))}
              {results.duplicate.length > 5 && (
                <p style={{ fontStyle: 'italic', color: '#666' }}>
                  ... ve {results.duplicate.length - 5} kelime daha
                </p>
              )}
            </div>
          </div>
        )}

        {/* Başarısız kelimeler */}
        {results.failed.length > 0 && (
          <div>
            <h4 style={{ color: 'red' }}>❌ Eklenemeyen kelimeler ({results.failed.length})</h4>
            <div style={{ maxHeight: '100px', overflowY: 'auto', fontSize: '14px' }}>
              {results.failed.map((item, index) => (
                <div key={index} style={{ padding: '3px' }}>
                  <strong>{item.word}</strong> - {item.reason}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2>📚 Kelime Ekleme</h2>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="words" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Kelimeler (virgül, boşluk veya yeni satırla ayırın)
          </label>
          <textarea
            id="words"
            value={words}
            onChange={(e) => setWords(e.target.value)}
            placeholder="Örnek: apple, book, computer&#10;house&#10;beautiful, interesting"
            rows={6}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '14px',
              fontFamily: 'monospace'
            }}
            disabled={isLoading}
          />
          <small style={{ color: '#666', fontSize: '12px' }}>
            Maksimum 50 kelime ekleyebilirsiniz. Her kelime için API'den anlamlar çekilecek.
          </small>
        </div>

        {error && (
          <div style={{ 
            color: 'red', 
            backgroundColor: '#ffebee', 
            padding: '10px', 
            borderRadius: '5px', 
            marginBottom: '15px'
          }}>
            {error}
          </div>
        )}

        {/* Progress Bar */}
        {isLoading && progress.total > 0 && (
          <div style={{ marginBottom: '15px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <span style={{ fontSize: '14px', color: '#666' }}>
                İşleniyor... {Math.floor(progress.current)}/{progress.total} kelime
              </span>
              <span style={{ fontSize: '12px', color: '#999' }}>
                {Math.round((progress.current / progress.total) * 100)}%
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#f0f0f0',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${(progress.current / progress.total) * 100}%`,
                height: '100%',
                backgroundColor: '#007bff',
                borderRadius: '4px',
                transition: 'width 0.3s ease'
              }} />
            </div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
              Bu işlem birkaç dakika sürebilir. Lütfen sayfayı kapatmayın.
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !words.trim()}
          style={{
            backgroundColor: isLoading ? '#ccc' : '#007bff',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            width: '100%'
          }}
        >
          {isLoading ? '🔄 Kelimeler ekleniyor...' : '➕ Kelimeleri Ekle'}
        </button>
      </form>

      {renderResults()}
    </div>
  );
};

export default WordForm;