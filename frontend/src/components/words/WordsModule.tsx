// frontend/src/components/words/WordsModule.tsx - GÜNCELLENMİŞ VERSİYON
import React, { useState, useEffect, useCallback } from 'react';
import { wordApi } from '../../services/api';
import type { Word, WordsResponse, WordFilters } from '../../types';

// Paylaşılan component'ler import ediliyor
import WordCard from './WordCard'; // Aynı klasörde olduğu varsayılıyor
import Pagination from '../shared/Pagination'; // ../shared/ altında olduğu varsayılıyor

import './WordsModule.css'; // Oluşturduğumuz CSS dosyası import ediliyor

interface WordStats {
  totalWords: number;
  totalMeanings: number;
  difficultyBreakdown: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
  partOfSpeechBreakdown: Record<string, number>;
  recentWords: number;
}

const WordsModule: React.FC = () => {
  const [words, setWords] = useState<Word[]>([]);
  const [stats, setStats] = useState<WordStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  // Pagination state'i için WordsResponse'dan gelen pagination objesini kullanalım
  const [paginationInfo, setPaginationInfo] = useState<WordsResponse['pagination'] | null>(null);


  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'beginner' | 'intermediate' | 'advanced' | ''>('');
  const [groupByWord, setGroupByWord] = useState(false);

  const pageSize = 20;

  const fetchWords = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const filters: WordFilters = {
        page: currentPage,
        limit: pageSize,
        groupByWord: groupByWord,
        search: searchQuery.trim() ? searchQuery.trim() : undefined,
        difficulty: difficultyFilter || undefined,
      };

      const data: WordsResponse = await wordApi.getWords(filters);
      
      setWords(data.words || (data.wordGroups ? data.wordGroups.flatMap(g => g.meanings) : []));
      setPaginationInfo(data.pagination || null); // Pagination bilgisini state'e ata
      setError('');

    } catch (err) {
      console.error('Kelime yükleme hatası:', err);
      setError(err instanceof Error ? err.message : 'Kelimeler yüklenirken hata oluştu');
      setWords([]);
      setPaginationInfo(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, difficultyFilter, groupByWord, pageSize]);

  const fetchStats = useCallback(async () => {
    // Gerçek bir stats API çağrısı olmadığından, paginationInfo'dan veri alıyoruz
    setStats({
      totalWords: paginationInfo?.totalWords || 0,
      totalMeanings: paginationInfo?.totalMeanings || 0,
      difficultyBreakdown: { beginner: 0, intermediate: 0, advanced: 0 }, // Placeholder
      partOfSpeechBreakdown: {}, // Placeholder
      recentWords: 0 // Placeholder
    });
  }, [paginationInfo]);

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  useEffect(() => {
    if (!isLoading && paginationInfo) {
        fetchStats();
    }
  }, [isLoading, paginationInfo, fetchStats]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Arama yapıldığında ilk sayfaya dön
    fetchWords(); // fetchWords zaten currentPage'e bağlı, ama yeni filtrelerle hemen tetiklemek için
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // getDifficultyColor fonksiyonu artık WordCard component'i içinde olmalı.
  // Eğer WordCard.tsx bu mantığı içermiyorsa, oraya taşınabilir veya
  // WordCard'a prop olarak renk geçilebilir. Şimdilik kaldırıyoruz.

  return (
    <div className="wordsModuleContainer">
      <div className="wordsModuleHeader">
        <h2>🗄️ Kelime Veritabanı</h2>
        <button
          onClick={fetchWords}
          disabled={isLoading}
          className="wordsModuleRefreshButton"
        >
          🔄 Yenile
        </button>
      </div>

      {stats && (
        <div className="statsGrid">
          <div className={`statCard ${groupByWord ? 'totalWords' : 'totalMeanings'}`}>
            <div className="statCardValue">
              {(groupByWord ? stats.totalWords : stats.totalMeanings).toLocaleString()}
            </div>
            <div className="statCardLabel">
              {groupByWord ? 'Toplam Benzersiz Kelime' : 'Toplam Anlam'}
            </div>
          </div>
          {!groupByWord && (
             <div className="statCard totalMeanings">
                <div className="statCardValue">{stats.totalMeanings.toLocaleString()}</div>
                <div className="statCardLabel">Toplam Anlam Sayısı</div>
            </div>
          )}
          <div className="statCard recentWords">
            <div className="statCardValue">{stats.recentWords}</div>
            <div className="statCardLabel">Son 24 Saat (Placeholder)</div>
          </div>
        </div>
      )}

      <div className="filterContainer">
        <form onSubmit={handleSearchSubmit} className="filterForm">
          <div className="filterGroup">
            <label htmlFor="wm-search" className="filterLabel">🔍 Kelime Ara:</label>
            <input
              id="wm-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Kelime veya anlam ara..."
              className="filterInput"
            />
          </div>
          
          <div className="filterGroup">
            <label htmlFor="wm-difficulty" className="filterLabel">📊 Zorluk:</label>
            <select
              id="wm-difficulty"
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value as WordFilters['difficulty'])}
              className="filterSelect"
            >
              <option value="">Tümü</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div className="filterGroup checkboxGroup">
            <input
              type="checkbox"
              id="wm-groupByWord"
              checked={groupByWord}
              onChange={(e) => {
                  setGroupByWord(e.target.checked);
                  setCurrentPage(1);
              }}
              className="filterCheckbox"
            />
            <label htmlFor="wm-groupByWord" className="filterLabel" style={{marginBottom: 0}}>
              📚 Kelime Bazında Grupla
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="filterSubmitButton"
          >
            Ara
          </button>
        </form>
      </div>

      {isLoading && <div className="loadingMessage">🔄 Kelimeler yükleniyor...</div>}
      {error && <div className="errorMessageContainer"><div className="errorMessage">❌ {error}</div></div>}

      {!isLoading && !error && words.length > 0 && (
        <>
          <div className="wordsListHeader">
            <h3>
              {groupByWord ? `Kelime Grupları (${paginationInfo?.totalWords || 0} benzersiz kelime)` : `Kelimeler (${paginationInfo?.totalMeanings || 0} anlam)`}
            </h3>
            {paginationInfo && (
                <span className="wordsListInfo">
                    Sayfa {currentPage} / {paginationInfo.totalPages}
                </span>
            )}
          </div>
          
          <div className="wordCardsGrid">
            {words.map(word => (
              // WordCard.tsx'in props'ları word objesini ve gerekirse diğer interaktif propları almalı
              <WordCard key={`${word.id}-${word.meaning_id}`} word={word} />
            ))}
          </div>
          
          {paginationInfo && paginationInfo.totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={paginationInfo.totalPages}
              onPageChange={handlePageChange}
              itemsPerPage={pageSize}
              totalItems={paginationInfo.totalItems} // totalItems API'den geliyorsa
              isLoading={isLoading}
            />
          )}
        </>
      )}

      {!isLoading && !error && words.length === 0 && (
        <div className="noWordsFoundContainer">
          <div className="noWordsFoundIcon">📭</div>
          <h3 className="noWordsFoundTitle">Kelime Bulunamadı</h3>
          <p className="noWordsFoundText">
            {searchQuery || difficultyFilter 
              ? 'Arama kriterlerinize uygun kelime bulunamadı.' 
              : 'Henüz veritabanında kelime bulunmuyor veya aktif kelime yok.'
            }
          </p>
          {(searchQuery || difficultyFilter) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setDifficultyFilter('');
                setCurrentPage(1);
                // fetchWords zaten tetiklenecek
              }}
              className="clearFiltersButton"
            >
              Filtreleri Temizle
            </button>
          )}
        </div>
      )}

      <div className="moduleInfoFooter">
        <h4>ℹ️ Kelime Veritabanı Bilgileri</h4>
        <div className="infoGrid">
          <div>
            <strong>🔧 Özellikler:</strong>
            <ul className="infoList">
              <li>Her kelime için çoklu anlam desteği</li>
              <li>6 aşamalı AI analizi ile oluşturulmuş</li>
              <li>Akademik seviyede örnek cümleler</li>
              <li>Context-aware Türkçe çeviriler</li>
            </ul>
          </div>
          <div>
            <strong>📊 Veri Kalitesi:</strong>
            <ul className="infoList">
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