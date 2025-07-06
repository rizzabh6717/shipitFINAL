import { Request, Response } from 'express';
import Parcel from '../models/parcelModel';

// @desc    Create a new parcel
// @route   POST /api/parcels
// @access  Public
export const createParcel = async (req: Request, res: Response) => {
    try {
        // Add blockchain integration data
        const parcelData = {
            ...req.body,
            lastUpdated: new Date(),
            blockchainStatus: 0, // Pending status
        };

        const parcel = new Parcel(parcelData);
        const newParcel = await parcel.save();
        
        console.log('Parcel created with blockchain integration:', {
            id: newParcel._id,
            deliveryId: newParcel.deliveryId,
            transactionHash: newParcel.transactionHash,
            senderAddress: newParcel.senderAddress
        });

        res.status(201).json(newParcel);
    } catch (error: any) {
        console.error('Error creating parcel:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get a parcel by ID
// @route   GET /api/parcels/:id
// @access  Public
export const getParcel = async (req: Request, res: Response) => {
    try {
        const parcel = await Parcel.findById(req.params.id);
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

        res.json(parcels);
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
        res.json(parcels);
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
        res.json(parcels);
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
