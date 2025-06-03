import apiClient from './apiClient';
import type { WordEntry, WordSubmission } from '../types/word.types';

/**
 * Submits a new word to the backend.
 * The backend will then call the Gemini API to get definitions, examples, etc.,
 * and may return multiple WordEntry objects if the word has multiple definitions.
 * @param wordSubmission - An object containing the word to submit.
 * @returns A promise that resolves to an array of newly created WordEntry objects.
 */
export const addWord = async (wordSubmission: WordSubmission): Promise<WordEntry[]> => {
  try {
    // The API now returns WordEntry[]
    const response = await apiClient.post<WordEntry[]>('/words', wordSubmission);
    return response.data;
  } catch (error: any) {
    // Log the error or handle it more gracefully
    console.error('Error adding word:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to add word. Please try again.');
  }
};