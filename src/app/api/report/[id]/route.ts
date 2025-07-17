import { dbConnect } from "@/db/mongodb/connect"
import Comment from "@/db/mongodb/models/Comment"
import CrimeReport from "@/db/mongodb/models/CrimeReport"
import User from "@/db/mongodb/models/User";
import { getAuth } from "@/libs/auth";
import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        await dbConnect()
        const { id } = await params
        const report = await CrimeReport.findById(id)
        if (!report) {
            return NextResponse.json({ error: "Report not found" }, { status: 404 })
        }

        const author = await User.findById(report.reportedBy).select("name email avatar");

        const comments = await Comment.find({ crimeReportId: id }).sort({ createdAt: -1 })

        let isAuthor = false;
        try {
            const loggedInUser = await getAuth(request);
            if (loggedInUser && loggedInUser.id) {
                isAuthor = loggedInUser.id === report.reportedBy.toString();
            }
        } catch (authError) {
            console.error("Error checking user auth: ", authError)
        }
        console.log(report, author)
        return NextResponse.json({
            report: { ...report.toJSON(), author },
            comments,
            isAuthor
        })
    } catch (error) {
        console.error("Error: ", error)
        return NextResponse.json({ error: "Something went wrong..." }, { status: 500 })
    }
}

