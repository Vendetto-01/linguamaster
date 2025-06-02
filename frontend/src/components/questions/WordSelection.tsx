// frontend/src/components/questions/WordSelection.tsx - KELİME SEÇİMİ KOMPONENTİ
import React, { useState, useEffect } from 'react';

interface Word {
  id: number;
  word: string;
  meaning_id: number;
  part_of_speech: string;
  meaning_description: string;
  english_example: string;
  turkish_meaning: string;
  final_difficulty: string;
  created_at: string;
}

interface WordSelectionProps {
  onWordsSelected: (words: Word[]) => void;
  selectedWords: Word[];
}

interface WordsResponse {
  words: Word[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalWords: number;
    totalMeanings: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const WordSelection: React.FC<WordSelectionProps> = ({ onWordsSelected, selectedWords }) => {
  const [words, setWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<WordsResponse['pagination'] | null>(null);
  
  // Filtreler
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [partOfSpeechFilter, setPartOfSpeechFilter] = useState('');
  
  // Seçim state'leri
  const [localSelectedIds, setLocalSelectedIds] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const pageSize = 20;
  const maxSelections = 50; // Maksimum seçim sayısı

  // Kelimeleri getir
  const fetchWords = async () => {
    try {
      setIsLoading(true);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        groupByWord: 'false' // Her anlam ayrı görünsün
      });

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      if (difficultyFilter) {
        params.append('difficulty', difficultyFilter);
      }

      if (partOfSpeechFilter) {
        params.append('partOfSpeech', partOfSpeechFilter);
      }

      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/words?${params}`
      );
      
      if (!response.ok) {
        throw new Error('Kelimeler yüklenemedi');
      }

      const data: WordsResponse = await response.json();
      
      setWords(data.words || []);
      setPagination(data.pagination || null);
      setError('');
      setSelectAll(false);

    } catch (err) {
      console.error('Kelime yükleme hatası:', err);
      setError(err instanceof Error ? err.message : 'Kelimeler yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWords();
  }, [currentPage, searchQuery, difficultyFilter, partOfSpeechFilter]);

  // Seçili kelimeleri güncelle
  useEffect(() => {
    const selectedWordsIds = new Set(selectedWords.map(w => w.id));
    setLocalSelectedIds(selectedWordsIds);
  }, [selectedWords]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchWords();
  };

  const handleWordToggle = (word: Word) => {
    const newSelected = new Set(localSelectedIds);
    
    if (newSelected.has(word.id)) {
      newSelected.delete(word.id);
    } else {
      if (newSelected.size >= maxSelections) {
        alert(`Maksimum ${maxSelections} kelime seçebilirsiniz.`);
        return;
      }
      newSelected.add(word.id);
    }
    
    setLocalSelectedIds(newSelected);
    
    // Seçili kelimeleri parent'a gönder
    const selectedWordsArray = words.filter(w => newSelected.has(w.id));
    // Önceki sayfalardaki seçili kelimelerle birleştir
    const allSelectedWords = [
      ...selectedWords.filter(sw => !words.some(w => w.id === sw.id)),
      ...selectedWordsArray
    ];
    
    onWordsSelected(allSelectedWords);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      // Tümünü kaldır (sadece bu sayfadakiler)
      const newSelected = new Set(localSelectedIds);
      words.forEach(word => newSelected.delete(word.id));
      setLocalSelectedIds(newSelected);
      
      const allSelectedWords = selectedWords.filter(sw => !words.some(w => w.id === sw.id));
      onWordsSelected(allSelectedWords);
    } else {
      // Tümünü seç (sadece bu sayfadakiler)
      const currentPageIds = words.map(w => w.id);
      const availableSlots = maxSelections - (localSelectedIds.size - currentPageIds.filter(id => localSelectedIds.has(id)).length);
      
      if (availableSlots < currentPageIds.length) {
        alert(`Sadece ${availableSlots} kelime daha seçebilirsiniz. (Maksimum ${maxSelections})`);
        return;
      }
      
      const newSelected = new Set(localSelectedIds);
      words.forEach(word => newSelected.add(word.id));
      setLocalSelectedIds(newSelected);
      
      const selectedWordsArray = words.filter(w => newSelected.has(w.id));
      const allSelectedWords = [
        ...selectedWords.filter(sw => !words.some(w => w.id === sw.id)),
        ...selectedWordsArray
      ];
      onWordsSelected(allSelectedWords);
    }
    
    setSelectAll(!selectAll);
  };

  const handleClearAll = () => {
    setLocalSelectedIds(new Set());
    onWordsSelected([]);
    setSelectAll(false);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectAll(false);
  };

  // Zorluk seviyesi renkleri
  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'beginner': return '#28a745';
      case 'intermediate': return '#ffc107';
      case 'advanced': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const renderPagination = () => {
    if (!pagination || pagination.totalPages <= 1) return null;

    const pageNumbers = [];
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(pagination.totalPages, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        gap: '5px',
        margin: '20px 0'
      }}>
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            backgroundColor: currentPage === 1 ? '#f8f9fa' : '#fff',
            color: currentPage === 1 ? '#6c757d' : '#28a745',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            borderRadius: '4px'
          }}
        >
          ← Önceki
        </button>

        {pageNumbers.map(pageNum => (
          <button
            key={pageNum}
            onClick={() => handlePageChange(pageNum)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              backgroundColor: currentPage === pageNum ? '#28a745' : '#fff',
              color: currentPage === pageNum ? 'white' : '#28a745',
              cursor: 'pointer',
              borderRadius: '4px',
              fontWeight: currentPage === pageNum ? 'bold' : 'normal'
            }}
          >
            {pageNum}
          </button>
        ))}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === pagination.totalPages}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            backgroundColor: currentPage === pagination.totalPages ? '#f8f9fa' : '#fff',
            color: currentPage === pagination.totalPages ? '#6c757d' : '#28a745',
            cursor: currentPage === pagination.totalPages ? 'not-allowed' : 'pointer',
            borderRadius: '4px'
          }}
        >
          Sonraki →
        </button>

        <span style={{ marginLeft: '15px', fontSize: '14px', color: '#666' }}>
          {currentPage} / {pagination.totalPages} sayfa
        </span>
      </div>
    );
  };

  const renderWordCard = (word: Word) => {
    const isSelected = localSelectedIds.has(word.id);
    
    return (
      <div
        key={word.id}
        onClick={() => handleWordToggle(word)}
        style={{
          backgroundColor: isSelected ? '#e8f5e8' : '#ffffff',
          border: isSelected ? '2px solid #28a745' : '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '10px',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          transform: isSelected ? 'translateY(-2px)' : 'none',
          boxShadow: isSelected ? '0 4px 8px rgba(40, 167, 69, 0.2)' : '0 2px 4px rgba(0,0,0,0.1)'
        }}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            e.currentTarget.style.transform = 'none';
          }
        }}
      >
        {/* Seçim durumu göstergesi */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          marginBottom: '10px'
        }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ 
              margin: '0 0 5px 0', 
              color: isSelected ? '#155724' : '#2c3e50',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              {word.word}
              <span style={{ 
                fontSize: '14px', 
                color: '#7f8c8d',
                marginLeft: '8px'
              }}>
                (anlam #{word.meaning_id})
              </span>
            </h3>
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{
                backgroundColor: getDifficultyColor(word.final_difficulty),
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {word.final_difficulty}
              </span>
              <span style={{
                backgroundColor: '#f8f9fa',
                color: '#495057',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                border: '1px solid #dee2e6'
              }}>
                {word.part_of_speech}
              </span>
            </div>
          </div>
          
          <div style={{ 
            fontSize: '24px', 
            color: isSelected ? '#28a745' : '#dee2e6',
            marginLeft: '10px'
          }}>
            {isSelected ? '✅' : '⭕'}
          </div>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '14px', color: '#495057', marginBottom: '5px' }}>
            <strong>Anlam:</strong> {word.meaning_description}
          </div>
          <div style={{ fontSize: '14px', color: '#495057', marginBottom: '5px' }}>
            <strong>Türkçe:</strong> {word.turkish_meaning}
          </div>
        </div>

        <div style={{
          backgroundColor: isSelected ? '#d4edda' : '#f8f9fa',
          padding: '8px',
          borderRadius: '5px',
          borderLeft: `4px solid ${isSelected ? '#28a745' : '#007bff'}`
        }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>
            Örnek Cümle:
          </div>
          <div style={{ fontSize: '13px', color: '#2c3e50', fontStyle: 'italic' }}>
            "{word.english_example}"
          </div>
        </div>

        {isSelected && (
          <div style={{
            marginTop: '8px',
            fontSize: '12px',
            color: '#155724',
            fontWeight: 'bold',
            textAlign: 'center'
          }}>
            ✓ Soru oluşturma için seçildi
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2>🎯 Soru Oluşturulacak Kelimeleri Seçin</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ 
            fontSize: '14px', 
            color: localSelectedIds.size > 0 ? '#28a745' : '#666',
            fontWeight: 'bold'
          }}>
            {localSelectedIds.size} / {maxSelections} seçili
          </span>
          <button
            onClick={() => fetchWords()}
            style={{
              padding: '8px 12px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔄 Yenile
          </button>
        </div>
      </div>

      {/* Seçim Kontrolleri */}
      {localSelectedIds.size > 0 && (
        <div style={{
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center'
          }}>
            <div style={{ color: '#155724' }}>
              <strong>✅ {localSelectedIds.size} kelime seçildi</strong>
              <div style={{ fontSize: '14px', marginTop: '5px' }}>
                Bu kelimeler için AI ile otomatik soru oluşturulacak
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleClearAll}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                🗑️ Tümünü Kaldır
              </button>
              
              <button
                onClick={() => onWordsSelected(selectedWords)}
                disabled={localSelectedIds.size === 0}
                style={{
                  padding: '8px 16px',
                  backgroundColor: localSelectedIds.size > 0 ? '#28a745' : '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: localSelectedIds.size > 0 ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                ➡️ Soru Oluşturmaya Geç
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Arama ve Filtreler */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <form onSubmit={handleSearch} style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'end' }}>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
                🔍 Kelime Ara:
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Kelime veya anlam ara..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ minWidth: '140px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
                📊 Zorluk:
              </label>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="">Tümü</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div style={{ minWidth: '140px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
                📝 Tür:
              </label>
              <select
                value={partOfSpeechFilter}
                onChange={(e) => setPartOfSpeechFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
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

            <button
              type="submit"
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Ara
            </button>
          </div>
        </form>

        {/* Toplu Seçim Kontrolleri */}
        {words.length > 0 && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={handleSelectAll}
              disabled={localSelectedIds.size >= maxSelections && !selectAll}
              style={{
                padding: '6px 12px',
                backgroundColor: selectAll ? '#dc3545' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: localSelectedIds.size >= maxSelections && !selectAll ? 'not-allowed' : 'pointer',
                fontSize: '13px'
              }}
            >
              {selectAll ? '❌ Sayfa Seçimini Kaldır' : '✅ Tüm Sayfayı Seç'}
            </button>
            
            <span style={{ fontSize: '13px', color: '#666' }}>
              Bu sayfada {words.length} kelime
            </span>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '18px', color: '#666' }}>
            🔄 Kelimeler yükleniyor...
          </div>
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
          ❌ {error}
        </div>
      )}

      {/* Kelime Listesi */}
      {!isLoading && !error && words.length > 0 && (
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <h3 style={{ margin: 0 }}>
              Kelimeler ({words.length} kayıt gösteriliyor)
            </h3>
            {pagination && (
              <div style={{ fontSize: '14px', color: '#666' }}>
                Toplam: {pagination.totalMeanings.toLocaleString()} anlam, {pagination.totalWords.toLocaleString()} benzersiz kelime
              </div>
            )}
          </div>
          
          {words.map(renderWordCard)}
          
          {renderPagination()}
        </div>
      )}

      {/* Boş State */}
      {!isLoading && !error && words.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>🔍</div>
          <h3 style={{ color: '#6c757d' }}>Kelime Bulunamadı</h3>
          <p style={{ color: '#6c757d' }}>
            {searchQuery || difficultyFilter || partOfSpeechFilter
              ? 'Arama kriterlerinize uygun kelime bulunamadı.' 
              : 'Veritabanında henüz kelime bulunmuyor.'
            }
          </p>
          {(searchQuery || difficultyFilter || partOfSpeechFilter) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setDifficultyFilter('');
                setPartOfSpeechFilter('');
                setCurrentPage(1);
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Filtreleri Temizle
            </button>
          )}
        </div>
      )}

      {/* Bilgi Kutusu */}
      <div style={{
        backgroundColor: '#e9ecef',
        padding: '15px',
        borderRadius: '5px',
        marginTop: '20px',
        fontSize: '14px',
        color: '#495057'
      }}>
        <h4 style={{ margin: '0 0 10px 0' }}>ℹ️ Kelime Seçimi Hakkında</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <div>
            <strong>🎯 Seçim Kriterleri:</strong>
            <ul style={{ margin: '5px 0', paddingLeft: '15px', fontSize: '13px' }}>
              <li>Maksimum {maxSelections} kelime seçebilirsiniz</li>
              <li>Her kelime anlamı ayrı bir soru olacak</li>
              <li>Zorluk seviyesi ve tür filtresi kullanabilirsiniz</li>
              <li>Seçiminiz sayfalara göre korunur</li>
            </ul>
          </div>
          <div>
            <strong>🤖 Soru Kalitesi:</strong>
            <ul style={{ margin: '5px 0', paddingLeft: '15px', fontSize: '13px' }}>
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