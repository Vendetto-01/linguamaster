import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; // Import cors
import wordRoutes from './routes/word.routes';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

// CORS Configuration
// You should restrict this to your frontend's actual deployed URL in production.
// For local development, you might allow localhost or a wildcard, but be careful.
const frontendURL = process.env.FRONTEND_URL || 'https://word-wizard-frontend.onrender.com'; // Fallback for safety

const corsOptions = {
  origin: frontendURL, // Allow requests from your frontend
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions)); // Use cors middleware

app.use(express.json());

// Use word routes
app.use('/api/words', wordRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Vocabulary App Backend Running');
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

export default app;