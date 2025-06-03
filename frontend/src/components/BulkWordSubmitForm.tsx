import React, { useState } from 'react';
import { submitBulkWords } from '../services/wordService';
import type { BulkSubmissionResponse } from '../services/wordService';

interface BulkWordSubmitFormProps {
  onBulkJobSubmitted: (response: BulkSubmissionResponse) => void;
}

const BulkWordSubmitForm: React.FC<BulkWordSubmitFormProps> = ({ onBulkJobSubmitted }) => {
  const [wordsInput, setWordsInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionResponse, setSubmissionResponse] = useState<BulkSubmissionResponse | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const wordsArray = wordsInput.split('\n').map(word => word.trim()).filter(word => word.length > 0);

    if (wordsArray.length === 0) {
      setError('Please enter at least one word.');
      return;
    }
    // Note: The backend has its own limit (e.g., 500 words). 
    // We could add a frontend limit check here too if desired.

    setIsLoading(true);
    setError(null);
    setSubmissionResponse(null);

    try {
      const response = await submitBulkWords({ words: wordsArray });
      setSubmissionResponse(response);
      onBulkJobSubmitted(response);
      setWordsInput(''); // Clear textarea after successful submission
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during bulk submission.');
      console.error("Bulk submission error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '30px', padding: '20px', border: '1px dashed #007bff' }}>
      <h2>Bulk Word Submission</h2>
      <p>Enter words separated by new lines. Each word will be processed individually in the background.</p>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="bulk-words-input">Words (one per line):</label>
          <textarea
            id="bulk-words-input"
            value={wordsInput}
            onChange={(e) => setWordsInput(e.target.value)}
            placeholder="Enter words here, one per line..."
            rows={10}
            style={{ width: '100%', minHeight: '150px', marginTop: '5px', marginBottom: '10px', padding: '8px', boxSizing: 'border-box' }}
            disabled={isLoading}
          />
        </div>
        <button type="submit" disabled={isLoading} style={{ padding: '10px 15px' }}>
          {isLoading ? 'Submitting Bulk Job...' : 'Submit Bulk Job'}
        </button>
      </form>

      {error && <p style={{ color: 'red', marginTop: '10px' }}>Error: {error}</p>}

      {submissionResponse && (
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#e6ffed', border: '1px solid #b2f2bb' }}>
          <h4>Bulk Job Submitted:</h4>
          <p>{submissionResponse.message}</p>
          <p><strong>Job ID:</strong> {submissionResponse.jobId}</p>
          <p><strong>Status:</strong> {submissionResponse.status}</p>
          <p><strong>Total Words Queued:</strong> {submissionResponse.totalWords}</p>
          <p><em>Processing occurs in the background. You can add a job status tracking page later.</em></p>
        </div>
      )}
    </div>
  );
};

export default BulkWordSubmitForm;