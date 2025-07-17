import UserInfo from '@/db/mongodb/models/UserInfo';
import { getAuth } from '@/libs/auth';
// import { FILE_DOMAIN } from '@/libs/const';
// import { uploadFile } from '@/libs/file-upload';
import { NextResponse, NextRequest } from 'next/server';
import crypto from 'node:crypto';

export async function GET(request: NextRequest) {
    try {
        const user = await getAuth(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userInfo = await UserInfo.findOne({ userId: user.id });
        if (userInfo) {
            user.avatar = userInfo.avatar;
            user.bio = userInfo.bio;
            user.address = userInfo.address;
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error('Error: ', error);
        return NextResponse.json({ error: 'Something went wrong...' }, { status: 500 });
    }
}


export async function PUT(request: NextRequest) {
    try {
        const user = await getAuth(request);
        if (!user)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const formData = await request.formData();
        const avatarImg = formData.get('avatar') as File;
        const bio = formData.get('bio') as string;
        const address = formData.get('address') as string; // Get address from form data
        if (!avatarImg && !bio && !address)
            return NextResponse.json({ error: 'Upload either bio, avatar or address' }, { status: 400 });

        // Update user info
        let avatar = '';
        if (avatarImg) {
            const fileExtension = avatarImg.name.split('.').pop();
            const randomName = crypto.randomBytes(12).toString('hex');
            const fileName = `user_${randomName}.${fileExtension}`;

            // const uploadResponse = await uploadFile(avatarImg, fileName);

            // if (uploadResponse && typeof uploadResponse.message === 'string') {
            //     const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
            //     const name = uploadResponse.message.split(' ')[1].split('/').pop() as string;
            //     avatar = `${protocol}://${FILE_DOMAIN}/${name}`;
            // } else {
            //     throw new Error('Invalid response from uploadFile');
            // }
        }

        let updatedUserInfo = await UserInfo.findOne({ userId: user.id });

        if (!updatedUserInfo) {
            // Create a new user record if not found
            updatedUserInfo = await UserInfo.create({
                userId: user.id,
                email: user.email,
                avatar: avatar || '',
                bio: bio || '',
                address: address || '', // Save address
            });
        } else {
            // Update the existing user record
            updatedUserInfo = await UserInfo.findOneAndUpdate(
                { userId: user.id },
                {
                    $set: {
                        email: user.email,
                        avatar: avatar || updatedUserInfo.avatar || '',
                        bio: bio ?? updatedUserInfo.bio ?? '',
                        address: address ?? updatedUserInfo.address ?? '', // Update address
                    },
                },
                { new: true }
            );
        }

        return NextResponse.json({ message: "Updated", address });
    } catch (error) {
        console.error('Error: ', error);
        return NextResponse.json({ error: 'Something went wrong...' }, { status: 500 });
    }
}
