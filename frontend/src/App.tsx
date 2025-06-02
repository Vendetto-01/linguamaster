import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import QueueStatus from './components/QueueStatus';
import { FileUploadResponse } from './types';
import './App.css';

type TabType = 'file' | 'queue';

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

  // Tab configurations (sadece file ve queue)
  const tabs: TabConfig[] = [
    {
      id: 'file',
      label: 'Dosya Yükleme',
      icon: '📁',
      description: 'Toplu kelime yükleme (.txt dosyası)'
    },
    {
      id: 'queue',
      label: 'Queue Durumu',
      icon: '📊',
      description: 'Aşamalı işleme durumu ve queue takibi'
    }
  ];

  const handleFileUploaded = (result: FileUploadResponse) => {
    setRefreshKey(prev => prev + 1);
    setLastBatchId(result.results.batchId);
    
    console.log('Dosya yüklendi:', result);
    
    if (result.results.queued > 0) {
      setTimeout(() => {
        setActiveTab('queue');
      }, 1000);
    }
  };

  const handleTabClick = (tabId: TabType) => {
    setActiveTab(tabId);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'file':
        return <FileUpload onFileUploaded={handleFileUploaded} />;
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
          İngilizce Kelime Veritabanı Yöneticisi - Gemini 2.0 Flash AI Destekli
        </p>
        <div style={{ marginTop: '8px' }}>
          <span style={{
            backgroundColor: '#007bff',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            v2.1 | {process.env.NODE_ENV || 'development'}
          </span>
        </div>
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
                <strong>AI Engine:</strong> Gemini 2.0 Flash API
              </p>
            </div>

            <div>
              <h4 style={{ color: '#495057', marginBottom: '10px' }}>⚡ Aşamalı Analiz Özellikleri</h4>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                ✅ 6 aşamalı kelime analizi
              </p>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                ✅ Çoklu anlam desteği
              </p>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                ✅ Akıllı zorluk analizi
              </p>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                ✅ Context-aware çeviri
              </p>
            </div>
          </div>

          <div style={{ 
            borderTop: '1px solid #dee2e6', 
            paddingTop: '15px',
            fontSize: '12px'
          }}>
            <p style={{ margin: '0' }}>
              🤖 Powered by <strong>Gemini 2.0 Flash</strong> | 
              🗄️ <strong>Supabase</strong> | 
              ⚛️ <strong>React + TypeScript</strong> | 
              🎯 <strong>6-Step Analysis System</strong>
            </p>
            
            <p style={{ margin: '5px 0 0 0', opacity: 0.8 }}>
              Çevre: {process.env.NODE_ENV || 'development'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;