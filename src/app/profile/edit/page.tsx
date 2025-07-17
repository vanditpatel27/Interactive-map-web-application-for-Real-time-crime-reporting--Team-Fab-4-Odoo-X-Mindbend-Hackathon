"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import toast from "react-hot-toast";

export default function EditProfile() {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [avatarPreview, setAvatarPreview] = useState<string>("");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [bio, setBio] = useState<string>("");
    const [address, setAddress] = useState<string>(""); // New state for address
    const router = useRouter();

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);

        try {
            const formData = new FormData();

            if (avatarFile) {
                formData.append("avatar", avatarFile);
            }

            if (bio.trim()) {
                formData.append("bio", bio);
            }

            if (address.trim()) {
                formData.append("address", address); // Append address
            }

            const response = await fetch("/api/user/me", {
                method: "PUT",
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to update profile");
            }

            toast.success("Profile updated successfully!");
            router.push("/profile");

        } catch (error) {
            console.error(error);
            toast.error("Failed to update profile. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (file) {
            if (!file.type.startsWith("image/")) {
                toast.error("Please select an image file");
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                toast.error("Image size should be less than 5MB");
                return;
            }

            setAvatarFile(file);

            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="flex min-h-screen">
            {/* <Sidebar /> */}
            <main className="flex-1">
                <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Edit Profile</CardTitle>
                            <CardDescription>
                                Update your profile information and avatar
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="flex flex-col items-center space-y-4 mb-6">
                                    <Avatar className="w-24 h-24 md:w-32 md:h-32">
                                        <AvatarImage src={avatarPreview} alt="Profile preview" />
                                        <AvatarFallback>Upload</AvatarFallback>
                                    </Avatar>
                                </div>

                                <div>
                                    <Label htmlFor="avatar">Profile Picture</Label>
                                    <Input
                                        id="avatar"
                                        name="avatar"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                        className="bg-white bg-opacity-20"
                                    />
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Recommended: Square image, max 5MB
                                    </p>
                                </div>

                                <div>
                                    <Label htmlFor="bio">Bio</Label>
                                    <Textarea
                                        id="bio"
                                        name="bio"
                                        placeholder="Tell us about yourself..."
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        className="min-h-[100px]"
                                    />
                                </div>

                                {/* Address Section */}
                                <div>
                                    <Label htmlFor="address">Address</Label>
                                    <Input
                                        id="address"
                                        name="address"
                                        type="text"
                                        placeholder="Enter your address"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        className="bg-white bg-opacity-20"
                                    />
                                </div>

                                <div className="pt-6">
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Saving Changes...
                                            </>
                                        ) : (
                                            "Save Changes"
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                        <CardFooter>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() => router.push("/profile")}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </main>
        </div>
    );
}
