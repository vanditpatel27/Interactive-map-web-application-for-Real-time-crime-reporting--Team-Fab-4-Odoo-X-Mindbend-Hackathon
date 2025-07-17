import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET(req: NextRequest, { params }: { params: { file: string } }) {
  const { file } = await params;
  const filePath = path.join(process.cwd(), "server-ftp", "root", file);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }
  console.log(filePath)
  const imageBuffer = fs.readFileSync(filePath);
  const mimeType = "image/" + path.extname(file).substring(1); // Detect file type

  return new NextResponse(imageBuffer, {
    headers: { "Content-Type": mimeType },
  });
}
