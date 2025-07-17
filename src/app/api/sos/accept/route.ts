// app/api/sos/accept/route.ts
import { dbConnect } from '@/db/mongodb/connect';
import SosAlert, { SosAlertStatus } from '@/db/mongodb/models/SosAlert';
import { getAuth } from '@/libs/auth';
import { NextRequest } from 'next/server';

interface LocationData {
  lat: number;
  lng: number;
}

interface AcceptSosRequest {
  sosId: string;
  policeLocation: LocationData;
}

export const POST = async (request: NextRequest) => {
  try {
    await dbConnect();

    // Extract the JSON body from the request
    const body = await request.json();
    const { sosId, policeLocation }: AcceptSosRequest = body;

    // Get the authenticated user (police officer)
    const session = await getAuth(request);
    
    // if (!session || !session.id) {
    //   return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
    // }

    const policeId = session.id;
    console.log('Police ID:', policeId);
    console.log(sosId);
    // Find the SOS alert by ID
    const sosAlert = await SosAlert.findById(sosId);
    if (!sosAlert) {
      return new Response(JSON.stringify({ message: 'SOS alert not found' }), { status: 404 });
    }

    // Check if the SOS alert is active
    if (sosAlert.status !== SosAlertStatus.ACTIVE) {
      return new Response(
        JSON.stringify({ message: `SOS is already ${sosAlert.status.toLowerCase()}` }),
        { status: 400 }
      );
    }

    // Update the SOS alert in the database
    sosAlert.status = SosAlertStatus.ACCEPTED;
    sosAlert.acceptedById = policeId;
    sosAlert.acceptedAt = new Date();
    await sosAlert.save();

    return new Response(
      JSON.stringify({
        message: 'SOS accepted successfully',
        sosId,
        policeId,
        status: sosAlert.status,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error accepting SOS:', error);
    return new Response(JSON.stringify({ message: 'Error accepting SOS' }), { status: 500 });
  }
};
