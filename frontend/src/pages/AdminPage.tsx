import React, { useState } from 'react';
import WordSubmitForm from '../components/WordSubmitForm';
import type { WordEntry } from '../types/word.types';

const AdminPage: React.FC = () => {
  // Store an array of the last added entries, or just the first one for simple display
  const [lastAddedEntries, setLastAddedEntries] = useState<WordEntry[] | null>(null);

  const handleWordEntriesAdded = (newEntries: WordEntry[]) => {
    console.log(`${newEntries.length} word entries added from AdminPage:`, newEntries);
    setLastAddedEntries(newEntries);
    // Here you could, for example, add them to a list of words displayed on this page
    // or trigger a refetch if displaying a list from the server.
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Vocabulary Admin Panel</h1>
      <p>Use the form below to submit new vocabulary words. The system will fetch definitions and details. A word may result in multiple entries if it has multiple distinct definitions.</p>
      
      <WordSubmitForm onWordEntriesAdded={handleWordEntriesAdded} />

      {/* 
        The WordSubmitForm now displays all entries.
        This section can show a summary or the first entry as confirmation.
      */}
      {lastAddedEntries && lastAddedEntries.length > 0 && (
        <div style={{ marginTop: '30px', borderTop: '2px solid blue', paddingTop: '20px' }}>
          <h2>Confirmation on Admin Page:</h2>
          <p>Successfully added <strong>{lastAddedEntries[0].word}</strong> ({lastAddedEntries.length} entr{lastAddedEntries.length === 1 ? 'y' : 'ies'}).</p>
          {/* You could list all definitions or just the first few */}
          {lastAddedEntries.slice(0, 3).map((entry, index) => (
            <p key={entry.id || index}><em>Definition {index + 1}:</em> {entry.definition}</p>
          ))}
          {lastAddedEntries.length > 3 && <p>...</p>}
        </div>
      )}
    </div>
  );
};

export default AdminPage;