// frontend/src/App.tsx - GÜNCELLENMİŞ VERSİYON
import React, { useState } from 'react';
import WordsModuleRenderer from './components/layout/WordsModuleRenderer';
import QuestionsModuleRenderer from './components/layout/QuestionsModuleRenderer';

// Konfigürasyon appConfig.ts'den import ediliyor
import {
  modules, // ModuleConfig[] tipinde
  wordsTabs, // WordsTabConfig[] tipinde
  APP_VERSION,
  AI_MODEL_NAME,
  DATABASE_PROVIDER
} from './config/appConfig';

// Merkezi tipler ../types'tan import ediliyor
import type {
  ModuleType,
  WordsModuleTabId,
  QuestionsModuleTabId,
  FileUploadResponse // Bu zaten ../types'tan geliyordu
} from './types';

import './App.css';

// ModuleConfig ve WordsTabConfig arayüzleri appConfig.ts içinde kaldı ve oradan gelen
// modules ve wordsTabs array'leri bu tipleri kullanıyor. App.tsx'in bu arayüzlere
// doğrudan ihtiyacı yok, sadece array'leri kullanıyor.
// QuestionsTabType lokal tanımı kaldırıldı, yerine QuestionsModuleTabId import edildi.


function App() {
  const [activeModule, setActiveModule] = useState<ModuleType>('words');
  const [activeWordsTab, setActiveWordsTab] = useState<WordsModuleTabId>('file'); // WordsModuleTabId kullanılıyor
  const [activeQuestionsTab, setActiveQuestionsTab] = useState<QuestionsModuleTabId>('selection'); // QuestionsModuleTabId kullanılıyor
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

  const handleWordsTabClick = (tabId: WordsModuleTabId) => { // WordsModuleTabId kullanılıyor
    setActiveWordsTab(tabId);
  };

  const handleQuestionsTabClick = (tabId: QuestionsModuleTabId) => { // QuestionsModuleTabId kullanılıyor
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
                    onMouseEnter={(e) => {
                      if (activeWordsTab !== tab.id) {
                        e.currentTarget.style.backgroundColor = '#e9ecef';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeWordsTab !== tab.id) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
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
                activeWordsTab={activeWordsTab} // WordsModuleTabId tipinde
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
              activeQuestionsTab={activeQuestionsTab} // QuestionsModuleTabId tipinde
              refreshKey={refreshKey}
              onQuestionsTabChange={handleQuestionsTabClick}
              onQuestionsRefresh={handleQuestionsRefresh}
            />
          </main>
        );
      
      default:
        return (
          <div>
            <div className="subTabNavigation">
              {/* ... */}
            </div>
            <main className="appContent">
              <WordsModuleRenderer
                activeWordsTab={'file'}
                lastBatchId={lastBatchId}
                onFileUploaded={handleFileUploaded}
              />
            </main>
          </div>
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
              onMouseEnter={(e) => {
                if (activeModule !== module.id) {
                  e.currentTarget.style.backgroundColor = '#e9ecef';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeModule !== module.id) {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                  e.currentTarget.style.transform = 'none';
                }
              }}
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
          {/* ... footer içeriği ... */}
        </div>
      </footer>
    </div>
  );
}

export default App;