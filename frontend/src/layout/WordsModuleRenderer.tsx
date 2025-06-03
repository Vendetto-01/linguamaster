// frontend/src/components/layout/WordsModuleRenderer.tsx - GÜNCELLENMİŞ VERSİYON
import React from 'react';
import FileUpload from '../words/FileUpload';
import QueueStatus from '../words/QueueStatus';
import WordsModule from '../words/WordsModule';
import type { FileUploadResponse } from '../../types';
import type { WordsModuleTabId } from '../../types'; // Merkezi WordsModuleTabId import edildi

// Lokal WordsTabType tanımı kaldırıldı.

interface WordsModuleRendererProps {
  activeWordsTab: WordsModuleTabId; // Merkezi tip kullanılıyor
  lastBatchId?: string;
  onFileUploaded: (result: FileUploadResponse) => void;
}

const WordsModuleRenderer: React.FC<WordsModuleRendererProps> = ({
  activeWordsTab,
  lastBatchId,
  onFileUploaded,
}) => {
  switch (activeWordsTab) {
    case 'file':
      return <FileUpload onFileUploaded={onFileUploaded} />;
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
      // Varsayılan durum için bir fallback veya hata yönetimi eklenebilir.
      // Ya da activeWordsTab her zaman geçerli bir değer alacak şekilde App.tsx'te kontrol edilebilir.
      return <FileUpload onFileUploaded={onFileUploaded} />;
  }
};

export default WordsModuleRenderer;