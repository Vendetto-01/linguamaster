// frontend/src/components/WordForm.tsx
import React, { useState } from 'react';
import { wordApi } from '../services/api';
import { BulkAddResponse, WordFormProps, ValidationResult, StreamEvent } from '../types';

const WordForm: React.FC<WordFormProps> = ({ onWordsAdded }) => {
  const [words, setWords] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [useRealTime, setUseRealTime] = useState(false);
  const [result, setResult] = useState<BulkAddResponse | null>(null);
  const [error, setError] = useState<string>('');
  const [streamProgress, setStreamProgress] = useState<{
    current: number;
    total: number;
    currentWord: string;
    summary: any;
  } | null>(null);

  // Kelime validasyonu
  const validateWords = (input: string): ValidationResult => {
    const wordList = input
      .split(/[,\n\s]+/)
      .map(word => word.trim().toLowerCase())
      .filter(word => word.length > 0);

    if (wordList.length === 0) {
      return { isValid: false, error: 'En az bir kelime girin', words: [] };
    }

    if (wordList.length > 50) {
      return { isValid: false, error: 'Maksimum 50 kelime ekleyebilirsiniz', words: [] };
    }

    // İngilizce karakter kontrolü
    const invalidWords = wordList.filter(word => !/^[a-zA-Z\s-']+$/.test(word));
    if (invalidWords.length > 0) {
      return { 
        isValid: false, 
        error: `Geçersiz karakterler içeren kelimeler: ${invalidWords.join(', ')}`, 
        words: [] 
      };
    }

    // Kelime uzunluğu kontrolü
    const tooLongWords = wordList.filter(word => word.length > 50);
    if (tooLongWords.length > 0) {
      return { 
        isValid: false, 
        error: `Çok uzun kelimeler (>50 karakter): ${tooLongWords.join(', ')}`, 
        words: [] 
      };
    }

    return { isValid: true, error: '', words: wordList };
  };

  // Normal bulk add
  const handleNormalSubmit = async (wordList: string[]) => {
    try {
      const response = await wordApi.addWords(wordList);
      setResult(response);
      onWordsAdded(response);
      
      // Başarılı olduysa formu temizle
      if (response.summary.queued > 0) {
        setWords('');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Beklenmeyen bir hata oluştu');
      }
    }
  };

  // Real-time stream submit
  const handleStreamSubmit = async (wordList: string[]) => {
    setStreamProgress({ current: 0, total: wordList.length, currentWord: '', summary: null });

    try {
      await wordApi.addWordsStreamPost(
        wordList,
        // onProgress
        (data: StreamEvent) => {
          if (data.type === 'progress') {
            setStreamProgress(prev => prev ? {
              ...prev,
              current: data.current,
              currentWord: data.currentWord
            } : null);
          }
        },
        // onComplete
        (data: StreamEvent) => {
          if (data.type === 'complete') {
            setStreamProgress(prev => prev ? {
              ...prev,
              current: data.results.total,
              summary: data.summary
            } : null);
            
            // Response'u BulkAddResponse formatına dönüştür
            const response: BulkAddResponse = {
              message: data.message,
              results: data.results,
              summary: data.summary,
              batchId: data.batchId,
              nextStep: 'Background processing ile Gemini API\'den veriler çekilecek'
            };
            
            setResult(response);
            onWordsAdded(response);
            setWords('');
          }
        },
        // onError
        (errorMsg: string) => {
          setError(errorMsg);
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Stream hatası');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasyon
    const validation = validateWords(words);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    setIsLoading(true);
    setError('');
    setResult(null);
    setStreamProgress(null);

    try {
      if (useRealTime) {
        await handleStreamSubmit(validation.words);
      } else {
        await handleNormalSubmit(validation.words);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderStreamProgress = () => {
    if (!streamProgress) return null;

    const percentage = (streamProgress.current / streamProgress.total) * 100;

    return (
      <div style={{
        backgroundColor: '#e7f3ff',
        border: '1px solid #b8daff',
        borderRadius: '5px',
        padding: '15px',
        marginTop: '15px'
      }}>
        <h4 style={{ color: '#004085', marginTop: 0 }}>📡 Real-time Progress</h4>
        
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span>İşlenen: {streamProgress.current}/{streamProgress.total}</span>
            <span>{percentage.toFixed(1)}%</span>
          </div>
          
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#dee2e6',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${percentage}%`,
              height: '100%',
              backgroundColor: '#007bff',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {streamProgress.currentWord && (
          <div style={{ fontSize: '14px', color: '#6c757d' }}>
            Şu an işleniyor: <strong>{streamProgress.currentWord}</strong>
          </div>
        )}

        {streamProgress.summary && (
          <div style={{ 
            marginTop: '10px',
            padding: '10px',
            backgroundColor: '#d1ecf1',
            borderRadius: '3px'
          }}>
            <strong>Tamamlandı!</strong>
            <br />
            ✅ Queue'ya eklendi: {streamProgress.summary.queued}
            <br />
            ⚠️ Duplicate: {streamProgress.summary.duplicate}
            <br />
            ❌ Başarısız: {streamProgress.summary.failed}
          </div>
        )}
      </div>
    );
  };

  const renderResults = () => {
    if (!result) return null;

    const { summary, results } = result;

    return (
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        border: '1px solid #ddd', 
        borderRadius: '5px' 
      }}>
        <h3>📊 İşlem Sonucu</h3>
        
        {/* Özet */}
        <div style={{ 
          marginBottom: '15px', 
          padding: '10px', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '3px' 
        }}>
          <p><strong>📚 Toplam:</strong> {summary.total}</p>
          <p style={{ color: 'green' }}><strong>✅ Queue'ya eklendi:</strong> {summary.queued}</p>
          <p style={{ color: 'orange' }}><strong>⚠️ Zaten mevcut:</strong> {summary.duplicate}</p>
          <p style={{ color: 'red' }}><strong>❌ Başarısız:</strong> {summary.failed}</p>
        </div>

        {/* Batch ID */}
        <div style={{ 
          marginBottom: '15px',
          padding: '10px',
          backgroundColor: '#e9ecef',
          borderRadius: '3px'
        }}>
          <strong>🆔 Batch ID:</strong> 
          <code style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '2px 6px', 
            borderRadius: '3px',
            fontSize: '12px',
            marginLeft: '5px'
          }}>
            {result.batchId}
          </code>
        </div>

        {/* Queue'ya eklenen kelimeler */}
        {results.queued.length > 0 && (
          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ color: 'green' }}>✅ Queue'ya eklenen kelimeler</h4>
            <div style={{ 
              maxHeight: '150px', 
              overflowY: 'auto', 
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '3px',
              padding: '5px'
            }}>
              {results.queued.slice(0, 10).map((item, index) => (
                <div key={index} style={{ 
                  padding: '5px', 
                  borderBottom: '1px solid #eee' 
                }}>
                  <strong>{item.word}</strong>
                  <small style={{ color: '#666', marginLeft: '10px' }}>
                    (Batch: {item.batchId.slice(0, 8)}...)
                  </small>
                </div>
              ))}
              {results.queued.length > 10 && (
                <p style={{ fontStyle: 'italic', color: '#666' }}>
                  ... ve {results.queued.length - 10} kelime daha
                </p>
              )}
            </div>
          </div>
        )}

        {/* Başarısız kelimeler */}
        {results.failed.length > 0 && (
          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ color: 'red' }}>❌ Queue'ya eklenemeyen kelimeler</h4>
            <div style={{ 
              maxHeight: '100px', 
              overflowY: 'auto', 
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '3px',
              padding: '5px'
            }}>
              {results.failed.map((item, index) => (
                <div key={index} style={{ padding: '3px' }}>
                  <strong>{item.word}</strong> - {item.reason}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Duplicate kelimeler */}
        {results.duplicate.length > 0 && (
          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ color: 'orange' }}>⚠️ Zaten queue'da olan kelimeler</h4>
            <div style={{ 
              maxHeight: '100px', 
              overflowY: 'auto', 
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '3px',
              padding: '5px'
            }}>
              {results.duplicate.map((item, index) => (
                <div key={index} style={{ padding: '3px' }}>
                  <strong>{item.word}</strong> - {item.reason}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sonraki adım bilgisi */}
        <div style={{
          backgroundColor: '#cce5ff',
          padding: '10px',
          borderRadius: '3px',
          fontSize: '14px',
          color: '#0066cc'
        }}>
          <strong>🤖 Sonraki Adım:</strong> {result.nextStep}
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2>📚 Manuel Kelime Ekleme</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Kelimeler queue'ya eklenir ve arka planda Gemini AI ile işlenir
      </p>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="words" style={{ 
            display: 'block', 
            marginBottom: '5px', 
            fontWeight: 'bold' 
          }}>
            Kelimeler (virgül, boşluk veya yeni satırla ayırın)
          </label>
          <textarea
            id="words"
            value={words}
            onChange={(e) => setWords(e.target.value)}
            placeholder="Örnek: apple, book, computer&#10;house&#10;beautiful"
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
            Maksimum 50 kelime • Sadece İngilizce karakterler
          </small>
        </div>

        {/* Real-time Toggle */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center',
            cursor: 'pointer',
            fontSize: '14px'
          }}>
            <input
              type="checkbox"
              checked={useRealTime}
              onChange={(e) => setUseRealTime(e.target.checked)}
              disabled={isLoading}
              style={{ marginRight: '8px' }}
            />
            📡 Real-time progress göster (yavaş ama detaylı)
          </label>
        </div>

        {error && (
          <div style={{ 
            color: '#dc3545', 
            backgroundColor: '#f8d7da', 
            padding: '10px', 
            borderRadius: '5px', 
            marginBottom: '15px',
            border: '1px solid #f5c6cb'
          }}>
            ❌ {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !words.trim()}
          style={{
            backgroundColor: isLoading ? '#6c757d' : '#007bff',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            width: '100%'
          }}
        >
          {isLoading ? 
            (useRealTime ? '📡 Stream ile ekleniyor...' : '🔄 Queue\'ya ekleniyor...') : 
            '➕ Kelimeleri Queue\'ya Ekle'
          }
        </button>
      </form>

      {/* Stream Progress */}
      {renderStreamProgress()}

      {/* Results */}
      {renderResults()}

      {/* Info Box */}
      <div style={{
        marginTop: '20px',
        backgroundColor: '#e9ecef',
        padding: '15px',
        borderRadius: '5px',
        fontSize: '14px',
        color: '#495057'
      }}>
        <h4 style={{ margin: '0 0 10px 0' }}>ℹ️ Yeni Sistem Nasıl Çalışır?</h4>
        <ol style={{ margin: 0, paddingLeft: '20px' }}>
          <li><strong>Queue'ya Ekleme:</strong> Kelimeler önce queue'ya eklenir</li>
          <li><strong>AI Processing:</strong> Background worker Gemini AI'dan her kelime için:
            <ul style={{ marginTop: '5px' }}>
              <li>Türkçe karşılıkları</li>
              <li>Kelime türleri (noun, verb, etc.)</li>
              <li>Zorluk seviyeleri (beginner/intermediate/advanced)</li>
              <li>İngilizce örnek cümleler</li>
            </ul>
          </li>
          <li><strong>Veritabanı:</strong> İşlenen kelimeler ana veritabanına kaydedilir</li>
          <li><strong>Quiz Hazır:</strong> Kelimeler quiz için kullanıma hazır hale gelir</li>
        </ol>
      </div>
    </div>
  );
};

export default WordForm;