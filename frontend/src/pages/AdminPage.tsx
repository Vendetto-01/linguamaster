import React, { useState } from 'react';
import WordSubmitForm from '../components/WordSubmitForm';
import BulkWordSubmitForm from '../components/BulkWordSubmitForm'; // Import the new component
import type { WordEntry } from '../types/word.types';
import type { BulkSubmissionResponse } from '../services/wordService'; // Import response type

const AdminPage: React.FC = () => {
  const [lastAddedEntries, setLastAddedEntries] = useState<WordEntry[] | null>(null);
  const [lastBulkJobResponse, setLastBulkJobResponse] = useState<BulkSubmissionResponse | null>(null);

  const handleWordEntriesAdded = (newEntries: WordEntry[]) => {
    console.log(`${newEntries.length} word entries added from AdminPage (single submission):`, newEntries);
    setLastAddedEntries(newEntries);
    setLastBulkJobResponse(null); // Clear bulk response if single was used
  };

  const handleBulkJobSubmitted = (response: BulkSubmissionResponse) => {
    console.log('Bulk job submitted from AdminPage:', response);
    setLastBulkJobResponse(response);
    setLastAddedEntries(null); // Clear single entry response if bulk was used
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Vocabulary Admin Panel</h1>
      
      <div style={{ marginBottom: '40px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
        <h2>Single Word Entry</h2>
        <p>Use the form below to submit a single vocabulary word. The system will fetch definitions and details. A word may result in multiple entries if it has multiple distinct definitions.</p>
        <WordSubmitForm onWordEntriesAdded={handleWordEntriesAdded} />
        {lastAddedEntries && lastAddedEntries.length > 0 && (
          <div style={{ marginTop: '20px', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
            <h3>Last Single Submission Result:</h3>
            <p>Successfully processed <strong>{lastAddedEntries[0].word}</strong>, creating {lastAddedEntries.length} entr{lastAddedEntries.length === 1 ? 'y' : 'ies'}. Details are shown above the form.</p>
          </div>
        )}
      </div>

      <BulkWordSubmitForm onBulkJobSubmitted={handleBulkJobSubmitted} />
      
      {lastBulkJobResponse && (
        <div style={{ marginTop: '20px', borderTop: '1px solid #ccc', paddingTop: '10px', backgroundColor: '#f0f8ff', padding: '15px' }}>
          <h3>Last Bulk Job Submission Result:</h3>
          <p>{lastBulkJobResponse.message}</p>
          <p><strong>Job ID:</strong> {lastBulkJobResponse.jobId}</p>
          <p><strong>Status:</strong> {lastBulkJobResponse.status}</p>
          <p><strong>Total Words Queued:</strong> {lastBulkJobResponse.totalWords}</p>
        </div>
      )}
    </div>
  );
};

export default AdminPage;