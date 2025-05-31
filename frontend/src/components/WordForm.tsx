// frontend/src/components/WordForm.tsx
import React, { useState } from 'react';
import { wordApi } from '../services/api';
import { AddWordResponse, WordFormProps } from '../types';

const WordForm: React.FC<WordFormProps> = ({ onWordsAdded }) => {
  const [words, setWords] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AddWordResponse | null>(null);
  const [error, setError] = useState<string>('');

  // Kelime validasyonu
  const validateWords = (input: string) => {
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

    return { isValid: true, error: '', words: wordList };
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

    try {
      // API çağrısı
      const response = await wordApi.addWords(validation.words);
      
      setResult(response);
      onWordsAdded();
      
      // Başarılı olduysa formu temizle
      if (response.summary.success > 0) {
        setWords('');
      }

    } catch (err) {
      // Hata yakalaması
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Beklenmeyen bir hata oluştu');
      }
    } finally {
      setIsLoading(false);
    }
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
          <p style={{ color: 'green' }}><strong>✅ Eklendi:</strong> {summary.success}</p>
          <p style={{ color: 'orange' }}><strong>⚠️ Zaten mevcut:</strong> {summary.duplicate}</p>
          <p style={{ color: 'red' }}><strong>❌ Başarısız:</strong> {summary.failed}</p>
        </div>

        {/* Başarılı kelimeler */}
        {results.success.length > 0 && (
          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ color: 'green' }}>✅ Eklenen kelimeler</h4>
            <div style={{ 
              maxHeight: '150px', 
              overflowY: 'auto', 
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '3px',
              padding: '5px'
            }}>
              {results.success.slice(0, 10).map((item, index) => (
                <div key={index} style={{ 
                  padding: '5px', 
                  borderBottom: '1px solid #eee' 
                }}>
                  <strong>{item.word}</strong> ({item.partOfSpeech})
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

        {/* Başarısız kelimeler */}
        {results.failed.length > 0 && (
          <div>
            <h4 style={{ color: 'red' }}>❌ Eklenemeyen kelimeler</h4>
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
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2>📚 Kelime Ekle</h2>
      
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
            Maksimum 50 kelime ekleyebilirsiniz
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
          {isLoading ? '🔄 Ekleniyor...' : '➕ Kelimeleri Ekle'}
        </button>
      </form>

      {renderResults()}
    </div>
  );
};

export default WordForm;