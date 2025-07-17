import { dbConnect } from '@/db/mongodb/connect';
import SosAlert, { SosAlertStatus } from '@/db/mongodb/models/SosAlert';
import { getAuth } from '@/libs/auth';
import { NextRequest } from 'next/server';

export const POST = async (request: NextRequest) => {
  try {
    await dbConnect();

    // ✅ Extract sosId from custom header
    const sosId = request.headers.get('x-sos-id');

    if (!sosId) {
      return new Response(JSON.stringify({ message: 'Missing sosId in headers' }), { status: 400 });
    }

    // ✅ Get the authenticated user
    const session = await getAuth(request);

    const userId = session?.id;
    if (!userId) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
    }

    // ✅ Find the user's active SOS alert
    const sosAlert = await SosAlert.findOne({ 
      _id: sosId,
      userId,
      status: { $in: [SosAlertStatus.ACTIVE, SosAlertStatus.ACCEPTED] },
    });

    if (!sosAlert) {
      return new Response(JSON.stringify({ message: 'No active SOS alert found for this user' }), { status: 404 });
    }

    // ✅ Update SOS status
    sosAlert.status = SosAlertStatus.CANCELLED;
    sosAlert.cancelledAt = new Date();
    await sosAlert.save();

    return new Response(
      JSON.stringify({
        message: 'SOS cancelled successfully',
        sosId,
        status: sosAlert.status,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error cancelling SOS:', error);
    return new Response(JSON.stringify({ message: 'Error cancelling SOS' }), { status: 500 });
  }
};
