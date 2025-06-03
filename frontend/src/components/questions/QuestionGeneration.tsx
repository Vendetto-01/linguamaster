// frontend/src/components/questions/QuestionGeneration.tsx
import React, { useState, useCallback } from 'react';
import Button from '../shared/Button';
import Card from '../shared/Card';
import ProgressDisplay from '../shared/ProgressDisplay';
// import ResultDisplay from '../shared/ResultDisplay'; // Commented out for now
import type {
  Word, // Added Word for selectedWords
  Question, // Added Question for onQuestionsGenerated
  QuestionGenerationComponentProps,
  QuestionGenerationProgress,
  GenerateQuestionsResponse as QuestionGenerationResponse // Aliased to match usage
} from '../../types'; // Corrected path
import { questionApi as questionsApi } from '../../services/api'; // Corrected path and aliased for consistency

const QuestionGeneration: React.FC<QuestionGenerationComponentProps> = ({
  selectedWords,
  onQuestionsGenerated,
  onBackToSelection
}) => {
  const [progress, setProgress] = useState<QuestionGenerationProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QuestionGenerationResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const startGeneration = useCallback(async () => {
    if (!selectedWords.length) {
      setError('Lütfen en az bir kelime seçin');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);
    setProgress({
      current: 0,
      total: selectedWords.length,
      percentage: 0,
      stage: 'starting',
      message: 'Soru üretimi başlatılıyor...',
      successful: 0,
      failed: 0,
      timeElapsed: 0
    });

    const startTime = Date.now();

    try {
      const payload = {
        word_ids: selectedWords.map(word => word.id),
        generation_config: { // Moved extra params into generation_config
          maxConcurrent: 5,
          validateQuality: true
        }
      };
      const generationResult: QuestionGenerationResponse = await questionsApi.generateQuestions(payload);

      setResult(generationResult);
      // Pass the actual questions array, or an empty array if undefined
      onQuestionsGenerated(generationResult.questions || []);

      setProgress(prev => prev ? {
        ...prev,
        stage: 'complete',
        message: `${generationResult.generated_count} soru başarıyla üretildi.`, // Use generated_count
        successful: generationResult.generated_count, // Use generated_count
        failed: generationResult.failed_count, // Use failed_count
        timeElapsed: (Date.now() - startTime) / 1000,
        percentage: 100
      } : null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Soru üretimi sırasında bir hata oluştu';
      setError(errorMessage);
      setProgress(prev => prev ? {
        ...prev,
        stage: 'error',
        message: errorMessage,
        timeElapsed: (Date.now() - startTime) / 1000
      } : null);
    } finally {
      setIsGenerating(false);
    }
  }, [selectedWords, onQuestionsGenerated]);

  return (
    <Card>
      <div style={{ padding: '20px' }}>
        <h3>Soru Üretimi</h3>
        
        <div style={{ marginBottom: '20px' }}>
          <p>Seçilen kelime sayısı: <strong>{selectedWords.length}</strong></p>
          <div style={{ display: 'flex', gap: '10px' }}>
            {selectedWords.slice(0, 5).map(word => (
              <span key={word.id} style={{
                backgroundColor: '#e9ecef',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '14px'
              }}>
                {word.word}
              </span>
            ))}
            {selectedWords.length > 5 && (
              <span style={{
                backgroundColor: '#e9ecef',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '14px'
              }}>
                +{selectedWords.length - 5} diğer
              </span>
            )}
          </div>
        </div>

        {progress && <ProgressDisplay progress={progress} />}
        
        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        {/* {result && <ResultDisplay result={result} />} */} {/* Commented out for now */}

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <Button
            onClick={startGeneration}
            disabled={isGenerating || !selectedWords.length}
            variant="primary"
          >
            {isGenerating ? 'Üretiliyor...' : 'Soruları Üret'}
          </Button>
          
          <Button
            onClick={onBackToSelection}
            disabled={isGenerating}
            variant="secondary"
          >
            Kelime Seçimine Dön
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default QuestionGeneration;