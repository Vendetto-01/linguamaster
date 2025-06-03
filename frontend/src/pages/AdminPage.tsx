import React, { useState } from 'react';
import WordSubmitForm from '../components/WordSubmitForm';
import type { WordEntry } from '../types/word.types';

const AdminPage: React.FC = () => {
  const [lastAddedWord, setLastAddedWord] = useState<WordEntry | null>(null);
  // In a more complex app, you might have a list of words, etc.
  // For now, we just show the last one added via the form's own display,
  // plus a small confirmation here.

  const handleWordAdded = (newWord: WordEntry) => {
    console.log('Word added from AdminPage:', newWord);
    setLastAddedWord(newWord);
    // Here you could, for example, add it to a list of words displayed on this page
    // or trigger a refetch if displaying a list from the server.
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Vocabulary Admin Panel</h1>
      <p>Use the form below to submit new vocabulary words. The system will fetch definitions and details.</p>
      
      <WordSubmitForm onWordAdded={handleWordAdded} />

      {/* 
        The WordSubmitForm already displays the details of the submitted word.
        This section demonstrates using the state in the AdminPage as well.
      */}
      {lastAddedWord && (
        <div style={{ marginTop: '30px', borderTop: '2px solid blue', paddingTop: '20px' }}>
          <h2>Confirmation on Admin Page:</h2>
          <p>Successfully added: <strong>{lastAddedWord.word}</strong></p>
          <p>Definition (first line): {lastAddedWord.definition.split('\n')[0].replace(/^•\s*/, '')}</p>
        </div>
      )}
    </div>
  );
};

export default AdminPage;