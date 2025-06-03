import { Router } from 'express';
import { addWordController } from '../controllers/word.controller';

const router = Router();

// Define POST route for adding words
router.post('/', addWordController);

export default router;