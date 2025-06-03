// frontend/src/components/words/WordCard.tsx - DÜZELTILMIŞ VERSİYON
import React from 'react';
import Card from '../shared/Card';
import type { Word } from '../../types';

interface WordCardProps {
  word: Word;
  isSelected?: boolean;
  onToggle?: (word: Word) => void;
  showActions?: boolean;
  onCardClick?: () => void; // Ek click handler
}

const WordCard: React.FC<WordCardProps> = ({
  word,
  isSelected = false,
  onToggle,
  showActions = false,
  onCardClick
}) => {
  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'beginner': return '#28a745';
      case 'intermediate': return '#ffc107';
      case 'advanced': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick();
    } else if (onToggle) {
      onToggle(word);
    }
  };

  return (
    <Card 
      isSelected={isSelected}
      isClickable={!!(onToggle || onCardClick)}
      onClick={handleCardClick}
    >
      {/* Header */}
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
          
          {/* Badges */}
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
        
        {/* Selection Indicator */}
        {(onToggle || onCardClick) && (
          <div style={{ 
            fontSize: '24px', 
            color: isSelected ? '#28a745' : '#dee2e6',
            marginLeft: '10px'
          }}>
            {isSelected ? '✅' : '⭕'}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ fontSize: '14px', color: '#495057', marginBottom: '5px' }}>
          <strong>Anlam:</strong> {word.meaning_description}
        </div>
        <div style={{ fontSize: '14px', color: '#495057', marginBottom: '5px' }}>
          <strong>Türkçe:</strong> {word.turkish_meaning}
        </div>
      </div>

      {/* Example Sentence */}
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

      {/* Selection Status */}
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

      {/* Additional Actions */}
      {showActions && (
        <div style={{
          marginTop: '10px',
          paddingTop: '10px',
          borderTop: '1px solid #dee2e6',
          fontSize: '12px',
          color: '#6c757d'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Oluşturulma: {new Date(word.created_at).toLocaleDateString('tr-TR')}</span>
            <span>Kaynak: {word.source || 'AI'}</span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default WordCard;