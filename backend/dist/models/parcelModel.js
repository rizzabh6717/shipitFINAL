"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const ParcelSchema = new mongoose_1.Schema({
    senderAddress: { type: String, required: true },
    driverAddress: { type: String },
    fromAddress: { type: String, required: true },
    toAddress: { type: String, required: true },
    itemDescription: { type: String, required: true },
    itemValue: { type: Number, required: true },
    sizeTier: { type: String, enum: ['Small', 'Medium', 'Large'], required: true },
    weight: { type: Number },
    pickupDate: { type: String },
    pickupTime: { type: String },
    specialInstructions: { type: String },
    feeInINR: { type: Number, required: true },
    escrowAmountInAVAX: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'in-transit', 'delivered', 'cancelled'],
        default: 'pending',
    },
    // Blockchain integration fields
    deliveryId: { type: String }, // Smart contract delivery ID
    transactionHash: { type: String }, // Transaction hash from blockchain
    escrowContractAddress: { type: String, required: true },
    blockchainStatus: { type: Number }, // Status from smart contract
    acceptTransactionHash: { type: String },
    deliveryTransactionHash: { type: String },
    fundReleaseTransactionHash: { type: String },
    creationDate: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now },
    proofPhoto: { type: String },
    proofUploadTime: { type: Date },
    senderPhoto: { type: String }, // Photo uploaded by sender during parcel creation
    // User information fields
    senderName: { type: String },
    senderPhone: { type: String },
    senderEmail: { type: String },
    driverName: { type: String },
    driverPhone: { type: String },
    driverCarNumber: { type: String },
    driverVehicle: { type: String },
    driverRating: { type: Number }
});
exports.default = mongoose_1.default.model('Parcel', ParcelSchema);
