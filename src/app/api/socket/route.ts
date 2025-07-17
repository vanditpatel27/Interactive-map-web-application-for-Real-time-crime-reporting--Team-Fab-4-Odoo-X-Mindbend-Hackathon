// app/api/socket/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { dbConnect } from '@/db/mongodb/connect';

interface LocationData {
  lat: number;
  lng: number;
}

interface SosAlertData {
  sosId: string;
  userId: string;
  location: LocationData;
}

interface SosAcceptedData {
  sosId: string;
  policeId: string;
  policeLocation: LocationData;
}

interface PoliceLocationUpdateData {
  sosId: string;
  policeId: string;
  location: LocationData;
}

interface SosCompletedData {
  sosId: string;
  policeId: string;
}

// Socket IO handler setup
export async function GET() {
  return NextResponse.json({ message: "Socket API is running" });
}

export async function POST(req: any) {
  // Connect to MongoDB
  await dbConnect();

  // Initialize socket.io on the server
  const resSocket = req.socket as NetServer & { io?: SocketIOServer };
  if (resSocket.io) {
    console.log('Socket is already running');
    return NextResponse.json({ message: 'Socket is already running' });
  }

  console.log('Setting up socket');
  const io = new SocketIOServer(resSocket);
  resSocket.io = io;

  io.on('connection', (socket) => {
    console.log('a user connected', socket.id);

    // Listen to 'sos-alert'
    socket.on('sos-alert', (data: SosAlertData) => {
      // Broadcast to all police users
      console.log('SOS alert receivedaaaaa:', data);
      socket.broadcast.emit('sos-alert', data);
    });

    // Listen to 'sos-accepted'
    socket.on('sos-accepted', (data: SosAcceptedData) => {
      // Notify the user who sent the SOS
      socket.broadcast.emit('sos-accepted', data);
      // Notify other police officers
      socket.broadcast.emit('sos-accepted-by-other', data.sosId);
    });

    // Listen to 'police-location-update'
    socket.on('police-location-update', (data: PoliceLocationUpdateData) => {
      // Send to the user who sent the SOS
      socket.broadcast.emit('police-location-update', data);
    });

    // Listen to 'sos-cancelled'
    socket.on('sos-cancelled', (sosId: string) => {
      socket.broadcast.emit('sos-cancelled', sosId);
    });

    // Listen to 'sos-completed'
    socket.on('sos-completed', (data: SosCompletedData) => {
      socket.broadcast.emit('sos-completed', data.sosId);
    });

    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
  });

  return NextResponse.json({ message: 'Socket initialized' });
}
