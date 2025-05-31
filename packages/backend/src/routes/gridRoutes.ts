import { Router } from 'express';
import { getAllGrids, getGridDetails } from '../controllers/gridController';

const router = Router();

// List all grids
router.get('/', getAllGrids);

// Get a single grid by ID
router.get('/:id', getGridDetails);

export default router;
