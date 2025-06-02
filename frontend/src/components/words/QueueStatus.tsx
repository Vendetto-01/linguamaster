// frontend/src/components/QueueStatus.tsx - OPTİMİZE EDİLMİŞ VERSİYON
import React, { useState, useEffect, useCallback } from 'react';
import { wordApi } from '../../services/api';
import { QueueStats, ProcessorStats, QueueStatusProps } from '../types';

const QueueStatus: React.FC<QueueStatusProps> = ({ 
  batchId, 
  autoRefresh = true, 
  refreshInterval = 5000 
}) => {
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [batchStatus, setBatchStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Queue stats'ı getir
  const fetchQueueStats = useCallback(async () => {
    try {
      const stats = await wordApi.getQueueStats();
      setQueueStats(stats);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Queue stats alınamadı');
    }
  }, []);

  // Specific batch status'ı getir
  const fetchBatchStatus = useCallback(async () => {
    if (!batchId) return;
    
    try {
      const status = await wordApi.getQueueStatus(batchId);
      setBatchStatus(status);
    } catch (err) {
      console.error('Batch status alınamadı:', err);
    }
  }, [batchId]);

  // İlk yükleme
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchQueueStats(),
        fetchBatchStatus()
      ]);
      setIsLoading(false);
      setLastUpdate(new Date());
    };

    loadData();
  }, [fetchQueueStats, fetchBatchStatus]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(async () => {
      await Promise.all([
        fetchQueueStats(),
        fetchBatchStatus()
      ]);
      setLastUpdate(new Date());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchQueueStats, fetchBatchStatus]);

  // Manual refresh
  const handleRefresh = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchQueueStats(),
      fetchBatchStatus()
    ]);
    setIsLoading(false);
    setLastUpdate(new Date());
  };

  // Processor kontrolü
  const handleProcessorControl = async (action: 'start' | 'stop') => {
    try {
      if (action === 'start') {
        await wordApi.processor.start();
      } else {
        await wordApi.processor.stop();
      }
      
      // Stats'ı yenile
      await fetchQueueStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Processor ${action} hatası`);
    }
  };

  // Status indicator component
  const StatusIndicator: React.FC<{ 
    isActive: boolean; 
    label: string; 
    activeColor?: string;
    inactiveColor?: string;
  }> = ({ isActive, label, activeColor = '#28a745', inactiveColor = '#6c757d' }) => (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
      <div style={{
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        backgroundColor: isActive ? activeColor : inactiveColor,
        marginRight: '8px',
        animation: isActive ? 'pulse 2s infinite' : 'none'
      }} />
      <span style={{ color: isActive ? activeColor : inactiveColor, fontWeight: 'bold' }}>
        {label}
      </span>
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );

  // Loading state
  if (isLoading && !queueStats) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', textAlign: 'center' }}>
        <h2>📊 Queue Durumu</h2>
        <div style={{ fontSize: '18px', color: '#666' }}>
          🔄 Yükleniyor...
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2>📊 6 Aşamalı Kelime İşleme Durumu</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔄 Yenile
          </button>
          <small style={{ color: '#666' }}>
            Son güncelleme: {lastUpdate.toLocaleTimeString()}
          </small>
        </div>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '10px',
          borderRadius: '5px',
          marginBottom: '20px',
          border: '1px solid #f5c6cb'
        }}>
          ❌ {error}
        </div>
      )}

      {/* Gelişmiş Processor Status */}
      {queueStats && (
        <div style={{
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{ marginTop: 0 }}>🤖 Gemini 2.0 Flash Aşamalı Processor</h3>
          
          {/* Analysis Method Badge */}
          <div style={{ marginBottom: '15px' }}>
            <span style={{
              backgroundColor: '#007bff',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              {queueStats.processorStats.analysisMethod || 'step-by-step'} Analysis
            </span>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '15px',
            marginBottom: '15px'
          }}>
            <div>
              <StatusIndicator 
                isActive={queueStats.processorStats.isProcessing}
                label={queueStats.processorStats.isProcessing ? 'Aşamalı Analiz Çalışıyor' : 'Bekleme Modunda'}
              />
              <div style={{ fontSize: '14px', color: '#666', marginLeft: '20px' }}>
                {queueStats.processorStats.isProcessing ? 
                  `${Math.round(queueStats.processorStats.elapsedTime)} saniye` : 
                  'Hazır durumda'
                }
              </div>
            </div>

            <div>
              <div style={{ fontWeight: 'bold' }}>📈 İşlenen Kelime</div>
              <div style={{ fontSize: '24px', color: '#28a745' }}>
                {queueStats.processorStats.processedCount}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                (Her kelime çoklu anlam)
              </div>
            </div>

            <div>
              <div style={{ fontWeight: 'bold' }}>❌ Hata Sayısı</div>
              <div style={{ fontSize: '24px', color: '#dc3545' }}>
                {queueStats.processorStats.errorCount}
              </div>
            </div>

            {/* Processing Hızı */}
            <div>
              <div style={{ fontWeight: 'bold' }}>⚡ İşlem Hızı</div>
              <div style={{ fontSize: '16px', color: '#6f42c1' }}>
                {queueStats.processorStats.isProcessing && queueStats.processorStats.elapsedTime > 0
                  ? `${((queueStats.processorStats.processedCount + queueStats.processorStats.errorCount) / queueStats.processorStats.elapsedTime * 60).toFixed(1)} kel/dk`
                  : '0 kel/dk'
                }
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                kelime/dakika
              </div>
            </div>
          </div>

          {/* Processor Control */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => handleProcessorControl('start')}
              disabled={queueStats.processorStats.isProcessing}
              style={{
                padding: '8px 16px',
                backgroundColor: queueStats.processorStats.isProcessing ? '#6c757d' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: queueStats.processorStats.isProcessing ? 'not-allowed' : 'pointer'
              }}
            >
              ▶️ Aşamalı Analizi Başlat
            </button>
            <button
              onClick={() => handleProcessorControl('stop')}
              disabled={!queueStats.processorStats.isProcessing}
              style={{
                padding: '8px 16px',
                backgroundColor: !queueStats.processorStats.isProcessing ? '#6c757d' : '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: !queueStats.processorStats.isProcessing ? 'not-allowed' : 'pointer'
              }}
            >
              ⏹️ Durdur
            </button>
          </div>
          
          {/* Aşamalı Analiz Açıklaması */}
          {queueStats.processorStats.isProcessing && (
            <div style={{
              marginTop: '15px',
              padding: '10px',
              backgroundColor: '#e7f3ff',
              borderRadius: '5px',
              fontSize: '14px'
            }}>
              <strong>🔄 6 Aşamalı Analiz Süreci:</strong>
              <br />
              1️⃣ İlk zorluk tahmini → 2️⃣ Anlam tespiti → 3️⃣ Akademik örnekler → 
              4️⃣ Zorluk doğrulama → 5️⃣ Türkçe çeviri → 6️⃣ Kelime eşleştirme
            </div>
          )}
        </div>
      )}

      {/* Queue Overview */}
      {queueStats && (
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{ marginTop: 0 }}>📋 Queue Genel Durumu</h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '15px',
            marginBottom: '15px'
          }}>
            <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '5px' }}>
              <div style={{ fontSize: '32px', color: '#856404' }}>⏳</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#856404' }}>
                {queueStats.totalPendingWords}
              </div>
              <div style={{ fontSize: '14px', color: '#856404' }}>Bekleyen Kelime</div>
              <div style={{ fontSize: '12px', color: '#856404', marginTop: '5px' }}>
                (6 aşamalı analiz için)
              </div>
            </div>

            <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#cce5ff', borderRadius: '5px' }}>
              <div style={{ fontSize: '32px', color: '#004085' }}>⚙️</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#004085' }}>
                {queueStats.totalProcessingWords}
              </div>
              <div style={{ fontSize: '14px', color: '#004085' }}>İşleniyor</div>
              <div style={{ fontSize: '12px', color: '#004085', marginTop: '5px' }}>
                (AI analiz aşamasında)
              </div>
            </div>

            <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f8d7da', borderRadius: '5px' }}>
              <div style={{ fontSize: '32px', color: '#721c24' }}>❌</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#721c24' }}>
                {queueStats.totalFailedWords}
              </div>
              <div style={{ fontSize: '14px', color: '#721c24' }}>Başarısız</div>
              <div style={{ fontSize: '12px', color: '#721c24', marginTop: '5px' }}>
                (3 deneme sonrası)
              </div>
            </div>

            <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#e2e3e5', borderRadius: '5px' }}>
              <div style={{ fontSize: '32px', color: '#383d41' }}>📦</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#383d41' }}>
                {queueStats.activeBatches}
              </div>
              <div style={{ fontSize: '14px', color: '#383d41' }}>Aktif Batch</div>
            </div>
          </div>

          {/* Queue Activity Status */}
          <StatusIndicator 
            isActive={queueStats.isQueueActive}
            label={queueStats.isQueueActive ? 'Queue Aktif' : 'Queue Boş'}
            activeColor="#007bff"
          />

          {/* Oldest Pending Word */}
          {queueStats.oldestPendingWord && (
            <div style={{ 
              marginTop: '15px',
              padding: '10px',
              backgroundColor: '#f8f9fa',
              borderRadius: '5px',
              fontSize: '14px'
            }}>
              <strong>En eski bekleyen kelime:</strong> "{queueStats.oldestPendingWord.word}"
              <br />
              <small style={{ color: '#666' }}>
                {new Date(queueStats.oldestPendingWord.created_at).toLocaleString()}
              </small>
            </div>
          )}
        </div>
      )}

      {/* Specific Batch Status */}
      {batchStatus && (
        <div style={{
          backgroundColor: '#e8f4f8',
          border: '1px solid #bee5eb',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{ marginTop: 0 }}>🆔 Batch Durumu</h3>
          
          <div style={{ marginBottom: '10px' }}>
            <strong>Batch ID:</strong> 
            <code style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '2px 6px', 
              borderRadius: '3px',
              fontSize: '12px',
              marginLeft: '5px'
            }}>
              {batchStatus.batchId}
            </code>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
            gap: '10px',
            marginBottom: '15px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#856404' }}>
                {batchStatus.pending}
              </div>
              <div style={{ fontSize: '12px' }}>Bekleyen</div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#004085' }}>
                {batchStatus.processing}
              </div>
              <div style={{ fontSize: '12px' }}>İşleniyor</div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#28a745' }}>
                {batchStatus.processed}
              </div>
              <div style={{ fontSize: '12px' }}>Tamamlanan</div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc3545' }}>
                {batchStatus.failed}
              </div>
              <div style={{ fontSize: '12px' }}>Başarısız</div>
            </div>
          </div>

          <StatusIndicator 
            isActive={batchStatus.status === 'processing'}
            label={batchStatus.status === 'processing' ? '6 Aşamalı Analiz Devam Ediyor' : 'Batch Tamamlandı'}
            activeColor="#007bff"
            inactiveColor="#28a745"
          />
        </div>
      )}

      {/* Auto Refresh Info */}
      {autoRefresh && (
        <div style={{
          fontSize: '12px',
          color: '#6c757d',
          textAlign: 'center',
          padding: '10px',
          backgroundColor: '#f8f9fa',
          borderRadius: '5px'
        }}>
          🔄 Otomatik yenileme aktif ({refreshInterval / 1000} saniye aralıklarla) | 
          ⚡ Gemini 2.0 Flash 6 Aşamalı Analiz Sistemi
        </div>
      )}
    </div>
  );
};

export default QueueStatus;