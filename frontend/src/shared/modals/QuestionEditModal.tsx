// frontend/src/shared/modals/QuestionEditModal.tsx
import React, { useState, useEffect } from 'react';
import { Question } from '../../types/questions';
import { modalStyles } from './modalStyles';

interface QuestionEditModalProps {
  show: boolean;
  question: Question | null;
  onClose: () => void;
  onSave: (updatedQuestion: Question) => Promise<boolean>;
}

const QuestionEditModal: React.FC<QuestionEditModalProps> = ({
  show,
  question,
  onClose,
  onSave
}) => {
  const [editedQuestion, setEditedQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
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
    } else {
      setEditedQuestion(prev => prev ? { ...prev, [name]: value } : null);
    }
  };
  
  const handleOptionChange = (index: number, value: string) => {
    setEditedQuestion(prev => {
      if (!prev) return null;
      const updatedQuestion = { ...prev };
      
      // Option alanlarını güncelle
      switch (index) {
        case 0: updatedQuestion.option_a = value; break;
        case 1: updatedQuestion.option_b = value; break;
        case 2: updatedQuestion.option_c = value; break;
        case 3: updatedQuestion.option_d = value; break;
      }
      
      return updatedQuestion;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedQuestion) return;
    
    setIsLoading(true);
    try {
      const success = await onSave(editedQuestion);
      if (success) {
        onClose();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const options = [
    editedQuestion.option_a,
    editedQuestion.option_b,
    editedQuestion.option_c,
    editedQuestion.option_d
  ];

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.modal}>
        <h3 style={{ marginTop: 0 }}>
          Soruyu Düzenle (ID: {editedQuestion.id})
        </h3>
        
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
              required
            />
          </div>

          {/* Seçenekler */}
          {options.map((option, index) => (
            <div style={modalStyles.formGroup} key={`option-${index}`}>
              <label htmlFor={`option-${index}`}>
                Seçenek {String.fromCharCode(65 + index)}:
              </label>
              <input
                type="text"
                id={`option-${index}`}
                value={option || ''}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                style={modalStyles.input}
                required
              />
            </div>
          ))}
          
          {/* Doğru Seçenek */}
          <div style={modalStyles.formGroup}>
            <label htmlFor="correct_answer">Doğru Seçenek:</label>
            <select
              id="correct_answer"
              name="correct_answer"
              value={editedQuestion.correct_answer || 'A'}
              onChange={handleChange}
              style={modalStyles.input}
              required
            >
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </div>

          {/* Açıklama */}
          <div style={modalStyles.formGroup}>
            <label htmlFor="explanation">Açıklama:</label>
            <textarea
              id="explanation"
              name="explanation"
              value={editedQuestion.explanation || ''}
              onChange={handleChange}
              rows={3}
              style={modalStyles.input}
              required
            />
          </div>

          {/* Zorluk */}
          <div style={modalStyles.formGroup}>
            <label htmlFor="difficulty">Zorluk:</label>
            <select 
              id="difficulty"
              name="difficulty" 
              value={editedQuestion.difficulty || 'intermediate'} 
              onChange={handleChange} 
              style={modalStyles.input}
              required
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          {/* Bağlam Cümlesi */}
          <div style={modalStyles.formGroup}>
            <label htmlFor="paragraph">Bağlam Cümlesi:</label>
            <textarea
              id="paragraph"
              name="paragraph"
              value={editedQuestion.paragraph || ''}
              onChange={handleChange}
              rows={2}
              style={modalStyles.input}
            />
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

          {/* Buttons */}
          <div style={modalStyles.buttonGroup}>
            <button 
              type="submit" 
              style={{ ...modalStyles.button, ...modalStyles.saveButton }}
              disabled={isLoading}
            >
              {isLoading ? '⏳ Kaydediliyor...' : '💾 Kaydet'}
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              style={{ ...modalStyles.button, ...modalStyles.cancelButton }}
              disabled={isLoading}
            >
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuestionEditModal;