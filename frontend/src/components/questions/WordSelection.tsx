// frontend/src/components/questions/WordSelection.tsx - BASİTLEŞTİRİLMİŞ VERSİYON
import React from 'react';
import { useWordSelectionLogic } from '../../hooks/useWordSelectionLogic';
import WordCard from '../words/WordCard';
import Pagination from '../shared/Pagination';
import WordSelectionHeader from './WordSelectionHeader';
import WordSelectionFilter from './WordSelectionFilter';
import type { Word } from '../../types';

interface WordSelectionProps {
  onWordsSelected: (words: Word[]) => void;
  selectedWords: Word[];
}

const WordSelection: React.FC<WordSelectionProps> = ({ 
  onWordsSelected, 
  selectedWords: initialSelectedWordsFromParent 
}) => {
  const {
    words,
    isLoading,
    error,
    pagination,
    currentPage,
    searchQuery,
    setSearchQuery,
    difficultyFilter,
    setDifficultyFilter,
    partOfSpeechFilter,
    setPartOfSpeechFilter,
    localSelectedIds,
    selectAll,
    fetchWords,
    handleSearch,
    handleWordToggle,
    handleSelectAllOnPage,
    handleClearAllSelections,
    handlePageChange,
    maxSelections,
    selectedCount,
    pageSize 
  } = useWordSelectionLogic({
    onWordsSelected: onWordsSelected,
    initialSelectedWords: initialSelectedWordsFromParent,
  });

  const handleProceedToGeneration = () => {
    // Parent component'te navigation yapılacak
    // Burada sadece callback çağrılıyor
    console.log('Proceeding to question generation with', selectedCount, 'words');
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setDifficultyFilter('');
    setPartOfSpeechFilter('');
    handleSearch();
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <WordSelectionHeader
        selectedCount={selectedCount}
        maxSelections={maxSelections}
        onRefresh={() => fetchWords()}
        onClearAll={handleClearAllSelections}
        onProceed={handleProceedToGeneration}
        isLoading={isLoading}
      />

      {/* Filter */}
      <WordSelectionFilter
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        difficultyFilter={difficultyFilter}
        setDifficultyFilter={setDifficultyFilter}
        partOfSpeechFilter={partOfSpeechFilter}
        setPartOfSpeechFilter={setPartOfSpeechFilter}
        onSearch={handleSearch}
        isLoading={isLoading}
        wordsCount={words.length}
        selectAll={selectAll}
        onSelectAllToggle={handleSelectAllOnPage}
        selectedCount={selectedCount}
        maxSelections={maxSelections}
      />

      {/* Loading State */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '40px', fontSize: '18px', color: '#6c757d' }}>
          🔄 Kelimeler yükleniyor...
        </div>
      )}
      
      {/* Error State */}
      {error && (
        <div style={{
          textAlign: 'center',
          padding: '20px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '5px',
          marginBottom: '20px',
          border: '1px solid #f5c6cb'
        }}>
          ❌ {error}
        </div>
      )}

      {/* Content */}
      {!isLoading && !error && words.length > 0 && (
        <>
          {/* List Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <h3 style={{ margin: 0, color: '#343a40' }}>
              Kelimeler ({words.length} kayıt gösteriliyor)
            </h3>
            {pagination && (
              <div style={{ fontSize: '14px', color: '#6c757d' }}>
                Toplam: {pagination.totalMeanings.toLocaleString()} anlam
                {pagination.totalWords !== undefined && pagination.totalWords !== pagination.totalMeanings && 
                  ` (${pagination.totalWords.toLocaleString()} benzersiz kelime)`
                }
              </div>
            )}
          </div>
          
          {/* Word Cards */}
          <div style={{ display: 'grid', gap: '15px' }}>
            {words.map(word => (
              <WordCard
                key={`${word.id}-${word.meaning_id}`}
                word={word}
                isSelected={localSelectedIds.has(word.id)}
                onToggle={() => handleWordToggle(word)}
                showActions={false}
              />
            ))}
          </div>
          
          {/* Pagination */}
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

      {/* No Words Found */}
      {!isLoading && !error && words.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '10px', color: '#6c757d' }}>
            🔍
          </div>
          <h3 style={{ color: '#495057', marginBottom: '8px' }}>
            Kelime Bulunamadı
          </h3>
          <p style={{ color: '#6c757d', marginBottom: '15px' }}>
            {searchQuery || difficultyFilter || partOfSpeechFilter
              ? 'Arama kriterlerinize uygun kelime bulunamadı.' 
              : 'Veritabanında henüz kelime bulunmuyor veya aktif kelime yok.'
            }
          </p>
          {(searchQuery || difficultyFilter || partOfSpeechFilter) && (
            <button
              onClick={handleClearFilters}
              style={{
                padding: '10px 18px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              Filtreleri Temizle
            </button>
          )}
        </div>
      )}

      {/* Info Footer */}
      <div style={{
        backgroundColor: '#e9ecef',
        padding: '20px',
        borderRadius: '8px',
        marginTop: '30px',
        fontSize: '14px',
        color: '#495057'
      }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#343a40' }}>
          ℹ️ Kelime Seçimi Hakkında
        </h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px'
        }}>
          <div>
            <strong>🎯 Seçim Kriterleri:</strong>
            <ul style={{ margin: '5px 0 0 0', paddingLeft: '18px', fontSize: '13px' }}>
              <li>Maksimum {maxSelections} kelime seçebilirsiniz</li>
              <li>Her kelime anlamı ayrı bir soru olacak</li>
              <li>Zorluk seviyesi ve tür filtresi kullanabilirsiniz</li>
              <li>Seçiminiz sayfalarda korunur</li>
            </ul>
          </div>
          <div>
            <strong>🤖 Soru Kalitesi:</strong>
            <ul style={{ margin: '5px 0 0 0', paddingLeft: '18px', fontSize: '13px' }}>
              <li>Her kelime için context-aware sorular</li>
              <li>Akademik seviyede örnek cümleler kullanılır</li>
              <li>4 seçenekli test formatında</li>
              <li>AI ile otomatik çeldirici oluşturma</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordSelection;