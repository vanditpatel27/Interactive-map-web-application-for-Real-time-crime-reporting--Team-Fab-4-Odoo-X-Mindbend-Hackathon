"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Loader2, X, Shield, User } from "lucide-react";
import { MapProvider } from "@/components/MapProvider";
import AutoCompleteInput from "@/components/AutoCompleteInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Address } from "@/types";
import toast from "react-hot-toast";
import { generateImageCaption } from "@/libs/hf-handlers";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { ethers } from 'ethers';

type CompressionLevel = "low" | "medium" | "high";

type ReportCrimeProps = {
  onClose: () => void;
  location_name?: string | Address | null;
};

// Contract information for anonymous reporting
const contractAbi = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "reportId",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "reportData",
        "type": "string"
      }
    ],
    "name": "ReportReceived",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "reportId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "reportData",
        "type": "string"
      }
    ],
    "name": "receiveReport",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const contractAddress = "0x9a6C46F22C797a617AEbAaC455EeFf6689A538e2";
const HARDCODED_PRIVATE_KEY = "e32b6c1396014df244c3105909f3598b39395aa0fb699452f40389a2070f26a9";

export default function ReportCrime({ onClose, location_name }: ReportCrimeProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [address, setAddress] = useState<Address | null>(typeof location_name === 'object' ? location_name as Address : null);
  const [video, setVideo] = useState<File | null>(null);
  const [videoDescription, setVideoDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>("medium");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [crimeTime, setCrimeTime] = useState(new Date().toISOString().slice(0, 16));
  const [txHash, setTxHash] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [imageData, setImageData] = useState<string[]>([]);

  // Geocode location_name if it's a string
  useEffect(() => {
    if (location_name && typeof location_name === 'string' && !address) {
      geocodeAddress(location_name);
    }
  }, [location_name]);

  const geocodeAddress = (addressString: string) => {
    // Make sure google maps is available
    if (typeof google === 'undefined' || !google.maps) {
      console.error('Google Maps API not loaded');
      return;
    }

    const geocoder = new google.maps.Geocoder();
    
    geocoder.geocode({ address: addressString }, (results: any, status: any) => {
      if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
        const location = results[0].geometry.location;
        
        setAddress({
          name: addressString,
          location: {
            lat: location.lat(),
            lng: location.lng()
          }
        });
      } else {
        console.error('Geocoding failed: ', status);
        toast.error('Failed to get coordinates for the provided location');
      }
    });
  };

  const hashImage = async (base64String: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(base64String);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error("Failed to read file"));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  const handleSubmitRegular = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!address) {
      toast.error("Please provide a location for the crime report");
      return;
    }
  
    try {
      setIsLoading(true);
  
      const formData = new FormData(e.target as HTMLFormElement);
      formData.set("description", description);
      formData.append("location_name", address.name || "");
      formData.append("lat", address.location.lat.toString() || "");
      formData.append("lng", address.location.lng.toString() || "");
      formData.append("videoDescription", videoDescription);
      formData.append("isAnonymous", isAnonymous.toString());
      formData.append("compressionLevel", compressionLevel);
  
      const res = await fetch("/api/user/report", {
        method: "POST",
        body: formData,
      });
  
      const data = await res.json();
  
      if (data.error) {
        toast.error(data.error); // 🔥 Error from backend (e.g., similarity < 60%)
      } else {
        toast.success("Report submitted successfully!");
        onClose();
        router.push("/");
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  
  const handleSubmitAnonymous = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);
    setTxHash('');

    if (!address) {
      toast.error("Please provide a location for the crime report");
      setIsLoading(false);
      return;
    }

    try {
      console.log("Starting anonymous submission process...");
      
      const provider = new ethers.JsonRpcProvider("https://sepolia.infura.io/v3/eace6f939924423b99717199157688cb");
      
      const wallet = new ethers.Wallet(HARDCODED_PRIVATE_KEY, provider);
      console.log("Using wallet:", wallet.address);

      const network = await provider.getNetwork();
      console.log("Network:", network.name);

      console.log("Calculating gas requirements...");
      
      let gasPrice;
      try {
        const feeData = await provider.getFeeData();
        if (feeData.gasPrice) {
          gasPrice = feeData.gasPrice;
        } else {
          const averageGasPrice = await provider.send("eth_gasPrice", []);
          gasPrice = BigInt(averageGasPrice);
        }
      } catch (feeError) {
        console.warn("Error getting fee data:", feeError);
        gasPrice = ethers.parseUnits("5", "gwei");
      }
      
      console.log("Current gas price:", ethers.formatUnits(gasPrice, "gwei"), "gwei");
      
      const contract = new ethers.Contract(
        contractAddress,
        contractAbi,
        wallet
      );

      const reportId = `crime-report-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      
      const reportSubmitData = {
        title,
        description,
        location_name: address.name,
        coordinates: [address.location.lng, address.location.lat],
        crimeTime,
        imageData,
        videoDescription: video ? videoDescription : undefined,
        isAnonymous: true,
      };
      
      const gasEstimate = await contract.receiveReport.estimateGas(
        reportId, 
        JSON.stringify(reportSubmitData)
      );
      
      console.log("Estimated gas:", gasEstimate.toString());
      
      const gasLimit = gasEstimate * BigInt(120) / BigInt(100);
      
      console.log("Submitting report via contract...");
      const tx = await contract.receiveReport(reportId, JSON.stringify(reportSubmitData), {
        gasLimit: gasLimit,
        gasPrice: gasPrice
      });
      
      console.log("Report transaction sent:", tx.hash);
      setTxHash(tx.hash);
      
      console.log("Waiting for report transaction confirmation...");
      const receipt = await tx.wait();
      console.log("Report transaction confirmed:", receipt);

      setSuccess(true);
      toast.success("Anonymous report submitted successfully!");
      setTimeout(() => {
        onClose();
        router.push("/");
      }, 3000);
    } catch (error: any) {
      console.error('Error submitting anonymous report:', error);
      setError(error.message || 'Failed to submit anonymous report. Please try again.');
      toast.error("Failed to submit anonymous report. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAnonymous) {
      handleSubmitAnonymous(e);
    } else {
      handleSubmitRegular(e);
    }
  };

  const templates = [
    "A crime is taking place: {text}. Immediate attention is required.",
    "Ongoing incident captured: {text}. Authorities should be alerted.",
    "Real-time crime report: {text}. This situation demands urgent action.",
    "This image documents {text}, highlighting the severity of the crime.",
    "Crime in progress: {text}. Witnesses should report any additional details.",
    "Emergency alert: {text} is happening right now. Law enforcement must intervene.",
    "Breaking news: {text}. Officials need to respond swiftly to this situation.",
    "Incident unfolding: {text}. Security footage may provide further insights.",
    "Public safety alert: {text}. People in the vicinity should stay cautious.",
    "Disturbance reported: {text}. Authorities must be informed immediately.",
  ];

  const generateDescription = async () => {
    if (!image) return;

    setIsGeneratingDescription(true);
    const response = await generateImageCaption(image);

    if (response && response.generated_text) {
      const randomTemplate =
        templates[Math.floor(Math.random() * templates.length)];
      const templatedDescription = randomTemplate.replace(
        "{text}",
        response.generated_text
      );
      setDescription(templatedDescription);
    } else {
      toast.error("Failed to generate description. Please try again.");
    }

    setIsGeneratingDescription(false);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Save base64 for anonymous submission
      try {
        const base64String = await readFileAsDataURL(file);
        setImageData([base64String]);
        
        // Also hash if needed for anonymous mode
        if (isAnonymous) {
          const imageHash = await hashImage(base64String);
          console.log("Image hashed for anonymous reporting");
        }
      } catch (err) {
        console.error("Error processing image:", err);
      }
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideo(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    setImageData([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const toggleAnonymousMode = () => {
    setIsAnonymous(!isAnonymous);
 
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <Card className="w-full max-w-4xl relative">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 z-10"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Report a Crime</CardTitle>
              <CardDescription>
                {isAnonymous 
                  ? "Submit an anonymous report using blockchain technology" 
                  : "Provide details about the incident you witnessed"}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <User className={`h-5 w-5 ${!isAnonymous ? 'text-primary' : 'text-gray-400'}`} />
              <Switch 
                checked={isAnonymous} 
                onCheckedChange={toggleAnonymousMode} 
                id="anonymous-mode"
              />
              <Shield className={`h-5 w-5 ${isAnonymous ? 'text-primary' : 'text-gray-400'}`} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {success && isAnonymous && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded">
              <p className="font-bold">Report submitted successfully!</p>
              <p>Your identity remains protected. Your report will be reviewed by authorities.</p>
              {txHash && (
                <p className="mt-2 text-sm">
                  Transaction hash: <span className="font-mono break-all">{txHash}</span>
                </p>
              )}
            </div>
          )}
          
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6" id="report-form">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    name="title"
                    id="title"
                    placeholder="Enter crime title"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe the crime..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    className="h-32"
                  />
                </div>
                <MapProvider>
                  <AutoCompleteInput
                    setAddress={setAddress}
                    address={address}
                    value={address?.name || ""}
                  />
                </MapProvider>
                <div>
                  <Label htmlFor="crimeTime">Crime Time</Label>
                  <Input
                    id="crimeTime"
                    name="crimeTime"
                    type="datetime-local"
                    required
                    value={crimeTime}
                    onChange={(e) => setCrimeTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="image">Upload Image</Label>
                  <Input
                    className="bg-white bg-opacity-20"
                    id="image"
                    name="images"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    ref={fileInputRef}
                    required
                  />
                </div>
                {image && (
                  <div>
                    <Label htmlFor="compression">Image Compression Level</Label>
                    <Select
                      value={compressionLevel}
                      onValueChange={(value: CompressionLevel) =>
                        setCompressionLevel(value)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select compression level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low (Best Quality)</SelectItem>
                        <SelectItem value="medium">Medium (Balanced)</SelectItem>
                        <SelectItem value="high">
                          High (Smallest Size)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {imagePreview && (
                  <div className="relative">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Preview"
                      className="mt-2 h-64 w-64 rounded-lg object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={removeImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {image && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={generateDescription}
                    disabled={isGeneratingDescription}
                  >
                    {isGeneratingDescription ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Description...
                      </>
                    ) : (
                      "Generate Description"
                    )}
                  </Button>
                )}
                <div>
                  <Label htmlFor="video">Upload Video (Optional)</Label>
                  <Input
                    id="video"
                    className="bg-white bg-opacity-20"
                    type="file"
                    accept="video/*"
                    name="videos"
                    onChange={handleVideoChange}
                  />
                </div>
                {video && (
                  <div>
                    <Label htmlFor="videoDescription">Video Description</Label>
                    <Textarea
                      id="videoDescription"
                      name="videoDescription"
                      placeholder="Describe the video content..."
                      value={videoDescription}
                      onChange={(e) => setVideoDescription(e.target.value)}
                      className="h-24"
                    />
                  </div>
                )}
              </div>
            </div>
          </form>
          
          {isAnonymous && (
            <div className="mt-6 pt-4 border-t text-sm text-gray-600">
              <p className="font-bold mb-2">Privacy & Security:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Your report is submitted anonymously through a blockchain-based system.</li>
                <li>Your identity is protected throughout the process.</li>
                <li>Your IP address is not tracked or stored.</li>
                <li>Only the information you provide in this form is recorded.</li>
                <li>This platform is designed for legitimate crime reporting only.</li>
              </ul>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="report-form"
            disabled={isLoading}
            className={isAnonymous ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : isAnonymous ? (
              "Submit Anonymous Report"
            ) : (
              "Submit Report"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}