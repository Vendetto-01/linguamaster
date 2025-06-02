// frontend/src/components/questions/QuestionManagement.tsx - SORU YÖNETİMİ KOMPONENTİ
import React, { useState, useEffect } from 'react';
import { QuestionManagementProps } from '../../types/questions';

interface Question {
  id: number;
  word_id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  paragraph: string;
  times_shown: number;
  times_correct: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  words?: {
    word: string;
    meaning_id: number;
    part_of_speech: string;
    meaning_description: string;
    turkish_meaning: string;
    final_difficulty: string;
  };
}

interface QuestionsResponse {
  questions: Question[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalQuestions: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface QuestionStats {
  totalQuestions: number;
  activeQuestions: number;
  difficultyBreakdown: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
  recentQuestions: number;
}

const QuestionManagement: React.FC<QuestionManagementProps> = ({ refreshKey }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [stats, setStats] = useState<QuestionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<QuestionsResponse['pagination'] | null>(null);
  
  // Filtreler
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('true');
  
  // Seçim ve toplu işlemler
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isUpdating, setIsUpdating] = useState(false);

  const pageSize = 20;

  // Soruları getir
  const fetchQuestions = async () => {
    try {
      setIsLoading(true);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString()
      });

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      if (difficultyFilter) {
        params.append('difficulty', difficultyFilter);
      }

      if (activeFilter !== '') {
        params.append('isActive', activeFilter);
      }

      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/words/questions?${params}`
      );
      
      if (!response.ok) {
        throw new Error('Sorular yüklenemedi');
      }

      const data: QuestionsResponse = await response.json();
      
      setQuestions(data.questions || []);
      setPagination(data.pagination || null);
      setError('');

    } catch (err) {
      console.error('Soru yükleme hatası:', err);
      setError(err instanceof Error ? err.message : 'Sorular yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  // İstatistikleri getir
  const fetchStats = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/words/questions/stats`
      );
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('İstatistik yükleme hatası:', err);
    }
  };

  useEffect(() => {
    fetchQuestions();
    fetchStats();
  }, [currentPage, searchQuery, difficultyFilter, activeFilter, refreshKey]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchQuestions();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Tekil soru durumu değiştir
  const handleToggleQuestion = async (questionId: number) => {
    try {
      setIsUpdating(true);
      
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/words/questions/${questionId}/toggle-active`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        throw new Error('Soru durumu değiştirilemedi');
      }

      // Listeyi yenile
      await fetchQuestions();
      await fetchStats();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem başarısız');
    } finally {
      setIsUpdating(false);
    }
  };

  // Soru sil
  const handleDeleteQuestion = async (questionId: number) => {
    if (!confirm('Bu soruyu silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      setIsUpdating(true);
      
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/words/questions/${questionId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Soru silinemedi');
      }

      // Listeyi yenile
      await fetchQuestions();
      await fetchStats();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Silme işlemi başarısız');
    } finally {
      setIsUpdating(false);
    }
  };

  // Toplu işlem
  const handleBulkOperation = async (operation: 'activate' | 'deactivate' | 'delete') => {
    if (selectedIds.size === 0) {
      alert('Lütfen işlem yapılacak soruları seçin');
      return;
    }

    const confirmMessage = operation === 'delete' 
      ? `${selectedIds.size} soruyu silmek istediğinizden emin misiniz?`
      : `${selectedIds.size} soruyu ${operation === 'activate' ? 'aktif' : 'pasif'} yapmak istediğinizden emin misiniz?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setIsUpdating(true);
      
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/words/questions/bulk`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            questionIds: Array.from(selectedIds),
            operation
          })
        }
      );

      if (!response.ok) {
        throw new Error('Toplu işlem başarısız');
      }

      const result = await response.json();
      alert(result.message);

      // Seçimi temizle ve listeyi yenile
      setSelectedIds(new Set());
      await fetchQuestions();
      await fetchStats();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Toplu işlem başarısız');
    } finally {
      setIsUpdating(false);
    }
  };

  // Seçim yönetimi
  const handleQuestionSelect = (questionId: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === questions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(questions.map(q => q.id)));
    }
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

  const renderQuestionCard = (question: Question) => {
    const isSelected = selectedIds.has(question.id);
    const word = question.words;
    
    return (
      <div
        key={question.id}
        style={{
          backgroundColor: isSelected ? '#e8f5e8' : '#ffffff',
          border: isSelected ? '2px solid #28a745' : '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '15px',
          transition: 'all 0.3s ease'
        }}
      >
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          marginBottom: '15px'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleQuestionSelect(question.id)}
                style={{ marginRight: '10px', transform: 'scale(1.2)' }}
              />
              
              <h4 style={{ margin: '0', color: '#2c3e50', fontSize: '16px' }}>
                {word?.word || 'Unknown'} 
                <span style={{ fontSize: '14px', color: '#7f8c8d', marginLeft: '8px' }}>
                  (anlam #{word?.meaning_id || '?'})
                </span>
              </h4>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{
                backgroundColor: getDifficultyColor(question.difficulty),
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {question.difficulty}
              </span>
              <span style={{
                backgroundColor: '#f8f9fa',
                color: '#495057',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                border: '1px solid #dee2e6'
              }}>
                {word?.part_of_speech || 'unknown'}
              </span>
              <span style={{
                backgroundColor: question.is_active ? '#d4edda' : '#f8d7da',
                color: question.is_active ? '#155724' : '#721c24',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {question.is_active ? 'Aktif' : 'Pasif'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleToggleQuestion(question.id)}
              disabled={isUpdating}
              style={{
                padding: '6px 12px',
                backgroundColor: question.is_active ? '#ffc107' : '#28a745',
                color: question.is_active ? '#212529' : 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {question.is_active ? '⏸️ Pasif Yap' : '▶️ Aktif Yap'}
            </button>
            
            <button
              onClick={() => handleDeleteQuestion(question.id)}
              disabled={isUpdating}
              style={{
                padding: '6px 12px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              🗑️ Sil
            </button>
          </div>
        </div>

        {/* Question Content */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '15px',
          borderRadius: '6px',
          marginBottom: '15px'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#495057', marginBottom: '10px' }}>
            Soru:
          </div>
          <div style={{ fontSize: '15px', color: '#2c3e50', marginBottom: '15px' }}>
            {question.question_text}
          </div>

          {/* Options */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '8px'
          }}>
            {[
              { key: 'A', text: question.option_a },
              { key: 'B', text: question.option_b },
              { key: 'C', text: question.option_c },
              { key: 'D', text: question.option_d }
            ].map(option => (
              <div
                key={option.key}
                style={{
                  padding: '8px 12px',
                  backgroundColor: option.key === question.correct_answer ? '#d4edda' : '#ffffff',
                  border: option.key === question.correct_answer ? '2px solid #28a745' : '1px solid #dee2e6',
                  borderRadius: '4px',
                  fontSize: '13px'
                }}
              >
                <strong>{option.key})</strong> {option.text}
                {option.key === question.correct_answer && (
                  <span style={{ color: '#28a745', marginLeft: '8px' }}>✓</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Explanation */}
        <div style={{
          backgroundColor: '#e7f3ff',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '10px'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0066cc', marginBottom: '5px' }}>
            Açıklama:
          </div>
          <div style={{ fontSize: '13px', color: '#495057' }}>
            {question.explanation}
          </div>
        </div>

        {/* Context Paragraph */}
        <div style={{
          backgroundColor: '#fff3cd',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '10px'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#856404', marginBottom: '5px' }}>
            Bağlam Cümlesi:
          </div>
          <div style={{ fontSize: '13px', color: '#495057', fontStyle: 'italic' }}>
            "{question.paragraph}"
          </div>
        </div>

        {/* Statistics */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          fontSize: '12px',
          color: '#6c757d',
          borderTop: '1px solid #dee2e6',
          paddingTop: '10px'
        }}>
          <div>
            <strong>Türkçe Karşılık:</strong> {word?.turkish_meaning || 'N/A'}
          </div>
          <div>
            <strong>Gösterilme:</strong> {question.times_shown} | 
            <strong>Doğru:</strong> {question.times_correct} | 
            <strong>Oluşturulma:</strong> {new Date(question.created_at).toLocaleDateString('tr-TR')}
          </div>
        </div>
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
        <h2>📋 Soru Yönetimi</h2>
        <button
          onClick={() => {
            fetchQuestions();
            fetchStats();
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
          🔄 Yenile
        </button>
      </div>

      {/* İstatistikler */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minWidth(150px, 1fr))',
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
              {stats.totalQuestions.toLocaleString()}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>Toplam Soru</div>
          </div>
          
          <div style={{
            backgroundColor: '#e8f5e8',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' }}>
              {stats.activeQuestions.toLocaleString()}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>Aktif Soru</div>
          </div>
          
          <div style={{
            backgroundColor: '#fff3e0',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f57c00' }}>
              {stats.recentQuestions}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>Son 24 Saat</div>
          </div>

          <div style={{
            backgroundColor: '#f3e5f5',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#7b1fa2' }}>
              B:{stats.difficultyBreakdown.beginner} | 
              I:{stats.difficultyBreakdown.intermediate} | 
              A:{stats.difficultyBreakdown.advanced}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>Zorluk Dağılımı</div>
          </div>
        </div>
      )}

      {/* Toplu İşlem Kontrolleri */}
      {selectedIds.size > 0 && (
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
              <strong>✅ {selectedIds.size} soru seçili</strong>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => handleBulkOperation('activate')}
                disabled={isUpdating}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ▶️ Aktif Yap
              </button>
              
              <button
                onClick={() => handleBulkOperation('deactivate')}
                disabled={isUpdating}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#ffc107',
                  color: '#212529',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ⏸️ Pasif Yap
              </button>
              
              <button
                onClick={() => handleBulkOperation('delete')}
                disabled={isUpdating}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                🗑️ Sil
              </button>
              
              <button
                onClick={() => setSelectedIds(new Set())}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ❌ Seçimi Temizle
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
                🔍 Soru Ara:
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Soru metni veya kelime ara..."
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

            <div style={{ minWidth: '120px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
                🎯 Durum:
              </label>
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="">Tümü</option>
                <option value="true">Aktif</option>
                <option value="false">Pasif</option>
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
        {questions.length > 0 && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={handleSelectAll}
              style={{
                padding: '6px 12px',
                backgroundColor: selectedIds.size === questions.length ? '#dc3545' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              {selectedIds.size === questions.length ? '❌ Sayfa Seçimini Kaldır' : '✅ Tüm Sayfayı Seç'}
            </button>
            
            <span style={{ fontSize: '13px', color: '#666' }}>
              Bu sayfada {questions.length} soru
            </span>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '18px', color: '#666' }}>
            🔄 Sorular yükleniyor...
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

      {/* Soru Listesi */}
      {!isLoading && !error && questions.length > 0 && (
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <h3 style={{ margin: 0 }}>
              Sorular ({questions.length} kayıt gösteriliyor)
            </h3>
            {pagination && (
              <div style={{ fontSize: '14px', color: '#666' }}>
                Toplam: {pagination.totalQuestions.toLocaleString()} soru
              </div>
            )}
          </div>
          
          {questions.map(renderQuestionCard)}
          
          {renderPagination()}
        </div>
      )}

      {/* Boş State */}
      {!isLoading && !error && questions.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>❓</div>
          <h3 style={{ color: '#6c757d' }}>Soru Bulunamadı</h3>
          <p style={{ color: '#6c757d' }}>
            {searchQuery || difficultyFilter || activeFilter !== ''
              ? 'Arama kriterlerinize uygun soru bulunamadı.' 
              : 'Henüz oluşturulmuş soru bulunmuyor.'
            }
          </p>
          {(searchQuery || difficultyFilter || activeFilter !== '') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setDifficultyFilter('');
                setActiveFilter('true');
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
        <h4 style={{ margin: '0 0 10px 0' }}>ℹ️ Soru Yönetimi Hakkında</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minWidth(250px, 1fr))', gap: '15px' }}>
          <div>
            <strong>🔧 Yönetim Özellikleri:</strong>
            <ul style={{ margin: '5px 0', paddingLeft: '15px', fontSize: '13px' }}>
              <li>Tekil ve toplu soru düzenleme</li>
              <li>Aktif/pasif durum yönetimi</li>
              <li>Gelişmiş filtreleme ve arama</li>
              <li>Soru kalitesi görüntüleme</li>
            </ul>
          </div>
          <div>
            <strong>📊 Soru Kalitesi:</strong>
            <ul style={{ margin: '5px 0', paddingLeft: '15px', fontSize: '13px' }}>
              <li>AI tarafından oluşturulmuş sorular</li>
              <li>Context-aware seçenekler</li>
              <li>Zorluk seviyesi uyumluluğu</li>
              <li>Otomatik kalite kontrolleri</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionManagement;