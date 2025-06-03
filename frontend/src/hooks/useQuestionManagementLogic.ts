// frontend/src/hooks/useQuestionManagementLogic.ts
import { useState, useEffect, useCallback } from 'react';
import { questionsApi } from '../services/questionsApi';
import type {
  Question,
  PaginationInfo,
  QuestionFilterParams,
  QuestionSortParams,
  BulkActionResponse,
} from '../types/questions'; // Tipler questions.ts'den

const DEFAULT_PAGE_SIZE = 10;

interface UseQuestionManagementLogicProps {
  initialPageSize?: number;
  // Parent component'ten gelebilecek diğer başlangıç değerleri veya callback'ler
}

export const useQuestionManagementLogic = ({
  initialPageSize = DEFAULT_PAGE_SIZE,
}: UseQuestionManagementLogicProps = {}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [filters, setFilters] = useState<QuestionFilterParams>({
    searchTerm: '',
    difficulty: '',
    type: '',
    source: '',
    hasEmbedding: undefined,
  });
  const [sort, setSort] = useState<QuestionSortParams>({
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAllOnPage, setSelectAllOnPage] = useState(false);

  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const pageSize = initialPageSize;

  const fetchQuestions = useCallback(async (page: number = currentPage) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await questionsApi.getQuestions({
        page,
        limit: pageSize,
        ...filters,
        ...sort,
      });
      setQuestions(response.data || []);
      setPagination(response.pagination || null);
      setCurrentPage(page); // Sayfa başarıyla yüklendiğinde currentPage'i güncelle
      setSelectedIds(new Set()); // Her fetch sonrası sayfa seçimi sıfırlansın
      setSelectAllOnPage(false);
    } catch (err: any) {
      console.error('Soru yükleme hatası (hook):', err);
      setError(err.message || 'Sorular yüklenirken bir hata oluştu.');
      setQuestions([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, filters, sort]);

  useEffect(() => {
    fetchQuestions(1); // Filtreler veya sıralama değiştiğinde ilk sayfayı yükle
  }, [filters, sort]); // fetchQuestions'ı bağımlılıktan çıkardık, çünkü o zaten currentPage'e bağlı


  const handleFilterChange = useCallback(<K extends keyof QuestionFilterParams>(
    filterName: K,
    value: QuestionFilterParams[K]
  ) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    // setCurrentPage(1) useEffect'te filters değişince fetchQuestions(1)'i tetikleyecek
  }, []);

  const handleSortChange = useCallback((newSort: Partial<QuestionSortParams>) => {
    setSort(prev => ({ ...prev, ...newSort }));
    // setCurrentPage(1) useEffect'te sort değişince fetchQuestions(1)'i tetikleyecek
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage > 0 && (!pagination || newPage <= pagination.totalPages)) {
        fetchQuestions(newPage);
    }
  }, [fetchQuestions, pagination]);


  const toggleSelectQuestion = useCallback((questionId: string) => {
    setSelectedIds(prev => {
      const newSelectedIds = new Set(prev);
      if (newSelectedIds.has(questionId)) {
        newSelectedIds.delete(questionId);
      } else {
        newSelectedIds.add(questionId);
      }
      return newSelectedIds;
    });
    setSelectAllOnPage(false); // Tekil seçim "tümünü seç"i bozar
  }, []);

  const toggleSelectAllOnPage = useCallback(() => {
    if (selectAllOnPage) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(questions.map(q => q.id)));
    }
    setSelectAllOnPage(prev => !prev);
  }, [questions, selectAllOnPage]);


  const handleEdit = useCallback((question: Question) => {
    setEditingQuestion(question);
    setShowEditModal(true);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setShowEditModal(false);
    setEditingQuestion(null);
  }, []);

  const handleUpdate = useCallback(async (updatedQuestion: Question): Promise<boolean> => {
    if (!editingQuestion) return false;
    setIsLoading(true); // Veya spesifik bir 'isUpdating' state'i
    try {
      await questionsApi.updateQuestion(editingQuestion.id, updatedQuestion);
      setShowEditModal(false);
      setEditingQuestion(null);
      fetchQuestions(currentPage); // Güncel listeyi çek
      return true;
    } catch (err: any) {
      console.error('Soru güncelleme hatası:', err);
      setError(err.message || 'Soru güncellenirken bir hata oluştu.');
      // Form içinde hata gösterimi için bu hatayı yakalayıp göstermek daha iyi olabilir.
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [editingQuestion, currentPage, fetchQuestions]);


  const handleDelete = useCallback((question: Question) => {
    setQuestionToDelete(question);
    setShowDeleteModal(true);
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setQuestionToDelete(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!questionToDelete) return;
    setIsLoading(true); // Veya spesifik bir 'isDeleting' state'i
    try {
      await questionsApi.deleteQuestion(questionToDelete.id);
      setShowDeleteModal(false);
      setQuestionToDelete(null);
      fetchQuestions(currentPage); // Güncel listeyi çek
      setSelectedIds(prev => { // Silinen soruyu seçimden çıkar
          const newSelected = new Set(prev);
          newSelected.delete(questionToDelete.id);
          return newSelected;
      });
    } catch (err: any) {
      console.error('Soru silme hatası:', err);
      setError(err.message || 'Soru silinirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  }, [questionToDelete, currentPage, fetchQuestions]);

  const handleBulkDelete = useCallback(async (): Promise<BulkActionResponse | undefined> => {
    if (selectedIds.size === 0) {
      alert('Lütfen silmek için en az bir soru seçin.');
      return;
    }
    if (!window.confirm(`${selectedIds.size} soruyu kalıcı olarak silmek istediğinizden emin misiniz?`)) {
        return;
    }
    setIsLoading(true);
    try {
      const response = await questionsApi.bulkDeleteQuestions(Array.from(selectedIds));
      fetchQuestions(1); // Toplu silme sonrası ilk sayfaya dön ve listeyi yenile
      setSelectedIds(new Set());
      setSelectAllOnPage(false);
      alert(`${response.deletedCount} soru başarıyla silindi. ${response.failedCount > 0 ? `${response.failedCount} soru silinemedi.` : ''}`);
      return response;
    } catch (err: any) {
      console.error('Toplu soru silme hatası:', err);
      setError(err.message || 'Toplu silme işlemi sırasında bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedIds, fetchQuestions]);
  
  // Diğer toplu işlemler (örn: re-generate, change difficulty) buraya eklenebilir.

  return {
    questions,
    isLoading,
    error,
    pagination,
    currentPage,
    filters,
    sort,
    selectedIds,
    selectAllOnPage,
    editingQuestion,
    showEditModal,
    questionToDelete,
    showDeleteModal,
    pageSize,

    fetchQuestions: () => fetchQuestions(currentPage), // Mevcut sayfayı yenile
    handleFilterChange,
    handleSortChange,
    handlePageChange,
    toggleSelectQuestion,
    toggleSelectAllOnPage,
    handleEdit,
    handleCloseEditModal,
    handleUpdate,
    handleDelete,
    handleCloseDeleteModal,
    handleConfirmDelete,
    handleBulkDelete,
  };
};