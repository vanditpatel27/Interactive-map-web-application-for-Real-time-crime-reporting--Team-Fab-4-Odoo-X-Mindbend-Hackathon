import { NextResponse } from "next/server";
import User from "@/db/mongodb/models/User"; // Path to your User model
import UserInfo from "@/db/mongodb/models/UserInfo"; // Path to your UserInfo model
import CrimeReport from "@/db/mongodb/models/CrimeReport"; // Path to your CrimeReport model
import { Types } from "mongoose"; // Import the Types object from mongoose

// Handler for GET requests to fetch user data by userId
export async function GET(request: Request, { params }: { params: { userId: string } }) {
    const { userId } = await params;

    try {
        // Convert the userId to ObjectId using Types.ObjectId
        const userObjectId = new Types.ObjectId(userId);

        // Fetch the user from the database
        const user = await User.findById(userObjectId).select("-password"); // Exclude password from the response

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        // Fetch additional user info (avatar and bio) from UserInfo model
        const userInfo = await UserInfo.findOne({ userId: user._id });

        // Fetch the crime reports associated with the user
        const userReports = await CrimeReport.find({ reportedBy: user._id });

        // Return the user data, user info, and reports
        return NextResponse.json({ user, userInfo, userReports }, { status: 200 });
    } catch (error) {
        console.error("Error fetching user data:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
