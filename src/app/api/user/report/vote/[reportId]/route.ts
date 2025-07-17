import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/db/mongodb/connect";
import Vote from "@/db/mongodb/models/Vote";
import CrimeReport from "@/db/mongodb/models/CrimeReport";
import { getAuth } from "@/libs/auth";
import webpush from "@/libs/webpush";
import { report } from "process";
import NotificationSubscription from "@/db/mongodb/models/NotificationSubscription";
import { PushSubscription } from "web-push";

export async function GET(request: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
    try {
        const { reportId } = await params;
        await dbConnect();
        const loggedInUser = await getAuth(request);
        if (!loggedInUser)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const vote = await Vote.findOne({ reportId, userId: loggedInUser.id });
        return NextResponse.json({ vote });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });   
    }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
    try {
        const { reportId } = await params;
        await dbConnect();
        const loggedInUser = await getAuth(request);
        if (!loggedInUser)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { vote } = await request.json();

        if (!reportId || !vote)
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

        if (!["upvote", "downvote"].includes(vote)) {
            return NextResponse.json({ success: false, message: "Invalid vote type" }, { status: 400 });
        }

        // Check if the user has already voted
        const existingVote = await Vote.findOne({ reportId, userId: loggedInUser.id });

        if (existingVote) {
            if (existingVote.vote === vote) {
                // If the user votes the same way again, remove the vote
                await Vote.deleteOne({ reportId, userId: loggedInUser.id });
                // Decrease the corresponding vote count
                const voteChange = vote === "upvote" ? { upvotes: -1 } : { downvotes: -1 };
                await CrimeReport.findByIdAndUpdate(reportId, { $inc: voteChange });
                return NextResponse.json({ message: "REMOVED", vote: existingVote });
            }            // Update vote counts accordingly
            const voteChange = vote === "upvote" ? { upvotes: 1, downvotes: -1 } : { upvotes: -1, downvotes: 1 };
            await CrimeReport.findByIdAndUpdate(reportId, { $inc: voteChange });

            existingVote.vote = vote;
            await existingVote.save();

            return NextResponse.json({ message: "UPDATED", vote: existingVote });
        }
        // If new vote, insert into Vote collection
        await Vote.create({ reportId, userId: loggedInUser.id, vote });
        // Update the crime report's vote count
        const voteIncrement = vote === "upvote" ? { upvotes: 1 } : { downvotes: 1 };
        const report = await CrimeReport.findByIdAndUpdate(reportId, { $inc: voteIncrement });
        
        
        const authorSubscription = await NotificationSubscription.findOne({ userId: report?.reportedBy });
        if (authorSubscription)
        await webpush.sendNotification(
            authorSubscription.subscription as PushSubscription,
            JSON.stringify({
              title: "Someone voted on your report!",
              body: vote === "upvote" ? "Someone upvoted your report" : "Someone downvoted your report",
            })
          );
        return NextResponse.json({ message: "ADDED", vote: { reportId, userId: loggedInUser.id, vote } });
    } catch (error) {
        console.error("Error in voting:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
