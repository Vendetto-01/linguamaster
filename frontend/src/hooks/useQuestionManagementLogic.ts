// frontend/src/hooks/useQuestionManagementLogic.ts
import { useState, useEffect, useCallback } from 'react';
import { questionsApi } from '../api/questionsApi';
import { 
  Question,
  QuestionFilterParams,
  QuestionSortParams,
  PaginationInfo,
  QuestionGenerationProgress
} from '../types/questions';

interface UseQuestionManagementLogicProps {
  refreshKey?: number;
}

export const useQuestionManagementLogic = ({ refreshKey }: UseQuestionManagementLogicProps) => {
  // State tanımlamaları
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNext: false,
    hasPrev: false
  });

  const [filters, setFilters] = useState<QuestionFilterParams>({});
  const [sort, setSort] = useState<QuestionSortParams>({
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAllOnPage, setSelectAllOnPage] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pageSize] = useState(10);
  const [progress, setProgress] = useState<QuestionGenerationProgress | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Soru listesini getirme fonksiyonu
  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await questionsApi.getQuestions({
        ...filters,
        page: pagination.currentPage,
        limit: pageSize,
        ...sort
      });
      setQuestions(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sorular yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.currentPage, pageSize, sort]);

  // Filtreleme işlemi
  const handleFilterChange = (newFilters: QuestionFilterParams) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Sıralama işlemi
  const handleSortChange = (newSort: QuestionSortParams) => {
    setSort(newSort);
  };

  // Sayfa değiştirme
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  // Soru seçme işlemleri
  const toggleSelectQuestion = useCallback((questionId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  }, []);

  // Toplu seçim işlemleri
  const toggleSelectAllOnPage = useCallback(() => {
    setSelectAllOnPage(prev => {
      if (prev) {
        setSelectedIds(new Set());
        return false;
      } else {
        setSelectedIds(new Set(questions.map(q => q.id)));
        return true;
      }
    });
  }, [questions]);

  // Soru güncelleme işlemi
  const handleUpdateQuestion = async (questionId: string, updates: Partial<Question>) => {
    try {
      await questionsApi.updateQuestion(questionId, updates);
      await fetchQuestions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Soru güncellenirken bir hata oluştu');
    }
  };

  // Soru silme işlemi
  const handleDeleteQuestion = async (questionId: string) => {
    try {
      await questionsApi.deleteQuestion(questionId);
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(questionId);
        return newSet;
      });
      await fetchQuestions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Soru silinirken bir hata oluştu');
    }
  };

  // Toplu soru silme işlemi
  const handleBulkDelete = async () => {
    try {
      await questionsApi.bulkDeleteQuestions(Array.from(selectedIds));
      setSelectedIds(new Set());
      await fetchQuestions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sorular silinirken bir hata oluştu');
    }
  };

  // Soru üretme işlemi
  const generateQuestions = async (wordIds: number[]) => {
    setIsGenerating(true);
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

    try {
      const generationResult = await questionsApi.generateQuestions({
        wordIds,
        maxConcurrent: 5,
        validateQuality: true
      });

      setProgress(prev => prev ? {
        ...prev,
        stage: 'complete',
        message: `${generationResult.results.successCount} soru başarıyla üretildi.`,
        successful: generationResult.results.successCount,
        failed: generationResult.results.failureCount
      } : null);

      await fetchQuestions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Soru üretimi sırasında bir hata oluştu');
      setProgress(prev => prev ? {
        ...prev,
        stage: 'error',
        message: 'Soru üretimi sırasında bir hata oluştu'
      } : null);
    } finally {
      setIsGenerating(false);
    }
  };

  // Yenileme ve temizleme işlemleri
  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions, refreshKey]);

  useEffect(() => {
    return () => {
      setProgress(null);
      setIsGenerating(false);
    };
  }, []);

  return {
    // State exports
    questions,
    isLoading,
    error,
    pagination,
    filters,
    sort,
    selectedIds,
    selectAllOnPage,
    editingQuestion,
    showEditModal,
    questionToDelete,
    showDeleteModal,
    progress,
    isGenerating,

    // Method exports
    fetchQuestions,
    handleFilterChange,
    handleSortChange,
    handlePageChange,
    toggleSelectQuestion,
    toggleSelectAllOnPage,
    handleUpdateQuestion,
    handleDeleteQuestion,
    handleBulkDelete,
    generateQuestions,
    
    // Modal control exports
    setEditingQuestion,
    setShowEditModal,
    setQuestionToDelete,
    setShowDeleteModal,
  };
};