import React, { useState, useEffect } from 'react';
import WordForm from './components/WordForm';
import FileUpload from './components/FileUpload';
import QueueStatus from './components/QueueStatus';
import { BulkAddResponse, FileUploadResponse } from './types';
import { wordApi } from './services/api';
import './App.css';

type TabType = 'file' | 'manual' | 'queue';

interface TabConfig {
  id: TabType;
  label: string;
  icon: string;
  description: string;
}

// YENİ: System Info State
interface SystemInfo {
  appName: string;
  version: string;
  aiModel: string;
  lastUpdated: string;
  features: string[];
  database: string;
  environment: string;
}

function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('file');
  const [lastBatchId, setLastBatchId] = useState<string | undefined>();
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null); // YENİ

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
      description: 'Aşamalı işleme durumu ve queue takibi'
    }
  ];

  // YENİ: System info çek
  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        const info = await wordApi.getSystemInfo();
        setSystemInfo(info);
      } catch (error) {
        console.error('System info alınamadı:', error);
      }
    };

    fetchSystemInfo();
  }, []);

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
      {/* Header - GÜNCELLEME */}
      <header style={{ 
        backgroundColor: '#282c34', 
        padding: '20px', 
        color: 'white', 
        textAlign: 'center',
        marginBottom: '0'
      }}>
        <h1 style={{ margin: '0 0 10px 0' }}>🧙‍♂️ Word Wizard</h1>
        <p style={{ margin: '0', opacity: 0.8 }}>
          İngilizce Kelime Veritabanı Yöneticisi - {systemInfo?.aiModel || 'Gemini 2.0 Flash'} AI Destekli
        </p>
        {/* YENİ: System version badge */}
        {systemInfo && (
          <div style={{ marginTop: '8px' }}>
            <span style={{
              backgroundColor: '#007bff',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              v{systemInfo.version} | {systemInfo.environment}
            </span>
          </div>
        )}
      </header>

      {/* Tab Navigation - GÜNCELLEME */}
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

      {/* Footer - GÜNCELLEME */}
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
                <strong>Veritabanı:</strong> {systemInfo?.database || 'Supabase PostgreSQL'}
              </p>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                <strong>AI Engine:</strong> {systemInfo?.aiModel || 'Gemini 2.0 Flash API'}
              </p>
            </div>

            <div>
              <h4 style={{ color: '#495057', marginBottom: '10px' }}>⚡ Aşamalı Analiz Özellikleri</h4>
              {systemInfo?.features ? (
                systemInfo.features.slice(0, 4).map((feature, index) => (
                  <p key={index} style={{ margin: '5px 0', fontSize: '14px' }}>
                    ✅ {feature}
                  </p>
                ))
              ) : (
                <>
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
                </>