import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Parcel from '../models/parcelModel';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/parcel-photos';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `parcel-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only .jpg, .jpeg, and .png files are allowed'));
  }
};

const upload = multer({
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
  } catch (error) {
    console.error('Error uploading sender photo:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading file'
    });
  }
});

// Get sender photo for a parcel
router.get('/parcel/:parcelId/sender-photo', async (req, res) => {
  try {
    const { parcelId } = req.params;
    console.log('Fetching sender photo for parcel:', parcelId);
    
    // Find parcel by deliveryId (primary) or _id (fallback)
    let parcel = await Parcel.findOne({ deliveryId: parcelId });
    console.log('Found parcel by deliveryId:', !!parcel);
    
    // If not found by deliveryId, try by ObjectId
    if (!parcel) {
      try {
        parcel = await Parcel.findById(parcelId);
        console.log('Found parcel by ObjectId:', !!parcel);
      } catch (error) {
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
  } catch (error) {
    console.error('Error fetching sender photo:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sender photo'
    });
  }
});

export default router;
