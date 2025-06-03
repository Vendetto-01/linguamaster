import React, { useState, useEffect } from 'react';
import WordForm from './components/WordForm';
import FileUpload from './components/FileUpload';
import QueueStatus from './components/QueueStatus';
import { BulkAddResponse, FileUploadResponse } from './types';
import { wordApi } from './services/api';
import styles from './App.module.css';
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
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [systemInfoError, setSystemInfoError] = useState<string | null>(null);

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

  // System info çek
  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        const info = await wordApi.getSystemInfo();
        setSystemInfo(info);
        setSystemInfoError(null);
      } catch (error: any) {
        console.error('System info alınamadı:', error);
        setSystemInfoError(error.message || 'Bilinmeyen bir hata oluştu');
      }
    };

    fetchSystemInfo();
  }, []);

  const handleWordsAdded = (result: BulkAddResponse) => {
    setRefreshKey(prev => prev + 1);
    setLastBatchId(result.batchId);
    
    console.log('Kelimeler queue\'ya eklendi:', result);
    
    if (result.summary.queued > 0) {
      setTimeout(() => {
        setActiveTab('queue');
      }, 1000);
    }
  };

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
        <header className={styles.AppHeader}>
          <h1>🧙‍♂️ Word Wizard</h1>
          <p>
            İngilizce Kelime Veritabanı Yöneticisi - {systemInfo?.aiModel || 'Gemini 2.0 Flash'} AI Destekli
          </p>
          {systemInfo && (
            <div>
              <span className={styles.VersionBadge}>
                v{systemInfo.version} | {systemInfo.environment}
              </span>
            </div>
          )}
          {systemInfoError && (
            <div className={styles.SystemInfoError}>
              Hata: {systemInfoError}
            </div>
          )}
        </header>

      {/* Tab Navigation */}
      <div className={styles.TabNavigation}>
        <div className={styles.TabNavigationContainer}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`${styles.TabButton} ${activeTab === tab.id ? styles.TabButtonActive : ''}`}
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
              <div className={styles.TabIcon}>
                {tab.icon}
              </div>
              <div className={styles.TabLabel}>
                {tab.label}
              </div>
              <div className={styles.TabDescription}>
                {tab.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <main className={styles.AppMain}>
        {renderTabContent()}
      </main>

      {/* Footer */}
      <footer className={styles.AppFooter}>
        <div className={styles.FooterContainer}>
          <div className={styles.TechnicalInfo}>
            <div>
              <h4>🔧 Teknik Bilgiler</h4>
              <p>
                <strong>Backend:</strong> {process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}
              </p>
              <p>
                <strong>Veritabanı:</strong> {systemInfo?.database || 'Supabase PostgreSQL'}
              </p>
              <p>
                <strong>AI Engine:</strong> {systemInfo?.aiModel || 'Gemini 2.0 Flash API'}
              </p>
            </div>
            <div>
              <h4>⚡ Aşamalı Analiz Özellikleri</h4>
              {systemInfo?.features ? (
                systemInfo.features.slice(0, 4).map((feature, index) => (
                  <p key={index}>
                    ✅ {feature}
                  </p>
                ))
              ) : (
                <>
                  <p>
                    ✅ 6 aşamalı kelime analizi
                  </p>
                  <p>
                    ✅ Çoklu anlam desteği
                  </p>
                  <p>
                    ✅ Akıllı zorluk analizi
                  </p>
                  <p>
                    ✅ Context-aware çeviri
                  </p>
                </>
              )}
            </div>
          </div>
          <div className={styles.FooterBorderTop}>
            <p>
              🤖 Powered by <strong>Gemini 2.0 Flash</strong> |
              🗄️ <strong>Supabase</strong> |
              ⚛️ <strong>React + TypeScript</strong> |
              🎯 <strong>6-Step Analysis System</strong>
            </p>
            {systemInfo && (
              <p>
                Son güncelleme: {new Date(systemInfo.lastUpdated).toLocaleDateString('tr-TR')} |
                Çevre: {systemInfo.environment}
              </p>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;