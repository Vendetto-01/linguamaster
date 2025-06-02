// frontend/src/components/shared/ResultDisplay.tsx
import React from 'react';

interface ResultItem {
  word?: string;
  reason?: string;
  questionId?: number;
  wordId?: number;
}

interface ResultData {
  message: string;
  summary: {
    generated?: number;
    failed?: number;
    total?: number;
    queued?: number;
    duplicates?: number;
    totalWords?: number;
  };
  results?: {
    successful?: ResultItem[];
    failed?: ResultItem[];
    successCount?: number;
    failureCount?: number;
  };
  fileName?: string;
  batchId?: string;
  nextStep?: string;
}

interface ResultDisplayProps {
  result: ResultData;
  variant?: 'success' | 'info' | 'warning';
  showDetails?: boolean;
  onAction?: () => void;
  actionLabel?: string;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({
  result,
  variant = 'success',
  showDetails = true,
  onAction,
  actionLabel = 'Devam Et'
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          backgroundColor: '#d4edda',
          borderColor: '#c3e6cb',
          titleColor: '#155724',
          iconColor: '#155724'
        };
      case 'info':
        return {
          backgroundColor: '#e7f3ff',
          borderColor: '#bee5eb',
          titleColor: '#0066cc',
          iconColor: '#0066cc'
        };
      case 'warning':
        return {
          backgroundColor: '#fff3cd',
          borderColor: '#ffeaa7',
          titleColor: '#856404',
          iconColor: '#856404'
        };
      default:
        return {
          backgroundColor: '#d4edda',
          borderColor: '#c3e6cb',
          titleColor: '#155724',
          iconColor: '#155724'
        };
    }
  };

  const styles = getVariantStyles();
  const icon = variant === 'success' ? '✅' : variant === 'warning' ? '⚠️' : 'ℹ️';

  return (
    <div style={{
      backgroundColor: styles.backgroundColor,
      border: `1px solid ${styles.borderColor}`,
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px'
    }}>
      <h4 style={{ color: styles.titleColor, marginTop: 0 }}>
        {icon} {result.message}
      </h4>
      
      {/* File Info */}
      {(result.fileName || result.batchId) && (
        <div style={{ marginBottom: '15px' }}>
          {result.fileName && (
            <>
              <strong>📁 Dosya:</strong> {result.fileName}
              <br />
            </>
          )}
          {result.batchId && (
            <>
              <strong>🆔 Batch ID:</strong>
              <code style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '2px 6px', 
                borderRadius: '3px',
                fontSize: '12px',
                marginLeft: '5px'
              }}>
                {result.batchId}
              </code>
            </>
          )}
        </div>
      )}
      
      {/* Summary Stats */}
      {result.summary && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '10px',
          marginBottom: '15px'
        }}>
          {result.summary.totalWords && (
            <div style={{ backgroundColor: '#f1f8e9', padding: '10px', borderRadius: '3px' }}>
              <div style={{ fontWeight: 'bold', color: '#2e7d32' }}>📊 Toplam Kelime</div>
              <div style={{ fontSize: '24px' }}>{result.summary.totalWords.toLocaleString()}</div>
            </div>
          )}
          
          {result.summary.generated !== undefined && (
            <div style={{ backgroundColor: '#e8f5e8', padding: '10px', borderRadius: '3px' }}>
              <div style={{ fontWeight: 'bold', color: '#2e7d32' }}>✅ Oluşturulan</div>
              <div style={{ fontSize: '24px' }}>{result.summary.generated.toLocaleString()}</div>
            </div>
          )}

          {result.summary.queued !== undefined && (
            <div style={{ backgroundColor: '#e8f5e8', padding: '10px', borderRadius: '3px' }}>
              <div style={{ fontWeight: 'bold', color: '#2e7d32' }}>✅ Queue'ya Eklendi</div>
              <div style={{ fontSize: '24px' }}>{result.summary.queued.toLocaleString()}</div>
            </div>
          )}
          
          {result.summary.duplicates !== undefined && result.summary.duplicates > 0 && (
            <div style={{ backgroundColor: '#fff3e0', padding: '10px', borderRadius: '3px' }}>
              <div style={{ fontWeight: 'bold', color: '#f57c00' }}>⚠️ Duplicate</div>
              <div style={{ fontSize: '24px' }}>{result.summary.duplicates.toLocaleString()}</div>
            </div>
          )}
          
          {result.summary.failed !== undefined && result.summary.failed > 0 && (
            <div style={{ backgroundColor: '#ffebee', padding: '10px', borderRadius: '3px' }}>
              <div style={{ fontWeight: 'bold', color: '#d32f2f' }}>❌ Başarısız</div>
              <div style={{ fontSize: '24px' }}>{result.summary.failed.toLocaleString()}</div>
            </div>
          )}
        </div>
      )}

      {/* Detailed Results */}
      {showDetails && result.results && (
        <>
          {/* Başarılı kelimeler */}
          {result.results.successful && result.results.successful.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <h5 style={{ color: styles.titleColor, margin: '0 0 8px 0' }}>
                ✅ Başarılı Kelimeler ({result.results.successful.length}):
              </h5>
              <div style={{ 
                maxHeight: '120px', 
                overflowY: 'auto',
                backgroundColor: '#f8f9fa',
                padding: '8px',
                borderRadius: '4px',
                fontSize: '13px'
              }}>
                {result.results.successful.map((item, index) => (
                  <span key={index} style={{ 
                    display: 'inline-block',
                    margin: '2px',
                    padding: '2px 6px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    borderRadius: '3px',
                    fontSize: '12px'
                  }}>
                    {item.word}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Başarısız kelimeler */}
          {result.results.failed && result.results.failed.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <h5 style={{ color: '#721c24', margin: '0 0 8px 0' }}>
                ❌ Başarısız Kelimeler ({result.results.failed.length}):
              </h5>
              <div style={{ 
                maxHeight: '120px', 
                overflowY: 'auto',
                backgroundColor: '#f8f9fa',
                padding: '8px',
                borderRadius: '4px',
                fontSize: '13px'
              }}>
                {result.results.failed.map((item, index) => (
                  <div key={index} style={{ 
                    margin: '4px 0',
                    padding: '4px 8px',
                    backgroundColor: '#f8d7da',
                    borderRadius: '3px',
                    fontSize: '12px'
                  }}>
                    <strong>{item.word}:</strong> {item.reason}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Next Step */}
      {result.nextStep && (
        <div style={{
          backgroundColor: '#cce5ff',
          padding: '15px',
          borderRadius: '5px',
          fontSize: '14px',
          color: '#0066cc',
          marginBottom: onAction ? '15px' : '0'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
            🎯 <strong>Sonraki Adım:</strong>
          </div>
          <p style={{ margin: '0' }}>
            {result.nextStep}
          </p>
        </div>
      )}

      {/* Action Button */}
      {onAction && (
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={onAction}
            style={{
              padding: '10px 20px',
              backgroundColor: styles.iconColor,
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;