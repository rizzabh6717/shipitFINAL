import { Request, Response } from 'express';
import User from '../models/userModel';

// Check if user exists by wallet address
export const checkUserExists = async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.params;
    
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address is required'
      });
    }

    const user = await User.findOne({ 
      walletAddress: walletAddress.toLowerCase() 
    });

    if (user) {
      return res.json({
        success: true,
        userExists: true,
        role: user.role,
        data: user
      });
    } else {
      return res.json({
        success: true,
        userExists: false
      });
    }
  } catch (error) {
    console.error('Error checking user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get user profile by wallet address
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.params;
    
    const user = await User.findOne({ 
      walletAddress: walletAddress.toLowerCase() 
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Register new sender
export const registerSender = async (req: Request, res: Response) => {
  try {
    const { walletAddress, name, email, phone, preferredPickupZone } = req.body;

    // Validate required fields
    if (!walletAddress || !name || !email || !phone || !preferredPickupZone) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      walletAddress: walletAddress.toLowerCase() 
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already registered'
      });
    }

    // Create new sender
    const newUser = new User({
      walletAddress: walletAddress.toLowerCase(),
      role: 'sender',
      profileData: {
        name,
        email,
        phone,
        preferredPickupZone
      }
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'Sender registered successfully',
      data: newUser
    });
  } catch (error) {
    console.error('Error registering sender:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Register new driver
export const registerDriver = async (req: Request, res: Response) => {
  try {
    const { walletAddress, name, phone, vehicleType, capacity, licenseNumber } = req.body;

    // Validate required fields
    if (!walletAddress || !name || !phone || !vehicleType || !capacity || !licenseNumber) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Validate capacity is a number
    if (isNaN(capacity) || capacity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Capacity must be a positive number'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      walletAddress: walletAddress.toLowerCase() 
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already registered'
      });
    }

    // Create new driver
    const newUser = new User({
      walletAddress: walletAddress.toLowerCase(),
      role: 'driver',
      profileData: {
        name,
        phone,
        vehicleType,
        capacity: Number(capacity),
        licenseNumber
      }
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'Driver registered successfully',
      data: newUser
    });
  } catch (error) {
    console.error('Error registering driver:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
