// models/SosAlert.ts
import mongoose, { Schema, Document } from 'mongoose';

// Define the location schema
interface ILocation {
  lat: number;
  lng: number;
}

const LocationSchema = new Schema<ILocation>({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true }
});

// Define the SOS alert status
export enum SosAlertStatus {
  ACTIVE = 'ACTIVE',
  ACCEPTED = 'ACCEPTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

// Define the SOS alert interface
export interface ISosAlert extends Document {
  userId: string;
  location: ILocation;
  status: SosAlertStatus;
  createdAt: Date;
  acceptedById?: string;
  acceptedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
}

// Create the SOS alert schema
const SosAlertSchema = new Schema<ISosAlert>({
  userId: { type: String, required: true, index: true },
  location: { type: LocationSchema, required: true },
  status: { 
    type: String, 
    enum: Object.values(SosAlertStatus), 
    default: SosAlertStatus.ACTIVE,
    index: true 
  },
  createdAt: { type: Date, default: Date.now },
  acceptedById: { type: String, index: true },
  acceptedAt: { type: Date },
  completedAt: { type: Date },
  cancelledAt: { type: Date }
});

// Add an index for active alerts
SosAlertSchema.index({ status: 1, createdAt: -1 });

// Create and export the model
export default mongoose.models.SosAlert || mongoose.model<ISosAlert>('SosAlert', SosAlertSchema);