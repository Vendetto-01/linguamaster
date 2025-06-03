import React, { useState } from 'react';
import { useQuestionManagementLogic } from '../../hooks/useQuestionManagementLogic';
import QuestionCard from './QuestionCard';
import QuestionFilters from './QuestionFilters';
import Pagination from '../shared/Pagination';
// import DeleteConfirmationModal from '../shared/DeleteConfirmationModal'; // Commented out
// import EditQuestionModal from './EditQuestionModal'; // Commented out
// import LoadingSpinner from '../shared/LoadingSpinner'; // Commented out
import type { Question, QuestionFilters as QuestionFilterParams } from '../../types'; // Corrected path and aliased, added 'type'

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
    handleToggleActiveState, // Added from hook
  } = useQuestionManagementLogic({ refreshKey });

  const handleDelete = async (question: Question) => {
    setQuestionToDelete(question);
    setShowDeleteModal(true);
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setShowEditModal(true);
  };

  // Removed placeholder handleToggleActive as handleToggleActiveState is used from the hook

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
    // return <LoadingSpinner />; // Commented out
    return <div>Loading questions...</div>; // Placeholder
  }

  return (
    <div className="question-management">
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

      {showFilters && (
        <QuestionFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
        />
      )}

      {questions.map(question => (
        <QuestionCard
          key={question.id}
          question={question}
          isSelected={selectedIds.has(question.id)}
          onSelect={() => toggleSelectQuestion(question.id)}
          onEdit={() => handleEdit(question)}
          onDelete={() => handleDelete(question)}
          onToggleActive={() => handleToggleActiveState(question.id)} // Use hook's function
        />
      ))}

      {questions.length === 0 && !isLoading && (
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

      {questions.length > 0 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {/* <DeleteConfirmationModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        itemName={questionToDelete?.word_text || 'soru'} // Corrected property access
      /> */}

      {/* <EditQuestionModal
        show={showEditModal}
        question={editingQuestion}
        onClose={() => {
          setShowEditModal(false);
          setEditingQuestion(null);
        }}
        onSave={handleUpdateQuestion}
      /> */}
    </div>
  );
};

export default QuestionManagement;