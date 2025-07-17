import { getAuth } from '@/libs/auth';
import { dbConnect } from '@/db/mongodb/connect';
import CrimeReport from '@/db/mongodb/models/CrimeReport';
import ApproveAnonymousReport from '@/db/mongodb/models/ApproveAnonymous';
import { NextResponse, NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const loggedInUser = await getAuth(request);
        if (!loggedInUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!loggedInUser.isVerified) return NextResponse.json({ error: 'You need to be Verified' }, { status: 403 });

        const { crimeReportId } = await request.json()

        if (!crimeReportId) {
            return NextResponse.json({ error: "Crime report ID is required" }, { status: 400 })
        }

        await dbConnect()

        // Check if the report exists and is anonymous
        const report = await CrimeReport.findById(crimeReportId)
        if (!report) {
            return NextResponse.json({ error: "Report not found" }, { status: 404 })
        }

        if (report.reportedBy.toString() !== loggedInUser.id) {
            return NextResponse.json({ error: "You are not authorized to make this request" }, { status: 403 })
        }

        // Check if a request already exists
        const existingRequest = await ApproveAnonymousReport.findOne({ crimeReportId })
        if (existingRequest) {
            return NextResponse.json({ error: "A request for this report already exists" }, { status: 400 })
        }

        // Create a new request
        const newRequest = new ApproveAnonymousReport({
            crimeReportId,
            userId: loggedInUser.id,
        })

        await newRequest.save()
        return NextResponse.json({ message: "Request submitted successfully" })
    } catch (error) {
        console.error('Error: ', error);
        return NextResponse.json({ error: 'Something went wrong...' }, { status: 500 });
    }
}
