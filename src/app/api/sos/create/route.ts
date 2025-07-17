import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/db/mongodb/connect';
import SosAlert, { SosAlertStatus } from '@/db/mongodb/models/SosAlert';

import { getAuth } from '@/libs/auth';

interface LocationData {
  lat: number;
  lng: number;
}

interface CreateSosRequest {
  location: LocationData;
}

export async function POST(req: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();

    const { location }: CreateSosRequest = await req.json();
    
    // Get the authenticated user
    const session = await getAuth(req);

    // Create SOS in the database
    const sosAlert = new SosAlert({
      userId: session.id,
      location,
      status: SosAlertStatus.ACTIVE,
      createdAt: new Date(),
    });

    await sosAlert.save();

    // Return the created SOS alert as a response
    return NextResponse.json(
      {
        id: sosAlert._id,
        userId: session.id,
        location,
        status: sosAlert.status,
        message: 'SOS created successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error creating SOS:', error);
    return NextResponse.json(
      { message: 'Error creating SOS' },
      { status: 500 }
    );
  }
}
