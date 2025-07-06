import { Request, Response } from 'express';
import User from '../models/userModel';

// @desc    Create or update a user
// @route   POST /api/users
// @access  Public
export const createUser = async (req: Request, res: Response) => {
  try {
    const { walletAddress, name, defaultRole, vehicleNumber } = req.body;
    const user = await User.findOneAndUpdate(
      { walletAddress },
      { walletAddress, name, defaultRole, vehicleNumber },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.status(201).json(user);
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get user by wallet address
// @route   GET /api/users/:walletAddress
// @access  Public
export const getUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({ walletAddress: req.params.walletAddress });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
