import express from 'express';
import { 
    createParcel, 
    getParcel, 
    getAvailableParcels, 
    acceptParcel, 
    getParcelsByDriver,
    getParcelsBySender,
    updateParcelStatus,
    releaseFunds
} from '../controllers/parcelController';

const router = express.Router();

// @route   POST /api/parcels
router.post('/', createParcel);

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

// @route   PUT /api/parcels/:id/status
router.put('/:id/status', updateParcelStatus);

// @route   PUT /api/parcels/:id/release-funds
router.put('/:id/release-funds', releaseFunds);

export default router;
