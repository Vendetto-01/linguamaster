import React, { useState } from 'react';
import WordForm from './components/WordForm';
import FileUpload from './components/FileUpload';
import './App.css';

function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<'manual' | 'file'>('file');

  const handleWordsAdded = () => {
    // Gelecekte kelime listesi eklendiğinde buradan yenileyeceğiz
    setRefreshKey(prev => prev + 1);
    console.log('Kelimeler eklendi, sayfa yenileniyor...');
  };

  const handleFileUploaded = (result: any) => {
    console.log('Dosya yüklendi:', result);
    handleWordsAdded();
  };

  return (
    <div className="App">
      <header style={{ 
        backgroundColor: '#282c34', 
        padding: '20px', 
        color: 'white', 
        textAlign: 'center',
        marginBottom: '30px'
      }}>
        <h1>🧙‍♂️ Word Wizard</h1>
        <p>İngilizce Kelime Veritabanı Yöneticisi</p>
      </header>

      {/* Tab Navigation */}
      <div style={{ 
        maxWidth: '600px', 
        margin: '0 auto 30px auto',
        display: 'flex',
        borderBottom: '1px solid #ddd'
      }}>
        <button
          onClick={() => setActiveTab('file')}
          style={{
            flex: 1,
            padding: '15px',
            border: 'none',
            backgroundColor: activeTab === 'file' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'file' ? 'white' : '#333',
            cursor: 'pointer',
            fontSize: '16px',
            borderTopLeftRadius: '5px',
            borderTopRightRadius: activeTab === 'file' ? '5px' : '0'
          }}
        >
          📁 Dosya Yükleme
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          style={{
            flex: 1,
            padding: '15px',
            border: 'none',
            backgroundColor: activeTab === 'manual' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'manual' ? 'white' : '#333',
            cursor: 'pointer',
            fontSize: '16px',
            borderTopRightRadius: '5px',
            borderTopLeftRadius: activeTab === 'manual' ? '5px' : '0'
          }}
        >
          ✍️ Manuel Ekleme
        </button>
      </div>

      <main>
        {activeTab === 'file' ? (
          <FileUpload onFileUploaded={handleFileUploaded} />
        ) : (
          <WordForm onWordsAdded={handleWordsAdded} />
        )}
      </main>

      <footer style={{ 
        textAlign: 'center', 
        padding: '20px', 
        color: '#666',
        marginTop: '50px',
        borderTop: '1px solid #eee'
      }}>
        <p>Backend: {process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}</p>
        <p>Veritabanı: Supabase PostgreSQL</p>
      </footer>
    </div>
  );
}

export default App;