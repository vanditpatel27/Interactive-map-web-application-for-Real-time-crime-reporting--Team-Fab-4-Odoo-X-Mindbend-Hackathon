import { dbConnect } from '@/db/mongodb/connect';
import User from '@/db/mongodb/models/User';
import { generateToken, getAuth } from '@/libs/auth';
import { NextResponse, NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { otp } = await request.json();
        const loggedInUser = await getAuth(request);
        await dbConnect();
        const user = await User.findById(loggedInUser.id);

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        if (user.otpExpiresAt < new Date()) return NextResponse.json({ error: true, message: "OTP has expired" }, { status: 401 });
        if (user.otp != otp) return NextResponse.json({ error: true, message: "Invalid OTP" }, { status: 401 });

        user.otp = "";
        user.isVerified = true;

        await user.save();

        const userInfo = {
            id: user.id,
            name: user.name,
            email: user.email,
            isVerified: user.isVerified,
            role: user.role,
        };
        const token = await generateToken(userInfo);

        const response = NextResponse.json({
            message: "OTP Verified",
            user: userInfo,
        });

        response.cookies.set("token", token, {
            httpOnly: true,
            maxAge: 60 * 60 * 24 * 7,
            sameSite: "none",
            secure: true,
        });

        return response;
    } catch (error) {
        console.error('Error: ', error);
        return NextResponse.json({ error: 'Something went wrong...' }, { status: 500 });
    }
}
