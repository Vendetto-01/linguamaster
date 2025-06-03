// frontend/src/components/shared/ResultDisplay.tsx
import React from 'react';
import { QuestionGenerationResponse } from '../../types/questions';

interface ResultDisplayProps {
  result: QuestionGenerationResponse;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result }) => {
  return (
    <div style={{
      backgroundColor: '#fff',
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px'
    }}>
      <h4 style={{ margin: '0 0 15px 0', color: '#495057' }}>
        🎯 Sonuçlar
      </h4>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        marginBottom: '20px'
      }}>
        <div style={{
          backgroundColor: '#d4edda',
          padding: '15px',
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#155724' }}>
            {result.results.successCount}
          </div>
          <div style={{ color: '#155724' }}>Başarılı</div>
        </div>

        <div style={{
          backgroundColor: '#f8d7da',
          padding: '15px',
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#721c24' }}>
            {result.results.failureCount}
          </div>
          <div style={{ color: '#721c24' }}>Başarısız</div>
        </div>
      </div>

      {result.results.failed.length > 0 && (
        <div>
          <h5 style={{ color: '#721c24', marginBottom: '10px' }}>
            Başarısız Olanlar:
          </h5>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            fontSize: '14px',
            color: '#6c757d'
          }}>
            {result.results.failed.map((failure, index) => (
              <li key={index} style={{
                padding: '8px',
                borderBottom: '1px solid #dee2e6',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>{failure.word}</span>
                <span style={{ color: '#dc3545' }}>{failure.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;