// app/api/sos/complete/[id]/route.ts
import { dbConnect } from '@/db/mongodb/connect';
import SosAlert, { SosAlertStatus } from '@/db/mongodb/models/SosAlert';
import { getAuth } from '@/libs/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Safely extract `id` from the URL
  const pathParts = req.nextUrl.pathname.split('/');
  const id = pathParts[pathParts.length - 1]; // Get the last part of the path

  if (!id) {
    return NextResponse.json({ message: 'SOS ID is required' }, { status: 400 });
  }

  try {
    await dbConnect();
    
    // Get the authenticated user (police officer)
    const session = await getAuth(req); // Use `req` here for NextRequest
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const policeId = session.id;
    
    // Get the SOS alert by ID
    const sosAlert = await SosAlert.findById(id);
    
    if (!sosAlert) {
      return NextResponse.json({ message: 'SOS not found' }, { status: 404 });
    }
    
    // Verify this is the police officer who accepted the alert
    if (sosAlert.acceptedById !== policeId) {
      return NextResponse.json({ 
        message: 'Only the police officer who accepted this SOS can complete it' 
      }, { status: 403 });
    }
    
    // Update SOS in the database
    sosAlert.status = SosAlertStatus.COMPLETED;
    sosAlert.completedAt = new Date();
    await sosAlert.save();
    
    return NextResponse.json({ 
      message: 'SOS marked as completed',
      sosId: id,
      status: sosAlert.status
    }, { status: 200 });
  } catch (error) {
    console.error('Error completing SOS:', error);
    return NextResponse.json({ message: 'Error completing SOS' }, { status: 500 });
  }
}
