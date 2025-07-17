import { dbConnect } from "@/db/mongodb/connect";
import User from "@/db/mongodb/models/User";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const users = await User.find();

    return NextResponse.json({
      users,
    });
  } catch (error) {
    console.error("Error: ", error);
    return NextResponse.json(
      { error: "Something went wrong..." },
      { status: 500 }
    );
  }
}
