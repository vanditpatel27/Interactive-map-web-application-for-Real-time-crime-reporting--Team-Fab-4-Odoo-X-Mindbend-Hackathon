// app/api/sos/active/route.ts
import { dbConnect } from '@/db/mongodb/connect';
import SosAlert, { SosAlertStatus } from '@/db/mongodb/models/SosAlert';
import { getAuth } from '@/libs/auth';
import { NextRequest } from 'next/server';

export const GET = async (request: NextRequest) => {
  try {
    await dbConnect();

    // Get the authenticated user (e.g., police officer)
    const session = await getAuth(request);

    // if (!session || !session.id) {
    //   return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
    // }

    // Get all active SOS alerts
    const activeAlerts = await SosAlert.find({ 
      status: SosAlertStatus.ACTIVE 
    }).sort({ createdAt: -1 });

    return new Response(
      JSON.stringify(activeAlerts),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching active SOS alerts:', error);
    return new Response(
      JSON.stringify({ message: 'Error fetching alerts' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
