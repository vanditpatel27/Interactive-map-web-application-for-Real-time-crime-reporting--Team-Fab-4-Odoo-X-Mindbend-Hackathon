// route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { image_url, text } = await req.json();

  const HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/laion/CLIP-ViT-B-32-laion2B-s34B-b79K";
  const HUGGINGFACE_API_TOKEN = "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";

  try {
    const response = await fetch(HUGGINGFACE_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HUGGINGFACE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: {
          image: image_url,
          text: text,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Hugging Face API error: ${errText}`);
    }

    const result = await response.json();

    return NextResponse.json({
      score: result[0]?.score || 0,
      label: result[0]?.label || "unknown",
    });
  } catch (err: any) {
    console.error("Hugging Face API error:", err.message);
    return NextResponse.json({ error: "Failed to get similarity." }, { status: 500 });
  }
}
