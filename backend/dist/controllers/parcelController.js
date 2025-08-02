"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadProofOfDelivery = exports.acceptParcel = exports.releaseFunds = exports.assignDriver = exports.updateParcelStatus = exports.getParcelsBySender = exports.getParcelsByDriver = exports.getAvailableParcels = exports.getParcel = exports.createParcel = exports.storeParcelInDB = void 0;
const parcelModel_1 = __importDefault(require("../models/parcelModel"));
// @desc    Store blockchain parcel in MongoDB
// @route   POST /api/parcels/store
// @access  Public
const storeParcelInDB = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { senderAddress, senderName, senderPhone, senderEmail, fromAddress, toAddress, itemDescription, itemValue, sizeTier, feeInINR, escrowAmountInAVAX, escrowContractAddress, transactionHash, deliveryId, senderPhoto } = req.body;
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
        const parcel = new parcelModel_1.default(parcelData);
        const savedParcel = yield parcel.save();
        const parcelObj = savedParcel.toObject();
        console.log('✅ Parcel stored in MongoDB:', {
            mongoId: parcelObj._id.toString(),
            deliveryId: savedParcel.deliveryId,
            transactionHash: savedParcel.transactionHash
        });
        res.status(201).json({
            success: true,
            parcel: Object.assign(Object.assign({}, parcelObj), { id: parcelObj._id.toString(), _id: parcelObj._id.toString() })
        });
    }
    catch (error) {
        console.error('❌ Error storing parcel:', error);
        res.status(500).json({ message: 'Failed to store parcel', error: error.message });
    }
});
exports.storeParcelInDB = storeParcelInDB;
// @desc    Create a new parcel (legacy endpoint)
// @route   POST /api/parcels
// @access  Public
const createParcel = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { senderAddress, senderName, senderPhone, senderEmail, fromAddress, toAddress, itemDescription, itemValue, sizeTier, feeInINR, escrowAmountInAVAX, escrowContractAddress, transactionHash, deliveryId, senderPhoto } = req.body;
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
        const parcel = new parcelModel_1.default(parcelData);
        const savedParcel = yield parcel.save();
        const parcelObject = savedParcel.toObject();
        const parcelId = savedParcel._id;
        console.log('✅ Parcel stored in MongoDB:', {
            mongoId: parcelId.toString(),
            deliveryId: savedParcel.deliveryId,
            transactionHash: savedParcel.transactionHash
        });
        res.status(201).json(Object.assign(Object.assign({}, parcelObject), { id: parcelId.toString() }));
    }
    catch (error) {
        console.error('❌ Error storing parcel:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});
exports.createParcel = createParcel;
// @desc    Get a parcel by ID
// @route   GET /api/parcels/:id
// @access  Public
const getParcel = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Find parcel by deliveryId (primary) or _id (fallback)
        let parcel = yield parcelModel_1.default.findOne({ deliveryId: id });
        // Fallback to ObjectId if deliveryId lookup fails
        if (!parcel) {
            try {
                parcel = yield parcelModel_1.default.findById(id);
            }
            catch (error) {
                // Invalid ObjectId format
            }
        }
        if (parcel) {
            res.json(parcel);
        }
        else {
            res.status(404).json({ message: 'Parcel not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});
exports.getParcel = getParcel;
// @desc    Get all available parcels for drivers
// @route   GET /api/parcels/available
// @access  Public
const getAvailableParcels = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { from, to } = req.query;
    try {
        const filter = { status: 'pending' };
        if (from) {
            filter.fromAddress = { $regex: new RegExp(from, 'i') };
        }
        if (to) {
            filter.toAddress = { $regex: new RegExp(to, 'i') };
        }
        console.log('Filtering available parcels with:', filter);
        const parcels = yield parcelModel_1.default.find(filter).sort({ creationDate: -1 });
        console.log('Found available parcels:', parcels.length);
        // Return parcels with MongoDB ObjectId
        const parcelsWithId = parcels.map(parcel => {
            const parcelObj = parcel.toObject();
            return Object.assign(Object.assign({}, parcelObj), { id: parcelObj._id.toString(), _id: parcelObj._id.toString() });
        });
        res.json(parcelsWithId);
    }
    catch (error) {
        console.error('Error fetching available parcels:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});
exports.getAvailableParcels = getAvailableParcels;
// @desc    Get all parcels for a specific driver
// @route   GET /api/parcels/driver/:driverAddress
// @access  Public
const getParcelsByDriver = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parcels = yield parcelModel_1.default.find({
            driverAddress: req.params.driverAddress
        }).sort({ lastUpdated: -1 });
        console.log(`Found ${parcels.length} parcels for driver:`, req.params.driverAddress);
        // Return parcels with MongoDB ObjectId
        const parcelsWithId = parcels.map(parcel => {
            const parcelObj = parcel.toObject();
            return Object.assign(Object.assign({}, parcelObj), { id: parcelObj._id.toString(), _id: parcelObj._id.toString() });
        });
        res.json(parcelsWithId);
    }
    catch (error) {
        console.error('Error fetching driver parcels:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});
exports.getParcelsByDriver = getParcelsByDriver;
// @desc    Get all parcels for a specific sender
// @route   GET /api/parcels/sender/:senderAddress
// @access  Public
const getParcelsBySender = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parcels = yield parcelModel_1.default.find({
            senderAddress: req.params.senderAddress
        }).sort({ lastUpdated: -1 });
        console.log(`Found ${parcels.length} parcels for sender:`, req.params.senderAddress);
        // Return parcels with MongoDB ObjectId
        const parcelsWithId = parcels.map(parcel => {
            const parcelObj = parcel.toObject();
            return Object.assign(Object.assign({}, parcelObj), { id: parcelObj._id.toString(), _id: parcelObj._id.toString() });
        });
        res.json(parcelsWithId);
    }
    catch (error) {
        console.error('Error fetching sender parcels:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});
exports.getParcelsBySender = getParcelsBySender;
// @desc    Update parcel status (for driver workflow)
// @route   PUT /api/parcels/:id/status
// @access  Public
const updateParcelStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status, transactionHash, driverAddress } = req.body;
        const parcel = yield parcelModel_1.default.findById(req.params.id);
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
        const updatedParcel = yield parcel.save();
        console.log('Parcel status updated:', {
            id: updatedParcel._id,
            deliveryId: updatedParcel.deliveryId,
            status: updatedParcel.status,
            transactionHash
        });
        res.json(updatedParcel);
    }
    catch (error) {
        console.error('Error updating parcel status:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});
exports.updateParcelStatus = updateParcelStatus;
// @desc    Assign real driver information when driver accepts parcel
// @route   PUT /api/parcels/:id/assign-driver
// @access  Public
const assignDriver = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { driverAddress, driverName, driverPhone, driverCarNumber, driverVehicle, driverRating } = req.body;
        const parcel = yield parcelModel_1.default.findById(req.params.id);
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
        const updatedParcel = yield parcel.save();
        console.log('Driver assigned to parcel:', {
            id: updatedParcel._id,
            deliveryId: updatedParcel.deliveryId,
            driverName: updatedParcel.driverName,
            driverPhone: updatedParcel.driverPhone,
            driverVehicle: updatedParcel.driverVehicle
        });
        res.json(updatedParcel);
    }
    catch (error) {
        console.error('Error assigning driver:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});
exports.assignDriver = assignDriver;
// @desc    Release funds (confirm delivery)
// @route   PUT /api/parcels/:id/release-funds
// @access  Public
const releaseFunds = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { transactionHash, senderAddress } = req.body;
        const parcel = yield parcelModel_1.default.findById(req.params.id);
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
        const updatedParcel = yield parcel.save();
        console.log('Funds released for parcel:', {
            id: updatedParcel._id,
            deliveryId: updatedParcel.deliveryId,
            transactionHash,
            driverAddress: updatedParcel.driverAddress
        });
        res.json(updatedParcel);
    }
    catch (error) {
        console.error('Error releasing funds:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});
exports.releaseFunds = releaseFunds;
// @desc    Driver accepts a parcel
// @route   POST /api/parcels/:id/accept
// @access  Public
const acceptParcel = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { driverAddress, transactionHash } = req.body;
        const parcel = yield parcelModel_1.default.findById(req.params.id);
        if (parcel) {
            if (parcel.status === 'pending') {
                parcel.driverAddress = driverAddress;
                parcel.status = 'accepted';
                parcel.blockchainStatus = 1;
                parcel.acceptTransactionHash = transactionHash;
                parcel.lastUpdated = new Date();
                const updatedParcel = yield parcel.save();
                console.log('Parcel accepted:', {
                    id: updatedParcel._id,
                    deliveryId: updatedParcel.deliveryId,
                    driverAddress,
                    transactionHash
                });
                res.json(updatedParcel);
            }
            else {
                res.status(400).json({ message: 'Parcel not available' });
            }
        }
        else {
            res.status(404).json({ message: 'Parcel not found' });
        }
    }
    catch (error) {
        console.error('Error accepting parcel:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});
exports.acceptParcel = acceptParcel;
// Upload proof of delivery
const uploadProofOfDelivery = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        let parcel = yield parcelModel_1.default.findOne({ deliveryId: id });
        // If not found by deliveryId, try by ObjectId
        if (!parcel) {
            try {
                parcel = yield parcelModel_1.default.findById(id);
            }
            catch (error) {
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
        yield parcel.save();
        res.json({
            success: true,
            message: 'Proof of delivery uploaded successfully',
            proofPhoto: req.file.filename,
            proofUploadTime: parcel.proofUploadTime
        });
    }
    catch (error) {
        console.error('Error uploading proof:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.uploadProofOfDelivery = uploadProofOfDelivery;
