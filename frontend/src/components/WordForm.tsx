import React, { useState, useRef } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

interface WordFormProps {
  onWordsAdded: () => void;
}

interface WordResult {
  word: string;
  partOfSpeech: string;
  definition: string;
  reason?: string;
}

interface ProcessingResults {
  success: WordResult[];
  failed: WordResult[];
  duplicate: WordResult[];
}

interface ProgressState {
  current: number;
  total: number;
  currentWord: string;
  message: string;
}

interface Summary {
  success: number;
  failed: number;
  duplicate: number;
  total: number;
}

const WordForm: React.FC<WordFormProps> = ({ onWordsAdded }) => {
  const [words, setWords] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ProcessingResults>({
    success: [],
    failed: [],
    duplicate: []
  });
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string>('');
  const [progress, setProgress] = useState<ProgressState>({
    current: 0,
    total: 0,
    currentWord: '',
    message: ''
  });
  const [processedWords, setProcessedWords] = useState<string[]>([]);
  
  // EventSource referansı - cleanup için
  const eventSourceRef = useRef<EventSource | null>(null);

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

    // State'leri sıfırla
    setIsLoading(true);
    setError('');
    setResults({ success: [], failed: [], duplicate: [] });
    setSummary(null);
    setProgress({ current: 0, total: wordList.length, currentWord: '', message: 'Başlatılıyor...' });
    setProcessedWords([]);

    try {
      // Önce kelime listesini backend'e gönder
      const response = await axios.post(
        `${API_BASE_URL}/api/words/bulk-stream`,
        { words: wordList },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000 // Sadece istek gönderme için kısa timeout
        }
      );

      // EventSource ile real-time updates dinle
      const eventSource = new EventSource(`${API_BASE_URL}/api/words/bulk-stream`, {
        withCredentials: false
      });
      
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('🔌 EventSource bağlantısı açıldı');
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📥 Event alındı:', data);

          switch (data.type) {
            case 'start':
              setProgress(prev => ({
                ...prev,
                total: data.total,
                message: data.message
              }));
              break;

            case 'progress':
              setProgress({
                current: data.current,
                total: data.total,
                currentWord: data.currentWord,
                message: data.message
              });
              break;

            case 'word_success':
              setResults(prev => ({
                ...prev,
                success: [...prev.success, {
                  word: data.word,
                  partOfSpeech: data.partOfSpeech,
                  definition: data.definition
                }]
              }));
              setProcessedWords(prev => [...prev, `✅ ${data.word}`]);
              break;

            case 'word_duplicate':
              setResults(prev => ({
                ...prev,
                duplicate: [...prev.duplicate, {
                  word: data.word,
                  partOfSpeech: data.partOfSpeech,
                  definition: '',
                  reason: 'Zaten mevcut'
                }]
              }));
              setProcessedWords(prev => [...prev, `⚠️ ${data.word} (tekrar)`]);
              break;

            case 'word_failed':
              setResults(prev => ({
                ...prev,
                failed: [...prev.failed, {
                  word: data.word,
                  partOfSpeech: '',
                  definition: '',
                  reason: data.reason
                }]
              }));
              setProcessedWords(prev => [...prev, `❌ ${data.word}`]);
              break;

            case 'complete':
              setSummary(data.summary);
              setProgress(prev => ({
                ...prev,
                message: 'İşlem tamamlandı!'
              }));
              onWordsAdded(); // Parent component'e bildir
              
              // Başarılı olduysa formu temizle
              if (data.summary.success > 0) {
                setWords('');
              }
              break;

            case 'end':
              eventSource.close();
              setIsLoading(false);
              console.log('🔚 EventSource bağlantısı kapandı');
              break;

            case 'error':
              setError(data.message || 'Sunucu hatası oluştu');
              eventSource.close();
              setIsLoading(false);
              break;

            default:
              console.log('❓ Bilinmeyen event type:', data.type);
          }
        } catch (parseError) {
          console.error('❌ Event parse hatası:', parseError);
        }
      };

      eventSource.onerror = (error) => {
        console.error('❌ EventSource hatası:', error);
        setError('Bağlantı hatası oluştu. Lütfen tekrar deneyin.');
        eventSource.close();
        setIsLoading(false);
      };

    } catch (err: any) {
      console.error('❌ Kelime ekleme hatası:', err);
      
      if (err.code === 'ECONNABORTED') {
        setError('İstek zaman aşımına uğradı. Lütfen tekrar deneyin.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Kelime eklenirken bir hata oluştu. Lütfen tekrar deneyin.');
      }
      
      setIsLoading(false);
    }
  };

  // Component unmount olduğunda EventSource'u temizle
  React.useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleCancel = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    setIsLoading(false);
    setProgress({ current: 0, total: 0, currentWord: '', message: '' });
  };

  const renderProgressBar = () => {
    if (!isLoading || progress.total === 0) return null;

    const percentage = Math.round((progress.current / progress.total) * 100);

    return (
      <div style={{ marginBottom: '20px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <span style={{ fontSize: '14px', color: '#666' }}>
            {progress.message}
          </span>
          <span style={{ fontSize: '12px', color: '#999' }}>
            {progress.current}/{progress.total} ({percentage}%)
          </span>
        </div>
        
        <div style={{
          width: '100%',
          height: '12px',
          backgroundColor: '#f0f0f0',
          borderRadius: '6px',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: '#007bff',
            borderRadius: '6px',
            transition: 'width 0.3s ease',
            background: 'linear-gradient(90deg, #007bff 0%, #0056b3 100%)'
          }} />
        </div>
        
        {progress.currentWord && (
          <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
            🔄 Şu an işleniyor: <strong>{progress.currentWord}</strong>
          </div>
        )}
        
        {/* İptal butonu */}
        <button
          onClick={handleCancel}
          style={{
            marginTop: '10px',
            padding: '6px 12px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          ❌ İptal Et
        </button>
      </div>
    );
  };

  const renderLiveProgress = () => {
    if (!isLoading || processedWords.length === 0) return null;

    return (
      <div style={{ 
        marginBottom: '20px', 
        padding: '12px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '6px',
        border: '1px solid #e9ecef'
      }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#495057' }}>
          📋 İşlenen Kelimeler
        </h4>
        <div style={{ 
          maxHeight: '120px', 
          overflowY: 'auto',
          fontSize: '12px',
          lineHeight: '1.4'
        }}>
          {processedWords.slice(-10).map((item, index) => (
            <div key={index} style={{ 
              padding: '2px 0',
              color: item.includes('✅') ? '#28a745' : 
                     item.includes('⚠️') ? '#ffc107' : '#dc3545'
            }}>
              {item}
            </div>
          ))}
          {processedWords.length > 10 && (
            <div style={{ fontStyle: 'italic', color: '#6c757d', marginTop: '5px' }}>
              ... ve {processedWords.length - 10} kelime daha işlendi
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderResults = () => {
    if (!summary) return null;

    return (
      <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h3>🎉 İşlem Sonucu</h3>
        
        {/* Özet */}
        <div style={{ marginBottom: '15px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            <p><strong>📊 Toplam kelime:</strong> {summary.total}</p>
            <p style={{ color: 'green' }}><strong>✅ Başarılı:</strong> {summary.success}</p>
            <p style={{ color: 'orange' }}><strong>⚠️ Tekrar:</strong> {summary.duplicate}</p>
            <p style={{ color: 'red' }}><strong>❌ Başarısız:</strong> {summary.failed}</p>
          </div>
        </div>

        {/* Başarılı kelimeler */}
        {results.success.length > 0 && (
          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ color: 'green', fontSize: '16px' }}>✅ Başarıyla eklenen kelimeler ({results.success.length})</h4>
            <div style={{ maxHeight: '150px', overflowY: 'auto', fontSize: '14px' }}>
              {results.success.slice(0, 10).map((item, index) => (
                <div key={index} style={{ padding: '6px', borderBottom: '1px solid #eee', backgroundColor: '#f8fff8' }}>
                  <strong>{item.word}</strong> ({item.partOfSpeech}) - {item.definition}
                </div>
              ))}
              {results.success.length > 10 && (
                <p style={{ fontStyle: 'italic', color: '#666', padding: '8px' }}>
                  ... ve {results.success.length - 10} kelime daha
                </p>
              )}
            </div>
          </div>
        )}

        {/* Tekrar eden kelimeler */}
        {results.duplicate.length > 0 && (
          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ color: 'orange', fontSize: '16px' }}>⚠️ Zaten mevcut kelimeler ({results.duplicate.length})</h4>
            <div style={{ maxHeight: '100px', overflowY: 'auto', fontSize: '14px' }}>
              {results.duplicate.slice(0, 5).map((item, index) => (
                <div key={index} style={{ padding: '4px', backgroundColor: '#fff8e1' }}>
                  {item.word} ({item.partOfSpeech})
                </div>
              ))}
              {results.duplicate.length > 5 && (
                <p style={{ fontStyle: 'italic', color: '#666', padding: '8px' }}>
                  ... ve {results.duplicate.length - 5} kelime daha
                </p>
              )}
            </div>
          </div>
        )}

        {/* Başarısız kelimeler */}
        {results.failed.length > 0 && (
          <div>
            <h4 style={{ color: 'red', fontSize: '16px' }}>❌ Eklenemeyen kelimeler ({results.failed.length})</h4>
            <div style={{ maxHeight: '100px', overflowY: 'auto', fontSize: '14px' }}>
              {results.failed.map((item, index) => (
                <div key={index} style={{ padding: '4px', backgroundColor: '#ffebee' }}>
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

        {/* Real-time Progress Bar */}
        {renderProgressBar()}

        {/* Live Progress Kelimeler */}
        {renderLiveProgress()}

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