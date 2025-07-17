import { dbConnect } from "@/db/mongodb/connect";
import { login } from "@/libs/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password)
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    await dbConnect();
    // Check if email and password are correct
    const user = await login(email, password);
    if (!user)
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

    // Set cookie
    const token = user.token;
    const response = NextResponse.json({
      message: "Logged In",
      user: user.user,
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "none",
      secure: true,
    });

    return response;
  } catch (error) {
    console.error("Error fetching batch:", error);
    return NextResponse.json({ error: "Failed to login. "+ (error as Error).message }, { status: 500 });
  }
}
