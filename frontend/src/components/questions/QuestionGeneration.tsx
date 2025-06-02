// frontend/src/components/questions/QuestionGeneration.tsx - REFACTOR EDİLMİŞ VERSİYON
import React, { useState } from 'react';
import Button from '../shared/Button';
import Card from '../shared/Card';
import ProgressDisplay from '../shared/ProgressDisplay';
import ResultDisplay from '../shared/ResultDisplay';
import { QuestionGenerationProps } from '../../types/questions';
import { questionsApi } from '../../services/questionsApi';

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

      const wordIds = selectedWords.map(word => word.id);

      setProgress(prev => prev ? {
        ...prev,
        stage: 'generating',
        message: 'AI ile sorular oluşturuluyor...'
      } : null);

      const generationResult = await questionsApi.generateQuestions(wordIds);

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

  const handleNewGeneration = () => {
    setResult(null);
    setProgress(null);
    setError('');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2>🤖 AI Soru Oluşturma</h2>
        <Button onClick={onBackToSelection} variant="secondary">
          ← Kelime Seçimine Dön
        </Button>
      </div>

      {/* Selected Words Summary */}
      <Card variant="success" style={{ marginBottom: '20px' }}>
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

        <Card variant="info" style={{
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
        </Card>
      </Card>

      {/* Progress Display */}
      {progress && (
        <ProgressDisplay
          progress={progress}
          title="AI Soru Oluşturma Süreci"
          showStats={true}
        />
      )}

      {/* Error Display */}
      {error && (
        <Card variant="danger" style={{ marginBottom: '20px' }}>
          ❌ {error}
        </Card>
      )}

      {/* Result Display */}
      {result && (
        <ResultDisplay
          result={{
            message: result.message,
            summary: result.summary,
            results: result.results,
            nextStep: '🎯 Sonraki Adım: Oluşturulan soruları "Soru Yönetimi" sekmesinden inceleyebilir ve düzenleyebilirsiniz.'
          }}
          variant="success"
          showDetails={true}
        />
      )}

      {/* Action Buttons */}
      <div style={{ 
        display: 'flex', 
        gap: '15px', 
        justifyContent: 'center',
        marginTop: '20px'
      }}>
        {!isGenerating && !result && (
          <Button
            onClick={generateQuestions}
            disabled={selectedWords.length === 0}
            variant={selectedWords.length > 0 ? 'success' : 'secondary'}
            size="large"
          >
            🚀 Soru Oluşturmaya Başla
          </Button>
        )}

        {error && !isGenerating && (
          <Button
            onClick={handleRetry}
            variant="warning"
            size="large"
          >
            🔄 Tekrar Dene
          </Button>
        )}

        {result && (
          <Button
            onClick={handleNewGeneration}
            variant="primary"
            size="large"
          >
            🔄 Yeni Soru Oluştur
          </Button>
        )}
      </div>

      {/* Info Box */}
      <Card variant="info" style={{ marginTop: '20px' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>ℹ️ AI Soru Oluşturma Hakkında</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minWidth(250px, 1fr))', gap: '15px' }}>
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
      </Card>
    </div>
  );
};

export default QuestionGeneration;