// frontend/src/components/questions/QuestionManagement.tsx
import React, { useState } from 'react';
import { useQuestionManagementLogic } from '../../hooks/useQuestionManagementLogic';
import QuestionCard from './QuestionCard';
import QuestionFilters from './QuestionFilters';
import Pagination from '../shared/Pagination';
import DeleteConfirmationModal from '../shared/DeleteConfirmationModal';
import EditQuestionModal from './EditQuestionModal';
import LoadingSpinner from '../shared/LoadingSpinner';
import { Question, QuestionFilterParams, QuestionSortParams } from '../../types/questions';

interface QuestionManagementProps {
  refreshKey?: number;
}

const QuestionManagement: React.FC<QuestionManagementProps> = ({ refreshKey }) => {
  const [showFilters, setShowFilters] = useState(false);
  
  const {
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
  } = useQuestionManagementLogic({ refreshKey });

  const handleSort = (newSort: QuestionSortParams) => {
    handleSortChange(newSort);
  };

  const handleFilter = (newFilters: QuestionFilterParams) => {
    handleFilterChange(newFilters);
  };

  const handleDelete = async (question: Question) => {
    setQuestionToDelete(question);
    setShowDeleteModal(true);
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setShowEditModal(true);
  };

  const handleConfirmDelete = async () => {
    if (questionToDelete) {
      await handleDeleteQuestion(questionToDelete.id);
      setShowDeleteModal(false);
      setQuestionToDelete(null);
    }
  };

  const handleBulkDeleteClick = async () => {
    if (selectedIds.size > 0) {
      await handleBulkDelete();
    }
  };

  if (isLoading && questions.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="question-management">
      {/* Header Section */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div>
          <h2 style={{ margin: 0 }}>Sorular</h2>
          <p style={{ margin: '5px 0 0 0', color: '#6c757d' }}>
            Toplam {pagination.totalItems} soru
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-outline-secondary"
          >
            {showFilters ? 'Filtreleri Gizle' : 'Filtrele'}
          </button>
          
          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkDeleteClick}
              className="btn btn-danger"
            >
              Seçilenleri Sil ({selectedIds.size})
            </button>
          )}
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <QuestionFilters
          currentFilters={filters}
          onFilterChange={handleFilter}
          currentSort={sort}
          onSortChange={handleSort}
        />
      )}

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Questions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {questions.map(question => (
          <QuestionCard
            key={question.id}
            question={question}
            isSelected={selectedIds.has(question.id)}
            onSelect={toggleSelectQuestion}
            onEdit={() => handleEdit(question)}
            onDelete={() => handleDelete(question)}
            isUpdating={false}
          />
        ))}
      </div>

      {/* Empty State */}
      {!isLoading && questions.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          marginTop: '20px'
        }}>
          <h4>Soru Bulunamadı</h4>
          <p>Seçili filtrelerle eşleşen soru bulunmamaktadır.</p>
        </div>
      )}

      {/* Pagination */}
      {questions.length > 0 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
          hasNextPage={pagination.hasNext}
          hasPrevPage={pagination.hasPrev}
        />
      )}

      {/* Modals */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        itemName={questionToDelete?.word?.word || 'soru'}
      />

      <EditQuestionModal
        show={showEditModal}
        question={editingQuestion}
        onClose={() => {
          setShowEditModal(false);
          setEditingQuestion(null);
        }}
        onSave={handleUpdateQuestion}
      />
    </div>
  );
};

export default QuestionManagement;