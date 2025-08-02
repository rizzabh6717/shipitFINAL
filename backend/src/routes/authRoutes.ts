import express from 'express';
import { 
  checkUserExists, 
  registerSender, 
  registerDriver,
  getUserProfile 
} from '../controllers/authController';

const router = express.Router();

// Check if user exists by wallet address
router.get('/user/:walletAddress', checkUserExists);

// Get user profile by wallet address
router.get('/profile/:walletAddress', getUserProfile);

// Register new sender
router.post('/register/sender', registerSender);

// Register new driver
router.post('/register/driver', registerDriver);

export default router;
