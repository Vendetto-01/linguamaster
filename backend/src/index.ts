import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import wordRoutes from './routes/word.routes';
import bulkRoutes from './routes/bulk.routes'; // Import bulk routes
import { startWorkerLoop } from './workers/bulkWorker.service'; // Import bulk worker starter
import { startReportWorkerLoop } from './workers/reportWorker.service'; // Import report worker starter

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

// CORS Configuration
const frontendURL = process.env.FRONTEND_URL || 'https://word-wizard-frontend.onrender.com';

const corsOptions = {
  origin: frontendURL,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Middleware to parse JSON bodies. Increased limit for larger bulk submissions.
app.use(express.json({ limit: '10mb' })); 

// API Routes
app.use('/api/words', wordRoutes);
app.use('/api/bulk', bulkRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Vocabulary App Backend Running with Bulk Processing Capabilities');
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Global error handler caught:", err.stack);
  if (err.name === 'PayloadTooLargeError') {
    return res.status(413).json({ message: 'Request payload is too large. Please submit fewer words at a time or contact support if this limit is too restrictive.' });
  }
  res.status(500).json({ message: 'Something broke!', error: err.message });
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
  
  // Start the background worker loop after the server starts
  // The interval can be configured via an environment variable if needed
  const workerInterval = parseInt(process.env.WORKER_INTERVAL_MS || '10000', 10); // Default to 10 seconds
  console.log(`Starting bulk processing worker with interval: ${workerInterval}ms`);
  startWorkerLoop(workerInterval);

  // Start the report processing worker loop
  const reportWorkerInterval = parseInt(process.env.REPORT_WORKER_INTERVAL_MS || '60000', 10); // Default to 60 seconds
  console.log(`Starting report processing worker with interval: ${reportWorkerInterval}ms`);
  startReportWorkerLoop(reportWorkerInterval);
});

export default app;