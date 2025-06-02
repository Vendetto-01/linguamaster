// frontend/src/components/words/WordsModule.tsx - KELİME VERİTABANI GÖRÜNTÜLEME
import React, { useState, useEffect } from 'react';
import { wordApi } from '../../services/api';

interface WordStats {
  totalWords: number;
  totalMeanings: number;
  difficultyBreakdown: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
  partOfSpeechBreakdown: Record<string, number>;
  recentWords: number; // Son 24 saatte eklenen
}

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

const WordsModule: React.FC = () => {
  const [words, setWords] = useState<Word[]>([]);
  const [stats, setStats] = useState<WordStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [groupByWord, setGroupByWord] = useState(false);

  const pageSize = 20;

  // Kelimeleri getir
  const fetchWords = async () => {
    try {
      setIsLoading(true);
      
      // WordApi'den kelime listesi al (mevcut endpoint'i kullan)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        groupByWord: groupByWord.toString()
      });

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      if (difficultyFilter) {
        params.append('difficulty', difficultyFilter);
      }

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/words?${params}`);
      
      if (!response.ok) {
        throw new Error('Kelimeler yüklenemedi');
      }

      const data = await response.json();
      
      setWords(data.words || []);
      setTotalPages(data.pagination?.totalPages || 0);
      setError('');

    } catch (err) {
      console.error('Kelime yükleme hatası:', err);
      setError(err instanceof Error ? err.message : 'Kelimeler yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  // İstatistikleri getir (basit bir endpoint yazacağız backend'e)
  const fetchStats = async () => {
    try {
      // Basit istatistikler için words endpoint'ini kullan
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/words?limit=1`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Temel istatistikler (gerçek istatistik endpoint'i eklenene kadar placeholder)
        setStats({
          totalWords: data.pagination?.totalWords || 0,
          totalMeanings: data.pagination?.totalMeanings || 0,
          difficultyBreakdown: {
            beginner: 0,
            intermediate: 0,
            advanced: 0
          },
          partOfSpeechBreakdown: {},
          recentWords: 0
        });
      }
    } catch (err) {
      console.error('İstatistik yükleme hatası:', err);
    }
  };

  useEffect(() => {
    fetchWords();
    fetchStats();
  }, [currentPage, searchQuery, difficultyFilter, groupByWord]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchWords();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

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
            color: currentPage === 1 ? '#6c757d' : '#007bff',
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
              backgroundColor: currentPage === pageNum ? '#007bff' : '#fff',
              color: currentPage === pageNum ? 'white' : '#007bff',
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
          disabled={currentPage === totalPages}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            backgroundColor: currentPage === totalPages ? '#f8f9fa' : '#fff',
            color: currentPage === totalPages ? '#6c757d' : '#007bff',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            borderRadius: '4px'
          }}
        >
          Sonraki →
        </button>

        <span style={{ marginLeft: '15px', fontSize: '14px', color: '#666' }}>
          {currentPage} / {totalPages} sayfa
        </span>
      </div>
    );
  };

  const renderWordCard = (word: Word) => (
    <div
      key={`${word.id}-${word.meaning_id}`}
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '15px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        e.currentTarget.style.transform = 'none';
      }}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '10px'
      }}>
        <div>
          <h3 style={{ 
            margin: '0 0 5px 0', 
            color: '#2c3e50',
            fontSize: '20px',
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
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
        <div style={{ fontSize: '12px', color: '#6c757d' }}>
          {new Date(word.created_at).toLocaleDateString('tr-TR')}
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
        backgroundColor: '#f8f9fa',
        padding: '10px',
        borderRadius: '5px',
        borderLeft: '4px solid #007bff'
      }}>
        <div style={{ fontSize: '13px', color: '#666', marginBottom: '3px' }}>
          Örnek Cümle:
        </div>
        <div style={{ fontSize: '14px', color: '#2c3e50', fontStyle: 'italic' }}>
          "{word.english_example}"
        </div>
      </div>
    </div>
  );

  // Zorluk seviyesi renkleri
  function getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'beginner': return '#28a745';
      case 'intermediate': return '#ffc107';
      case 'advanced': return '#dc3545';
      default: return '#6c757d';
    }
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2>🗄️ Kelime Veritabanı</h2>
        <button
          onClick={() => {
            fetchWords();
            fetchStats();
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔄 Yenile
        </button>
      </div>

      {/* İstatistikler */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginBottom: '25px'
        }}>
          <div style={{
            backgroundColor: '#e3f2fd',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>
              {stats.totalWords.toLocaleString()}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>Toplam Kelime</div>
          </div>
          
          <div style={{
            backgroundColor: '#f3e5f5',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#7b1fa2' }}>
              {stats.totalMeanings.toLocaleString()}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>Toplam Anlam</div>
          </div>
          
          <div style={{
            backgroundColor: '#e8f5e8',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#388e3c' }}>
              {stats.recentWords}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>Son 24 Saat</div>
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
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'end' }}>
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
          
          <div style={{ minWidth: '150px' }}>
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="groupByWord"
              checked={groupByWord}
              onChange={(e) => setGroupByWord(e.target.checked)}
              style={{ transform: 'scale(1.2)' }}
            />
            <label htmlFor="groupByWord" style={{ fontSize: '14px', fontWeight: 'bold' }}>
              📚 Kelime Bazında Grupla
            </label>
          </div>

          <button
            type="submit"
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Ara
          </button>
        </form>
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
            <div style={{ fontSize: '14px', color: '#666' }}>
              Sayfa {currentPage} / {totalPages}
            </div>
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
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>📭</div>
          <h3 style={{ color: '#6c757d' }}>Kelime Bulunamadı</h3>
          <p style={{ color: '#6c757d' }}>
            {searchQuery || difficultyFilter 
              ? 'Arama kriterlerinize uygun kelime bulunamadı.' 
              : 'Henüz veritabanında kelime bulunmuyor.'
            }
          </p>
          {(searchQuery || difficultyFilter) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setDifficultyFilter('');
                setCurrentPage(1);
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
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
        <h4 style={{ margin: '0 0 10px 0' }}>ℹ️ Kelime Veritabanı Bilgileri</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
          <div>
            <strong>🔧 Özellikler:</strong>
            <ul style={{ margin: '5px 0', paddingLeft: '15px', fontSize: '13px' }}>
              <li>Her kelime için çoklu anlam desteği</li>
              <li>6 aşamalı AI analizi ile oluşturulmuş</li>
              <li>Akademik seviyede örnek cümleler</li>
              <li>Context-aware Türkçe çeviriler</li>
            </ul>
          </div>
          <div>
            <strong>📊 Veri Kalitesi:</strong>
            <ul style={{ margin: '5px 0', paddingLeft: '15px', fontSize: '13px' }}>
              <li>Gemini 2.0 Flash AI ile analiz edilmiş</li>
              <li>Zorluk seviyeleri context'e göre ayarlanmış</li>
              <li>Kelime türleri doğrulanmış</li>
              <li>Duplicate kontrolü yapılmış</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordsModule;