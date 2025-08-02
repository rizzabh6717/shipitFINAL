import express from 'express';
import { getAnalyticsData } from '../controllers/analyticsController';

const router = express.Router();

// GET /api/analytics - Get comprehensive analytics data
router.get('/', getAnalyticsData);

// GET /api/analytics/user/:address - Get user-specific analytics
router.get('/user/:address', getAnalyticsData);

// GET /api/analytics/summary - Get quick summary metrics
router.get('/summary', getAnalyticsData);

export default router;
