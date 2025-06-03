import { Router } from 'express';
import { submitBulkWordsController } from '../controllers/bulk.controller';

const router = Router();

// POST /api/bulk/words - Submit a list of words for bulk processing
router.post('/words', submitBulkWordsController);

// We can add more routes here later, e.g., to get the status of a bulk job
// router.get('/jobs/:jobId/status', getBulkJobStatusController);

export default router;