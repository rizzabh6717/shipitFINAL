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
exports.getUser = exports.createUser = void 0;
const userModel_1 = __importDefault(require("../models/userModel"));
// @desc    Create or update a user
// @route   POST /api/users
// @access  Public
const createUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { walletAddress, name, defaultRole, vehicleNumber } = req.body;
        const user = yield userModel_1.default.findOneAndUpdate({ walletAddress }, { walletAddress, name, defaultRole, vehicleNumber }, { new: true, upsert: true, setDefaultsOnInsert: true });
        res.status(201).json(user);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});
exports.createUser = createUser;
// @desc    Get user by wallet address
// @route   GET /api/users/:walletAddress
// @access  Public
const getUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield userModel_1.default.findOne({ walletAddress: req.params.walletAddress });
        if (user) {
            res.json(user);
        }
        else {
            res.status(404).json({ message: 'User not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});
exports.getUser = getUser;
