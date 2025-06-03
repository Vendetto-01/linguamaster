import React, { useState } from 'react';
import WordSubmitForm from '../components/WordSubmitForm';
import type { WordEntry } from '../types/word.types';

const AdminPage: React.FC = () => {
  const [lastAddedWord, setLastAddedWord] = useState<WordEntry | null>(null);
  // In a more complex app, you might have a list of words, etc.
  // For now, we just show the last one added via the form's own display.

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
        If you wanted to display it separately or add to a list on this page,
        you could use the `lastAddedWord` state. For example:

        {lastAddedWord && (
          <div style={{ marginTop: '30px', borderTop: '2px solid blue', paddingTop: '20px' }}>
            <h2>Confirmation on Admin Page:</h2>
            <p>Successfully added: <strong>{lastAddedWord.word}</strong></p>
            <p>Definition: {lastAddedWord.definition.split('\n')[0]}</p>
          </div>
        )} 
      */}
    </div>
  );
};

export default AdminPage;