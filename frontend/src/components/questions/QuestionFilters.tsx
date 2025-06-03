import React from 'react';
import { QuestionFilterParams, QuestionSortParams } from '../../types/questions';

interface QuestionFiltersProps {
  filters: QuestionFilterParams;
  onFilterChange: (filters: QuestionFilterParams) => void;
  onSortChange: (sort: QuestionSortParams) => void;
}

const QuestionFilters: React.FC<QuestionFiltersProps> = ({
  filters,
  onFilterChange,
  onSortChange
}) => {
  // Zorluk seviyeleri
  const difficultyLevels = [
    { value: '', label: 'Tüm Seviyeler' },
    { value: 'beginner', label: 'Başlangıç' },
    { value: 'intermediate', label: 'Orta' },
    { value: 'advanced', label: 'İleri' }
  ];

  // Sıralama seçenekleri
  const sortOptions = [
    { value: 'created_at', label: 'Oluşturulma Tarihi' },
    { value: 'updated_at', label: 'Güncellenme Tarihi' },
    { value: 'word.word', label: 'Kelime' },
    { value: 'difficulty', label: 'Zorluk Seviyesi' }
  ];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filters,
      searchTerm: e.target.value
    });
  };

  const handleDifficultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({
      ...filters,
      difficulty: e.target.value
    });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [sortBy, sortOrder] = e.target.value.split(':');
    onSortChange({
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc'
    });
  };

  const handleActiveStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFilterChange({
      ...filters,
      isActive: value === '' ? undefined : value === 'true'
    });
  };

  return (
    <div className="question-filters">
      <div className="filters-grid">
        {/* Arama alanı */}
        <div className="filter-group">
          <label htmlFor="search">Ara</label>
          <input
            id="search"
            type="text"
            placeholder="Kelime veya soru metni..."
            value={filters.searchTerm || ''}
            onChange={handleSearchChange}
            className="filter-input"
          />
        </div>

        {/* Zorluk seviyesi filtresi */}
        <div className="filter-group">
          <label htmlFor="difficulty">Zorluk Seviyesi</label>
          <select
            id="difficulty"
            value={filters.difficulty || ''}
            onChange={handleDifficultyChange}
            className="filter-select"
          >
            {difficultyLevels.map(level => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>

        {/* Aktiflik durumu filtresi */}
        <div className="filter-group">
          <label htmlFor="activeStatus">Durum</label>
          <select
            id="activeStatus"
            value={filters.isActive === undefined ? '' : filters.isActive.toString()}
            onChange={handleActiveStatusChange}
            className="filter-select"
          >
            <option value="">Tümü</option>
            <option value="true">Aktif</option>
            <option value="false">Pasif</option>
          </select>
        </div>

        {/* Sıralama seçenekleri */}
        <div className="filter-group">
          <label htmlFor="sort">Sıralama</label>
          <select
            id="sort"
            onChange={handleSortChange}
            className="filter-select"
          >
            {sortOptions.map(option => (
              <React.Fragment key={option.value}>
                <option value={`${option.value}:desc`}>
                  {option.label} (Azalan)
                </option>
                <option value={`${option.value}:asc`}>
                  {option.label} (Artan)
                </option>
              </React.Fragment>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default QuestionFilters;