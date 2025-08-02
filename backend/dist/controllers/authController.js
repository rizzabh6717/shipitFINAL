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
exports.registerDriver = exports.registerSender = exports.getUserProfile = exports.checkUserExists = void 0;
const userModel_1 = __importDefault(require("../models/userModel"));
// Check if user exists by wallet address
const checkUserExists = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { walletAddress } = req.params;
        if (!walletAddress) {
            return res.status(400).json({
                success: false,
                message: 'Wallet address is required'
            });
        }
        const user = yield userModel_1.default.findOne({
            walletAddress: walletAddress.toLowerCase()
        });
        if (user) {
            return res.json({
                success: true,
                userExists: true,
                role: user.role,
                data: user
            });
        }
        else {
            return res.json({
                success: true,
                userExists: false
            });
        }
    }
    catch (error) {
        console.error('Error checking user:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.checkUserExists = checkUserExists;
// Get user profile by wallet address
const getUserProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { walletAddress } = req.params;
        const user = yield userModel_1.default.findOne({
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
    }
    catch (error) {
        console.error('Error getting user profile:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.getUserProfile = getUserProfile;
// Register new sender
const registerSender = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const existingUser = yield userModel_1.default.findOne({
            walletAddress: walletAddress.toLowerCase()
        });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already registered'
            });
        }
        // Create new sender
        const newUser = new userModel_1.default({
            walletAddress: walletAddress.toLowerCase(),
            role: 'sender',
            profileData: {
                name,
                email,
                phone,
                preferredPickupZone
            }
        });
        yield newUser.save();
        res.status(201).json({
            success: true,
            message: 'Sender registered successfully',
            data: newUser
        });
    }
    catch (error) {
        console.error('Error registering sender:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.registerSender = registerSender;
// Register new driver
const registerDriver = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const existingUser = yield userModel_1.default.findOne({
            walletAddress: walletAddress.toLowerCase()
        });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already registered'
            });
        }
        // Create new driver
        const newUser = new userModel_1.default({
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
        yield newUser.save();
        res.status(201).json({
            success: true,
            message: 'Driver registered successfully',
            data: newUser
        });
    }
    catch (error) {
        console.error('Error registering driver:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.registerDriver = registerDriver;
