import { Router } from 'express';
import { signupUser, loginUser } from '../controllers/authController';

const router = Router();

// Route for user signup
router.post('/signup', signupUser);

// Route for user login
router.post('/login', loginUser);

export default router;