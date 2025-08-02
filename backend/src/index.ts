import path from "path";
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db';
import userRoutes from './routes/userRoutes';
import parcelRoutes from './routes/parcelRoutes';
import authRoutes from './routes/authRoutes';

dotenv.config();

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get('/api', (req, res) => {
  res.send('ShipIT Backend API is running...');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/parcels', parcelRoutes);

// Analytics routes
import analyticsRoutes from './routes/analyticsRoutes';
app.use('/api/analytics', analyticsRoutes);

// Photo routes for parcel photos
import photoRoutes from './routes/photoRoutes';
app.use('/api/photos', photoRoutes);

const PORT = process.env.PORT || 5006;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
