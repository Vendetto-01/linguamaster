// frontend/src/components/questions/QuestionCard.tsx
import React from 'react';
import Card from '../shared/Card';
import Button from '../shared/Button';
import { Question } from '../../types/questions';

interface QuestionCardProps {
  question: Question;
  isSelected: boolean;
  onSelect: (questionId: number) => void;
  onToggleActive: (questionId: number) => void;
  onDelete: (questionId: number) => void;
  isUpdating: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  isSelected,
  onSelect,
  onToggleActive,
  onDelete,
  isUpdating
}) => {
  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'beginner': return '#28a745';
      case 'intermediate': return '#ffc107';
      case 'advanced': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const word = question.word;

  return (
    <Card isSelected={isSelected}>
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
              onChange={() => onSelect(question.id)}
              style={{ marginRight: '10px', transform: 'scale(1.2)' }}
            />
            
            <h4 style={{ margin: '0', color: '#2c3e50', fontSize: '16px' }}>
              {word?.word || 'Unknown'} 
              <span style={{ fontSize: '14px', color: '#7f8c8d', marginLeft: '8px' }}>
                (anlam #{word?.meaning_id || '?'})
              </span>
            </h4>
          </div>

          {/* Badges */}
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

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            onClick={() => onToggleActive(question.id)}
            disabled={isUpdating}
            variant={question.is_active ? 'warning' : 'success'}
            size="small"
          >
            {question.is_active ? '⏸️ Pasif Yap' : '▶️ Aktif Yap'}
          </Button>
          
          <Button
            onClick={() => onDelete(question.id)}
            disabled={isUpdating}
            variant="danger"
            size="small"
          >
            🗑️ Sil
          </Button>
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
    </Card>
  );
};

export default QuestionCard;