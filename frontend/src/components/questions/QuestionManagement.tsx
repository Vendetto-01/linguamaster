// frontend/src/components/questions/QuestionManagement.tsx - BASİTLEŞTİRİLMİŞ VERSİYON
import React, { useEffect } from 'react';
import { useQuestionManagementLogic } from '../../hooks/useQuestionManagementLogic';
import FilterBar from '../shared/FilterBar';
import QuestionCard from './QuestionCard';
import Pagination from '../shared/Pagination';
import QuestionEditModal from '../../shared/modals/QuestionEditModal';
import ConfirmDeleteModal from '../../shared/modals/ConfirmDeleteModal';
import { QuestionFilterParams, QuestionSortParams } from '../../types/questions';

interface QuestionManagementProps {
  refreshKey?: number;
}

const QuestionManagement: React.FC<QuestionManagementProps> = ({ refreshKey }) => {
  const {
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

    fetchQuestions,
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
  } = useQuestionManagementLogic({ initialPageSize: 10 });

  useEffect(() => {
    if (refreshKey !== undefined) {
      fetchQuestions();
    }
  }, [refreshKey, fetchQuestions]);

  // Filter bar alanları
  const filterBarFields = [
    {
      type: 'text' as const,
      key: 'searchTerm',
      label: 'Ara',
      placeholder: 'Soru metni, kelime...',
      value: filters.searchTerm || '',
      onChange: (value: string | boolean) => handleFilterChange('searchTerm', value as string),
      width: '300px'
    },
    {
      type: 'select' as const,
      key: 'difficulty',
      label: 'Zorluk',
      value: filters.difficulty || '',
      onChange: (value: string | boolean) => handleFilterChange('difficulty', value as string),
      options: [
        { value: '', label: 'Tümü' },
        { value: 'beginner', label: 'Beginner' },
        { value: 'intermediate', label: 'Intermediate' },
        { value: 'advanced', label: 'Advanced' }
      ]
    },
    {
      type: 'select' as const,
      key: 'type',
      label: 'Tür',
      value: filters.type || '',
      onChange: (value: string | boolean) => handleFilterChange('type', value as string),
      options: [
        { value: '', label: 'Tümü' },
        { value: 'multiple_choice', label: 'Çoktan Seçmeli' },
        { value: 'fill_in_the_blank', label: 'Boşluk Doldurma' }
      ]
    }
  ];

  // Sıralama seçenekleri
  const sortOptions = [
    { value: 'created_at,desc', label: 'Eklenme Tarihi (Yeni)' },
    { value: 'created_at,asc', label: 'Eklenme Tarihi (Eski)' },
    { value: 'updated_at,desc', label: 'Güncellenme (Yeni)' },
    { value: 'difficulty,asc', label: 'Zorluk (Artan)' },
    { value: 'word,asc', label: 'Kelime (A-Z)' }
  ];

  const handleSortSelect = (value: string) => {
    const [sortBy, sortOrder] = value.split(',');
    handleSortChange({ sortBy, sortOrder: sortOrder as 'asc' | 'desc' });
  };

  const handleClearFilters = () => {
    handleFilterChange('searchTerm', '');
    handleFilterChange('difficulty', '');
    handleFilterChange('type', '');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px', color: '#343a40' }}>
        ❓ Soru Yönetimi
      </h2>

      {/* Filtreleme Barı */}
      <FilterBar
        fields={filterBarFields}
        onSearch={() => fetchQuestions(1)}
        onClear={handleClearFilters}
        extraActions={
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label htmlFor="sort-select" style={{ fontWeight: 'bold', fontSize: '14px' }}>
                Sırala:
              </label>
              <select
                id="sort-select"
                value={`${sort.sortBy},${sort.sortOrder}`}
                onChange={(e) => handleSortSelect(e.target.value)}
                disabled={isLoading}
                style={{
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid #ced4da',
                  fontSize: '14px',
                  minWidth: '200px'
                }}
              >
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        }
      />

      {/* Loading State */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '40px', fontSize: '18px', color: '#6c757d' }}>
          🔄 Sorular yükleniyor...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '15px',
          borderRadius: '5px',
          marginBottom: '20px',
          border: '1px solid #f5c6cb'
        }}>
          ❌ Hata: {error}
        </div>
      )}

      {/* Content */}
      {!isLoading && !error && (
        <>
          {/* Toplu İşlemler */}
          {selectedIds.size > 0 && (
            <div style={{
              marginBottom: '20px',
              padding: '15px',
              backgroundColor: '#e9ecef',
              borderRadius: '5px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontWeight: 'bold' }}>
                {selectedIds.size} soru seçildi
              </span>
              <button
                onClick={handleBulkDelete}
                disabled={isLoading}
                style={{
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                🗑️ Seçilenleri Sil
              </button>
            </div>
          )}

          {/* Soru Listesi */}
          {questions.length > 0 ? (
            <>
              {/* Tümünü Seç Checkbox'ı */}
              <div style={{
                padding: '15px',
                borderBottom: '1px solid #dee2e6',
                backgroundColor: '#f8f9fa',
                display: 'flex',
                alignItems: 'center',
                marginBottom: '20px',
                borderRadius: '5px'
              }}>
                <input
                  type="checkbox"
                  checked={selectAllOnPage}
                  onChange={toggleSelectAllOnPage}
                  disabled={questions.length === 0 || isLoading}
                  style={{ marginRight: '12px', transform: 'scale(1.2)' }}
                  id="select-all-questions"
                />
                <label htmlFor="select-all-questions" style={{ fontWeight: 'bold', fontSize: '14px' }}>
                  Sayfadaki Tüm Soruları Seç ({selectedIds.size} / {questions.length} seçili)
                </label>
              </div>

              {/* Sorular */}
              <div style={{ display: 'grid', gap: '20px' }}>
                {questions.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    isSelected={selectedIds.has(question.id)}
                    onSelect={() => toggleSelectQuestion(question.id)}
                    onToggleActive={() => handleEdit(question)}
                    onDelete={() => handleDelete(question)}
                    isUpdating={isLoading}
                  />
                ))}
              </div>
            </>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              fontSize: '16px',
              backgroundColor: '#f8f9fa',
              borderRadius: '5px',
              color: '#6c757d'
            }}>
              📭 Gösterilecek soru bulunamadı
              <div style={{ marginTop: '10px', fontSize: '14px' }}>
                Filtrelerinizi kontrol edin veya yeni sorular ekleyin
              </div>
            </div>
          )}

          {/* Sayfalama */}
          {pagination && pagination.totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              itemsPerPage={pageSize}
              totalItems={pagination.totalItems}
              isLoading={isLoading}
            />
          )}
        </>
      )}

      {/* Modallar */}
      <QuestionEditModal
        show={showEditModal}
        question={editingQuestion}
        onClose={handleCloseEditModal}
        onSave={handleUpdate}
      />
      
      <ConfirmDeleteModal
        show={showDeleteModal}
        question={questionToDelete}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default QuestionManagement;