// frontend/src/shared/modals/ConfirmDeleteModal.tsx
import React, { useState } from 'react';
import { Question } from '../../types/questions';
import { modalStyles } from './modalStyles';

interface ConfirmDeleteModalProps {
  show: boolean;
  question: Question | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  show,
  question,
  onClose,
  onConfirm
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!show || !question) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  const truncatedQuestion = question.question_text?.substring(0, 100) || '';
  const displayText = truncatedQuestion.length === 100 ? `${truncatedQuestion}...` : truncatedQuestion;

  return (
    <div style={modalStyles.overlay}>
      <div style={{ ...modalStyles.modal, maxWidth: '500px' }}>
        <h3 style={{ marginTop: 0, color: '#dc3545' }}>
          🗑️ Soruyu Sil
        </h3>
        
        <div style={{ marginBottom: '20px' }}>
          <p style={{ margin: '0 0 15px 0', fontSize: '16px' }}>
            Bu soruyu kalıcı olarak silmek istediğinizden emin misiniz?
          </p>
          
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '15px',
            borderRadius: '5px',
            border: '1px solid #dee2e6',
            marginBottom: '15px'
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
              <strong>Soru ID:</strong> {question.id}
            </div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
              <strong>Kelime:</strong> {question.word?.word || 'Bilinmiyor'}
            </div>
            <div style={{ fontSize: '14px', color: '#495057' }}>
              <strong>Soru:</strong> "{displayText}"
            </div>
          </div>
          
          <div style={{
            backgroundColor: '#fff3cd',
            padding: '10px',
            borderRadius: '4px',
            border: '1px solid #ffeaa7',
            fontSize: '14px',
            color: '#856404'
          }}>
            <strong>⚠️ Uyarı:</strong> Bu işlem geri alınamaz. Soru ve tüm istatistikleri kalıcı olarak silinecektir.
          </div>
        </div>

        <div style={modalStyles.buttonGroup}>
          <button 
            onClick={handleConfirm} 
            style={{ 
              ...modalStyles.button, 
              ...modalStyles.deleteButton,
              opacity: isDeleting ? 0.7 : 1
            }}
            disabled={isDeleting}
          >
            {isDeleting ? '⏳ Siliniyor...' : '🗑️ Evet, Sil'}
          </button>
          <button 
            onClick={onClose} 
            style={{ ...modalStyles.button, ...modalStyles.cancelButton }}
            disabled={isDeleting}
          >
            İptal
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;