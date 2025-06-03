import { Request, Response, NextFunction } from 'express';
import { WordEntry } from '../types/word.types'; // This type might need to be WordSubmission from client
import { addWordService } from '../services/word.service';

// Interface for the expected request body from the client
interface WordSubmissionRequest {
  word: string;
}

export const addWordController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // The client should only send the word itself.
    const submission = req.body as WordSubmissionRequest;

    if (!submission || typeof submission.word !== 'string' || submission.word.trim() === '') {
      return res.status(400).json({ message: 'The "word" field is required and must be a non-empty string.' });
    }

    // The service now expects { word: string } and returns Promise<WordEntry[]>
    const newWordEntries = await addWordService({ word: submission.word.trim() });
    
    // The service returns an array of WordEntry objects.
    // We send this array back to the client.
    res.status(201).json(newWordEntries);
  } catch (error) {
    next(error); // Pass errors to the error handling middleware
  }
};