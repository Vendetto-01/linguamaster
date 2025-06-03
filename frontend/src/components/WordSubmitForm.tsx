import React, { useState } from 'react';
import { addWord } from '../services/wordService';
import type { WordEntry, WordSubmission } from '../types/word.types';

interface WordSubmitFormProps {
  // This will now pass an array of WordEntry objects, or the first one if preferred by parent
  onWordEntriesAdded: (newEntries: WordEntry[]) => void; 
}

const WordSubmitForm: React.FC<WordSubmitFormProps> = ({ onWordEntriesAdded }) => {
  const [word, setWord] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // Store an array of submitted word details
  const [submittedWordEntries, setSubmittedWordEntries] = useState<WordEntry[] | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!word.trim()) {
      setError('Please enter a word.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSubmittedWordEntries(null); // Clear previous results

    try {
      const wordSubmission: WordSubmission = { word: word.trim() };
      // addWord now returns WordEntry[]
      const newEntries = await addWord(wordSubmission); 
      setSubmittedWordEntries(newEntries);
      onWordEntriesAdded(newEntries); // Notify parent component with all entries
      setWord(''); // Clear input after successful submission
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      console.error("Submission error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="word-input">Enter Word:</label>
          <input
            id="word-input"
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder="e.g., ubiquitous"
            disabled={isLoading}
          />
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Submitting...' : 'Submit Word'}
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {submittedWordEntries && submittedWordEntries.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Word Details Added ({submittedWordEntries.length} entr{submittedWordEntries.length === 1 ? 'y' : 'ies'}):</h3>
          {submittedWordEntries.map((entry, index) => (
            <div key={entry.id || index} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
              <p><strong>Word:</strong> {entry.word}</p>
              <p><strong>Part of Speech:</strong> {entry.part_of_speech}</p>
              <p><strong>Difficulty:</strong> {entry.difficulty_level}</p>
              <p><strong>Definition:</strong> {entry.definition}</p> {/* Each entry has one definition now */}
              <p><strong>Example:</strong> {entry.example_sentence}</p>
              <p><strong>Options:</strong></p>
              <ul>
                <li>A: {entry.option_a} (Correct)</li>
                <li>B: {entry.option_b}</li>
                <li>C: {entry.option_c}</li>
                <li>D: {entry.option_d}</li>
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WordSubmitForm;