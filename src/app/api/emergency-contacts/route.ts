import EmergencyContact from '@/db/mongodb/models/EmergencyContact';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const searchParam = request.nextUrl.searchParams;
        const lat = searchParam.get('lat');
        const lng = searchParam.get('lng');
        const type = searchParam.get('type');

        if (!lat || !lng) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        const query: any = {
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: 10000
                }
            }
        };

        if (type && type !== 'All') {
            query.type = type;
        }

        const contacts = await EmergencyContact.find(query);
        return NextResponse.json({ contacts });
    } catch (error) {
        console.error('Error: ', error);
        return NextResponse.json({ error: 'Something went wrong...' }, { status: 500 });
    }
}
