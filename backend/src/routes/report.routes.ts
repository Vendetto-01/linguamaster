import express, { Request, Response } from 'express';
import { supabase } from '../config/supabaseClient'; // Adjust path if your supabaseClient is elsewhere

const router = express.Router();

// GET all reports
router.get('/', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false }); // Optional: order by creation date

    if (error) {
      console.error('Error fetching reports from Supabase:', error);
      throw error;
    }

    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch reports.', error: error.message });
  }
});

// You can add more report-specific routes here later (e.g., GET /:id, PUT /:id)

export default router;