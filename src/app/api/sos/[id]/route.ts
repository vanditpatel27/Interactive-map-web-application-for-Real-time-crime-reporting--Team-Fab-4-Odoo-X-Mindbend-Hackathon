// app/api/sos/[id]/route.ts
import { dbConnect } from '@/db/mongodb/connect';
import SosAlert from '@/db/mongodb/models/SosAlert';
import { getAuth } from '@/libs/auth';
import { NextRequest, NextResponse } from 'next/server';

export const GET = async (request: NextRequest, { params }: { params: { id: string } }) => {
  // Use await to make sure params are resolved before accessing id
  const { id } = await params; // Ensure params is awaited

  try {
    await dbConnect();

    // Get the authenticated user
    const session = await getAuth(request);
    
    // if (!session || !session.id) {
    //   return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
    // }

    // Get SOS details from the database
    const sosAlert = await SosAlert.findById(id);

    if (!sosAlert) {
      return NextResponse.json({ message: 'SOS not found' }, { status: 404 });
    }

    // Check if the user is authorized to view this SOS
    const userId = session.id;
    if (sosAlert.userId !== userId && sosAlert.acceptedById !== userId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(sosAlert, { status: 200 });
  } catch (error) {
    console.error('Error fetching SOS details:', error);
    return NextResponse.json({ message: 'Error fetching SOS details' }, { status: 500 });
  }
};
