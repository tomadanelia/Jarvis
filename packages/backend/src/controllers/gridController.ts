import { Request, Response } from 'express';
import { SupabaseService } from '../services/supabaseService';

const supabaseService = new SupabaseService();


/**
 * Controller for handling GET requests to fetch all grids.
 *
 * @route GET /api/grids
 * @param {Request} _req - The Express request object (unused).
 * @param {Response} res - The Express response object used to return data or error.
 * @returns {Promise<void>} - Sends a JSON response with all grid definitions or a 500 error.
 */
 
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


/**
 * Controller for handling GET requests to fetch a single grid by its ID.
 *
 * @route GET /api/grids/:id
 * @param {Request} req - The Express request object containing the grid ID in params.
 * @param {Response} res - The Express response object used to return data or error.
 * @returns {Promise<void>} - Sends a JSON response with the grid or an appropriate error status.
 */
 
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
