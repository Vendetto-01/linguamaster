// frontend/src/App.tsx - DÜZELTİLMİŞ İMPORTLAR
import React, { useState } from 'react';
import WordsModuleRenderer from './components/layout/WordsModuleRenderer';
import QuestionsModuleRenderer from './components/layout/QuestionsModuleRenderer';

// Konfigürasyon appConfig.ts'den import ediliyor
import {
  modules,
  wordsTabs,
  APP_VERSION,
  AI_MODEL_NAME,
  DATABASE_PROVIDER
} from './config/appConfig';

// Merkezi tipler types'tan import ediliyor
import type {
  ModuleType,
  WordsModuleTabId,
  QuestionsModuleTabId,
  FileUploadResponse
} from './types';

import './App.css';

function App() {
  const [activeModule, setActiveModule] = useState<ModuleType>('words');
  const [activeWordsTab, setActiveWordsTab] = useState<WordsModuleTabId>('file');
  const [activeQuestionsTab, setActiveQuestionsTab] = useState<QuestionsModuleTabId>('selection');
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastBatchId, setLastBatchId] = useState<string | undefined>();

  const handleFileUploaded = (result: FileUploadResponse) => {
    setRefreshKey(prev => prev + 1);
    setLastBatchId(result.results.batchId);
    console.log('Dosya yüklendi:', result);
    if (result.results.queued > 0) {
      setTimeout(() => {
        setActiveWordsTab('queue');
      }, 1000);
    }
  };

  const handleModuleClick = (moduleId: ModuleType) => {
    setActiveModule(moduleId);
    if (moduleId === 'words') {
      setActiveWordsTab('file');
    } else if (moduleId === 'questions') {
      setActiveQuestionsTab('selection');
    }
  };

  const handleWordsTabClick = (tabId: WordsModuleTabId) => {
    setActiveWordsTab(tabId);
  };

  const handleQuestionsTabClick = (tabId: QuestionsModuleTabId) => {
    setActiveQuestionsTab(tabId);
  };

  const handleQuestionsRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const renderContent = () => {
    switch (activeModule) {
      case 'words':
        return (
          <div>
            <div className="subTabNavigation">
              <div className="subTabNavigationContainer">
                {wordsTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleWordsTabClick(tab.id)}
                    className={`subTabButton ${activeWordsTab === tab.id ? 'active' : ''}`}
                    style={activeWordsTab === tab.id ? { borderBottomColor: modules.find(m => m.id === 'words')?.color } : {}}
                  >
                    <div className="subTabButtonIcon">{tab.icon}</div>
                    <div className="subTabButtonLabel">{tab.label}</div>
                    <div className="subTabButtonDescription">{tab.description}</div>
                  </button>
                ))}
              </div>
            </div>
            <main className="appContent">
              <WordsModuleRenderer
                activeWordsTab={activeWordsTab}
                lastBatchId={lastBatchId}
                onFileUploaded={handleFileUploaded}
              />
            </main>
          </div>
        );
      
      case 'questions':
        return (
          <main className="appContent">
            <QuestionsModuleRenderer
              activeQuestionsTab={activeQuestionsTab}
              refreshKey={refreshKey}
              onQuestionsTabChange={handleQuestionsTabClick}
              onQuestionsRefresh={handleQuestionsRefresh}
            />
          </main>
        );
      
      default:
        return (
          <main className="appContent">
            <WordsModuleRenderer
              activeWordsTab={'file'}
              lastBatchId={lastBatchId}
              onFileUploaded={handleFileUploaded}
            />
          </main>
        );
    }
  };

  return (
    <div className="App">
      <header className="appMainHeader">
        <h1>🧙‍♂️ Word Wizard Admin Panel</h1>
        <p>İngilizce Kelime ve Soru Yönetim Sistemi</p>
        <div className="appMainHeaderBadges">
          <span>{AI_MODEL_NAME}</span>
          <span>{DATABASE_PROVIDER}</span>
          <span>v{APP_VERSION}</span>
        </div>
      </header>

      <div className="moduleNavigation">
        <div className="moduleNavigationContainer">
          {modules.map((module) => (
            <button
              key={module.id}
              onClick={() => handleModuleClick(module.id)}
              className={`moduleButton ${activeModule === module.id ? 'active' : ''}`}
              style={activeModule === module.id ? { borderBottomColor: module.color, color: module.color } : {}}
            >
              <div className="moduleButtonIcon">{module.icon}</div>
              <div className="moduleButtonTitle">{module.title}</div>
              <div className="moduleButtonDescription">{module.description}</div>
            </button>
          ))}
        </div>
      </div>

      {renderContent()}

      <footer className="appFooter">
        <div className="appFooterContainer">
          <div className="appFooterGrid">
            <div>
              <h4>🤖 AI Teknolojisi</h4>
              <p>Gemini 2.0 Flash model ile 6 aşamalı analiz</p>
              <p>Context-aware soru oluşturma</p>
              <p>Akademik kalitede çeldiriciler</p>
            </div>
            <div>
              <h4>📊 Veri Yönetimi</h4>
              <p>Supabase veritabanı entegrasyonu</p>
              <p>Real-time queue processing</p>
              <p>Toplu dosya yükleme desteği</p>
            </div>
            <div>
              <h4>⚡ Performans</h4>
              <p>TypeScript tip güvenliği</p>
              <p>Modüler React mimarisi</p>
              <p>Responsive tasarım</p>
            </div>
          </div>
          <div className="appFooterBottom">
            <p>&copy; 2024 Word Wizard Admin Panel v{APP_VERSION}</p>
            <p>Gemini 2.0 Flash AI • Supabase Database • React TypeScript</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
