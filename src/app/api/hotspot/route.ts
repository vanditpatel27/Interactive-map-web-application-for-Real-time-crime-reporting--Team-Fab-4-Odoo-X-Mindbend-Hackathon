import { getHotspots } from './hotspotService';
import { dbConnect } from '@/db/mongodb/connect';
// For Next.js App Router (Next.js 13+)
export async function GET() {
  try {
    await dbConnect();
    const hotspots = await getHotspots();
    console.log("request completed");
    
    return new Response(JSON.stringify(hotspots), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.log(error);
    
    return new Response(JSON.stringify({ error: (error instanceof Error) ? error.message : 'An unknown error occurred' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}