// frontend/src/components/questions/WordSelection.tsx - GÜNCELLENMİŞ VERSİYON
import React from 'react';
import { useWordSelectionLogic } from '../../hooks/useWordSelectionLogic';
import type { Word, WordFilters } from '../../types'; // WordsResponse'a direkt ihtiyaç kalmayabilir

// Paylaşılan component'ler import ediliyor
import WordCard from '../words/WordCard'; // WordCard.tsx ../words/ altında
import Pagination from '../shared/Pagination';

import './WordSelection.css'; // Oluşturduğumuz CSS dosyası

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
    selectAll, // Bu 'selectAllOnPage' olarak değiştirilmişti hook'ta, kontrol edelim. Hook'taki ismi kullanalım.
                // hook'taki adı handleSelectAllOnPage, selectAll ise sayfanın seçili olup olmadığını tutuyor.
    fetchWords,
    handleSearch,
    handleWordToggle,
    handleSelectAllOnPage, // Hook'taki doğru isim bu
    handleClearAllSelections,
    handlePageChange,
    maxSelections,
    selectedCount,
    pageSize 
  } = useWordSelectionLogic({
    onWordsSelected: onWordsSelected,
    initialSelectedWords: initialSelectedWordsFromParent,
  });

  // getDifficultyColor fonksiyonu kaldırıldı. Bu mantık WordCard.tsx içinde olmalı.

  // renderPaginationControls ve renderWordDisplayCard metodları kaldırıldı.
  // Yerine <Pagination /> ve <WordCard /> component'leri kullanılacak.

  return (
    <div className="wordSelectionContainer">
      <div className="wsHeader">
        <h2>🎯 Soru Oluşturulacak Kelimeleri Seçin</h2>
        <div className="wsHeaderActions">
          <span className={`wsSelectedCount ${selectedCount > 0 ? 'hasSelection' : ''}`}>
            {selectedCount} / {maxSelections} seçili
          </span>
          <button
            onClick={() => fetchWords()}
            disabled={isLoading}
            className="wsButton refresh"
          >
            🔄 Yenile
          </button>
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="wsSelectedInfoBar">
          <div className="wsSelectedInfoContent">
            <div className="wsSelectedInfoText">
              <strong>✅ {selectedCount} kelime seçildi</strong>
              <div>Bu kelimeler için AI ile otomatik soru oluşturulacak</div>
            </div>
            <div className="wsSelectedInfoButtons">
              <button
                onClick={handleClearAllSelections}
                className="wsButton clearAll"
              >
                🗑️ Tümünü Kaldır
              </button>
              <button
                disabled={selectedCount === 0}
                onClick={() => { /* Parent component'e bir sonraki adıma geçiş sinyali */ }}
                className="wsButton proceed"
              >
                ➡️ Soru Oluşturmaya Geç ({selectedCount})
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="wsFilterContainer">
        <form onSubmit={handleSearch} className="wsFilterForm">
          <div className="wsFilterFormInner">
            <div className="wsFilterGroup">
              <label htmlFor="ws-search" className="wsFilterLabel">🔍 Kelime Ara:</label>
              <input
                id="ws-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Kelime veya anlam ara..."
                className="wsFilterInput"
              />
            </div>
            
            <div className="wsFilterGroup">
              <label htmlFor="ws-difficulty" className="wsFilterLabel">📊 Zorluk:</label>
              <select
                id="ws-difficulty"
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value as WordFilters['difficulty'])}
                className="wsFilterSelect"
              >
                <option value="">Tümü</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div className="wsFilterGroup">
              <label htmlFor="ws-pos" className="wsFilterLabel">📝 Tür:</label>
              <select
                id="ws-pos"
                value={partOfSpeechFilter}
                onChange={(e) => setPartOfSpeechFilter(e.target.value)}
                className="wsFilterSelect"
              >
                <option value="">Tümü</option>
                <option value="noun">Noun</option>
                <option value="verb">Verb</option>
                <option value="adjective">Adjective</option>
                <option value="adverb">Adverb</option>
                <option value="preposition">Preposition</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="wsButton refresh" // Aynı stil için refresh class'ı kullanılabilir veya yeni bir class
              style={{backgroundColor: '#28a745'}} // Ya da spesifik renk inline kalabilir
            >
              Ara
            </button>
          </div>
        </form>

        {words.length > 0 && (
          <div className="wsFilterActions">
            <button
              onClick={handleSelectAllOnPage}
              disabled={isLoading || (selectedCount >= maxSelections && !selectAll)}
              className={`wsButton ${selectAll ? 'deselectAllPage' : 'selectAllPage'}`}
            >
              {selectAll ? '❌ Sayfa Seçimini Kaldır' : '✅ Tüm Sayfayı Seç'}
            </button>
            <span className="wsPageInfoText">
              Bu sayfada {words.length} kelime gösteriliyor
            </span>
          </div>
        )}
      </div>

      {isLoading && <div className="wsLoadingMessage">🔄 Kelimeler yükleniyor...</div>}
      
      {error && (
        <div className="wsErrorMessageContainer">
          <div className="wsErrorMessage">❌ {error}</div>
        </div>
      )}

      {!isLoading && !error && words.length > 0 && (
        <>
          <div className="wsListHeader">
            <h3>Kelimeler ({words.length} kayıt gösteriliyor)</h3>
            {pagination && (
              <div className="wsListInfoText">
                Toplam: {pagination.totalMeanings.toLocaleString()} anlam
                {pagination.totalWords !== undefined && pagination.totalWords !== pagination.totalMeanings && ` (${pagination.totalWords.toLocaleString()} benzersiz kelime)`}
              </div>
            )}
          </div>
          
          <div className="wsWordCardsGrid">
            {words.map(word => (
              // WordCard.tsx'e isSelected ve onToggleSelect gibi proplar eklenmeli
              <WordCard
                key={`${word.id}-${word.meaning_id}`}
                word={word}
                // Varsayılan olarak WordCard'ın alabileceği ek proplar:
                isSelected={localSelectedIds.has(word.id)}
                onCardClick={() => handleWordToggle(word)} 
                // Veya WordCard içinde seçim için bir checkbox/button varsa
                // onSelectToggle={() => handleWordToggle(word)}
              />
            ))}
          </div>
          
          {pagination && pagination.totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              itemsPerPage={pageSize} // Hook'tan gelen pageSize
              totalItems={pagination.totalItems}
              isLoading={isLoading}
            />
          )}
        </>
      )}

      {!isLoading && !error && words.length === 0 && (
        <div className="wsNoWordsContainer">
          <div className="wsNoWordsIcon">🔍</div>
          <h3 className="wsNoWordsTitle">Kelime Bulunamadı</h3>
          <p className="wsNoWordsText">
            {searchQuery || difficultyFilter || partOfSpeechFilter
              ? 'Arama kriterlerinize uygun kelime bulunamadı.' 
              : 'Veritabanında henüz kelime bulunmuyor veya aktif kelime yok.'
            }
          </p>
          {(searchQuery || difficultyFilter || partOfSpeechFilter) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setDifficultyFilter('');
                setPartOfSpeechFilter('');
                handleSearch(); // Hook'taki handleSearch'ü çağırarak filtreleri temizle ve yeniden yükle
              }}
              className="wsButton clearFilters"
            >
              Filtreleri Temizle
            </button>
          )}
        </div>
      )}

      <div className="wsInfoFooter">
        <h4>ℹ️ Kelime Seçimi Hakkında</h4>
        <div className="wsInfoGrid">
          <div>
            <strong>🎯 Seçim Kriterleri:</strong>
            <ul className="wsInfoList">
              <li>Maksimum {maxSelections} kelime seçebilirsiniz</li>
              <li>Her kelime anlamı ayrı bir soru olacak</li>
              <li>Zorluk seviyesi ve tür filtresi kullanabilirsiniz</li>
              {/*<li>Seçiminiz sayfalara göre korunur (Bu hook'ta tam olarak böyle değil, parent'a iletiliyor)</li>*/}
            </ul>
          </div>
          <div>
            <strong>🤖 Soru Kalitesi:</strong>
            <ul className="wsInfoList">
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