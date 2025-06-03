// frontend/src/hooks/useQuestionGenerationLogic.ts
import { useState, useCallback } from 'react';
import { questionsApi } from '../api/questionsApi';
import { QuestionGenerationProgress } from '../types/questions';

export const useQuestionGenerationLogic = () => {
  const [progress, setProgress] = useState<QuestionGenerationProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateQuestions = useCallback(async (wordIds: number[]) => {
    if (!wordIds.length) {
      setError('Kelime seçilmedi');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgress({
      current: 0,
      total: wordIds.length,
      percentage: 0,
      stage: 'starting',
      message: 'Soru üretimi başlatılıyor...',
      successful: 0,
      failed: 0,
      timeElapsed: 0
    });

    const startTime = Date.now();

    try {
      const generationResult = await questionsApi.generateQuestions({
        wordIds,
        maxConcurrent: 5,
        validateQuality: true
      });

      const timeElapsed = (Date.now() - startTime) / 1000;

      setProgress(prev => prev ? {
        ...prev,
        stage: 'complete',
        message: `${generationResult.results.successCount} soru başarıyla üretildi.`,
        successful: generationResult.results.successCount,
        failed: generationResult.results.failureCount,
        timeElapsed,
        percentage: 100
      } : null);

      return generationResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Soru üretimi sırasında bir hata oluştu';
      setError(errorMessage);
      setProgress(prev => prev ? {
        ...prev,
        stage: 'error',
        message: errorMessage,
        timeElapsed: (Date.now() - startTime) / 1000
      } : null);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const resetProgress = useCallback(() => {
    setProgress(null);
    setError(null);
    setIsGenerating(false);
  }, []);

  return {
    progress,
    error,
    isGenerating,
    generateQuestions,
    resetProgress
  };
};