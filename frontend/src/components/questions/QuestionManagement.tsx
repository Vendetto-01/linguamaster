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

  // ... rest of the handlers ...

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

        {/* ... rest of the header ... */}
      </div>

      {/* Question list or empty state ... */}

      {/* Pagination */}
      {questions.length > 0 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
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