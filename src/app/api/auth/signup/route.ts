import { dbConnect } from '@/db/mongodb/connect';
import { register } from '@/libs/auth';
import { NextResponse, NextRequest } from 'next/server';


export async function POST(request: NextRequest) {
    try {
        const { name, email, password,batchNo,phoneNumber,latitude,longitude } = await request.json();
        console.log(name, email, password,batchNo,phoneNumber,latitude,longitude)
        if (!name || !email || !password||!phoneNumber||!latitude||!longitude) {
            return NextResponse.json(
                { error: "Name, Email and Password ,PhoneNumber,latitude,longitude are required." },
                { status: 400 }
            );
        }
        await dbConnect();
        
        await register(name, email, password,batchNo,phoneNumber,latitude,longitude);
       
        return NextResponse.json({ message: "User registered successfully" }, { status: 201 });
    } catch (error) {
        console.error('Error: ', error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
