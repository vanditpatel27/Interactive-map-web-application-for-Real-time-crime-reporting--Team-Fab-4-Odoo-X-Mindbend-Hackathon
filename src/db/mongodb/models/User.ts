import { IUser } from '@/types';
import { Model, model, models, Schema } from 'mongoose';


const UserSchema = new Schema<IUser>({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    phoneNumber: { type: String,unique: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    role: { type: String, required: true, default: 'user' },
    otp: { type: String, default: '' },
    otpExpiresAt: { type: Date, default: new Date() },
    batchNo: { type: String ,default:""},
    latitude:{type:String,default:""},
    longitude:{type:String,default:""},
});

const User = models?.user as Model<IUser> || model('user', UserSchema);

export default User;