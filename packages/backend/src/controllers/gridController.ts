import { Request, Response } from 'express';
import { SupabaseService } from '../services/supabaseService';

const supabaseService = new SupabaseService();


// GET /api/grids
// Returns an array of all grid definitions.
 
export const getAllGrids = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const grids = await supabaseService.getGrids();
    res.json(grids);
  } catch (error) {
    console.error('getAllGrids error:', error);
    res.status(500).json({ message: 'Failed to fetch grids' });
  }
};


//GET /api/grids/:id
// Returns a single grid by ID, or 404 if not found.
 
export const getGridDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const grid = await supabaseService.getGridById(req.params.id);

    if (!grid) {
      res.status(404).json({ message: 'Grid not found' });
      return;
    }

    res.json(grid);
  } catch (error) {
    console.error(`getGridDetails error for id=${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to fetch grid details' });
  }
};
