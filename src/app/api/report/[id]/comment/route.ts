import Comment from '@/db/mongodb/models/Comment';
import User from '@/db/mongodb/models/User';
import { NextResponse, NextRequest } from 'next/server';

export async function GET
(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        
        if (!id) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

        // Fetch comments for the given crime report
        const comments = await Comment.find({ crimeReportId: id });

        // Fetch author names and add them to the comments
        const commentsWithAuthors = await Promise.all(
            comments.map(async (comment) => {
                const user = await User.findById(comment.author);
                return {
                    ...comment.toObject(),
                    authorName: user ? user.name : 'Unknown'
                };
            })
        );

        return NextResponse.json({ comments: commentsWithAuthors });
    } catch (error) {
        console.error('Error: ', error);
        return NextResponse.json({ error: 'Something went wrong...' }, { status: 500 });
    }
}
