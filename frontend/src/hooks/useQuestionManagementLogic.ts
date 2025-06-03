// frontend/src/hooks/useQuestionManagementLogic.ts
import { useState, useEffect, useCallback } from 'react';
import { questionApi } from '../services/api';
import type { Question, QuestionsResponse, QuestionFilters } from '../types';

interface UseQuestionManagementLogicProps {
  refreshKey?: number;
}

export const useQuestionManagementLogic = ({ refreshKey }: UseQuestionManagementLogicProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [pagination, setPagination] = useState<QuestionsResponse['pagination'] | null>(null);
  const [filters, setFilters] = useState<QuestionFilters>({ page: 1, limit: 10 });
  // Sort state can be part of filters if QuestionFilters includes sortBy and sortOrder
  // const [sort, setSort] = useState<any>({}); // Define a proper sort type if needed

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectAllOnPage, setSelectAllOnPage] = useState(false);

  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchQuestions = useCallback(async (currentFilters?: QuestionFilters) => {
    setIsLoading(true);
    setError('');
    try {
      const queryFilters = currentFilters || filters;
      const data = await questionApi.getQuestions(queryFilters);
      setQuestions(data.questions || []);
      setPagination(data.pagination || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch questions';
      setError(errorMessage);
      setQuestions([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions, refreshKey]); // refreshKey dependency added

  const handleFilterChange = (newFilters: Partial<QuestionFilters>) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 }; // Reset to page 1 on filter change
    setFilters(updatedFilters);
    // fetchQuestions will be called by useEffect due to filters dependency change if fetchQuestions depends on filters
    // Or call directly: fetchQuestions(updatedFilters);
  };

  const handleSortChange = (newSort: Partial<QuestionFilters>) => { // Assuming sort is part of filters
    const updatedFilters = { ...filters, ...newSort, page: 1 };
    setFilters(updatedFilters);
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && (!pagination || page <= pagination.totalPages)) {
      const updatedFilters = { ...filters, page };
      setFilters(updatedFilters);
      // fetchQuestions(updatedFilters); // Call directly or let useEffect handle it
    }
  };

  const toggleSelectQuestion = (id: number) => {
    const newSelectedIds = new Set(selectedIds);
    if (newSelectedIds.has(id)) {
      newSelectedIds.delete(id);
    } else {
      newSelectedIds.add(id);
    }
    setSelectedIds(newSelectedIds);
  };

  const toggleSelectAllOnPage = () => {
    // Basic implementation: if not all are selected, select all on current page. Else, deselect all.
    // This needs more robust logic if selections should persist across pages or respect a max limit.
    if (selectAllOnPage) {
      setSelectedIds(new Set());
      setSelectAllOnPage(false);
    } else {
      const idsOnPage = questions.map(q => q.id);
      setSelectedIds(new Set(idsOnPage));
      setSelectAllOnPage(true);
    }
  };

  const handleUpdateQuestion = async (questionData: Question) => {
    // Placeholder for update logic
    console.log('Updating question:', questionData);
    // await questionApi.updateQuestion(questionData.id, questionData);
    fetchQuestions(); // Refetch after update
  };

  const handleDeleteQuestion = async (id: number) => {
    // Placeholder for delete logic
    console.log('Deleting question ID:', id);
    // await questionApi.deleteQuestion(id);
    fetchQuestions(); // Refetch after delete
  };

  const handleBulkDelete = async () => {
    // Placeholder for bulk delete
    console.log('Bulk deleting IDs:', Array.from(selectedIds));
    // await questionApi.bulkUpdateQuestions({ action: 'delete', question_ids: Array.from(selectedIds) });
    setSelectedIds(new Set());
    fetchQuestions(); // Refetch
  };
  
  const handleToggleActiveState = async (questionId: number) => {
    console.log('Toggling active state for question ID (hook):', questionId);
    try {
      await questionApi.toggleQuestionActive(questionId);
      // Optimistically update UI or refetch
      setQuestions(prevQuestions => 
        prevQuestions.map(q => 
          q.id === questionId ? { ...q, is_active: !q.is_active } : q
        )
      );
      // Or simply call fetchQuestions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle active state');
    }
  };


  return {
    questions,
    isLoading,
    error,
    pagination,
    filters,
    // sort, // if sort is a separate state
    selectedIds,
    selectAllOnPage,
    editingQuestion,
    showEditModal,
    questionToDelete,
    showDeleteModal,
    
    fetchQuestions,
    handleFilterChange,
    handleSortChange,
    handlePageChange,
    toggleSelectQuestion,
    toggleSelectAllOnPage,
    handleUpdateQuestion,
    handleDeleteQuestion,
    handleBulkDelete,
    setEditingQuestion,
    setShowEditModal,
    setQuestionToDelete,
    setShowDeleteModal,
    handleToggleActiveState, // Exporting the new handler
  };
};