// frontend/src/components/questions/QuestionManagement.tsx - GÜNCELLENMİŞ VERSİYON
import React, { useEffect } from 'react';
import { useQuestionManagementLogic } from '../../hooks/useQuestionManagementLogic';
import type { Question, QuestionFilterParams, QuestionSortParams } from '../../types/questions';

// Paylaşılan component'lerin import edildiğini varsayıyoruz (dosya yolları doğru olmalı)
import FilterBar from '../shared/Filterbar'; // Büyük/küçük harf FilterBar.tsx olabilir, kontrol edilecek
import QuestionCard from './QuestionCard'; // Bu zaten Question modülünde
import Pagination from '../shared/Pagination'; // Büyük/küçük harf Pagination.tsx olabilir

// Modal component'leri (bunlar QuestionManagement içinde kalabilir veya ayrı dosyalara taşınabilir)
// Şimdilik QuestionManagement içinde bırakıyoruz.
const QuestionEditModal: React.FC<{
  show: boolean;
  question: Question | null;
  onClose: () => void;
  onSave: (updatedQuestion: Question) => Promise<boolean>;
}> = ({ show, question, onClose, onSave }) => {
  const [editedQuestion, setEditedQuestion] = React.useState<Question | null>(null);

  React.useEffect(() => {
    setEditedQuestion(question ? { ...question } : null);
  }, [question]);

  if (!show || !editedQuestion) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      if (name === 'is_active') {
        setEditedQuestion(prev => prev ? { ...prev, [name]: checked } : null);
      }
      // options ve correct_options için özel handle gerekebilir
    } else if (name.startsWith('options.')) {
      const [_, indexStr] = name.split('.');
      const index = parseInt(indexStr, 10);
      setEditedQuestion(prev => {
        if (!prev) return null;
        const newOptions = [...(prev.options || [])];
        newOptions[index] = value;
        return { ...prev, options: newOptions };
      });
    } else if (name.startsWith('correct_options.')) {
        const [_, indexStr] = name.split('.');
        const index = parseInt(indexStr, 10);
        setEditedQuestion(prev => {
            if (!prev) return null;
            const newCorrectOptions = [...(prev.correct_options || [])];
            newCorrectOptions[index] = value;
            return { ...prev, correct_options: newCorrectOptions };
        });
    } else {
      setEditedQuestion(prev => prev ? { ...prev, [name]: value } : null);
    }
  };
  
  const handleOptionChange = (index: number, value: string) => {
    setEditedQuestion(prev => {
      if (!prev) return null;
      const newOptions = [...(prev.options || ['','','',''])];
      newOptions[index] = value;
      return { ...prev, options: newOptions };
    });
  };

  const handleCorrectOptionChange = (index: number, value: string) => {
    setEditedQuestion(prev => {
      if (!prev) return null;
      const newCorrectOptions = [...(prev.correct_options || [''])]; // Genellikle tek doğru cevap
      newCorrectOptions[index] = value; // Eğer birden fazla ise mantık değişebilir
      return { ...prev, correct_options: newCorrectOptions };
    });
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editedQuestion) {
      const success = await onSave(editedQuestion);
      // Başarılı/başarısız mesajı hook'ta yönetiliyor, burada ekstra bir şey yapmaya gerek yok.
      // İstenirse burada da bir bildirim gösterilebilir.
    }
  };

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.modal}>
        <h3 style={{marginTop: 0}}>Soruyu Düzenle (ID: {editedQuestion.id})</h3>
        <form onSubmit={handleSubmit}>
          {/* Soru Metni */}
          <div style={modalStyles.formGroup}>
            <label htmlFor="question_text">Soru Metni:</label>
            <textarea
              id="question_text"
              name="question_text"
              value={editedQuestion.question_text || ''}
              onChange={handleChange}
              rows={3}
              style={modalStyles.input}
            />
          </div>

          {/* Seçenekler */}
          {(editedQuestion.options || ['','','','']).map((option, index) => (
            <div style={modalStyles.formGroup} key={`option-${index}`}>
              <label htmlFor={`option-${index}`}>Seçenek {index + 1}:</label>
              <input
                type="text"
                id={`option-${index}`}
                name={`options.${index}`}
                value={option || ''}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                style={modalStyles.input}
              />
            </div>
          ))}
          
          {/* Doğru Seçenek(ler) */}
            <div style={modalStyles.formGroup}>
                <label htmlFor="correct_options.0">Doğru Seçenek (Metin):</label>
                <input
                type="text"
                id="correct_options.0"
                name="correct_options.0" // Sadece ilk doğru seçeneği düzenliyoruz, eğer birden fazlaysa yapı değişmeli
                value={editedQuestion.correct_options?.[0] || ''}
                onChange={(e) => handleCorrectOptionChange(0, e.target.value)}
                style={modalStyles.input}
                placeholder="Doğru olan seçeneğin metnini girin"
                />
            </div>


          {/* Zorluk */}
          <div style={modalStyles.formGroup}>
            <label htmlFor="difficulty">Zorluk:</label>
            <select 
              name="difficulty" 
              value={editedQuestion.difficulty || ''} 
              onChange={handleChange} 
              style={modalStyles.input}
            >
              <option value="">Seçiniz</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          {/* Tür */}
          <div style={modalStyles.formGroup}>
            <label htmlFor="type">Tür:</label>
            <select 
              name="type" 
              value={editedQuestion.type || ''} 
              onChange={handleChange} 
              style={modalStyles.input}
            >
              <option value="">Seçiniz</option>
              <option value="multiple_choice">Çoktan Seçmeli</option>
              <option value="fill_in_the_blank">Boşluk Doldurma</option>
              {/* Diğer türler */}
            </select>
          </div>
          
          {/* Aktif mi? */}
          <div style={modalStyles.formGroup}>
            <label htmlFor="is_active" style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={editedQuestion.is_active || false}
                onChange={handleChange}
                style={{ marginRight: '8px' }}
              />
              Soru Aktif mi?
            </label>
          </div>


          <div style={modalStyles.buttonGroup}>
            <button type="submit" style={{ ...modalStyles.button, ...modalStyles.saveButton }}>
              💾 Kaydet
            </button>
            <button type="button" onClick={onClose} style={{ ...modalStyles.button, ...modalStyles.cancelButton }}>
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ConfirmDeleteModal: React.FC<{
  show: boolean;
  question: Question | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}> = ({ show, question, onClose, onConfirm }) => {
  if (!show || !question) return null;

  return (
    <div style={modalStyles.overlay}>
      <div style={{...modalStyles.modal, maxWidth: '400px'}}>
        <h3 style={{marginTop:0}}>Soruyu Sil</h3>
        <p>
          "{question.question_text?.substring(0, 50)}..." (ID: {question.id}) sorusunu kalıcı olarak silmek istediğinizden emin misiniz?
        </p>
        <div style={modalStyles.buttonGroup}>
          <button onClick={onConfirm} style={{ ...modalStyles.button, ...modalStyles.deleteButton }}>
            🗑️ Evet, Sil
          </button>
          <button onClick={onClose} style={{ ...modalStyles.button, ...modalStyles.cancelButton }}>
            İptal
          </button>
        </div>
      </div>
    </div>
  );
};

const modalStyles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '8px',
    boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflowY: 'auto'
  },
  formGroup: {
    marginBottom: '15px',
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '20px',
  },
  button: {
    padding: '10px 18px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  saveButton: {
    backgroundColor: '#28a745',
    color: 'white',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    color: 'white',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    color: 'white',
  },
};


const QuestionManagement: React.FC<{ refreshKey?: number }> = ({ refreshKey }) => {
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
    pageSize, // Hook'tan pageSize'ı alıyoruz

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
  } = useQuestionManagementLogic({ initialPageSize: 10 }); // İsterseniz farklı bir pageSize ile başlatabilirsiniz

  useEffect(() => {
    // refreshKey prop'u değiştiğinde verileri yeniden çek
    if (refreshKey !== undefined) { // Sadece refreshKey tanımlıysa çalışsın
      fetchQuestions();
    }
  }, [refreshKey, fetchQuestions]);


  const filterBarFields = [
    { name: 'searchTerm', label: 'Ara', type: 'text', placeholder: 'Soru metni, kelime...' },
    { name: 'difficulty', label: 'Zorluk', type: 'select', options: [{value:'', label: 'Tümü'}, {value:'beginner', label:'Beginner'}, {value:'intermediate', label:'Intermediate'}, {value:'advanced', label:'Advanced'}] },
    { name: 'type', label: 'Tür', type: 'select', options: [{value:'', label: 'Tümü'}, {value:'multiple_choice', label:'Çoktan Seçmeli'}, {value:'fill_in_the_blank', label:'Boşluk Doldurma'}] },
    { name: 'source', label: 'Kaynak', type: 'select', options: [{value:'', label: 'Tümü'}, {value:'generated', label:'AI Üretimi'}, {value:'manual', label:'Manuel Giriş'}] },
    { name: 'hasEmbedding', label: 'Embedding', type: 'select', options: [{value:'', label:'Tümü'},{value:'true', label:'Var'},{value:'false', label:'Yok'}] },
  ];
  
  // Sıralama seçenekleri
  const sortOptions = [
    { value: 'created_at,desc', label: 'Eklenme Tarihi (Yeni)' },
    { value: 'created_at,asc', label: 'Eklenme Tarihi (Eski)' },
    { value: 'updated_at,desc', label: 'Güncellenme (Yeni)' },
    { value: 'updated_at,asc', label: 'Güncellenme (Eski)' },
    { value: 'difficulty,asc', label: 'Zorluk (Artan)' },
    { value: 'difficulty,desc', label: 'Zorluk (Azalan)' },
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px' }}>Soru Yönetimi</h2>

      {/* Filtreleme Barı (Paylaşılan FilterBar component'i kullanılacak) */}
      <FilterBar
        fields={filterBarFields}
        filters={filters}
        onFilterChange={(name, value) => handleFilterChange(name as keyof QuestionFilterParams, value)}
        onSearch={() => fetchQuestions(1)} // Arama butonu fetch'i tetiklesin
        isLoading={isLoading}
        // sortOptions={sortOptions} // FilterBar'a sıralama yeteneği eklenebilir
        // currentSort={`${sort.sortBy},${sort.sortOrder}`}
        // onSortChange={(value) => {
        //   const [sortBy, sortOrder] = value.split(',');
        //   handleSortChange({ sortBy, sortOrder: sortOrder as 'asc' | 'desc' });
        // }}
      />
       {/* Basit sıralama dropdown'ı */}
       <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px' }}>
            <label htmlFor="sort-questions" style={{fontWeight: 'bold'}}>Sırala:</label>
            <select
                id="sort-questions"
                value={`${sort.sortBy},${sort.sortOrder}`}
                onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split(',');
                    handleSortChange({ sortBy, sortOrder: sortOrder as 'asc' | 'desc' });
                }}
                disabled={isLoading}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
                {sortOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>


      {isLoading && <div style={{ textAlign: 'center', padding: '30px', fontSize: '18px' }}>🔄 Sorular yükleniyor...</div>}
      {error && <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>❌ Hata: {error}</div>}

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
              <span>{selectedIds.size} soru seçildi.</span>
              <button
                onClick={handleBulkDelete}
                disabled={isLoading}
                style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}
              >
                🗑️ Seçilenleri Sil
              </button>
            </div>
          )}

          {/* Soru Listesi */}
          {questions.length > 0 ? (
            <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: '1fr' }}> {/* Tek sütunlu liste */}
              {/* Tümünü Seç Checkbox'ı */}
              <div style={{ padding: '10px', borderBottom: '1px solid #eee', display:'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={selectAllOnPage}
                  onChange={toggleSelectAllOnPage}
                  disabled={questions.length === 0 || isLoading}
                  style={{ marginRight: '10px', transform: 'scale(1.2)' }}
                  id="select-all-questions"
                />
                <label htmlFor="select-all-questions" style={{fontWeight: 'bold'}}>
                  Sayfadaki Tüm Soruları Seç ({selectedIds.size} / {questions.length})
                </label>
              </div>

              {questions.map((question) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  isSelected={selectedIds.has(question.id)}
                  onSelect={() => toggleSelectQuestion(question.id)}
                  onEdit={() => handleEdit(question)}
                  onDelete={() => handleDelete(question)}
                />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px', fontSize: '16px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
              Gösterilecek soru bulunamadı. Filtrelerinizi kontrol edin veya yeni sorular ekleyin.
            </div>
          )}

          {/* Sayfalama (Paylaşılan Pagination component'i kullanılacak) */}
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