import { NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(request: Request) {
    const groq = new Groq();
  try {
    // Parse the incoming form data
    const formData = await request.formData();
    const base64 = formData.get("base64");

    if (!base64 || typeof base64 !== "string") {
      return NextResponse.json({ error: "Invalid base64 data" }, { status: 400 });
    }

    // Convert base64 to a buffer
    const buffer = Buffer.from(base64, "base64");
    // buffer to blob
    const blob = new Blob([buffer], { type: "audio/webm" });
    const file = new File([blob], 'audio.webm', { type: 'audio/webm' });

    const res = await groq.audio.translations.create({
        file: file,
        model: "whisper-large-v3",
        response_format: "json",
        temperature: 0.0
    })
    console.log(res)
    return NextResponse.json(res, {status: 200});
  } catch (error) {
    console.error("Error processing voice note:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
