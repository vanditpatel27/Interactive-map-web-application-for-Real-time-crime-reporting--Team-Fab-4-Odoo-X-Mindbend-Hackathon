import CrimeReport from "@/db/mongodb/models/CrimeReport";
import { getAuth } from "@/libs/auth";
import { NextResponse, NextRequest } from "next/server";

export async function PATCH(request: NextRequest) {
  try {
    const loggedInUser = await getAuth(request);
    if (!loggedInUser)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (loggedInUser.role != "admin")
      return NextResponse.json(
        { error: "Authorized for Admin" },
        { status: 403 }
      );

    const { reportId, suspicionLevel } = await request.json();
    if (!reportId || !suspicionLevel)
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );

    await CrimeReport.findByIdAndUpdate(reportId, { suspicionLevel });
    return NextResponse.json({ message: "Status updated successfully" });
  } catch (error) {
    console.error("Error: ", error);
    return NextResponse.json(
      { error: "Something went wrong..." },
      { status: 500 }
    );
  }
}
