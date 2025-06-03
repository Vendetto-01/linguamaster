import { Request, Response, NextFunction } from 'express';
import { WordEntry } from '../types/word.types';
import { addWordService } from '../services/word.service';

export const addWordController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wordData: WordEntry = req.body;

    // Basic validation (can be expanded)
    // This validation might be too strict if Gemini is expected to provide most fields.
    // For now, we only strictly require the 'word' itself from the client.
    if (!wordData.word) {
      return res.status(400).json({ message: 'The "word" field is required.' });
    }

    // The service currently expects { word: string } as input for Gemini.
    // The full WordEntry is formed after Gemini's response.
    const newWord = await addWordService({ word: wordData.word });
    res.status(201).json(newWord);
  } catch (error) {
    next(error); // Pass errors to the error handling middleware
  }
};