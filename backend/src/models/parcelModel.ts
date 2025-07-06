import mongoose, { Schema, Document } from 'mongoose';

export interface IParcel extends Document {
  senderAddress: string;
  driverAddress?: string;
  fromAddress: string;
  toAddress: string;
  itemDescription: string;
  itemValue: number; // In INR
  sizeTier: 'Small' | 'Medium' | 'Large';
  weight?: number;
  pickupDate?: string;
  pickupTime?: string;
  specialInstructions?: string;
  feeInINR: number;
  escrowAmountInAVAX: number;
  status: 'pending' | 'accepted' | 'in-transit' | 'delivered' | 'cancelled';
  // Blockchain integration fields
  deliveryId?: string; // Smart contract delivery ID
  transactionHash?: string; // Transaction hash from blockchain
  escrowContractAddress: string;
  blockchainStatus?: number; // Status from smart contract (0=pending, 1=accepted, 2=in-transit, 3=delivered)
  acceptTransactionHash?: string; // Transaction hash when driver accepts
  deliveryTransactionHash?: string; // Transaction hash when marked as delivered
  fundReleaseTransactionHash?: string; // Transaction hash when funds are released
  creationDate: Date;
  lastUpdated: Date;
}

const ParcelSchema: Schema = new Schema({
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
});

export default mongoose.model<IParcel>('Parcel', ParcelSchema);
