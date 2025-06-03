// frontend/src/components/questions/WordSelectionHeader.tsx
import React from 'react';

interface WordSelectionHeaderProps {
  selectedCount: number;
  maxSelections: number;
  onRefresh: () => void;
  onClearAll: () => void;
  onProceed: () => void;
  isLoading: boolean;
}

const WordSelectionHeader: React.FC<WordSelectionHeaderProps> = ({
  selectedCount,
  maxSelections,
  onRefresh,
  onClearAll,
  onProceed,
  isLoading
}) => {
  return (
    <>
      {/* Ana Başlık */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{ margin: 0, color: '#343a40' }}>
          🎯 Soru Oluşturulacak Kelimeleri Seçin
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{
            fontSize: '14px',
            fontWeight: 'bold',
            color: selectedCount > 0 ? '#28a745' : '#6c757d'
          }}>
            {selectedCount} / {maxSelections} seçili
          </span>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              opacity: isLoading ? 0.6 : 1
            }}
          >
            🔄 Yenile
          </button>
        </div>
      </div>

      {/* Seçim Bilgi Çubuğu */}
      {selectedCount > 0 && (
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
            <div>
              <div style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#155724',
                marginBottom: '5px'
              }}>
                ✅ {selectedCount} kelime seçildi
              </div>
              <div style={{ fontSize: '14px', color: '#155724' }}>
                Bu kelimeler için AI ile otomatik soru oluşturulacak
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={onClearAll}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                🗑️ Tümünü Kaldır
              </button>
              <button
                onClick={onProceed}
                disabled={selectedCount === 0}
                style={{
                  padding: '8px 20px',
                  backgroundColor: selectedCount > 0 ? '#28a745' : '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: selectedCount > 0 ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                ➡️ Soru Oluşturmaya Geç ({selectedCount})
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WordSelectionHeader;