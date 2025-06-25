import { Router } from 'express';
import {
    getAllUserSetups,
    saveCurrentSetup,
    loadSetup,
    deleteSetup,
} from '../controllers/setupsController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Apply JWT auth middleware to all setup routes
router.use(authMiddleware);

// --- Collection-level routes ---
// GET all setups for the authenticated user
router.get('/', getAllUserSetups);

// POST to save the current simulation state as a new setup
router.post('/', saveCurrentSetup);


// --- Item-level routes ---
// POST to load a specific setup into the simulation state
router.post('/load/:id', loadSetup);

// DELETE a specific setup by its ID
router.delete('/:id', deleteSetup);


export default router;