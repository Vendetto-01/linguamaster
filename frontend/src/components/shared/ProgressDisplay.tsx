// frontend/src/components/shared/ProgressDisplay.tsx
import React from 'react';
// Assuming UploadProgress is the base and we add other fields, or we use a more generic type
// For now, let's use a more general type structure directly here,
// or we can define a combined type in 'types/index.ts' later if needed.
import type { UploadProgress } from '../../types'; // Use UploadProgress as a base

// Define a more comprehensive progress type for the display component
interface DisplayProgressData extends UploadProgress {
  successful: number;
  failed: number;
  timeElapsed: number;
}

interface ProgressDisplayProps {
  progress: DisplayProgressData;
  title?: string; // Make title optional
  showStats?: boolean; // Make showStats optional
  variant?: 'compact' | 'full'; // Define variant type
}

const ProgressDisplay: React.FC<ProgressDisplayProps> = ({
  progress,
  title = "İşlem Durumu", // Default title
  showStats = true,      // Default to show stats
  variant = "full"       // Default variant
}) => {
  const getStageColor = () => {
    switch (progress.stage) {
      case 'complete': return '#28a745';
      case 'error': return '#dc3545';
      default: return '#007bff';
    }
  };

  const getStageIcon = () => {
    switch (progress.stage) {
      case 'starting': return '🚀';
      case 'generating': return '⚙️';
      case 'saving': return '💾';
      case 'complete': return '✅';
      case 'error': return '❌';
      default: return '📝';
    }
  };

  return (
    <div style={{
      backgroundColor: '#f8f9fa',
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px'
    }}>
      <h4 style={{ margin: '0 0 15px 0', color: '#495057' }}>
        {getStageIcon()} {title}
      </h4>
      
      <div style={{ marginBottom: '15px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <span>{progress.message}</span>
          <span>{progress.percentage}%</span>
        </div>
        
        <div style={{
          height: '8px',
          backgroundColor: '#e9ecef',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progress.percentage}%`,
            height: '100%',
            backgroundColor: getStageColor(),
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {showStats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: variant === 'compact' ? '1fr' : 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '10px',
          fontSize: variant === 'compact' ? '13px' : '14px',
          color: '#6c757d'
        }}>
          <div>
            <strong>İşlenen:</strong> {progress.current}/{progress.total}
          </div>
          {variant !== 'compact' && (
            <>
              <div>
                <strong>Başarılı:</strong> {progress.successful}
              </div>
              <div>
                <strong>Başarısız:</strong> {progress.failed}
              </div>
              <div>
                <strong>Geçen Süre:</strong> {progress.timeElapsed.toFixed(1)}s
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ProgressDisplay;