import { dbConnect } from '@/db/mongodb/connect';
import NotificationSubscription from '@/db/mongodb/models/NotificationSubscription';
import { getAuth } from '@/libs/auth';
import { NextResponse, NextRequest } from 'next/server';


export async function GET(request: NextRequest) {
    try {
        const loggedInUser = await getAuth(request);
        const userId = loggedInUser?.id;
        if (!userId)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        await dbConnect();
        const subscription = await NotificationSubscription.findOne({ userId });
        return NextResponse.json({ subscription });
    } catch (error) {
        console.error('Error: ', error);
        return NextResponse.json({ error: 'Something went wrong...' }, { status: 500 });
    }
}


export async function POST(request: NextRequest) {
    try {
        const { subscription } = await request.json();
        const loggedInUser = await getAuth(request);
        const userId = loggedInUser?.id;

        if (!userId || !subscription)
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

        await dbConnect();
        await NotificationSubscription.findOneAndUpdate(
            { userId },
            { subscription },
            { upsert: true }
        );
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error: ', error);
        return NextResponse.json({ error: 'Something went wrong...' }, { status: 500 });
    }
}


export async function DELETE(request: NextRequest) {
    try {
        const loggedInUser = await getAuth(request);
        if (!loggedInUser)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        const userId = loggedInUser.id;
        await dbConnect();
        await NotificationSubscription.deleteOne({ userId });
    } catch (error) {
        console.error('Error: ', error);
        return NextResponse.json({ error: 'Something went wrong...' }, { status: 500 });
    }
}
