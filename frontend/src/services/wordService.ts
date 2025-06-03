import apiClient from './apiClient';
import type { WordEntry, WordSubmission } from '../types/word.types';

/**
 * Submits a new word to the backend for single entry processing.
 * The backend will then call the Gemini API to get definitions, examples, etc.,
 * and may return multiple WordEntry objects if the word has multiple definitions.
 * @param wordSubmission - An object containing the word to submit.
 * @returns A promise that resolves to an array of newly created WordEntry objects.
 */
export const addWord = async (wordSubmission: WordSubmission): Promise<WordEntry[]> => {
  try {
    const response = await apiClient.post<WordEntry[]>('/words', wordSubmission);
    return response.data;
  } catch (error: any) {
    console.error('Error adding single word:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to add single word. Please try again.');
  }
};

// --- Bulk Submission ---

export interface BulkSubmissionPayload {
  words: string[];
}

export interface BulkSubmissionResponse {
  message: string;
  jobId: number;
  status: string;
  totalWords: number;
}

/**
 * Submits a list of words for bulk processing.
 * @param payload - An object containing an array of words.
 * @returns A promise that resolves to the backend's confirmation response.
 */
export const submitBulkWords = async (payload: BulkSubmissionPayload): Promise<BulkSubmissionResponse> => {
  try {
    const response = await apiClient.post<BulkSubmissionResponse>('/bulk/words', payload);
    return response.data;
  } catch (error: any) {
    console.error('Error submitting bulk words:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to submit bulk words. Please try again.');
  }
};