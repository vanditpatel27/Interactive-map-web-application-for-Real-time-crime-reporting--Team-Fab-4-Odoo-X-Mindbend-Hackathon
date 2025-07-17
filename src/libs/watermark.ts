import sharp from "sharp";

export async function addWatermark(imageBuffer: Buffer): Promise<Buffer> {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || 800;
    const height = metadata.height || 600;

    // Create a text-based SVG watermark with fixed positioning
    const svgText = `
    <svg width="${width}" height="${height}">
      <style>
        .watermark {
          font: bold 24px sans-serif;
          fill: rgba(255, 255, 255, 0.5);
          stroke: black;
          stroke-width: 1px;
        }
      </style>
      <text 
        x="${width - 150}" 
        y="${height - 20}" 
        class="watermark"
      >Shahajjo</text>
    </svg>`;

    // Convert the SVG to a Buffer
    const svgBuffer = Buffer.from(svgText);

    // Apply the watermark
    const result = await sharp(imageBuffer)
      .composite([
        {
          input: svgBuffer,
          blend: "over",
        },
      ])
      .jpeg() // Ensure output format
      .toBuffer();

    return result;
  } catch (error) {
    console.error("Watermark error:", error);
    throw error;
  }
}
