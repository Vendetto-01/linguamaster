import React, { useState, useEffect } from 'react';
import WordForm from './components/WordForm';
import FileUpload from './components/FileUpload';
import QueueStatus from './components/QueueStatus';
import config from './config';
import './App.css';
import { BulkAddResponse, FileUploadResponse } from './types';
import { wordApi } from './services/api';
import styles from './App.module.css';
import './App.css';

type TabType = 'file' | 'manual' | 'queue' | 'questionGenerator';

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

// Minimal Types - Sadece gerekli alanlar
interface Word {
  id: number;
  word: string;
  meaning_id: number;
  question_count: number;
}

interface DatabaseInfo {
  words_table: {
    total_rows: number;
    columns: string[];
    column_count: number;
  };
  questions_table: {
    total_rows: number;
    columns: string[];
    column_count: number;
  };
}

interface WordsResponse {
  words: Word[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
    has_next: boolean;
    has_prev: boolean;
  };
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
    },
    {
      id: 'questionGenerator',
      label: 'Question Generator',
      icon: '❓',
      description: 'Generate questions for selected words'
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
     case 'questionGenerator':
       return <QuestionGenerator />;
     default:
       return <FileUpload onFileUploaded={handleFileUploaded} />;
   }
 };

 const QuestionGenerator = () => {
   const [words, setWords] = useState<Word[]>([]);
   const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo | null>(null);
   const [selectedWordIds, setSelectedWordIds] = useState<Set<number>>(new Set());
   const [currentPage, setCurrentPage] = useState(1);
   const [pagination, setPagination] = useState<WordsResponse['pagination'] | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [isGenerating, setIsGenerating] = useState(false);
 
   // Fetch database info
   const fetchDatabaseInfo = async () => {
     try {
       const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/questionWizard/database-info`);
       if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
       
       const data = await response.json();
       setDatabaseInfo(data);
       console.log('✅ Database info yüklendi');
     } catch (err) {
       console.error('❌ Database info hatası:', err);
     }
   };
 
   // Fetch words with pagination
   const fetchWords = async (page: number = 1) => {
     try {
       setLoading(true);
       setError(null);
       
       const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/questionWizard/words?page=${page}`);
       if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
       
       const data: WordsResponse = await response.json();
       setWords(data.words);
       setPagination(data.pagination);
       setCurrentPage(page);
       
       console.log(`✅ Sayfa ${page}: ${data.words.length} kelime yüklendi`);
     } catch (err) {
       console.error('❌ Words fetch hatası:', err);
       setError(err instanceof Error ? err.message : 'Veri yüklenirken hata oluştu');
     } finally {
       setLoading(false);
     }
   };
 
   // Initial load
   useEffect(() => {
     Promise.all([fetchDatabaseInfo(), fetchWords(1)]);
   }, []);
 
   // Handle word selection
   const handleSelectWord = (wordId: number) => {
     const newSelected = new Set(selectedWordIds);
     if (newSelected.has(wordId)) {
       newSelected.delete(wordId);
     } else {
       newSelected.add(wordId);
     }
     setSelectedWordIds(newSelected);
   };
 
   // Handle select all on current page
   const handleSelectAllPage = () => {
     const currentPageWordIds = words.map(w => w.id);
     const newSelected = new Set(selectedWordIds);
     
     const allCurrentSelected = currentPageWordIds.every(id => newSelected.has(id));
     
     if (allCurrentSelected) {
       // Deselect all current page
       currentPageWordIds.forEach(id => newSelected.delete(id));
     } else {
       // Select all current page
       currentPageWordIds.forEach(id => newSelected.add(id));
     }
     
     setSelectedWordIds(newSelected);
   };
 
   // Generate questions
   const handleGenerateQuestions = async () => {
     if (selectedWordIds.size === 0) {
       alert('Lütfen en az bir kelime seçin!');
       return;
     }
 
     const confirmed = window.confirm(
       `${selectedWordIds.size} kelime için sorular oluşturulsun mu?\n\n` +
       `⚠️ Bu işlem ${selectedWordIds.size} dakika kadar sürebilir.`
     );
     if (!confirmed) return;
 
     try {
       setIsGenerating(true);
       console.log(`🚀 ${selectedWordIds.size} kelime için soru oluşturma başladı...`);
 
       const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/questionWizard/questions/generate`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ wordIds: Array.from(selectedWordIds) }),
       });
 
       if (!response.ok) {
         const errorData = await response.json().catch(() => ({}));
         throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
       }
 
       const result = await response.json();
       
       const successMsg = `✅ Soru oluşturma tamamlandı!\n\n` +
         `📊 Başarılı: ${result.successful}\n` +
         `❌ Hatalı: ${result.failed}\n` +
         `📈 Başarı oranı: ${result.success_rate}`;
       
       alert(successMsg);
       
       // Refresh data
       await Promise.all([fetchDatabaseInfo(), fetchWords(currentPage)]);
       setSelectedWordIds(new Set());
       
     } catch (err) {
       console.error('❌ Generate questions hatası:', err);
       alert('❌ Soru oluşturulurken hata: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'));
     } finally {
       setIsGenerating(false);
     }
   };
 
   // Page navigation
   const goToPage = (page: number) => {
     if (page >= 1 && page <= (pagination?.total_pages || 1)) {
       fetchWords(page);
     }
   };
 
   if (loading && !words.length) {
     return (
       <div className="app">
         <div className="loading">
           <div>🔄</div>
           <p>Veriler yükleniyor...</p>
           <small>Backend: {process.env.REACT_APP_BACKEND_URL}</small>
         </div>
       </div>
     );
   }
 
   if (error && !words.length) {
     return (
       <div className="app">
         <div className="error">
           <h2>❌ Bağlantı Hatası</h2>
           <p>{error}</p>
           <small>Backend: {process.env.REACT_APP_BACKEND_URL}</small>
           <button onClick={() => fetchWords(1)}>🔄 Tekrar Dene</button>
         </div>
       </div>
     );
   }
 
   const allCurrentPageSelected = words.length > 0 && words.every(w => selectedWordIds.has(w.id));
 
   return (
     <div className="app">
       <header className="header">
         <h1>🧠 Question Generator</h1>
         <p>Basit soru oluşturma arayüzü</p>
       </header>
 
       {/* Database Info */}
       {databaseInfo && (
         <div className="database-info">
           <div className="db-card">
             <h3>📚 Words Tablosu</h3>
             <div className="db-stat">
               <span>Toplam Kayıt:</span>
               <strong>{databaseInfo.words_table.total_rows.toLocaleString()}</strong>
             </div>
             <div className="db-stat">
               <span>Sütun Sayısı:</span>
               <strong>{databaseInfo.words_table.column_count}</strong>
             </div>
           </div>
           <div className="db-card">
             <h3>❓ Questions Tablosu</h3>
             <div className="db-stat">
               <span>Toplam Kayıt:</span>
               <strong>{databaseInfo.questions_table.total_rows.toLocaleString()}</strong>
             </div>
             <div className="db-stat">
               <span>Sütun Sayısı:</span>
               <strong>{databaseInfo.questions_table.column_count}</strong>
             </div>
           </div>
         </div>
       )}
 
       {/* Words List */}
       <div className="words-section">
         <div className="words-header">
           <h3>📋 Kelime Kombinasyonları</h3>
           {pagination && (
             <div className="pagination-info">
               Sayfa {pagination.current_page}/{pagination.total_pages} |
               Toplam: {pagination.total_items.toLocaleString()} |
               Seçili: {selectedWordIds.size}
             </div>
           )}
         </div>
 
         <div className="words-list">
           {/* Select All Header */}
           <div className="word-item" style={{ backgroundColor: '#f8fafc', fontWeight: 'bold' }}>
             <input
               type="checkbox"
               checked={allCurrentPageSelected}
               onChange={handleSelectAllPage}
               disabled={isGenerating}
             />
             <div className="word-info">
               <span>Tümünü Seç/Bırak (Bu Sayfa)</span>
               <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                 {words.length} kombinasyon
               </span>
             </div>
           </div>
 
           {/* Words */}
           {words.map((word) => (
             <div
               key={word.id}
               className={`word-item ${selectedWordIds.has(word.id) ? 'selected' : ''}`}
             >
               <input
                 type="checkbox"
                 checked={selectedWordIds.has(word.id)}
                 onChange={() => handleSelectWord(word.id)}
                 disabled={isGenerating}
               />
               <div className="word-info">
                 <div>
                   <span className="word-text">{word.word}</span>
                   <span className="meaning-id"> (meaning_id: {word.meaning_id})</span>
                 </div>
                 <span className={`question-count ${word.question_count > 0 ? 'has-questions' : 'no-questions'}`}>
                   {word.question_count} soru
                 </span>
               </div>
             </div>
           ))}
         </div>
 
         {/* Pagination */}
         {pagination && pagination.total_pages > 1 && (
           <div className="pagination">
             <button
               onClick={() => goToPage(currentPage - 1)}
               disabled={!pagination.has_prev}
             >
               ◀ Önceki
             </button>
             
             <button className="current-page">
               {pagination.current_page}
             </button>
             
             <button
               onClick={() => goToPage(currentPage + 1)}
               disabled={!pagination.has_next}
             >
               Sonraki ▶
             </button>
             
             <span style={{ marginLeft: '1rem', color: '#6b7280' }}>
               / {pagination.total_pages} sayfa
             </span>
           </div>
         )}
       </div>
 
       {/* Action Bar */}
       <div className="action-bar">
         <div className="selection-info">
           {selectedWordIds.size > 0
             ? `${selectedWordIds.size} kombinasyon seçildi`
             : 'Kombinasyon seçilmedi'
           }
           {isGenerating && (
             <div style={{ color: '#f59e0b', fontWeight: 'bold', marginTop: '0.5rem' }}>
               🔄 Sorular oluşturuluyor...
             </div>
           )}
         </div>
         
         <button
           onClick={handleGenerateQuestions}
           disabled={selectedWordIds.size === 0 || isGenerating}
           className="generate-btn"
         >
           {isGenerating
             ? '⏳ Oluşturuluyor...'
             : `🤖 Sorular Oluştur (${selectedWordIds.size})`
           }
         </button>
       </div>
     </div>
   );
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