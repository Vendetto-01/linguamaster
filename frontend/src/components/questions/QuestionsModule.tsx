// frontend/src/components/questions/QuestionsModule.tsx - SORU YÖNETİMİ ANA MODÜL
import React, { useState } from 'react';
import WordSelection from './WordSelection';
import QuestionGeneration from './QuestionGeneration';
import QuestionManagement from './QuestionManagement';

type QuestionsTabType = 'selection' | 'generation' | 'management';

interface QuestionsTabConfig {
  id: QuestionsTabType;
  label: string;
  icon: string;
  description: string;
}

interface QuestionsModuleProps {
  activeTab: QuestionsTabType;
  onTabChange: (tab: QuestionsTabType) => void;
  refreshKey?: number; // ✅ Yeni prop eklendi
  onRefresh?: () => void; // ✅ Yeni prop eklendi
}

interface SelectedWord {
  id: number;
  word: string;
  meaning_id: number;
  part_of_speech: string;
  meaning_description: string;
  english_example: string;
  turkish_meaning: string;
  final_difficulty: string;
}

const QuestionsModule: React.FC<QuestionsModuleProps> = ({ 
  activeTab, 
  onTabChange,
  refreshKey = 0, // ✅ Default value
  onRefresh // ✅ Yeni prop
}) => {
  const [selectedWords, setSelectedWords] = useState<SelectedWord[]>([]);
  const [localRefreshKey, setLocalRefreshKey] = useState(0);

  // Soru modülü sekmeleri
  const tabs: QuestionsTabConfig[] = [
    {
      id: 'selection',
      label: 'Kelime Seçimi',
      icon: '🎯',
      description: 'Soru oluşturulacak kelimeleri seçin'
    },
    {
      id: 'generation',
      label: 'Soru Oluşturma',
      icon: '🤖',
      description: 'AI ile otomatik soru oluşturma'
    },
    {
      id: 'management',
      label: 'Soru Yönetimi',
      icon: '📋',
      description: 'Mevcut soruları görüntüle ve yönet'
    }
  ];

  // Effective refresh key - hem parent hem local refresh'i birleştir
  const effectiveRefreshKey = refreshKey + localRefreshKey;

  const handleWordsSelected = (words: SelectedWord[]) => {
    setSelectedWords(words);
    console.log(`${words.length} kelime seçildi:`, words.map(w => w.word).join(', '));
    
    // Kelime seçildikten sonra otomatik olarak soru oluşturma sekmesine geç
    if (words.length > 0) {
      setTimeout(() => {
        onTabChange('generation');
      }, 500);
    }
  };

  const handleQuestionsGenerated = (generatedCount: number) => {
    setLocalRefreshKey(prev => prev + 1);
    onRefresh?.(); // ✅ Parent'a bildir
    console.log(`${generatedCount} soru oluşturuldu`);
    
    // Soru oluşturulduktan sonra yönetim sekmesine geç
    if (generatedCount > 0) {
      setTimeout(() => {
        onTabChange('management');
      }, 1000);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'selection':
        return (
          <WordSelection 
            onWordsSelected={handleWordsSelected}
            selectedWords={selectedWords}
          />
        );
      
      case 'generation':
        return (
          <QuestionGeneration 
            selectedWords={selectedWords}
            onQuestionsGenerated={handleQuestionsGenerated}
            onBackToSelection={() => onTabChange('selection')}
          />
        );
      
      case 'management':
        return (
          <QuestionManagement 
            refreshKey={effectiveRefreshKey} // ✅ refreshKey'i geç
          />
        );
      
      default:
        return (
          <WordSelection 
            onWordsSelected={handleWordsSelected}
            selectedWords={selectedWords}
          />
        );
    }
  };

  return (
    <div>
      {/* Soru Modülü Alt Sekmeleri */}
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
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                flex: '1',
                minWidth: '200px',
                padding: '15px 10px',
                border: 'none',
                backgroundColor: activeTab === tab.id ? '#ffffff' : 'transparent',
                color: activeTab === tab.id ? '#495057' : '#6c757d',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                borderBottom: activeTab === tab.id ? '2px solid #28a745' : '2px solid transparent',
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

      {/* Seçili Kelimeler Özeti (Generation ve Management sekmelerinde göster) */}
      {(activeTab === 'generation' || activeTab === 'management') && selectedWords.length > 0 && (
        <div style={{
          backgroundColor: '#e8f5e8',
          border: '1px solid #c3e6cb',
          borderRadius: '0 0 8px 8px',
          padding: '10px 20px',
          margin: '0',
          fontSize: '14px',
          color: '#155724'
        }}>
          <strong>✅ Seçili Kelimeler ({selectedWords.length}):</strong> {' '}
          {selectedWords.slice(0, 5).map(w => w.word).join(', ')}
          {selectedWords.length > 5 && ` ve ${selectedWords.length - 5} kelime daha...`}
          <button
            onClick={() => onTabChange('selection')}
            style={{
              marginLeft: '10px',
              padding: '2px 8px',
              fontSize: '12px',
              backgroundColor: 'transparent',
              color: '#155724',
              border: '1px solid #155724',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            Değiştir
          </button>
        </div>
      )}

      {/* İçerik */}
      <main style={{ 
        minHeight: 'calc(100vh - 400px)',
        backgroundColor: '#ffffff'
      }}>
        {renderTabContent()}
      </main>

      {/* Soru Modülü Bilgi Kutusu */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderTop: '1px solid #dee2e6',
        fontSize: '14px',
        color: '#495057'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h4 style={{ color: '#28a745', marginBottom: '15px', textAlign: 'center' }}>
            ❓ Soru Oluşturma Sistemi - Gemini 2.0 Flash AI Destekli
          </h4>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '20px'
          }}>
            <div>
              <strong>🎯 1. Kelime Seçimi:</strong>
              <ul style={{ margin: '5px 0', paddingLeft: '15px', fontSize: '13px' }}>
                <li>Veritabanından kelimeleri filtrele ve seç</li>
                <li>Çoklu seçim ve toplu işlem desteği</li>
                <li>Zorluk seviyesi ve kelime türü filtreleri</li>
                <li>Sayfalama ile büyük veri setleri</li>
              </ul>
            </div>
            
            <div>
              <strong>🤖 2. AI Soru Oluşturma:</strong>
              <ul style={{ margin: '5px 0', paddingLeft: '15px', fontSize: '13px' }}>
                <li>Gemini 2.0 Flash ile 4 seçenekli test soruları</li>
                <li>Context-aware sorular ve çeldiriciler</li>
                <li>Akademik seviyede soru kalitesi</li>
                <li>Rate limiting ile güvenli işlem</li>
              </ul>
            </div>
            
            <div>
              <strong>📋 3. Soru Yönetimi:</strong>
              <ul style={{ margin: '5px 0', paddingLeft: '15px', fontSize: '13px' }}>
                <li>Oluşturulan soruları görüntüle ve düzenle</li>
                <li>Soru kalitesi kontrolü ve onaylama</li>
                <li>İstatistikler ve performans takibi</li>
                <li>Toplu soru operasyonları</li>
              </ul>
            </div>
          </div>

          <div style={{ 
            backgroundColor: '#e7f3ff', 
            padding: '10px', 
            borderRadius: '5px',
            marginTop: '15px',
            textAlign: 'center',
            fontSize: '13px'
          }}>
            <strong>⚡ Sistem Performansı:</strong> ~1 soru/saniye | 
            <strong>🎯 Kalite:</strong> AI-reviewed | 
            <strong>📊 Format:</strong> Multiple Choice (A/B/C/D) | 
            <strong>🔄 Entegrasyon:</strong> Kelime veritabanı ile senkron
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionsModule;