import { NextResponse, NextRequest } from "next/server";
import fsJson from "./fire_stations_v2.json";
import { dbConnect } from "@/db/mongodb/connect";
import EmergencyContact from "@/db/mongodb/models/EmergencyContact";

export async function POST(request: NextRequest) {
  try {
    // await dbConnect();
    // fsJson.forEach(async (fs) => {
    //     const ec = await EmergencyContact.create({
    //         name: fs.name,
    //         contact_number: fs.contact_number,
    //         address: fs.address,
    //         location: {
    //             type: "Point",
    //             coordinates: [fs.coordinates.lng, fs.coordinates.lat]
    //         },
    //         type: 'Fire Station'
    //     });
    //     await ec.save();
    // });
    return NextResponse.json({
      message: "Emergency Contacts added successfully",
    });
  } catch (error) {
    console.error("Error: ", error);
    return NextResponse.json(
      { error: "Something went wrong..." },
      { status: 500 }
    );
  }
}
