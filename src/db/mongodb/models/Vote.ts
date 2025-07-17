import { Model, model, models, Schema } from 'mongoose';
import { IVote } from '@/types';

const VoteSchema = new Schema<IVote>({
    reportId: { type: String, ref: "crimeReport", required: true },
    userId: { type: String, ref: "user", required: true },
    vote: { type: String, enum: ['upvote', 'downvote'], required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const Vote = models?.vote as Model<IVote> || model('vote', VoteSchema);

export default Vote;