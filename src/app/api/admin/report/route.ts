import CrimeReport from "@/db/mongodb/models/CrimeReport";
import NotificationSubscription from "@/db/mongodb/models/NotificationSubscription";
import { getAuth } from "@/libs/auth";
import webpush from "@/libs/webpush";
import { NextResponse, NextRequest } from "next/server";
import { PushSubscription } from "web-push";

export async function DELETE(request: NextRequest) {
  try {
    const { reportId } = await request.json();
    const loggedInUser = await getAuth(request);

    if (!reportId)
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    if (!loggedInUser)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (loggedInUser.role != "admin")
      return NextResponse.json(
        { error: "Authorized for Admin" },
        { status: 403 }
      );
    const report = await CrimeReport.findByIdAndDelete(reportId);

    const authorSubscription = await NotificationSubscription.findOne({
      userId: report?.reportedBy,
    });
    if (authorSubscription)
      await webpush.sendNotification(
        authorSubscription.subscription as PushSubscription,
        JSON.stringify({
          title: "Your report has been deleted!",
          body: "Your report has been deleted by an admin",
        })
      );

    return NextResponse.json({ message: "Report deleted successfully" });
  } catch (error) {
    console.error("Error: ", error);
    return NextResponse.json(
      { error: "Something went wrong..." },
      { status: 500 }
    );
  }
}
