"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Trash2, X } from "lucide-react"
import { MapProvider } from "@/components/MapProvider"
import AutoCompleteInput from "@/components/AutoCompleteInput"
import type { Address } from "@/types"
import toast from "react-hot-toast"
import { Sidebar } from "@/components/Sidebar"
import { generateImageCaption } from "@/libs/hf-handlers"


export default function EditReport() {
    const router = useRouter()
    const { crimeReportId } = useParams()

    const [isLoading, setIsLoading] = useState(false)
    const [report, setReport] = useState<any>(null)
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [address, setAddress] = useState<Address | null>(null)
    const [crimeTime, setCrimeTime] = useState("")
    const [existingImages, setExistingImages] = useState<string[]>([])
    const [existingVideos, setExistingVideos] = useState<string[]>([])
    const [newImage, setNewImage] = useState<File | null>(null)
    const [newVideo, setNewVideo] = useState<File | null>(null)
    const [videoDescription, setVideoDescription] = useState("")
    const [isGeneratingDescription, setIsGeneratingDescription] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const response = await fetch(`/api/report/${crimeReportId}`)
                if (response.ok) {
                    const data = await response.json()
                    setReport(data.report)
                    setTitle(data.report.title)
                    setDescription(data.report.description)
                    setAddress({
                        name: data.report.location_name,
                        location: {
                            lat: data.report.location.coordinates[1],
                            lng: data.report.location.coordinates[0],
                        },
                    })
                    setCrimeTime(new Date(data.report.crimeTime).toISOString().slice(0, 16))
                    setExistingImages(data.report.images || [])
                    setExistingVideos(data.report.videos || [])
                    setVideoDescription(data.report.videoDescription || "")
                } else {
                    toast.error("Failed to fetch report")
                }
            } catch (error) {
                console.error("Error fetching report:", error)
                toast.error("An error occurred while fetching the report")
            }
        }

        fetchReport()
    }, [crimeReportId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setIsLoading(true)
            const formData = new FormData()
            formData.append("reportId", crimeReportId as string)
            formData.append("title", title)
            formData.append("description", description)
            formData.append("location_name", address?.name || "")
            formData.append("lat", address?.location.lat.toString() || "")
            formData.append("lng", address?.location.lng.toString() || "")
            formData.append("crimeTime", crimeTime)
            formData.append("videoDescription", videoDescription)
            formData.append("existingImages", JSON.stringify(existingImages))
            formData.append("existingVideos", JSON.stringify(existingVideos))

            if (newImage) formData.append("newImage", newImage)
            if (newVideo) formData.append("newVideo", newVideo)

            const res = await fetch(`/api/user/report`, {
                method: "PUT",
                body: formData,
            })
            const data = await res.json()
            if (data.error) toast.error(data.error)
            else {
                toast.success("Report updated successfully!")
                router.push(`/${crimeReportId}`)
            }
        } catch (error) {
            console.error(error)
            toast.error("Failed to update report. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const generateDescription = async () => {
        if (!newImage) return

        setIsGeneratingDescription(true)
        const response = await generateImageCaption(newImage)

        if (response && response.generated_text) {
            setDescription(response.generated_text as string)
        } else {
            toast.error("Failed to generate description. Please try again.")
        }

        setIsGeneratingDescription(false)
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setNewImage(file)
        }
    }

    const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setNewVideo(file)
        }
    }

    const removeExistingImage = (index: number) => {
        setExistingImages(existingImages.filter((_, i) => i !== index))
    }

    const removeExistingVideo = (index: number) => {
        setExistingVideos(existingVideos.filter((_, i) => i !== index))
    }

    const removeNewImage = () => {
        setNewImage(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const removeNewVideo = () => {
        setNewVideo(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    if (!report) {
        return <div>Loading...</div>
    }

    return (
        <div className="flex min-h-screen">
            {/* <Sidebar /> */}
            <main className="flex-1">
                <div className="container mx-auto py-6 px-4 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Edit Crime Report</CardTitle>
                            <CardDescription>Update the details of the reported crime</CardDescription>
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
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
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
                                            <AutoCompleteInput setAddress={setAddress} address={address} />
                                        </MapProvider>
                                        <div>
                                            <Label htmlFor="crimeTime">Crime Time</Label>
                                            <Input
                                                id="crimeTime"
                                                name="crimeTime"
                                                type="datetime-local"
                                                value={crimeTime}
                                                onChange={(e) => setCrimeTime(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <Label>Existing Images</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {existingImages.map((image, index) => (
                                                    <div key={index} className="relative">
                                                        <img
                                                            src={image || "/placeholder.svg"}
                                                            alt={`Evidence ${index + 1}`}
                                                            className="w-full h-32 object-cover rounded"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="icon"
                                                            className="absolute top-1 right-1"
                                                            onClick={() => removeExistingImage(index)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <Label htmlFor="newImage">Upload New Image (Optional)</Label>
                                            <Input
                                                className="bg-white bg-opacity-20"
                                                id="newImage"
                                                name="newImage"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                ref={fileInputRef}
                                            />
                                        </div>
                                        {newImage && (
                                            <div className="relative">
                                                <img
                                                    src={URL.createObjectURL(newImage) || "/placeholder.svg"}
                                                    alt="New image preview"
                                                    className="mt-2 h-32 w-full object-cover rounded"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute top-1 right-1"
                                                    onClick={removeNewImage}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                        {newImage && (
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
                                            <Label>Existing Videos</Label>
                                            <div className="space-y-2">
                                                {existingVideos.map((video, index) => (
                                                    <div key={index} className="flex items-center justify-between">
                                                        <span className="truncate">{video}</span>
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => removeExistingVideo(index)}
                                                        >
                                                            Remove
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <Label htmlFor="newVideo">Upload New Video (Optional)</Label>
                                            <Input
                                                id="newVideo"
                                                className="bg-white bg-opacity-20"
                                                type="file"
                                                accept="video/*"
                                                name="newVideo"
                                                onChange={handleVideoChange}
                                            />
                                        </div>
                                        {newVideo && (
                                            <div className="flex items-center justify-between">
                                                <span className="truncate">{newVideo.name}</span>
                                                <Button type="button" variant="destructive" size="sm" onClick={removeNewVideo}>
                                                    Remove
                                                </Button>
                                            </div>
                                        )}
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
                                    </div>
                                </div>
                                <div className="pt-6">
                                    <Button type="submit" className="w-full" disabled={isLoading}>
                                        {isLoading ? "Updating..." : "Update Report"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}

