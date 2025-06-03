// frontend/src/components/shared/ProgressDisplay.tsx
import React from 'react';

interface ProgressData {
  current: number;
  total: number;
  percentage: number;
  currentWord?: string;
  stage: 'starting' | 'generating' | 'saving' | 'complete' | 'error' | 'reading' | 'uploading' | 'queueing';
  message: string;
  successful: number;
  failed: number;
  timeElapsed: number;
  estimatedTimeRemaining?: number;
}

interface ProgressDisplayProps {
  progress: ProgressData;
  title?: string;
  showStats?: boolean;
  variant?: 'default' | 'compact';
}

const ProgressDisplay: React.FC<ProgressDisplayProps> = ({
  progress,
  title = 'İşlem Süreci',
  showStats = true,
  variant = 'default'
}) => {
  const getStageColor = (): string => {
    switch (progress.stage) {
      case 'error': return '#dc3545';
      case 'complete': return '#28a745';
      case 'generating': 
      case 'uploading':
      case 'saving': return '#007bff';
      default: return '#6c757d';
    }
  };

  const getStageIcon = (): string => {
    switch (progress.stage) {
      case 'starting': return '🚀';
      case 'reading': return '📖';
      case 'uploading': return '📤';
      case 'queueing': return '📋';
      case 'generating': return '🤖';
      case 'saving': return '💾';
      case 'complete': return '✅';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  if (variant === 'compact') {
    return (
      <div style={{
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '6px',
        padding: '15px',
        marginBottom: '15px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <span style={{ fontSize: '14px', color: '#666' }}>
            {getStageIcon()} {progress.message}
          </span>
          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{progress.percentage}%</span>
        </div>
        
        <div style={{
          width: '100%',
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
    );
  }

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
          <span style={{ fontSize: '14px', color: '#666' }}>{progress.message}</span>
          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{progress.percentage}%</span>
        </div>
        
        <div style={{
          width: '100%',
          height: '12px',
          backgroundColor: '#e9ecef',
          borderRadius: '6px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progress.percentage}%`,
            height: '100%',
            backgroundColor: getStageColor(),
            transition: 'width 0.3s ease',
            backgroundImage: progress.stage === 'generating' || progress.stage === 'uploading' ? 
              'linear-gradient(45deg, rgba(255,255,255,.2) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.2) 50%, rgba(255,255,255,.2) 75%, transparent 75%, transparent)' : 'none',
            backgroundSize: '20px 20px',
            animation: progress.stage === 'generating' || progress.stage === 'uploading' ? 'progress-bar-stripes 1s linear infinite' : 'none'
          }} />
        </div>
      </div>

      {showStats && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
          gap: '15px',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#007bff' }}>
              {progress.current} / {progress.total}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>İşlenen</div>
          </div>
          
          <div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#28a745' }}>
              {progress.successful}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Başarılı</div>
          </div>
          
          <div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc3545' }}>
              {progress.failed}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Başarısız</div>
          </div>
          
          <div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#6c757d' }}>
              {progress.timeElapsed}s
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Süre</div>
          </div>

          {progress.estimatedTimeRemaining && (
            <div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffc107' }}>
                {progress.estimatedTimeRemaining}s
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Kalan Süre</div>
            </div>
          )}
        </div>
      )}

      {progress.currentWord && (
        <div style={{
          marginTop: '15px',
          padding: '10px',
          backgroundColor: '#cce5ff',
          borderRadius: '5px',
          fontSize: '14px',
          textAlign: 'center'
        }}>
          <strong>Şu an işleniyor:</strong> {progress.currentWord}
        </div>
      )}

      <style>{`
        @keyframes progress-bar-stripes {
          0% { background-position: 20px 0; }
          100% { background-position: 0 0; }
        }
      `}</style>
    </div>
  );
};

export default ProgressDisplay;