"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Sidebar } from "@/components/Sidebar"
import { useUserLoaded, useUser } from "@/hooks/user";
import { createAvatar } from "@dicebear/core"
import { shapes } from "@dicebear/collection"
import { toPng } from "@dicebear/converter"
import { format } from "date-fns"
import Link from "next/link"

const dummyUser = {
    reportsCount: 15,
    upvotes: 87,
    downvotes: 3,
    verificationScore: 0.92,
    achievements: [
        { name: "First Report", description: "Submitted your first crime report" },
        { name: "Vigilant Citizen", description: "Submitted 10 verified reports" },
        { name: "Community Guardian", description: "Reached a 90% verification score" },
    ],
}

const dummyActivityData = [
    { name: "Jan", reports: 4 },
    { name: "Feb", reports: 3 },
    { name: "Mar", reports: 2 },
    { name: "Apr", reports: 5 },
    { name: "May", reports: 1 },
]

interface UserReport {
    _id: string
    title: string
    description: string
    location_name: string
    images: string[]
    videos: string[]
    status: string
    createdAt: string
}

export default function Profile() {
    const [activeTab, setActiveTab] = useState("overview")
    const [user, setUser] = useUser()
    const [userLoaded, _] = useUserLoaded()
    const [avatarUrl, setAvatarUrl] = useState<string>("/placeholder.svg")
    const [userReports, setUserReports] = useState<UserReport[]>([])
    const router = useRouter()
    const [upvoteCount, setUpvoteCount] = useState(0);
    const [downvoteCount, setDownvoteCount] = useState(0);
    const [verificationScore, setVerificationScore] = useState(0);

    useEffect(() => {
        fetch("/api/user/report/verify")
        .then((res) => res.json())
        .then((data) => {
            console.log(data);
            setVerificationScore(data.metrics.averageVerificationScore);
        });
    }, [])

    useEffect(() => {
        fetch("/api/user/report/vote")
        .then((res) => res.json())
        .then((data) => {
            console.log(data);
            setUpvoteCount(data.upvoteCount);
            setDownvoteCount(data.downvoteCount);
        });
    },[])

    useEffect(() => {
        async function generateAvatar() {
            if (!user) return

            if (user.avatar) {
                setAvatarUrl(user.avatar)
                return
            }

            const avatar = createAvatar(shapes, {
                seed: user.name,
            })
            const svg = avatar.toString()
            const png = await toPng(svg)
            const avatarUri = await png.toDataUri()
            setAvatarUrl(avatarUri)
        }

        generateAvatar()
    }, [user])

    useEffect(() => {
        async function fetchUserReports() {
            try {
                const response = await fetch("/api/user/report")
                if (response.ok) {
                    const data = await response.json()
                    setUserReports(data.reports)
                } else {
                    console.error("Failed to fetch user reports")
                }
            } catch (error) {
                console.error("Error fetching user reports:", error)
            }
        }

        if (userLoaded && user) {
            fetchUserReports()
        }
    }, [userLoaded, user])

    if (!userLoaded) return <div className="text-center">Loading...</div>
    if (!user) return <div className="text-center">Not logged in</div>

    const handleVerify = async () => {
        router.push("/verify")
    }

    const handleEditProfile = async () => {
        router.push("/profile/edit")
    }

    return (
        <div className="flex min-h-screen bg-background">
            {/* <Sidebar /> */}
            <main className="flex-1">
                <div className="container mx-auto py-6 px-4 space-y-6">
                    <Card className="w-full">
                        <CardHeader className="flex flex-col sm:flex-row items-start gap-4">
                            <Avatar className="w-24 h-24">
                                <AvatarImage src={avatarUrl} alt={user.name} />
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-grow space-y-2">
                                <CardTitle className="text-2xl font-bold">{user.name}</CardTitle>
                                <CardDescription className="text-base">{user.email}</CardDescription>
                                <Badge
                                    variant={user.isVerified ? "secondary" : "destructive"}
                                    className={`${user.isVerified ? "bg-green-500 text-white hover:bg-green-600" : ""}`}
                                >
                                    {user.isVerified ? "Verified" : "Unverified"}
                                </Badge>
                                <p className="text-sm mt-2">{user.bio}</p>
                            </div>
                            <div className="flex gap-2 items-center justify-end mt-4 sm:mt-0">
                                <Button onClick={handleEditProfile} variant="outline">
                                    Edit Profile
                                </Button>
                                {!user.isVerified && (
                                    <Button onClick={handleVerify} variant="default">
                                        Verify
                                    </Button>
                                )}
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            <div className="border-t pt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <p className="text-sm">
                                        <strong>Phone:</strong> {user.phoneNumber || "Not provided"}
                                    </p>
                                    <p className="text-sm">
                                        <strong>Address:</strong> {user.address || "Not provided"}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                <div className="bg-primary/10 p-4 rounded-lg">
                                    <p className="text-2xl font-bold">{userReports.length}</p>
                                    <p className="text-muted-foreground">Reports</p>
                                </div>
                                <div className="bg-primary/10 p-4 rounded-lg">
                                    <p className="text-2xl font-bold">{upvoteCount}</p>
                                    <p className="text-muted-foreground">Upvotes</p>
                                </div>
                                <div className="bg-primary/10 p-4 rounded-lg">
                                    <p className="text-2xl font-bold">{downvoteCount}</p>
                                    <p className="text-muted-foreground">Downvotes</p>
                                </div>
                                <div className="bg-primary/10 p-4 rounded-lg">
                                    <p className="text-2xl font-bold">{verificationScore}%</p>
                                    <p className="text-muted-foreground">Verification Score</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="reports">My Reports</TabsTrigger>
                            <TabsTrigger value="achievements">Achievements</TabsTrigger>
                        </TabsList>
                        <TabsContent value="overview">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Activity Overview</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={dummyActivityData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="reports" fill="#8884d8" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="reports">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Reports History</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-4">
                                        {userReports.map((report) => (
                                            <li
                                                key={report._id}
                                                className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4"
                                            >
                                                <div className="flex-grow">
                                                    <Link
                                                        href={`/${report._id}`}
                                                        className="font-semibold hover:text-primary transition-colors"
                                                    >
                                                        {report.title}
                                                    </Link>
                                                    <p className="text-sm text-muted-foreground mt-1">{report.location_name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {format(new Date(report.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                                                    </p>
                                                </div>
                                                <div className="mt-2 sm:mt-0">
                                                    <Badge className="ml-2" variant={report.status === "verified" ? "default" : "secondary"}>
                                                        {report.status}
                                                    </Badge>
                                                    {report.images.length > 0 && (
                                                        <Badge className="ml-2" variant="outline">
                                                            {report.images.length} image{report.images.length > 1 ? "s" : ""}
                                                        </Badge>
                                                    )}
                                                    {report.videos.length > 0 && (
                                                        <Badge className="ml-2" variant="outline">
                                                            {report.videos.length} video{report.videos.length > 1 ? "s" : ""}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="achievements">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Achievements</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-4">
                                        {dummyUser.achievements.map((achievement, index) => (
                                            <li key={index} className="flex items-center gap-4 bg-primary/5 p-4 rounded-lg">
                                                <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold">
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <p className="font-semibold">{achievement.name}</p>
                                                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
    )
}



interface ReportMetrics {
    isUserVerified: boolean;
    upvotes: number;
    downvotes: number;
  }
  
  function calculateVerificationScore(metrics: ReportMetrics): number {
    // Base weights for different components
    const weights = {
      userVerification: 0.4, // 40% weight for user verification
      voteDifference: 0.6    // 60% weight for community votes
    };
  
    // Calculate user verification component (40 points if verified)
    const verificationScore = metrics.isUserVerified ? 100 : 0;
  
    // Calculate vote difference component
    const totalVotes = metrics.upvotes + metrics.downvotes;
    let voteScore = 0;
  
    if (totalVotes > 0) {
      // Calculate vote ratio and convert to percentage
      const voteDifference = metrics.upvotes - metrics.downvotes;
      const maxPossibleDifference = totalVotes;
      voteScore = ((voteDifference + maxPossibleDifference) / (2 * maxPossibleDifference)) * 100;
    }
  
    // Calculate final weighted score
    const finalScore = (
      verificationScore * weights.userVerification +
      voteScore * weights.voteDifference
    );
  
    // Round to 2 decimal places and ensure score is between 0-100
    return Math.min(100, Math.max(0, Number(finalScore.toFixed(2))));
  }
  