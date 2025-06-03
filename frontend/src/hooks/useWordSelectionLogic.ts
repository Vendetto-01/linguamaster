// frontend/src/hooks/useWordSelectionLogic.ts
import { useState, useEffect, useCallback } from 'react';
import { wordApi } from '../services/api';
import type { Word, WordsResponse, WordFilters } from '../types';

interface UseWordSelectionLogicProps {
  onWordsSelected: (words: Word[]) => void; // Seçilen kelimeleri parent component'e bildirmek için callback
  initialSelectedWords?: Word[]; // Parent component'ten gelen başlangıçta seçili kelimeler
  initialPageSize?: number;
  initialMaxSelections?: number;
}

export const useWordSelectionLogic = ({
  onWordsSelected,
  initialSelectedWords = [],
  initialPageSize = 20,
  initialMaxSelections = 50,
}: UseWordSelectionLogicProps) => {
  const [words, setWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<WordsResponse['pagination'] | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<WordFilters['difficulty']>('');
  const [partOfSpeechFilter, setPartOfSpeechFilter] = useState('');
  
  const [localSelectedIds, setLocalSelectedIds] = useState<Set<number>>(() => new Set(initialSelectedWords.map(w => w.id)));
  const [selectAll, setSelectAll] = useState(false);

  const pageSize = initialPageSize;
  const maxSelections = initialMaxSelections;

  const fetchWords = useCallback(async (pageToFetch: number = currentPage) => {
    setIsLoading(true);
    setError('');
    try {
      const filters: WordFilters = {
        page: pageToFetch,
        limit: pageSize,
        groupByWord: false,
        search: searchQuery.trim() ? searchQuery.trim() : undefined,
        difficulty: difficultyFilter || undefined,
        partOfSpeech: partOfSpeechFilter || undefined,
      };

      const data = await wordApi.getWords(filters);
      
      setWords(data.words || []);
      setPagination(data.pagination || null);
      if (pageToFetch !== currentPage) { // Eğer sayfa değişmişse currentPage'i güncelle
        setCurrentPage(pageToFetch);
      }
      setSelectAll(false); // Her fetch sonrası "tümünü seç" durumunu sıfırla

    } catch (err) {
      console.error('Kelime yükleme hatası (hook):', err);
      setError(err instanceof Error ? err.message : 'Kelimeler yüklenirken hata oluştu');
      setWords([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, difficultyFilter, partOfSpeechFilter, pageSize]);

  useEffect(() => {
    fetchWords(1); // İlk yüklemede 1. sayfayı getir
  }, [searchQuery, difficultyFilter, partOfSpeechFilter]); // Sadece filtreler değiştiğinde ilk sayfayı yükle

  useEffect(() => {
    // initialSelectedWords değiştiğinde localSelectedIds'i güncelle
    // Bu, parent component'in seçimi dışarıdan değiştirmesine olanak tanır (örn: soru düzenleme)
    setLocalSelectedIds(new Set(initialSelectedWords.map(w => w.id)));
  }, [initialSelectedWords]);


  const handleSearch = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    // fetchWords useEffect içinde çağrılacak (searchQuery, difficultyFilter, partOfSpeechFilter değiştiği için)
    // ve ilk sayfadan başlayacak şekilde fetchWords'ü tetikler.
    setCurrentPage(1); // Bu, bir sonraki render'da fetchWords(1)'i tetikler (aşağıdaki useEffect ile)
    // Ya da doğrudan fetchWords(1) çağrılabilir, ancak filtre state'lerinin güncellenmesini beklemek daha iyi olabilir.
    // Şimdilik filtreler değiştiğinde tetiklenen useEffect'e güveniyoruz.
  }, []);


  const handleWordToggle = useCallback((word: Word) => {
    const newSelectedIds = new Set(localSelectedIds);
    let currentSelectedObjects = [...initialSelectedWords]; // Parent'tan gelen son seçili listeyi al

    if (newSelectedIds.has(word.id)) {
      newSelectedIds.delete(word.id);
      currentSelectedObjects = currentSelectedObjects.filter(w => w.id !== word.id);
    } else {
      if (newSelectedIds.size >= maxSelections) {
        alert(`Maksimum ${maxSelections} kelime seçebilirsiniz.`);
        return;
      }
      newSelectedIds.add(word.id);
      // Eğer kelime `initialSelectedWords` içinde yoksa (yani yeni ekleniyorsa)
      // ve `words` listesi içinde varsa, oradan alıp ekle.
      // Bu, kelimenin tüm detaylarını parent'a göndermek için önemlidir.
      if (!currentSelectedObjects.find(w => w.id === word.id)) {
         const fullWordObject = words.find(w => w.id === word.id) || word; // words listesinde yoksa gelen word objesini kullan
         currentSelectedObjects.push(fullWordObject);
      }
    }
    
    setLocalSelectedIds(newSelectedIds);
    onWordsSelected(currentSelectedObjects); // Güncellenmiş tam kelime objelerini parent'a gönder
  }, [localSelectedIds, initialSelectedWords, onWordsSelected, maxSelections, words]);

  const handleSelectAllOnPage = useCallback(() => {
    let newSelectedWordObjects: Word[];
    const currentWordIdsOnPage = new Set(words.map(w => w.id));

    if (selectAll) { // Sayfadaki tüm seçimleri kaldır
      const newLocalIds = new Set(localSelectedIds);
      words.forEach(word => newLocalIds.delete(word.id));
      setLocalSelectedIds(newLocalIds);
      
      newSelectedWordObjects = initialSelectedWords.filter(sw => !currentWordIdsOnPage.has(sw.id));
      setSelectAll(false);
    } else { // Sayfadaki tümünü seç (maksimum limite kadar)
      // Sayfada olmayan, ama zaten seçili olanları koru
      const currentSelectionNotOnPage = initialSelectedWords.filter(sw => !currentWordIdsOnPage.has(sw.id));
      // Sayfada olup, henüz seçilmemiş olanlar (potansiyel yeni seçimler)
      const potentialNewSelectionsOnPage = words.filter(w => !localSelectedIds.has(w.id));
      
      const availableSlots = maxSelections - currentSelectionNotOnPage.length;

      if (potentialNewSelectionsOnPage.length > availableSlots) {
        alert(`Bu sayfadan en fazla ${availableSlots} kelime daha seçebilirsiniz. (Toplam sınır: ${maxSelections})`);
        const selectableOnPage = potentialNewSelectionsOnPage.slice(0, availableSlots);
        
        const newLocalIds = new Set(localSelectedIds);
        selectableOnPage.forEach(word => newLocalIds.add(word.id));
        setLocalSelectedIds(newLocalIds);

        newSelectedWordObjects = [...currentSelectionNotOnPage, ...selectableOnPage];
        setSelectAll(false); 
      } else {
        const newLocalIds = new Set(localSelectedIds);
        potentialNewSelectionsOnPage.forEach(word => newLocalIds.add(word.id));
        setLocalSelectedIds(newLocalIds);

        newSelectedWordObjects = [...currentSelectionNotOnPage, ...potentialNewSelectionsOnPage];
        setSelectAll(true);
      }
    }
    onWordsSelected(newSelectedWordObjects);
  }, [selectAll, localSelectedIds, initialSelectedWords, words, maxSelections, onWordsSelected]);
  
  const handleClearAllSelections = useCallback(() => {
    setLocalSelectedIds(new Set());
    onWordsSelected([]);
    setSelectAll(false);
  }, [onWordsSelected]);

  const handlePageChange = useCallback((page: number) => {
    if (page > 0 && (!pagination || page <= pagination.totalPages)) {
      fetchWords(page); // Doğrudan yeni sayfayı fetch et
    }
    // setSelectAll(false) fetchWords içinde yapılıyor.
  }, [fetchWords, pagination]);

  return {
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
    fetchWords: () => fetchWords(currentPage), // Mevcut sayfayı yenilemek için
    handleSearch,
    handleWordToggle,
    handleSelectAllOnPage,
    handleClearAllSelections,
    handlePageChange,
    maxSelections,
    selectedCount: localSelectedIds.size,
    pageSize
  };
};