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
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const parcelModel_1 = __importDefault(require("../models/parcelModel"));
const router = express_1.default.Router();
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/parcel-photos';
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `parcel-${uniqueSuffix}${path_1.default.extname(file.originalname)}`);
    }
});
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
        return cb(null, true);
    }
    else {
        cb(new Error('Only .jpg, .jpeg, and .png files are allowed'));
    }
};
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});
// Upload sender photo for parcel
router.post('/upload-sender-photo', upload.single('senderPhoto'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }
        const fileUrl = `/uploads/parcel-photos/${req.file.filename}`;
        res.json({
            success: true,
            photoUrl: fileUrl,
            filename: req.file.filename
        });
    }
    catch (error) {
        console.error('Error uploading sender photo:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading file'
        });
    }
});
// Get sender photo for a parcel
router.get('/parcel/:parcelId/sender-photo', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { parcelId } = req.params;
        console.log('Fetching sender photo for parcel:', parcelId);
        // Find parcel by deliveryId (primary) or _id (fallback)
        let parcel = yield parcelModel_1.default.findOne({ deliveryId: parcelId });
        console.log('Found parcel by deliveryId:', !!parcel);
        // If not found by deliveryId, try by ObjectId
        if (!parcel) {
            try {
                parcel = yield parcelModel_1.default.findById(parcelId);
                console.log('Found parcel by ObjectId:', !!parcel);
            }
            catch (error) {
                console.log('Invalid ObjectId format:', parcelId);
            }
        }
        if (!parcel) {
            console.log('Parcel not found:', parcelId);
            return res.status(404).json({
                success: false,
                message: 'Parcel not found'
            });
        }
        console.log('Parcel found:', {
            deliveryId: parcel.deliveryId,
            _id: parcel._id,
            hasSenderPhoto: !!parcel.senderPhoto,
            senderPhoto: parcel.senderPhoto
        });
        if (!parcel.senderPhoto) {
            console.log('No sender photo available for parcel:', parcelId);
            return res.status(404).json({
                success: false,
                message: 'No sender photo available for this parcel'
            });
        }
        // Return the photo URL - ensure absolute URL
        const fullPhotoUrl = parcel.senderPhoto.startsWith('http')
            ? parcel.senderPhoto
            : `http://localhost:5006${parcel.senderPhoto}`;
        console.log('Returning photo URL:', fullPhotoUrl);
        res.json({
            success: true,
            photoUrl: fullPhotoUrl,
            parcelId: parcel.deliveryId || parcel._id
        });
    }
    catch (error) {
        console.error('Error fetching sender photo:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sender photo'
        });
    }
}));
exports.default = router;
