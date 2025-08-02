import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  walletAddress: string;
  role: 'sender' | 'driver';
  profileData: {
    name: string;
    email?: string;
    phone: string;
    preferredPickupZone?: string;
    vehicleType?: string;
    capacity?: number;
    licenseNumber?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: {
      validator: function(v: string) {
        return /^0x[a-fA-F0-9]{40}$/.test(v);
      },
      message: 'Invalid wallet address format'
    }
  },
  role: {
    type: String,
    required: true,
    enum: ['sender', 'driver']
  },
  profileData: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function(v: string) {
          return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Invalid email format'
      }
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    preferredPickupZone: {
      type: String,
      trim: true
    },
    vehicleType: {
      type: String,
      trim: true
    },
    capacity: {
      type: Number,
      min: 0
    },
    licenseNumber: {
      type: String,
      trim: true
    }
  }
}, {
  timestamps: true
});

// Index for faster wallet address lookups
userSchema.index({ walletAddress: 1 });

const User = mongoose.model<IUser>('User', userSchema);

export default User;
