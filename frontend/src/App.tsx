import React, { useState } from 'react';
// Kelime modülü importları - YENİ PATH'LER
import FileUpload from './components/words/FileUpload';
import QueueStatus from './components/words/QueueStatus';
import WordsModule from './components/words/WordsModule';

// Soru modülü importları  
import QuestionsModule from './components/questions/QuestionsModule';

// Type importları
import { FileUploadResponse } from './types';
import './App.css';

type ModuleType = 'words' | 'questions';
type WordsTabType = 'file' | 'queue' | 'database';
type QuestionsTabType = 'selection' | 'generation' | 'management';

interface ModuleConfig {
  id: ModuleType;
  title: string;
  icon: string;
  description: string;
  color: string;
}

interface WordsTabConfig {
  id: WordsTabType;
  label: string;
  icon: string;
  description: string;
}

function App() {
  const [activeModule, setActiveModule] = useState<ModuleType>('words');
  const [activeWordsTab, setActiveWordsTab] = useState<WordsTabType>('file');
  const [activeQuestionsTab, setActiveQuestionsTab] = useState<QuestionsTabType>('selection');
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastBatchId, setLastBatchId] = useState<string | undefined>();

  // Ana modül konfigürasyonları
  const modules: ModuleConfig[] = [
    {
      id: 'words',
      title: 'Kelime Yönetimi',
      icon: '📚',
      description: 'Toplu kelime yükleme, AI analiz ve veritabanı yönetimi',
      color: '#007bff'
    },
    {
      id: 'questions',
      title: 'Soru Yönetimi', 
      icon: '❓',
      description: 'Kelime seçimi, soru oluşturma ve yönetimi',
      color: '#28a745'
    }
  ];

  // Kelime modülü sekmeleri
  const wordsTabs: WordsTabConfig[] = [
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
    },
    {
      id: 'database',
      label: 'Veritabanı',
      icon: '🗄️',
      description: 'Kelime veritabanı görüntüleme ve istatistikler'
    }
  ];

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
    
    // Modül değiştiğinde ilk sekmeye git
    if (moduleId === 'words') {
      setActiveWordsTab('file');
    } else if (moduleId === 'questions') {
      setActiveQuestionsTab('selection');
    }
  };

  const handleWordsTabClick = (tabId: WordsTabType) => {
    setActiveWordsTab(tabId);
  };

  const handleQuestionsTabClick = (tabId: QuestionsTabType) => {
    setActiveQuestionsTab(tabId);
  };

  // Soru modülü için refresh handler - YENİ
  const handleQuestionsRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const renderWordsContent = () => {
    switch (activeWordsTab) {
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
      case 'database':
        return <WordsModule />;
      default:
        return <FileUpload onFileUploaded={handleFileUploaded} />;
    }
  };

  const renderQuestionsContent = () => {
    return (
      <QuestionsModule 
        activeTab={activeQuestionsTab}
        onTabChange={handleQuestionsTabClick}
        refreshKey={refreshKey} // Yeni prop eklendi
        onRefresh={handleQuestionsRefresh} // Yeni prop eklendi
      />
    );
  };

  const renderContent = () => {
    switch (activeModule) {
      case 'words':
        return (
          <div>
            {/* Kelime Modülü Alt Sekmeleri */}
            <div style={{ 
              backgroundColor: '#f8f9fa',
              borderBottom: '1px solid #dee2e6',
              padding: '0'
            }}>
              <div style={{ 
                maxWidth: '1200px', 
                margin: '0 auto',
                display: 'flex',
                overflow: 'auto'
              }}>
                {wordsTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleWordsTabClick(tab.id)}
                    style={{
                      flex: '1',
                      minWidth: '200px',
                      padding: '15px 10px',
                      border: 'none',
                      backgroundColor: activeWordsTab === tab.id ? '#ffffff' : 'transparent',
                      color: activeWordsTab === tab.id ? '#495057' : '#6c757d',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: activeWordsTab === tab.id ? 'bold' : 'normal',
                      borderBottom: activeWordsTab === tab.id ? '2px solid #007bff' : '2px solid transparent',
                      transition: 'all 0.3s ease',
                      textAlign: 'center'
                    }}
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
                    <div style={{ fontSize: '20px', marginBottom: '3px' }}>
                      {tab.icon}
                    </div>
                    <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                      {tab.label}
                    </div>
                    <div style={{ 
                      fontSize: '11px', 
                      opacity: 0.7,
                      lineHeight: '1.2'
                    }}>
                      {tab.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Kelime Modülü İçeriği */}
            <main style={{ 
              minHeight: 'calc(100vh - 300px)',
              backgroundColor: '#ffffff'
            }}>
              {renderWordsContent()}
            </main>
          </div>
        );
      
      case 'questions':
        return (
          <main style={{ 
            minHeight: 'calc(100vh - 200px)',
            backgroundColor: '#ffffff'
          }}>
            {renderQuestionsContent()}
          </main>
        );
      
      default:
        return renderWordsContent();
    }
  };

  return (
    <div className="App">
      {/* Ana Header */}
      <header style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px', 
        color: 'white', 
        textAlign: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '28px' }}>
          🧙‍♂️ Word Wizard Admin Panel
        </h1>
        <p style={{ margin: '0 0 10px 0', opacity: 0.9, fontSize: '16px' }}>
          İngilizce Kelime ve Soru Yönetim Sistemi
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <span style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            padding: '4px 12px',
            borderRadius: '15px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            Gemini 2.0 Flash AI
          </span>
          <span style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            padding: '4px 12px',
            borderRadius: '15px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            Supabase DB
          </span>
          <span style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            padding: '4px 12px',
            borderRadius: '15px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            v3.0 Admin
          </span>
        </div>
      </header>

      {/* Ana Modül Navigasyonu */}
      <div style={{ 
        backgroundColor: '#ffffff',
        borderBottom: '2px solid #e9ecef',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          display: 'flex'
        }}>
          {modules.map((module) => (
            <button
              key={module.id}
              onClick={() => handleModuleClick(module.id)}
              style={{
                flex: '1',
                padding: '25px 20px',
                border: 'none',
                backgroundColor: activeModule === module.id ? '#ffffff' : '#f8f9fa',
                color: activeModule === module.id ? module.color : '#6c757d',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                borderBottom: activeModule === module.id ? `4px solid ${module.color}` : '4px solid transparent',
                transition: 'all 0.3s ease',
                textAlign: 'center',
                transform: activeModule === module.id ? 'translateY(-2px)' : 'none',
                boxShadow: activeModule === module.id ? '0 4px 8px rgba(0,0,0,0.1)' : 'none'
              }}
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
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                {module.icon}
              </div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>
                {module.title}
              </div>
              <div style={{ 
                fontSize: '12px', 
                opacity: 0.8,
                lineHeight: '1.3',
                maxWidth: '250px',
                margin: '0 auto'
              }}>
                {module.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Modül İçeriği */}
      {renderContent()}

      {/* Footer */}
      <footer style={{ 
        backgroundColor: '#f8f9fa',
        textAlign: 'center', 
        padding: '25px 20px', 
        color: '#6c757d',
        borderTop: '1px solid #dee2e6',
        marginTop: 'auto'
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '20px',
            marginBottom: '20px'
          }}>
            <div>
              <h4 style={{ color: '#495057', marginBottom: '10px' }}>
                📚 Kelime Modülü Özellikleri
              </h4>
              <p style={{ margin: '5px 0', fontSize: '13px' }}>
                ✅ Toplu dosya yükleme sistemi
              </p>
              <p style={{ margin: '5px 0', fontSize: '13px' }}>
                ✅ 6 aşamalı AI kelime analizi
              </p>
              <p style={{ margin: '5px 0', fontSize: '13px' }}>
                ✅ Queue yönetimi ve background processing
              </p>
            </div>

            <div>
              <h4 style={{ color: '#495057', marginBottom: '10px' }}>
                ❓ Soru Modülü Özellikleri
              </h4>
              <p style={{ margin: '5px 0', fontSize: '13px' }}>
                ✅ Çoklu kelime seçimi ve filtreleme
              </p>
              <p style={{ margin: '5px 0', fontSize: '13px' }}>
                ✅ AI destekli soru oluşturma
              </p>
              <p style={{ margin: '5px 0', fontSize: '13px' }}>
                ✅ Soru veritabanı yönetimi
              </p>
            </div>
          </div>

          <div style={{ 
            borderTop: '1px solid #dee2e6', 
            paddingTop: '15px',
            fontSize: '12px'
          }}>
            <p style={{ margin: '0' }}>
              🤖 <strong>Gemini 2.0 Flash</strong> | 
              🗄️ <strong>Supabase PostgreSQL</strong> | 
              ⚛️ <strong>React + TypeScript</strong> | 
              🔧 <strong>Modüler Admin Panel</strong>
            </p>
            
            <p style={{ margin: '5px 0 0 0', opacity: 0.8 }}>
              Environment: {process.env.NODE_ENV || 'development'} | 
              Backend: {process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;