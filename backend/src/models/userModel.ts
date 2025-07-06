import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  walletAddress: string;
  name: string;
  joinDate: Date;
  defaultRole: 'sender' | 'driver';
  vehicleNumber?: string;
}

const UserSchema: Schema = new Schema({
  walletAddress: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  joinDate: { type: Date, default: Date.now },
  defaultRole: { type: String, enum: ['sender', 'driver'], required: true },
  vehicleNumber: { type: String },
});

export default mongoose.model<IUser>('User', UserSchema);
