import React, { useState } from 'react';
import WordForm from './components/WordForm';
import './App.css';

function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleWordsAdded = () => {
    // Gelecekte kelime listesi eklendiğinde buradan yenileyeceğiz
    setRefreshKey(prev => prev + 1);
    console.log('Kelimeler eklendi, sayfa yenileniyor...');
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
        <h1>🌍 LinguaMaster</h1>
        <p>İngilizce Kelime Veritabanı Yöneticisi</p>
      </header>

      <main>
        <WordForm onWordsAdded={handleWordsAdded} />
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