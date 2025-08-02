"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const router = express_1.default.Router();
// Check if user exists by wallet address
router.get('/user/:walletAddress', authController_1.checkUserExists);
// Get user profile by wallet address
router.get('/profile/:walletAddress', authController_1.getUserProfile);
// Register new sender
router.post('/register/sender', authController_1.registerSender);
// Register new driver
router.post('/register/driver', authController_1.registerDriver);
exports.default = router;
