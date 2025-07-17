// page.tsx
"use client";

import type React from "react";
import { useState, useRef } from "react";
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
} from "@/components/ui/card";
import { Loader2, X } from "lucide-react";
import { MapProvider } from "@/components/MapProvider";
import AutoCompleteInput from "@/components/AutoCompleteInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Address } from "@/types";
import toast from "react-hot-toast";
import { Sidebar } from "@/components/Sidebar";
import { generateImageCaption } from "@/libs/hf-handlers";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";

type CompressionLevel = "low" | "medium" | "high";

export default function ReportCrime() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [address, setAddress] = useState<Address | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [videoDescription, setVideoDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [compressionLevel, setCompressionLevel] =
    useState<CompressionLevel>("medium");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const formData = new FormData(e.target as HTMLFormElement);
      formData.set("description", description);
      formData.append("location_name", address?.name || "");
      formData.append("lat", address?.location.lat.toString() || "");
      formData.append("lng", address?.location.lng.toString() || "");
      formData.append("videoDescription", videoDescription);
      formData.append("isAnonymous", isAnonymous.toString());
      formData.append("compressionLevel", compressionLevel);

      const res = await fetch("/api/user/report", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.error) toast.error(data.error);
      else {
        toast.success("Report submitted successfully!");
        router.push("/");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setIsLoading(false);
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* <Sidebar /> */}
      <main className="flex-1">
        <div className="container mx-auto py-6 px-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report a Crime</CardTitle>
              <CardDescription>
                Provide details about the incident you witnessed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        name="title"
                        id="title"
                        placeholder="Enter crime title"
                        required
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
                      />
                    </MapProvider>
                    <div>
                      <Label htmlFor="crimeTime">Crime Time</Label>
                      <Input
                        id="crimeTime"
                        name="crimeTime"
                        type="datetime-local"
                        required
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isAnonymous"
                        checked={isAnonymous}
                        onCheckedChange={(checked: any) =>
                          setIsAnonymous(checked as boolean)
                        }
                      />
                      <Label htmlFor="isAnonymous">Submit anonymously</Label>
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
                        <Label htmlFor="compression">
                          Image Compression Level
                        </Label>
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
                            <SelectItem value="low">
                              Low (Best Quality)
                            </SelectItem>
                            <SelectItem value="medium">
                              Medium (Balanced)
                            </SelectItem>
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
                        <Label htmlFor="videoDescription">
                          Video Description
                        </Label>
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
                <div className="pt-6">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Submitting..." : "Submit Report"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
