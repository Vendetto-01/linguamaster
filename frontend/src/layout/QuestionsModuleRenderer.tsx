// frontend/src/components/layout/QuestionsModuleRenderer.tsx - GÜNCELLENMİŞ VERSİYON
import React from 'react';
import QuestionsModule from '../questions/QuestionsModule';
import type { QuestionsModuleTabId } from '../../types'; // Merkezi QuestionsModuleTabId import edildi

// Lokal QuestionsTabType tanımı kaldırıldı.

interface QuestionsModuleRendererProps {
  activeQuestionsTab: QuestionsModuleTabId; // Merkezi tip kullanılıyor
  refreshKey: number;
  onQuestionsTabChange: (tab: QuestionsModuleTabId) => void; // Merkezi tip kullanılıyor
  onQuestionsRefresh: () => void;
}

const QuestionsModuleRenderer: React.FC<QuestionsModuleRendererProps> = ({
  activeQuestionsTab,
  refreshKey,
  onQuestionsTabChange,
  onQuestionsRefresh,
}) => {
  return (
    <QuestionsModule
      activeTab={activeQuestionsTab} // QuestionsModule'e QuestionsModuleTabId tipinde prop geçiliyor
      onTabChange={onQuestionsTabChange}
      refreshKey={refreshKey}
      onRefresh={onQuestionsRefresh}
    />
  );
};

export default QuestionsModuleRenderer;