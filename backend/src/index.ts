import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db';
import userRoutes from './routes/userRoutes';
import parcelRoutes from './routes/parcelRoutes';

dotenv.config();

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

app.get('/api', (req, res) => {
  res.send('ShipIT Backend API is running...');
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/parcels', parcelRoutes);

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
