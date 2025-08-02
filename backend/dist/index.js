"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const db_1 = __importDefault(require("./config/db"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const parcelRoutes_1 = __importDefault(require("./routes/parcelRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// Connect to Database
(0, db_1.default)();
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "../uploads")));
app.get('/api', (req, res) => {
    res.send('ShipIT Backend API is running...');
});
// Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/api/parcels', parcelRoutes_1.default);
// Analytics routes
const analyticsRoutes_1 = __importDefault(require("./routes/analyticsRoutes"));
app.use('/api/analytics', analyticsRoutes_1.default);
// Photo routes for parcel photos
const photoRoutes_1 = __importDefault(require("./routes/photoRoutes"));
app.use('/api/photos', photoRoutes_1.default);
const PORT = process.env.PORT || 5006;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
