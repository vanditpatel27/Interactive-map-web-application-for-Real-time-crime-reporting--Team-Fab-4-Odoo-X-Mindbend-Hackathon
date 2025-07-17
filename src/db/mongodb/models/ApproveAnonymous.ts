import { IApproveAnonymousReport } from '@/types';
import { Model, model, models, Schema } from 'mongoose';

const ApproveAnonymousReportSchema = new Schema<IApproveAnonymousReport>({
    crimeReportId: { type: String, required: true },
    userId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const ApproveAnonymousReport = models?.approveAnonymousReport as Model<IApproveAnonymousReport> || model('approveAnonymousReport', ApproveAnonymousReportSchema);

export default ApproveAnonymousReport;