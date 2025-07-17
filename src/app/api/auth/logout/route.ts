import { NextResponse, NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const response = NextResponse.json({ message: "Logged out" });

        response.cookies.set("token", "", {
            httpOnly: true,
            maxAge: 0,
            sameSite: "none",
            secure: true,
            path: "/", // Path must match the original cookie
        });

        return response;
      
    } catch (error) {
        console.error('Error: ', error);
        return NextResponse.json({ error: 'Something went wrong...' }, { status: 500 });
    }
}
