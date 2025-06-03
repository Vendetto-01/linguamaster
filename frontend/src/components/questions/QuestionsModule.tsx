// frontend/src/components/questions/QuestionsModule.tsx - GÜNCELLENMİŞ VERSİYON
import React, { useState, useEffect } from 'react';
import WordSelection from './WordSelection';
import QuestionGeneration from './QuestionGeneration';
import QuestionManagement from './QuestionManagement';
import type { Word, QuestionsModuleTabId, Question } from '../../types'; // Word tipi WordSelection'dan gelebilir
// Merkezi QuestionsModuleTabId import edildi
// Question tipi questions.ts'den - ARTIK MERKEZİ TİPTEN GELİYOR

// QuestionsModuleProps arayüzü güncellendi
interface QuestionsModuleProps {
  activeTab: QuestionsModuleTabId; // Merkezi tip kullanılıyor
  onTabChange: (tab: QuestionsModuleTabId) => void; // Merkezi tip kullanılıyor
  refreshKey: number; // Forcing re-renders or re-fetches in child components
  onRefresh: () => void; // Callback to parent to indicate a refresh might be needed
}

// TabConfig arayüzü güncellendi
interface TabConfig {
  id: QuestionsModuleTabId; // Merkezi tip kullanılıyor
  label: string;
  icon: string;
  description: string;
  color: string; // Renk eklendi (App.tsx'deki gibi)
}

const QuestionsModule: React.FC<QuestionsModuleProps> = ({
  activeTab,
  onTabChange,
  refreshKey,
  onRefresh
}) => {
  const [selectedWordsForGeneration, setSelectedWordsForGeneration] = useState<Word[]>([]);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]); // Düzeltilmiş: Question[] olmalı

  useEffect(() => {
    // Potansiyel olarak refreshKey değiştiğinde bazı state'leri sıfırla veya işlemleri tetikle
    console.log('QuestionsModule refreshKey changed:', refreshKey);
  }, [refreshKey]);


  const questionsTabsConfig: TabConfig[] = [
    {
      id: 'selection',
      label: 'Kelime Seçimi',
      icon: '🎯',
      description: 'Soruları oluşturmak için kelimeleri seçin',
      color: '#28a745' // Soru modülü ana rengi
    },
    {
      id: 'generation',
      label: 'Soru Üretme',
      icon: '🤖',
      description: 'AI ile seçilen kelimelerden sorular üretin',
      color: '#17a2b8' // Farklı bir renk
    },
    {
      id: 'management',
      label: 'Soru Yönetimi',
      icon: '⚙️',
      description: 'Mevcut soruları görüntüleyin ve yönetin',
      color: '#ffc107' // Farklı bir renk
    },
  ];

  const handleWordsSelected = (words: Word[]) => {
    setSelectedWordsForGeneration(words);
    if (words.length > 0) {
      onTabChange('generation'); // Kelime seçildiyse otomatik olarak Soru Üretme sekmesine geç
    }
  };

  const handleQuestionsGenerated = (questions: Question[]) => { // Question[] olarak düzeltildi
    setGeneratedQuestions(questions);
    // onRefresh(); // QuestionManagement'in yeniden yüklenmesini tetikle
    if (questions.length > 0) {
        onTabChange('management'); // Soru üretildiyse otomatik olarak Soru Yönetimi sekmesine geç
    }
  };

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'selection':
        return (
          <WordSelection
            onWordsSelected={handleWordsSelected}
            selectedWords={selectedWordsForGeneration}
          />
        );
      case 'generation':
        return (
          <QuestionGeneration
            selectedWords={selectedWordsForGeneration}
            onQuestionsGenerated={handleQuestionsGenerated}
            onBackToSelection={() => onTabChange('selection')}
          />
        );
      case 'management':
        return <QuestionManagement refreshKey={refreshKey} />; // refreshKey QuestionManagement'a iletiliyor
      default:
        return <div>Bilinmeyen sekme</div>;
    }
  };

  return (
    <div>
      {/* Alt Sekme Navigasyonu - App.tsx'teki subTabNavigation'a benzer */}
      <div className="subTabNavigation" style={{ backgroundColor: '#f0fdf4', borderBottom: '2px solid #d1fae5' }}>
        <div className="subTabNavigationContainer">
          {questionsTabsConfig.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`subTabButton ${activeTab === tab.id ? 'active' : ''}`}
              style={
                activeTab === tab.id 
                ? { borderBottomColor: tab.color, color: tab.color, backgroundColor: '#ffffff' } 
                : { borderBottomColor: 'transparent'}
              }
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.backgroundColor = '#e2f5e8';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  // active olmayanlar için hover sonrası rengi transparent yapabiliriz ya da initial rengi koruyabiliriz
                  e.currentTarget.style.backgroundColor = 'transparent'; 
                }
              }}
            >
              <div className="subTabButtonIcon" style={{ fontSize: '22px' }}>{tab.icon}</div>
              <div className="subTabButtonLabel" style={{ fontWeight: activeTab === tab.id ? 'bold' : 'normal' }}>{tab.label}</div>
              <div className="subTabButtonDescription" style={{ fontSize: '12px' }}>{tab.description}</div>
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding: '20px' }}> {/* İçerik için padding */}
        {renderActiveTabContent()}
      </div>
    </div>
  );
};

export default QuestionsModule;