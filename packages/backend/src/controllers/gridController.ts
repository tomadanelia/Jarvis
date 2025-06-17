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
  const gridId = req.params.id; // Get ID early for logging
  console.log(`[gridController] Attempting to get details for grid ID: ${gridId}`);
  try {
    const grid = await supabaseService.getGridById(gridId);
    console.log(`[gridController] Fetched grid from SupabaseService:`, grid ? `Name: ${grid.name}` : 'Grid not found in service');

    if (!grid) {
      console.log(`[gridController] Grid ID ${gridId} not found. Sending 404.`);
      res.status(404).json({ message: 'Grid not found' });
      return;
    }

    console.log(`[gridController] Grid ID ${gridId} found. Attempting to send JSON response.`);
    res.json(grid); // This sends the JSON
    console.log(`[gridController] Successfully sent JSON response for grid ID: ${gridId}`);

  } catch (error: any) { // Catch any type of error
    console.error(`[gridController] CRITICAL ERROR in getGridDetails for id=${gridId}:`, error.message, error.stack);
    if (!res.headersSent) {
        res.status(500).json({ message: 'Failed to fetch grid details due to server error.' });
    }
  }
};
