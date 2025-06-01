import React, { useState } from 'react';
import WordForm from './components/WordForm';
import FileUpload from './components/FileUpload';
import QueueStatus from './components/QueueStatus';
import { useKeepAlive } from './services/keepAlive';
import { BulkAddResponse, FileUploadResponse } from './types';
import './App.css';

type TabType = 'file' | 'manual' | 'queue';

interface TabConfig {
  id: TabType;
  label: string;
  icon: string;
  description: string;
}

function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('file');
  const [lastBatchId, setLastBatchId] = useState<string | undefined>();

  // Keep-alive service - Render.com cold start prevention
  const keepAliveStatus = useKeepAlive();

  // Tab configurations
  const tabs: TabConfig[] = [
    {
      id: 'file',
      label: 'Dosya Yükleme',
      icon: '📁',
      description: 'Toplu kelime yükleme (.txt dosyası)'
    },
    {
      id: 'manual',
      label: 'Manuel Ekleme',
      icon: '✍️',
      description: 'Kelime listesi yazarak ekleme'
    },
    {
      id: 'queue',
      label: 'Queue Durumu',
      icon: '📊',
      description: 'İşleme durumu ve queue takibi'
    }
  ];

  const handleWordsAdded = (result: BulkAddResponse) => {
    // Yeni kelimeler eklendi
    setRefreshKey(prev => prev + 1);
    setLastBatchId(result.batchId);
    
    console.log('Kelimeler queue\'ya eklendi:', result);
    
    // Başarılı işlemden sonra queue sekmesine yönlendir
    if (result.summary.queued > 0) {
      setTimeout(() => {
        setActiveTab('queue');
      }, 1000);
    }
  };

  const handleFileUploaded = (result: FileUploadResponse) => {
    // Dosya yüklendi
    setRefreshKey(prev => prev + 1);
    setLastBatchId(result.results.batchId);
    
    console.log('Dosya yüklendi:', result);
    
    // Başarılı yüklemeden sonra queue sekmesine yönlendir
    if (result.results.queued > 0) {
      setTimeout(() => {
        setActiveTab('queue');
      }, 1000);
    }
  };

  // Tab click handler
  const handleTabClick = (tabId: TabType) => {
    setActiveTab(tabId);
  };

  // Tab content renderer
  const renderTabContent = () => {
    switch (activeTab) {
      case 'file':
        return <FileUpload onFileUploaded={handleFileUploaded} />;
      case 'manual':
        return <WordForm onWordsAdded={handleWordsAdded} />;
      case 'queue':
        return (
          <QueueStatus 
            batchId={lastBatchId}
            autoRefresh={true}
            refreshInterval={5000}
          />
        );
      default:
        return <FileUpload onFileUploaded={handleFileUploaded} />;
    }
  };

  return (
    <div className="App">
      {/* Header */}
      <header style={{ 
        backgroundColor: '#282c34', 
        padding: '20px', 
        color: 'white', 
        textAlign: 'center',
        marginBottom: '0'
      }}>
        <h1 style={{ margin: '0 0 10px 0' }}>🧙‍♂️ Word Wizard</h1>
        <p style={{ margin: '0', opacity: 0.8 }}>
          İngilizce Kelime Veritabanı Yöneticisi - Gemini AI Destekli
        </p>
      </header>

      {/* Tab Navigation */}
      <div style={{ 
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #dee2e6',
        padding: '0'
      }}>
        <div style={{ 
          maxWidth: '1000px', 
          margin: '0 auto',
          display: 'flex',
          overflow: 'auto'
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              style={{
                flex: '1',
                minWidth: '200px',
                padding: '20px 15px',
                border: 'none',
                backgroundColor: activeTab === tab.id ? '#ffffff' : 'transparent',
                color: activeTab === tab.id ? '#495057' : '#6c757d',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                borderBottom: activeTab === tab.id ? '3px solid #007bff' : '3px solid transparent',
                transition: 'all 0.3s ease',
                textAlign: 'center'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.backgroundColor = '#e9ecef';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '5px' }}>
                {tab.icon}
              </div>
              <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>
                {tab.label}
              </div>
              <div style={{ 
                fontSize: '12px', 
                opacity: 0.7,
                lineHeight: '1.3'
              }}>
                {tab.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <main style={{ 
        minHeight: 'calc(100vh - 200px)',
        backgroundColor: '#ffffff'
      }}>
        {renderTabContent()}
      </main>

      {/* Footer */}
      <footer style={{ 
        backgroundColor: '#f8f9fa',
        textAlign: 'center', 
        padding: '30px 20px', 
        color: '#6c757d',
        borderTop: '1px solid #dee2e6'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '20px',
            marginBottom: '20px'
          }}>
            <div>
              <h4 style={{ color: '#495057', marginBottom: '10px' }}>🔧 Teknik Bilgiler</h4>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                <strong>Backend:</strong> {process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}
              </p>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                <strong>Veritabanı:</strong> Supabase PostgreSQL
              </p>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                <strong>AI Engine:</strong> Google Gemini API
              </p>
            </div>

            <div>
              <h4 style={{ color: '#495057', marginBottom: '10px' }}>⚡ Yeni Özellikler</h4>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                ✅ Queue tabanlı background processing
              </p>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                ✅ Gemini AI entegrasyonu
              </p>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                ✅ Real-time progress tracking
              </p>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                ✅ Zorluk seviyesi analizi
              </p>
            </div>

            <div>
              <h4 style={{ color: '#495057', marginBottom: '10px' }}>📋 Süreç</h4>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                1️⃣ Kelimeler queue'ya eklenir
              </p>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                2️⃣ AI background'da işler
              </p>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                3️⃣ Türkçe karşılıklar çekilir
              </p>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                4️⃣ Quiz için hazır hale gelir
              </p>
            </div>
          </div>

          <div style={{ 
            padding: '20px',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <h4 style={{ color: '#495057', marginBottom: '10px' }}>
              🤖 Gemini AI ile Gelişmiş Kelime İşleme
            </h4>
            <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
              Her kelime için otomatik olarak Türkçe karşılıklar, kelime türleri, 
              zorluk seviyeleri ve İngilizce örnek cümleler Google Gemini AI tarafından analiz edilir. 
              Bu sayede daha zengin ve eğitici bir kelime veritabanı oluşturulur.
            </p>
          </div>

          <div style={{ 
            marginTop: '20px',
            fontSize: '12px',
            color: '#adb5bd'
          }}>
            <p style={{ margin: 0 }}>
              Word Wizard v2.0 - Gemini AI Edition | 
              Son güncellenme: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;