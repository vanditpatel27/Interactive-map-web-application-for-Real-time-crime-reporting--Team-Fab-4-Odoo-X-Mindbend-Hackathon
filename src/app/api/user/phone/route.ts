import { dbConnect } from '@/db/mongodb/connect';
import User from '@/db/mongodb/models/User';
import { getAuth } from '@/libs/auth';
import { isPhoneNo, parsePhoneNumber, sendOTP } from '@/libs/otp';
import { NextResponse, NextRequest } from 'next/server';

export async function PATCH(request: NextRequest) {
    try {
        const { email } = await request.json();

        // if (!phoneNumber || !isPhoneNo(phoneNumber)) return NextResponse.json({ error: 'Missing or invalid phone number' }, { status: 400 });
        const loggedInUser = await getAuth(request);
        if (!loggedInUser)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const user = await User.findById(loggedInUser.id)
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        user.email = email;
        user.isVerified = false;

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 360000);

        user.otp = otp;
        user.otpExpiresAt = otpExpiresAt;

        await user.save();

        await sendOTP(otp, email);


        return NextResponse.json({ error: false, message: 'Email updated successfully' });
    } catch (error) {
        console.error('Error: ', error);
        return NextResponse.json({ error: 'Something went wrong...' }, { status: 500 });
    }
}
