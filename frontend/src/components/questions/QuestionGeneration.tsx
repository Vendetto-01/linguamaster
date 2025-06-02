// frontend/src/components/questions/QuestionGeneration.tsx - SORU OLUŞTURMA KOMPONENTİ
import React, { useState } from 'react';
import { QuestionGenerationProps } from '../../types/questions';

interface GenerationProgress {
  current: number;
  total: number;
  percentage: number;
  currentWord?: string;
  stage: 'starting' | 'generating' | 'saving' | 'complete' | 'error';
  message: string;
  successful: number;
  failed: number;
  timeElapsed: number;
}

interface GenerationResult {
  message: string;
  results: {
    successful: Array<{
      word: string;
      wordId: number;
      questionId: number;
    }>;
    failed: Array<{
      word: string;
      wordId: number;
      reason: string;
    }>;
    successCount: number;
    failureCount: number;
    total: number;
  };
  summary: {
    generated: number;
    failed: number;
    total: number;
  };
}

const QuestionGeneration: React.FC<QuestionGenerationProps> = ({ 
  selectedWords, 
  onQuestionsGenerated, 
  onBackToSelection 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string>('');

  const generateQuestions = async () => {
    if (selectedWords.length === 0) {
      setError('Lütfen önce kelime seçin');
      return;
    }

    setIsGenerating(true);
    setError('');
    setResult(null);
    
    const startTime = Date.now();

    try {
      // Progress başlat
      setProgress({
        current: 0,
        total: selectedWords.length,
        percentage: 0,
        stage: 'starting',
        message: 'Soru oluşturma başlatılıyor...',
        successful: 0,
        failed: 0,
        timeElapsed: 0
      });

      console.log(`🤖 ${selectedWords.length} kelime için soru oluşturma başlatılıyor...`);

      // Word ID'lerini topla
      const wordIds = selectedWords.map(word => word.id);

      setProgress(prev => prev ? {
        ...prev,
        stage: 'generating',
        message: 'AI ile sorular oluşturuluyor...'
      } : null);

      // Backend'e soru oluşturma isteği gönder
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/words/questions/generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ wordIds })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Soru oluşturma başarısız');
      }

      const generationResult: GenerationResult = await response.json();

      setProgress(prev => prev ? {
        ...prev,
        stage: 'complete',
        current: selectedWords.length,
        percentage: 100,
        message: 'Soru oluşturma tamamlandı!',
        successful: generationResult.results.successCount,
        failed: generationResult.results.failureCount,
        timeElapsed: Math.round((Date.now() - startTime) / 1000)
      } : null);

      setResult(generationResult);
      
      console.log(`✅ Soru oluşturma tamamlandı: ${generationResult.summary.generated} başarılı`);
      
      // Parent'a bildir
      onQuestionsGenerated(generationResult.summary.generated);

    } catch (err) {
      console.error('❌ Soru oluşturma hatası:', err);
      
      setError(err instanceof Error ? err.message : 'Soru oluşturma hatası');
      
      setProgress(prev => prev ? {
        ...prev,
        stage: 'error',
        message: 'Soru oluşturma başarısız!',
        timeElapsed: Math.round((Date.now() - startTime) / 1000)
      } : null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRetry = () => {
    setResult(null);
    setError('');
    setProgress(null);
    generateQuestions();
  };

  const renderProgress = () => {
    if (!progress) return null;

    return (
      <div style={{
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#495057' }}>
          🤖 AI Soru Oluşturma Süreci
        </h4>
        
        <div style={{ marginBottom: '15px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '14px', color: '#666' }}>{progress.message}</span>
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{progress.percentage}%</span>
          </div>
          
          <div style={{
            width: '100%',
            height: '12px',
            backgroundColor: '#e9ecef',
            borderRadius: '6px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progress.percentage}%`,
              height: '100%',
              backgroundColor: progress.stage === 'error' ? '#dc3545' : 
                             progress.stage === 'complete' ? '#28a745' : '#007bff',
              transition: 'width 0.3s ease',
              backgroundImage: progress.stage === 'generating' ? 
                'linear-gradient(45deg, rgba(255,255,255,.2) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.2) 50%, rgba(255,255,255,.2) 75%, transparent 75%, transparent)' : 'none',
              backgroundSize: '20px 20px',
              animation: progress.stage === 'generating' ? 'progress-bar-stripes 1s linear infinite' : 'none'
            }} />
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
          gap: '15px',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#007bff' }}>
              {progress.current} / {progress.total}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>İşlenen</div>
          </div>
          
          <div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#28a745' }}>
              {progress.successful}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Başarılı</div>
          </div>
          
          <div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc3545' }}>
              {progress.failed}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Başarısız</div>
          </div>
          
          <div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#6c757d' }}>
              {progress.timeElapsed}s
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Süre</div>
          </div>
        </div>

        {progress.currentWord && (
          <div style={{
            marginTop: '15px',
            padding: '10px',
            backgroundColor: '#cce5ff',
            borderRadius: '5px',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            <strong>Şu an işleniyor:</strong> {progress.currentWord}
          </div>
        )}

        <style>{`
          @keyframes progress-bar-stripes {
            0% { background-position: 20px 0; }
            100% { background-position: 0 0; }
          }
        `}</style>
      </div>
    );
  };

  const renderResult = () => {
    if (!result) return null;

    return (
      <div style={{
        backgroundColor: '#d4edda',
        border: '1px solid #c3e6cb',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#155724' }}>
          ✅ Soru Oluşturma Tamamlandı!
        </h4>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '15px',
          marginBottom: '20px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#28a745' }}>
              {result.summary.generated}
            </div>
            <div style={{ fontSize: '14px', color: '#155724' }}>Oluşturulan Soru</div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#dc3545' }}>
              {result.summary.failed}
            </div>
            <div style={{ fontSize: '14px', color: '#155724' }}>Başarısız</div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#007bff' }}>
              {result.summary.total}
            </div>
            <div style={{ fontSize: '14px', color: '#155724' }}>Toplam Kelime</div>
          </div>
        </div>

        <div style={{ fontSize: '14px', color: '#155724', marginBottom: '15px' }}>
          <strong>{result.message}</strong>
        </div>

        {/* Başarılı kelimeler */}
        {result.results.successful.length > 0 && (
          <div style={{ marginBottom: '15px' }}>
            <h5 style={{ color: '#155724', margin: '0 0 8px 0' }}>
              ✅ Başarılı Kelimeler ({result.results.successful.length}):
            </h5>
            <div style={{ 
              maxHeight: '120px', 
              overflowY: 'auto',
              backgroundColor: '#f8f9fa',
              padding: '8px',
              borderRadius: '4px',
              fontSize: '13px'
            }}>
              {result.results.successful.map((item, index) => (
                <span key={index} style={{ 
                  display: 'inline-block',
                  margin: '2px',
                  padding: '2px 6px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  borderRadius: '3px',
                  fontSize: '12px'
                }}>
                  {item.word}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Başarısız kelimeler */}
        {result.results.failed.length > 0 && (
          <div style={{ marginBottom: '15px' }}>
            <h5 style={{ color: '#721c24', margin: '0 0 8px 0' }}>
              ❌ Başarısız Kelimeler ({result.results.failed.length}):
            </h5>
            <div style={{ 
              maxHeight: '120px', 
              overflowY: 'auto',
              backgroundColor: '#f8f9fa',
              padding: '8px',
              borderRadius: '4px',
              fontSize: '13px'
            }}>
              {result.results.failed.map((item, index) => (
                <div key={index} style={{ 
                  margin: '4px 0',
                  padding: '4px 8px',
                  backgroundColor: '#f8d7da',
                  borderRadius: '3px',
                  fontSize: '12px'
                }}>
                  <strong>{item.word}:</strong> {item.reason}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{
          backgroundColor: '#cce5ff',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '14px',
          textAlign: 'center'
        }}>
          🎯 <strong>Sonraki Adım:</strong> Oluşturulan soruları "Soru Yönetimi" sekmesinden inceleyebilir ve düzenleyebilirsiniz.
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2>🤖 AI Soru Oluşturma</h2>
        <button
          onClick={onBackToSelection}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ← Kelime Seçimine Dön
        </button>
      </div>

      {/* Seçili Kelimeler Özeti */}
      <div style={{
        backgroundColor: '#e8f5e8',
        border: '1px solid #c3e6cb',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#155724' }}>
          📋 Seçili Kelimeler ({selectedWords.length})
        </h3>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '10px',
          marginBottom: '15px'
        }}>
          {selectedWords.slice(0, 8).map((word, index) => (
            <div key={word.id} style={{
              backgroundColor: '#fff',
              padding: '8px 12px',
              borderRadius: '5px',
              border: '1px solid #c3e6cb',
              fontSize: '14px'
            }}>
              <strong>{word.word}</strong>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {word.part_of_speech} • {word.final_difficulty}
              </div>
            </div>
          ))}
        </div>
        
        {selectedWords.length > 8 && (
          <div style={{ fontSize: '14px', color: '#155724', textAlign: 'center' }}>
            ... ve {selectedWords.length - 8} kelime daha
          </div>
        )}

        <div style={{
          backgroundColor: '#cce5ff',
          padding: '10px',
          borderRadius: '5px',
          marginTop: '15px',
          fontSize: '14px'
        }}>
          <strong>🎯 İşlem Detayları:</strong>
          <ul style={{ margin: '8px 0', paddingLeft: '20px', fontSize: '13px' }}>
            <li>Her kelime için 1 adet 4 seçenekli test sorusu oluşturulacak</li>
            <li>Sorular kelimenin example cümlesine dayalı olacak</li>
            <li>Zorluk seviyesi kelimeyle uyumlu olacak</li>
            <li>İşlem yaklaşık {Math.ceil(selectedWords.length * 1.5)} dakika sürer</li>
          </ul>
        </div>
      </div>

      {/* Progress */}
      {renderProgress()}

      {/* Error */}
      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '15px',
          borderRadius: '5px',
          marginBottom: '20px',
          border: '1px solid #f5c6cb'
        }}>
          ❌ {error}
        </div>
      )}

      {/* Result */}
      {renderResult()}

      {/* Action Buttons */}
      <div style={{ 
        display: 'flex', 
        gap: '15px', 
        justifyContent: 'center',
        marginTop: '20px'
      }}>
        {!isGenerating && !result && (
          <button
            onClick={generateQuestions}
            disabled={selectedWords.length === 0}
            style={{
              padding: '12px 24px',
              backgroundColor: selectedWords.length > 0 ? '#28a745' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: selectedWords.length > 0 ? 'pointer' : 'not-allowed',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            🚀 Soru Oluşturmaya Başla
          </button>
        )}

        {error && !isGenerating && (
          <button
            onClick={handleRetry}
            style={{
              padding: '12px 24px',
              backgroundColor: '#ffc107',
              color: '#212529',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            🔄 Tekrar Dene
          </button>
        )}

        {result && (
          <button
            onClick={() => {
              setResult(null);
              setProgress(null);
              setError('');
            }}
            style={{
              padding: '12px 24px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            🔄 Yeni Soru Oluştur
          </button>
        )}
      </div>

      {/* Bilgi Kutusu */}
      <div style={{
        backgroundColor: '#e9ecef',
        padding: '15px',
        borderRadius: '5px',
        marginTop: '20px',
        fontSize: '14px',
        color: '#495057'
      }}>
        <h4 style={{ margin: '0 0 10px 0' }}>ℹ️ AI Soru Oluşturma Hakkında</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <div>
            <strong>🤖 AI Teknolojisi:</strong>
            <ul style={{ margin: '5px 0', paddingLeft: '15px', fontSize: '13px' }}>
              <li>Google Gemini 2.0 Flash model kullanılır</li>
              <li>Context-aware soru oluşturma</li>
              <li>Akademik kalitede çeldiriciler</li>
              <li>Otomatik zorluk seviyesi uyumluluğu</li>
            </ul>
          </div>
          <div>
            <strong>⚡ İşlem Süreci:</strong>
            <ul style={{ margin: '5px 0', paddingLeft: '15px', fontSize: '13px' }}>
              <li>Rate limiting: 1 saniye/kelime</li>
              <li>Otomatik hata yönetimi</li>
              <li>Duplicate kontrol yapılır</li>
              <li>Soru kalitesi doğrulanır</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionGeneration;