import { dbConnect } from '@/db/mongodb/connect';
import Vote from '@/db/mongodb/models/Vote';
import { getAuth } from '@/libs/auth';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const loggedInUser = await getAuth(request);
        if (!loggedInUser)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();

        const reports = await Vote.find({
            userId: loggedInUser.id
        });

        const upvoteCount = reports.filter((report) => report.vote === 'upvote').length;
        const downvoteCount = reports.filter((report) => report.vote === 'downvote').length;

        return NextResponse.json({ upvoteCount, downvoteCount });
    } catch (error) {
        console.error('Error: ', error);
        return NextResponse.json({ error: 'Something went wrong...' }, { status: 500 });
    }
}
