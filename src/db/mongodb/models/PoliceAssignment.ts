import { Schema, model, models, Document } from 'mongoose';

export interface IPoliceAssignment extends Document {
  policeId: string;
  assignedReports: string[]; // Array of crime report string IDs
}

const PoliceAssignmentSchema = new Schema<IPoliceAssignment>({
  policeId: {
    type: String,
    required: true,
    unique: true,
  },
  assignedReports: {
    type: [String],
    default: [],
  },
});

const PoliceAssignment =
  models.PoliceAssignment || model<IPoliceAssignment>('PoliceAssignment', PoliceAssignmentSchema);

export default PoliceAssignment;
