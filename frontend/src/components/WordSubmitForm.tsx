import React, { useState } from 'react';
import { addWord } from '../services/wordService';
import type { WordEntry, WordSubmission } from '../types/word.types';

interface WordSubmitFormProps {
  onWordAdded: (newWord: WordEntry) => void;
}

const WordSubmitForm: React.FC<WordSubmitFormProps> = ({ onWordAdded }) => {
  const [word, setWord] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedWordDetails, setSubmittedWordDetails] = useState<WordEntry | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!word.trim()) {
      setError('Please enter a word.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSubmittedWordDetails(null);

    try {
      const wordSubmission: WordSubmission = { word: word.trim() };
      const newWordEntry = await addWord(wordSubmission);
      setSubmittedWordDetails(newWordEntry);
      onWordAdded(newWordEntry); // Notify parent component
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

      {submittedWordDetails && (
        <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px' }}>
          <h3>Word Details Added:</h3>
          <p><strong>Word:</strong> {submittedWordDetails.word}</p>
          <p><strong>Part of Speech:</strong> {submittedWordDetails.part_of_speech}</p>
          <p><strong>Difficulty:</strong> {submittedWordDetails.difficulty_level}</p>
          <div>
            <strong>Definition:</strong>
            <ul>
              {submittedWordDetails.definition.split('\\n').map((def, index) => def.trim() && <li key={index}>{def.replace(/^•\s*/, '')}</li>)}
            </ul>
          </div>
          <p><strong>Example:</strong> {submittedWordDetails.example_sentence}</p>
          <p><strong>Options:</strong></p>
          <ul>
            <li>A: {submittedWordDetails.option_a} (Correct)</li>
            <li>B: {submittedWordDetails.option_b}</li>
            <li>C: {submittedWordDetails.option_c}</li>
            <li>D: {submittedWordDetails.option_d}</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default WordSubmitForm;