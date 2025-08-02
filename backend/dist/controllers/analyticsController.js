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
exports.getAnalyticsData = void 0;
const parcelModel_1 = __importDefault(require("../models/parcelModel"));
const getAnalyticsData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userAddress, timeframe = 'all' } = req.query;
        // Build date filter based on timeframe
        const dateFilter = {};
        if (timeframe !== 'all') {
            const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 365;
            dateFilter.createdAt = { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
        }
        // Add user filter if provided
        const filter = userAddress
            ? Object.assign(Object.assign({}, dateFilter), { $or: [{ senderAddress: userAddress }, { driverAddress: userAddress }] }) : dateFilter;
        // Get all parcels with analytics data
        const parcels = yield parcelModel_1.default.find(filter).sort({ createdAt: -1 });
        // Calculate analytics metrics
        const totalDeliveries = parcels.length;
        const completedDeliveries = parcels.filter(p => p.status === 'delivered').length;
        const pendingDeliveries = parcels.filter(p => p.status === 'pending').length;
        const inProgressDeliveries = parcels.filter(p => p.status === 'in-transit').length;
        const totalRevenue = parcels.reduce((sum, p) => sum + (p.feeInINR || 0), 0);
        const averageDeliveryTime = calculateAverageDeliveryTime(parcels);
        const deliverySuccessRate = totalDeliveries > 0 ? (completedDeliveries / totalDeliveries) * 100 : 0;
        // Monthly breakdown
        const monthlyData = getMonthlyBreakdown(parcels);
        // Top routes
        const topRoutes = getTopRoutes(parcels);
        // Driver performance
        const driverPerformance = getDriverPerformance(parcels);
        // Customer insights
        const customerInsights = getCustomerInsights(parcels);
        res.json({
            overview: {
                totalDeliveries,
                completedDeliveries,
                pendingDeliveries,
                inProgressDeliveries,
                totalRevenue,
                averageDeliveryTime,
                deliverySuccessRate
            },
            monthlyData,
            topRoutes,
            driverPerformance,
            customerInsights,
            recentDeliveries: parcels.slice(0, 10)
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching analytics data', error });
    }
});
exports.getAnalyticsData = getAnalyticsData;
function calculateAverageDeliveryTime(parcels) {
    const deliveredParcels = parcels.filter(p => p.status === 'delivered' && p.deliveredAt && p.createdAt);
    if (deliveredParcels.length === 0)
        return 0;
    const totalTime = deliveredParcels.reduce((sum, p) => {
        const deliveryTime = new Date(p.deliveredAt).getTime() - new Date(p.createdAt).getTime();
        return sum + deliveryTime;
    }, 0);
    return Math.round(totalTime / deliveredParcels.length / (1000 * 60 * 60)); // Hours
}
function getMonthlyBreakdown(parcels) {
    const monthlyData = {};
    parcels.forEach(parcel => {
        const month = new Date(parcel.createdAt).toISOString().slice(0, 7); // YYYY-MM
        if (!monthlyData[month]) {
            monthlyData[month] = {
                month,
                deliveries: 0,
                revenue: 0,
                completed: 0
            };
        }
        monthlyData[month].deliveries++;
        monthlyData[month].revenue += parcel.feeInINR || 0;
        if (parcel.status === 'delivered')
            monthlyData[month].completed++;
    });
    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
}
function getTopRoutes(parcels) {
    const routes = {};
    parcels.forEach(parcel => {
        const route = `${parcel.fromAddress} → ${parcel.toAddress}`;
        if (!routes[route]) {
            routes[route] = {
                route,
                count: 0,
                revenue: 0
            };
        }
        routes[route].count++;
        routes[route].revenue += parcel.feeInINR || 0;
    });
    return Object.values(routes)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
}
function getDriverPerformance(parcels) {
    const drivers = {};
    parcels.forEach(parcel => {
        if (!parcel.driverAddress)
            return;
        const driver = parcel.driverAddress;
        if (!drivers[driver]) {
            drivers[driver] = {
                driver,
                totalDeliveries: 0,
                completedDeliveries: 0,
                totalRevenue: 0,
                averageRating: 0
            };
        }
        drivers[driver].totalDeliveries++;
        drivers[driver].totalRevenue += parcel.feeInINR || 0;
        if (parcel.status === 'delivered')
            drivers[driver].completedDeliveries++;
    });
    return Object.values(drivers)
        .map((driver) => (Object.assign(Object.assign({}, driver), { completionRate: driver.totalDeliveries > 0 ? (driver.completedDeliveries / driver.totalDeliveries) * 100 : 0 })))
        .sort((a, b) => b.totalDeliveries - a.totalDeliveries);
}
function getCustomerInsights(parcels) {
    const customers = {};
    parcels.forEach(parcel => {
        const customer = parcel.senderAddress;
        if (!customers[customer]) {
            customers[customer] = {
                customer,
                totalOrders: 0,
                totalSpent: 0,
                lastOrderDate: null
            };
        }
        customers[customer].totalOrders++;
        customers[customer].totalSpent += parcel.feeInINR || 0;
        customers[customer].lastOrderDate = new Date(parcel.createdAt);
    });
    return Object.values(customers)
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 20);
}
