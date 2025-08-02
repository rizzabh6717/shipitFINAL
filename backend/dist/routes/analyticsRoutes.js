"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const analyticsController_1 = require("../controllers/analyticsController");
const router = express_1.default.Router();
// GET /api/analytics - Get comprehensive analytics data
router.get('/', analyticsController_1.getAnalyticsData);
// GET /api/analytics/user/:address - Get user-specific analytics
router.get('/user/:address', analyticsController_1.getAnalyticsData);
// GET /api/analytics/summary - Get quick summary metrics
router.get('/summary', analyticsController_1.getAnalyticsData);
exports.default = router;
