import apiClient from './apiClient';
import type { WordEntry, WordSubmission } from '../types/word.types';

/**
 * Submits a new word to the backend.
 * The backend will then call the Gemini API to get definitions, examples, etc.
 * @param wordSubmission - An object containing the word to submit.
 * @returns A promise that resolves to the newly created WordEntry.
 */
export const addWord = async (wordSubmission: WordSubmission): Promise<WordEntry> => {
  try {
    const response = await apiClient.post<WordEntry>('/words', wordSubmission);
    return response.data;
  } catch (error: any) {
    // Log the error or handle it more gracefully
    console.error('Error adding word:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to add word. Please try again.');
  }
};