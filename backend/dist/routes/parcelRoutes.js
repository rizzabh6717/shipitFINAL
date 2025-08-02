"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const parcelController_1 = require("../controllers/parcelController");
const router = express_1.default.Router();
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path_1.default.join(__dirname, '../../uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'proof-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed'));
        }
    }
});
// @route   POST /api/parcels
router.post('/', parcelController_1.createParcel);
// @route   POST /api/parcels/store
router.post('/store', parcelController_1.storeParcelInDB); // Dedicated MongoDB storage endpoint
// @route   GET /api/parcels/available
router.get('/available', parcelController_1.getAvailableParcels);
// @route   GET /api/parcels/driver/:driverAddress
router.get('/driver/:driverAddress', parcelController_1.getParcelsByDriver);
// @route   GET /api/parcels/sender/:senderAddress
router.get('/sender/:senderAddress', parcelController_1.getParcelsBySender);
// @route   GET /api/parcels/:id
router.get('/:id', parcelController_1.getParcel);
// @route   POST /api/parcels/:id/accept
router.post('/:id/accept', parcelController_1.acceptParcel);
// @route   PUT /api/parcels/:id/assign-driver
router.put('/:id/assign-driver', parcelController_1.assignDriver);
// @route   PUT /api/parcels/:id/status
router.put('/:id/status', parcelController_1.updateParcelStatus);
// @route   PUT /api/parcels/:id/release-funds
router.put('/:id/release-funds', parcelController_1.releaseFunds);
// Upload proof of delivery
router.post('/:id/proof', upload.single('proofPhoto'), parcelController_1.uploadProofOfDelivery);
exports.default = router;
