import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Parcel from '../models/parcelModel';

// @desc    Store blockchain parcel in MongoDB
// @route   POST /api/parcels/store
// @access  Public
export const storeParcelInDB = async (req: Request, res: Response) => {
    try {
        const { 
            senderAddress,
            senderName,
            senderPhone,
            senderEmail,
            fromAddress,
            toAddress,
            itemDescription,
            itemValue,
            sizeTier,
            feeInINR,
            escrowAmountInAVAX,
            escrowContractAddress,
            transactionHash,
            deliveryId,
            senderPhoto
        } = req.body;

        // Create parcel data for MongoDB storage
        const parcelData = {
            senderAddress,
            senderName,
            senderPhone,
            senderEmail,
            fromAddress,
            toAddress,
            itemDescription,
            itemValue: parseInt(itemValue) || 0,
            sizeTier: sizeTier || 'Medium',
            feeInINR: parseInt(feeInINR) || 0,
            escrowAmountInAVAX: parseFloat(escrowAmountInAVAX) || 0,
            escrowContractAddress,
            transactionHash,
            deliveryId,
            senderPhoto,
            status: 'pending',
            blockchainStatus: 0,
            lastUpdated: new Date(),
            createdAt: new Date()
        };

        const parcel = new Parcel(parcelData);
        const savedParcel = await parcel.save();
        
        const parcelObj = savedParcel.toObject();
        
        console.log('✅ Parcel stored in MongoDB:', {
            mongoId: (parcelObj._id as any).toString(),
            deliveryId: savedParcel.deliveryId,
            transactionHash: savedParcel.transactionHash
        });

        res.status(201).json({
            success: true,
            parcel: {
                ...parcelObj,
                id: (parcelObj._id as any).toString(),
                _id: (parcelObj._id as any).toString()
            }
        });
    } catch (error: any) {
        console.error('❌ Error storing parcel:', error);
        res.status(500).json({ message: 'Failed to store parcel', error: error.message });
    }
};

// @desc    Create a new parcel (legacy endpoint)
// @route   POST /api/parcels
// @access  Public
export const createParcel = async (req: Request, res: Response) => {
    try {
        const { 
            senderAddress, 
            senderName, 
            senderPhone, 
            senderEmail,
            fromAddress, 
            toAddress, 
            itemDescription, 
            itemValue,
            sizeTier,
            feeInINR,
            escrowAmountInAVAX,
            escrowContractAddress,
            transactionHash,
            deliveryId,
            senderPhoto
        } = req.body;

        const parcelData = {
            senderAddress,
            senderName,
            senderPhone,
            senderEmail,
            fromAddress,
            toAddress,
            itemDescription,
            itemValue: parseInt(itemValue) || 0,
            sizeTier,
            feeInINR: parseInt(feeInINR) || 0,
            escrowAmountInAVAX: parseFloat(escrowAmountInAVAX) || 0,
            escrowContractAddress,
            transactionHash,
            deliveryId,
            senderPhoto,
            status: 'pending',
            blockchainStatus: 0,
            lastUpdated: new Date(),
            createdAt: new Date()
        };

        const parcel = new Parcel(parcelData);
        const savedParcel = await parcel.save();
        
        const parcelObject = savedParcel.toObject();
        const parcelId = savedParcel._id as mongoose.Types.ObjectId;
        
        console.log('✅ Parcel stored in MongoDB:', {
            mongoId: parcelId.toString(),
            deliveryId: savedParcel.deliveryId,
            transactionHash: savedParcel.transactionHash
        });

        res.status(201).json({
            ...parcelObject,
            id: parcelId.toString()
        });
    } catch (error: any) {
        console.error('❌ Error storing parcel:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get a parcel by ID
// @route   GET /api/parcels/:id
// @access  Public
export const getParcel = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        // Find parcel by deliveryId (primary) or _id (fallback)
        let parcel = await Parcel.findOne({ deliveryId: id });
        
        // Fallback to ObjectId if deliveryId lookup fails
        if (!parcel) {
            try {
                parcel = await Parcel.findById(id);
            } catch (error) {
                // Invalid ObjectId format
            }
        }
        
        if (parcel) {
            res.json(parcel);
        } else {
            res.status(404).json({ message: 'Parcel not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get all available parcels for drivers
// @route   GET /api/parcels/available
// @access  Public
export const getAvailableParcels = async (req: Request, res: Response) => {
    const { from, to } = req.query;
    try {
        const filter: { status: string; fromAddress?: any; toAddress?: any } = { status: 'pending' };

        if (from) {
            filter.fromAddress = { $regex: new RegExp(from as string, 'i') };
        }

        if (to) {
            filter.toAddress = { $regex: new RegExp(to as string, 'i') };
        }

        console.log('Filtering available parcels with:', filter);

        const parcels = await Parcel.find(filter).sort({ creationDate: -1 });

        console.log('Found available parcels:', parcels.length);

        // Return parcels with MongoDB ObjectId
        const parcelsWithId = parcels.map(parcel => {
            const parcelObj = parcel.toObject();
            return {
                ...parcelObj,
                id: (parcelObj._id as any).toString(),
                _id: (parcelObj._id as any).toString()
            };
        });

        res.json(parcelsWithId);
    } catch (error: any) {
        console.error('Error fetching available parcels:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get all parcels for a specific driver
// @route   GET /api/parcels/driver/:driverAddress
// @access  Public
export const getParcelsByDriver = async (req: Request, res: Response) => {
    try {
        const parcels = await Parcel.find({ 
            driverAddress: req.params.driverAddress 
        }).sort({ lastUpdated: -1 });
        
        console.log(`Found ${parcels.length} parcels for driver:`, req.params.driverAddress);
        
        // Return parcels with MongoDB ObjectId
        const parcelsWithId = parcels.map(parcel => {
            const parcelObj = parcel.toObject();
            return {
                ...parcelObj,
                id: (parcelObj._id as any).toString(),
                _id: (parcelObj._id as any).toString()
            };
        });
        
        res.json(parcelsWithId);
    } catch (error: any) {
        console.error('Error fetching driver parcels:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get all parcels for a specific sender
// @route   GET /api/parcels/sender/:senderAddress
// @access  Public
export const getParcelsBySender = async (req: Request, res: Response) => {
    try {
        const parcels = await Parcel.find({ 
            senderAddress: req.params.senderAddress 
        }).sort({ lastUpdated: -1 });
        
        console.log(`Found ${parcels.length} parcels for sender:`, req.params.senderAddress);
        
        // Return parcels with MongoDB ObjectId
        const parcelsWithId = parcels.map(parcel => {
            const parcelObj = parcel.toObject();
            return {
                ...parcelObj,
                id: (parcelObj._id as any).toString(),
                _id: (parcelObj._id as any).toString()
            };
        });
        
        res.json(parcelsWithId);
    } catch (error: any) {
        console.error('Error fetching sender parcels:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update parcel status (for driver workflow)
// @route   PUT /api/parcels/:id/status
// @access  Public
export const updateParcelStatus = async (req: Request, res: Response) => {
    try {
        const { status, transactionHash, driverAddress } = req.body;
        const parcel = await Parcel.findById(req.params.id);

        if (!parcel) {
            return res.status(404).json({ message: 'Parcel not found' });
        }

        // Verify driver authorization
        if (parcel.driverAddress !== driverAddress) {
            return res.status(403).json({ message: 'Unauthorized: Not the assigned driver' });
        }

        // Update status and blockchain data
        parcel.status = status;
        parcel.lastUpdated = new Date();

        switch (status) {
            case 'picked-up':
                parcel.blockchainStatus = 2;
                break;
            case 'in-transit':
                parcel.blockchainStatus = 2;
                break;
            case 'delivered':
                parcel.blockchainStatus = 3;
                parcel.deliveryTransactionHash = transactionHash;
                break;
        }

        const updatedParcel = await parcel.save();
        
        console.log('Parcel status updated:', {
            id: updatedParcel._id,
            deliveryId: updatedParcel.deliveryId,
            status: updatedParcel.status,
            transactionHash
        });

        res.json(updatedParcel);
    } catch (error: any) {
        console.error('Error updating parcel status:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Assign real driver information when driver accepts parcel
// @route   PUT /api/parcels/:id/assign-driver
// @access  Public
export const assignDriver = async (req: Request, res: Response) => {
    try {
        const { 
            driverAddress, 
            driverName, 
            driverPhone, 
            driverCarNumber, 
            driverVehicle, 
            driverRating 
        } = req.body;
        
        const parcel = await Parcel.findById(req.params.id);
        
        if (!parcel) {
            return res.status(404).json({ message: 'Parcel not found' });
        }
        
        // Assign real driver information from registration
        parcel.driverAddress = driverAddress;
        parcel.driverName = driverName;
        parcel.driverPhone = driverPhone;
        parcel.driverCarNumber = driverCarNumber;
        parcel.driverVehicle = driverVehicle;
        parcel.driverRating = driverRating;
        parcel.status = 'accepted';
        parcel.lastUpdated = new Date();
        
        const updatedParcel = await parcel.save();
        
        console.log('Driver assigned to parcel:', {
            id: updatedParcel._id,
            deliveryId: updatedParcel.deliveryId,
            driverName: updatedParcel.driverName,
            driverPhone: updatedParcel.driverPhone,
            driverVehicle: updatedParcel.driverVehicle
        });
        
        res.json(updatedParcel);
    } catch (error: any) {
        console.error('Error assigning driver:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Release funds (confirm delivery)
// @route   PUT /api/parcels/:id/release-funds
// @access  Public
export const releaseFunds = async (req: Request, res: Response) => {
    try {
        const { transactionHash, senderAddress } = req.body;
        const parcel = await Parcel.findById(req.params.id);

        if (!parcel) {
            return res.status(404).json({ message: 'Parcel not found' });
        }

        // Verify sender authorization
        if (parcel.senderAddress !== senderAddress) {
            return res.status(403).json({ message: 'Unauthorized: Not the original sender' });
        }

        // Verify parcel is delivered
        if (parcel.status !== 'delivered') {
            return res.status(400).json({ message: 'Parcel must be delivered before releasing funds' });
        }

        // Update with fund release transaction
        parcel.fundReleaseTransactionHash = transactionHash;
        parcel.lastUpdated = new Date();

        const updatedParcel = await parcel.save();
        
        console.log('Funds released for parcel:', {
            id: updatedParcel._id,
            deliveryId: updatedParcel.deliveryId,
            transactionHash,
            driverAddress: updatedParcel.driverAddress
        });

        res.json(updatedParcel);
    } catch (error: any) {
        console.error('Error releasing funds:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Driver accepts a parcel
// @route   POST /api/parcels/:id/accept
// @access  Public
export const acceptParcel = async (req: Request, res: Response) => {
    try {
        const { driverAddress, transactionHash } = req.body;
        const parcel = await Parcel.findById(req.params.id);

        if (parcel) {
            if (parcel.status === 'pending') {
                parcel.driverAddress = driverAddress;
                parcel.status = 'accepted';
                parcel.blockchainStatus = 1;
                parcel.acceptTransactionHash = transactionHash;
                parcel.lastUpdated = new Date();
                
                const updatedParcel = await parcel.save();
                
                console.log('Parcel accepted:', {
                    id: updatedParcel._id,
                    deliveryId: updatedParcel.deliveryId,
                    driverAddress,
                    transactionHash
                });
                
                res.json(updatedParcel);
            } else {
                res.status(400).json({ message: 'Parcel not available' });
            }
        } else {
            res.status(404).json({ message: 'Parcel not found' });
        }
    } catch (error: any) {
        console.error('Error accepting parcel:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Upload proof of delivery
export const uploadProofOfDelivery = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Handle both MongoDB ObjectId and string IDs
    // Find parcel by deliveryId (primary) or _id (fallback)
    let parcel = await Parcel.findOne({ deliveryId: id });
    
    // If not found by deliveryId, try by ObjectId
    if (!parcel) {
      try {
        parcel = await Parcel.findById(id);
      } catch (error) {
        console.log('Invalid ObjectId format:', id);
      }
    }
    
    // Debug logging
    console.log('Looking for parcel with ID:', id);
    console.log('Found parcel:', parcel ? 'Yes' : 'No');
    
    if (!parcel) {
      return res.status(404).json({
        success: false,
        message: 'Parcel not found'
      });
    }

    // Update parcel with proof photo information
    parcel.proofPhoto = req.file.filename;
    parcel.proofUploadTime = new Date();
    
    // Do not change status to delivered yet - sender needs to verify
    await parcel.save();

    res.json({
      success: true,
      message: 'Proof of delivery uploaded successfully',
      proofPhoto: req.file.filename,
      proofUploadTime: parcel.proofUploadTime
    });
  } catch (error) {
    console.error('Error uploading proof:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
