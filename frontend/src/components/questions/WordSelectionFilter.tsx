// frontend/src/components/questions/WordSelectionFilter.tsx
import React from 'react';
import type { WordFilters } from '../../types';

interface WordSelectionFilterProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  difficultyFilter: WordFilters['difficulty'];
  setDifficultyFilter: (difficulty: WordFilters['difficulty']) => void;
  partOfSpeechFilter: string;
  setPartOfSpeechFilter: (pos: string) => void;
  onSearch: (e?: React.FormEvent) => void;
  isLoading: boolean;
  wordsCount: number;
  selectAll: boolean;
  onSelectAllToggle: () => void;
  selectedCount: number;
  maxSelections: number;
}

const WordSelectionFilter: React.FC<WordSelectionFilterProps> = ({
  searchQuery,
  setSearchQuery,
  difficultyFilter,
  setDifficultyFilter,
  partOfSpeechFilter,
  setPartOfSpeechFilter,
  onSearch,
  isLoading,
  wordsCount,
  selectAll,
  onSelectAllToggle,
  selectedCount,
  maxSelections
}) => {
  return (
    <div style={{
      backgroundColor: '#f8f9fa',
      padding: '20px',
      borderRadius: '8px',
      marginBottom: '20px'
    }}>
      {/* Ana Form */}
      <form onSubmit={onSearch} style={{ marginBottom: '15px' }}>
        <div style={{
          display: 'flex',
          gap: '15px',
          flexWrap: 'wrap',
          alignItems: 'flex-end'
        }}>
          {/* Arama */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label htmlFor="ws-search" style={{
              display: 'block',
              marginBottom: '5px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#495057'
            }}>
              🔍 Kelime Ara:
            </label>
            <input
              id="ws-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Kelime veya anlam ara..."
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          {/* Zorluk */}
          <div style={{ minWidth: '150px' }}>
            <label htmlFor="ws-difficulty" style={{
              display: 'block',
              marginBottom: '5px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#495057'
            }}>
              📊 Zorluk:
            </label>
            <select
              id="ws-difficulty"
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value as WordFilters['difficulty'])}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            >
              <option value="">Tümü</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          {/* Kelime Türü */}
          <div style={{ minWidth: '150px' }}>
            <label htmlFor="ws-pos" style={{
              display: 'block',
              marginBottom: '5px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#495057'
            }}>
              📝 Tür:
            </label>
            <select
              id="ws-pos"
              value={partOfSpeechFilter}
              onChange={(e) => setPartOfSpeechFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            >
              <option value="">Tümü</option>
              <option value="noun">Noun</option>
              <option value="verb">Verb</option>
              <option value="adjective">Adjective</option>
              <option value="adverb">Adverb</option>
              <option value="preposition">Preposition</option>
            </select>
          </div>

          {/* Ara Butonu */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              opacity: isLoading ? 0.6 : 1
            }}
          >
            {isLoading ? '🔄 Aranıyor...' : '🔍 Ara'}
          </button>
        </div>
      </form>

      {/* Sayfa İşlemleri */}
      {wordsCount > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '15px',
          borderTop: '1px solid #dee2e6'
        }}>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <button
              onClick={onSelectAllToggle}
              disabled={isLoading || (selectedCount >= maxSelections && !selectAll)}
              style={{
                padding: '8px 16px',
                backgroundColor: selectAll ? '#dc3545' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 'bold',
                opacity: isLoading || (selectedCount >= maxSelections && !selectAll) ? 0.6 : 1
              }}
            >
              {selectAll ? '❌ Sayfa Seçimini Kaldır' : '✅ Tüm Sayfayı Seç'}
            </button>
            
            <span style={{ fontSize: '13px', color: '#6c757d' }}>
              Bu sayfada {wordsCount} kelime gösteriliyor
            </span>
          </div>

          {/* Seçim Durumu */}
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
            <span style={{ 
              color: selectedCount > 0 ? '#28a745' : '#6c757d' 
            }}>
              {selectedCount} / {maxSelections} seçili
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WordSelectionFilter;