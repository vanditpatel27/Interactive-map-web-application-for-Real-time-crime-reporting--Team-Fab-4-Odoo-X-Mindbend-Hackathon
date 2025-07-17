import { dbConnect } from "@/db/mongodb/connect";
import Comment from "@/db/mongodb/models/Comment";
import User from "@/db/mongodb/models/User";
import CrimeReport from "@/db/mongodb/models/CrimeReport";
import Vote from "@/db/mongodb/models/Vote";
import { analyzeReport } from '@/libs/analyze-report';
import { getAuth } from "@/libs/auth";
import { NextResponse, NextRequest } from "next/server";
import { v2 as cloudinary } from 'cloudinary';
import PoliceAssignment from '@/db/mongodb/models/PoliceAssignment';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET
});

export async function GET(request: NextRequest) {
  try {
    const loggedInUser = await getAuth(request);
    if (!loggedInUser)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();

    const reports = await CrimeReport.find({
      reportedBy: loggedInUser.id,
    }).sort({ createdAt: -1 });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Error: ", error);
    return NextResponse.json(
      { error: "Something went wrong..." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const loggedInUser = await getAuth(request);
    if (!loggedInUser)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!loggedInUser.isVerified)
      return NextResponse.json(
        { error: "You need to be Verified" },
        { status: 403 }
      );

    const formData = await request.formData();
    const reportedBy = loggedInUser.id;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const location_name = formData.get("location_name") as string;
    const crimeTime = formData.get("crimeTime") as string;
    const lat = formData.get("lat");
    const lng = formData.get("lng");
    const images = formData.getAll("images") as File[];
    const videos = formData.getAll("videos") as File[];
    const videoDescription = formData.get("videoDescription") as string;
    const isAnonymous = formData.get("isAnonymous") === "true";

    if (!title || !description || !location_name || !location_name)
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );

    let imageUrls: string[] = [];
    if (images.length !== 0 && images[0].size)
      imageUrls = await uploadToCloudinary(images, 'image');
    
    let videoUrls: string[] = [];
    if (videos.length !== 0 && videos[0].size)
      videoUrls = await uploadToCloudinary(videos, 'video');

    await dbConnect();
    const photo=imageUrls[0];
    const text=description;
    const response = await fetch('http://localhost:3001/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image_url:photo, description:text }),
    });

    const data = await response.json();
    console.log("Response from analyze:", data);
    
    if(data.similarity_score<0.50){
      return NextResponse.json({ error: "image and context are not matching" }, { status: 400 });
    }
    const response1 = await fetch('http://localhost:3001/detect-crime', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: description }),
    });

    const data1 = await response1.json();
    console.log("Response from analyze:", data1);
    if((data1.highest_category=="normal content") ||(data1.highest_score<0.50)){
      return NextResponse.json({ error: "This is not a Crime" }, { status: 400 });
    }
    function getDistanceFromLatLonInKm(lat1: any, lon1: any, lat2: any, lon2: any) {
      const R = 6371; // Radius of the earth in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) *
          Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      console.log(R * c);
      return R * c;
    }
    
    const police = await User.find({ role: 'police' });
    
    let nearestPolice = null;
    let minDistance = Infinity;
    

for (const officer of police as any[]) {
  const policeLat: number = parseFloat(officer.latitude);
  const policeLng: number = parseFloat(officer.longitude);
   
  
    const distance: number = getDistanceFromLatLonInKm(lat, lng, policeLat, policeLng);
    console.log(distance);
    if (distance < minDistance) {
      minDistance = distance;
      nearestPolice = officer;
    }
  
}

    
    const report = await CrimeReport.create({
      givenTo: nearestPolice?._id || null,
      reportedBy,
      title,
      description,
      location_name,
      videoDescription,
      crimeTime: new Date(crimeTime),
      location: {
        type: "Point",
        coordinates: [lng, lat],
      },
      images: imageUrls.length > 0 ? imageUrls : ["https://th.bing.com/th/id/OIP.64JjP4kqWijT4G5M6L3nVgHaE8?rs=1&pid=ImgDetMain"],
      videos: videoUrls,
      isAnonymous,

    });
    
    const a=await report.save();
    console.log(a);
    const b=await PoliceAssignment.findOneAndUpdate(
      { policeId: nearestPolice._id.toString() }, // Filter
      { $addToSet: { assignedReports: a._id.toString() } }, // Update
      { upsert: true, new: true } // Create if not exists
    );
    console.log(b);
    // analyzeReport(report._id, report.title, report.description, imageUrls.length > 0 ? imageUrls : ["https://th.bing.com/th/id/OIP.64JjP4kqWijT4G5M6L3nVgHaE8?rs=1&pid=ImgDetMain"]);

    return NextResponse.json({ message: "Report created successfully" });
  } catch (error) {
    console.error("Error: ", error);
    return NextResponse.json(
      { error: "Something went wrong..." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const loggedInUser = await getAuth(request);
    if (!loggedInUser)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!loggedInUser.isVerified)
      return NextResponse.json(
        { error: "You need to be Verified" },
        { status: 403 }
      );

    const formData = await request.formData();
    const reportId = formData.get("reportId") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const location_name = formData.get("location_name") as string;
    const crimeTime = formData.get("crimeTime") as string;
    const lat = formData.get("lat");
    const lng = formData.get("lng");
    const newImages = formData.getAll("newImages") as File[];
    const newVideos = formData.getAll("newVideos") as File[];
    const videoDescription = formData.get("videoDescription") as string;
    const existingImages = JSON.parse(
      formData.get("existingImages") as string
    ) as string[];
    const existingVideos = JSON.parse(
      formData.get("existingVideos") as string
    ) as string[];

    if (!reportId)
      return NextResponse.json(
        { error: "Report ID is required" },
        { status: 400 }
      );

    await dbConnect();
    const report = await CrimeReport.findById(reportId);
    if (!report)
      return NextResponse.json({ error: "Report not found" }, { status: 404 });

    if (report.reportedBy.toString() !== loggedInUser.id)
      return NextResponse.json(
        { error: "Unauthorized to edit this report" },
        { status: 403 }
      );

    let imageUrls = existingImages;
    if (newImages.length !== 0 && newImages[0].size) {
      const uploadedImages = await uploadToCloudinary(newImages, 'image');
      imageUrls = [...imageUrls, ...uploadedImages];
    }

    let videoUrls = existingVideos;
    if (newVideos.length !== 0 && newVideos[0].size) {
      const uploadedVideos = await uploadToCloudinary(newVideos, 'video');
      videoUrls = [...videoUrls, ...uploadedVideos];
    }
    
    report.title = title || report.title;
    report.description = description || report.description;
    report.location_name = location_name || report.location_name;
    report.crimeTime = crimeTime ? new Date(crimeTime) : report.crimeTime;
    report.location =
      lat && lng
        ? { type: "Point", coordinates: [Number(lng), Number(lat)] }
        : report.location;
    report.images = imageUrls.length > 0 ? imageUrls : ["https://th.bing.com/th/id/OIP.64JjP4kqWijT4G5M6L3nVgHaE8?rs=1&pid=ImgDetMain"];
    report.videos = videoUrls;
    report.updatedAt = new Date();
    report.videoDescription = videoDescription || report.videoDescription;

    await report.save();
    return NextResponse.json({ message: "Report updated successfully" });
  } catch (error) {
    console.error("Error: ", error);
    return NextResponse.json(
      { error: "Something went wrong..." },
      { status: 500 }
    );
  }
}

async function uploadToCloudinary(files: File[], resourceType: 'image' | 'video'): Promise<string[]> {
  const uploadPromises = files.map(async (file) => {
    // Convert File to base64 string
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64String = `data:${file.type};base64,${buffer.toString('base64')}`;
    
    try {
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(base64String, {
        folder: 'mernproduct',
        resource_type: resourceType
      });
      
      console.log(`Uploaded to Cloudinary: ${result.secure_url}`);
      return result.secure_url;
    } catch (error) {
      console.error(`Failed to upload to Cloudinary:`, error);
      return null;
    }
  });

  // Wait for all uploads to finish and filter out any null values
  const urls:any = (await Promise.all(uploadPromises)).filter((url:any) => url !== null);
  return urls;
}

export async function DELETE(request: NextRequest) {
  try {
    const { reportId } = await request.json();
    if (!reportId)
      return NextResponse.json(
        { error: "Report ID is required" },
        { status: 400 }
      );

    const loggedInUser = await getAuth(request);
    if (!loggedInUser)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!loggedInUser.isVerified)
      return NextResponse.json(
        { error: "You need to be Verified" },
        { status: 403 }
      );

    await dbConnect();

    // Fetch the report first to check ownership
    const report = await CrimeReport.findById(reportId);
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Check if user is either the owner or an admin
    const isOwner = report.reportedBy.toString() === loggedInUser.id.toString();
    const isAdmin = loggedInUser.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Not authorized to delete this report" },
        { status: 403 }
      );
    }

    // Proceed with deletion
    await CrimeReport.findByIdAndDelete(reportId);
    await Comment.deleteMany({ reportId });
    await Vote.deleteMany({ reportId });

    return NextResponse.json({ message: "Report deleted successfully" });
  } catch (error) {
    console.error("Error: ", error);
    return NextResponse.json(
      { error: "Something went wrong..." },
      { status: 500 }
    );
  }
}