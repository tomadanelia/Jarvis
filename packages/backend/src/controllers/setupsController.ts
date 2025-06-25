import { Request, Response } from 'express';
import { supabaseService } from '../services/supabaseService';
import { simulationStateService } from '../services/simulationStateService';

/**
 * Extracts the JWT from the Authorization header.
 * @param req The Express request object.
 * @returns The token string or null if not found.
 */
const getToken = (req: Request): string | null => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }
    return null;
};

/**
 * Get all setups for the authenticated user.
 * @route GET /api/setups
 */
export const getAllUserSetups = async (req: Request, res: Response): Promise<void> => {
    const token = getToken(req);
    if (!token) {
        res.status(401).json({ error: 'Authentication token is required.' });
        return;
    }

    try {
        const setups = await supabaseService.getUserSetups(token);
        res.status(200).json(setups);
    } catch (error: any) {
        console.error('Error fetching user setups:', error.message);
        res.status(500).json({ error: 'Failed to fetch setups.' });
    }
};

/**
 * Saves the current simulation state as a new setup.
 * @route POST /api/setups
 */
export const saveCurrentSetup = async (req: Request, res: Response): Promise<void> => {
    const token = getToken(req);
    const userId = req.user?.id;

    if (!token || !userId) {
        res.status(401).json({ error: 'Authentication token and user ID are required.' });
        return;
    }

    const { name } = req.body;
    if (!name) {
        res.status(400).json({ error: 'A "name" for the setup is required.' });
        return;
    }

    const grid_id = simulationStateService.getCurrentGridId();
    if (!grid_id) {
        res.status(400).json({ error: 'Cannot save: No grid is loaded in the current simulation.' });
        return;
    }

    const robots = simulationStateService.getRobots();
    const tasks = simulationStateService.getTasks();
    const strategy = simulationStateService.getSelectedStrategy();

    try {
        const newSetup = await supabaseService.createSetup(token, userId, {
            name,
            grid_id,
            robots,
            tasks,
            strategy,
        });
        res.status(201).json(newSetup);
    } catch (error: any) {
        console.error('Error creating setup:', error.message);
        if (error.code === '23505') {
            res.status(409).json({ error: 'A setup with this name already exists.' });
        } else {
            res.status(500).json({ error: 'Failed to create setup.' });
        }
    }
};

/**
 * Loads a saved setup into the current simulation state.
 * @route POST /api/setups/load/:id
 */
export const loadSetup = async (req: Request, res: Response): Promise<void> => {
    const token = getToken(req);
    const setupId = req.params.id;

    if (!token) {
        res.status(401).json({ error: 'Authentication token is required.' });
        return;
    }

    try {
        const setupToLoad = await supabaseService.getSetupById(token, setupId);
        if (!setupToLoad) {
            res.status(404).json({ error: 'Setup not found or permission denied.' });
            return;
        }

        const gridData = await supabaseService.getGridById(setupToLoad.grid_id);
        if (!gridData) {
            res.status(404).json({ error: `Grid with ID ${setupToLoad.grid_id} not found.` });
            return;
        }

        simulationStateService.loadFromSetup(setupToLoad, gridData.layout, gridData.name);
        res.status(200).json({ message: `Setup "${setupToLoad.name}" loaded.` });

    } catch (error: any) {
        console.error(`Error loading setup ${setupId}:`, error.message);
        res.status(500).json({ error: 'Failed to load setup.' });
    }
};

/**
 * Deletes a saved setup.
 * @route DELETE /api/setups/:id
 */
export const deleteSetup = async (req: Request, res: Response): Promise<void> => {
    const token = getToken(req);
    const { id } = req.params;

    if (!token) {
        res.status(401).json({ error: 'Authentication token is required.' });
        return;
    }

    try {
        const deletedSetup = await supabaseService.deleteSetup(token, id);
        if (deletedSetup) {
            res.status(200).json(deletedSetup);
        } else {
            res.status(404).json({ error: 'Setup not found or permission denied.' });
        }
    } catch (error: any) {
        console.error(`Error deleting setup ${id}:`, error.message);
        res.status(500).json({ error: 'Failed to delete setup.' });
    }
};