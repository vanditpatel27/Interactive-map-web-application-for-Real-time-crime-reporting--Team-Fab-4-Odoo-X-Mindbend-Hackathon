import { dbConnect } from '@/db/mongodb/connect';
import Comment from '@/db/mongodb/models/Comment';
import NotificationSubscription from '@/db/mongodb/models/NotificationSubscription';
import { getAuth } from '@/libs/auth';
import webpush from '@/libs/webpush';
import { Content } from 'next/font/google';
import { NextResponse, NextRequest } from 'next/server';
import { PushSubscription } from 'web-push';

export async function POST(request: NextRequest) {
    try {
        const loggedInUser = await getAuth(request);
        if (!loggedInUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { reportId, replyOf, content } = await request.json();
        if (!reportId) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        await dbConnect();
        const comment = await Comment.create({
            crimeReportId: reportId,
            author: loggedInUser.id,
            content,
            replyOf: replyOf || null,
        });
    
        const authorSubscription = await NotificationSubscription.findOne({ userId: comment.author });
        if (authorSubscription)
        await webpush.sendNotification(
            authorSubscription.subscription as PushSubscription,
            JSON.stringify({
              title: "Someone Commented on your report!",
              body: comment.content,
            })
          );
        return NextResponse.json({ comment });
    } catch (error) {
        console.error('Error: ', error);
        return NextResponse.json({ error: 'Something went wrong...' }, { status: 500 });
    }
}
