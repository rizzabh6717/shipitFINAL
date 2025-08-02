import express from 'express';
import multer from 'multer';
import path from 'path';
import {
    createParcel,
    getParcel,
    getAvailableParcels,
    getParcelsByDriver,
    getParcelsBySender,
    updateParcelStatus,
    releaseFunds,
    acceptParcel,
    assignDriver,
    uploadProofOfDelivery,
    storeParcelInDB
} from '../controllers/parcelController';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'proof-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// @route   POST /api/parcels
router.post('/', createParcel);

// @route   POST /api/parcels/store
router.post('/store', storeParcelInDB); // Dedicated MongoDB storage endpoint

// @route   GET /api/parcels/available
router.get('/available', getAvailableParcels);

// @route   GET /api/parcels/driver/:driverAddress
router.get('/driver/:driverAddress', getParcelsByDriver);

// @route   GET /api/parcels/sender/:senderAddress
router.get('/sender/:senderAddress', getParcelsBySender);

// @route   GET /api/parcels/:id
router.get('/:id', getParcel);

// @route   POST /api/parcels/:id/accept
router.post('/:id/accept', acceptParcel);

// @route   PUT /api/parcels/:id/assign-driver
router.put('/:id/assign-driver', assignDriver);

// @route   PUT /api/parcels/:id/status
router.put('/:id/status', updateParcelStatus);

// @route   PUT /api/parcels/:id/release-funds
router.put('/:id/release-funds', releaseFunds);

// Upload proof of delivery
router.post('/:id/proof', upload.single('proofPhoto'), uploadProofOfDelivery);

export default router;
