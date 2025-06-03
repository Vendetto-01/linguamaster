import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import wordRoutes from './routes/word.routes'; // Import word routes

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

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