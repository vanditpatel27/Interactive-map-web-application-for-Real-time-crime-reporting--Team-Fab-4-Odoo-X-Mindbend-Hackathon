"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sidebar } from "@/components/Sidebar"

interface UserProfileData {
    _id: string
    name: string
    email: string
    isVerified: boolean
}

interface UserInfoData {
    avatar: string
    bio: string
}

interface CrimeReportData {
    _id: string
    title: string
    description: string
    status: string
}

const UserProfile = () => {
    const { userId } = useParams() // Capture the userId from the URL parameters
    const [user, setUser] = useState<UserProfileData | null>(null) // State for storing user data
    const [userInfo, setUserInfo] = useState<UserInfoData | null>(null) // State for storing user additional info (avatar, bio)
    const [userReports, setUserReports] = useState<CrimeReportData[]>([]) // State for storing user reports
    const [loading, setLoading] = useState(true) // State for loading indicator

    // Dummy data for statistics
    const reportsCount = 12
    const upvotes = 5
    const downvotes = 3
    const verificationScore = 0.89 // This is 89%

    
    // Fetch the user data and their reports when the component mounts
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // Make an API call to fetch the user data using the userId
                const response = await fetch(`/api/users/${userId}`)
                if (response.ok) {
                    const data = await response.json()
                    setUser(data.user) // Set the fetched user data into state
                    setUserInfo(data.userInfo) // Set the fetched user info (avatar, bio) into state
                    setUserReports(data.userReports) // Set the fetched user reports into state
                } else {
                    console.error("User not found")
                }
            } catch (error) {
                console.error("Error fetching user data:", error)
            } finally {
                setLoading(false) // Stop loading after data is fetched
            }
        }

        fetchUserData()
    }, [userId]) // Re-fetch data whenever userId changes

    console.log(user, userInfo, userReports)

    if (loading) return <div className="text-center">Loading...</div> // Show loading text until data is fetched
    if (!user) return <div className="text-center">User not found</div> // Show error if user is not found

    return (
        <div className="flex min-h-screen bg-background">
            {/* <Sidebar /> */}
            <main className="flex-1">
                <div className="container mx-auto py-6 px-4 space-y-6">
                    {/* User Profile Card */}
                    <Card className="w-full">
                        <CardHeader className="flex flex-col sm:flex-row items-start gap-4">
                            {/* User Avatar */}
                            <Avatar className="w-24 h-24">
                                <AvatarImage src={userInfo?.avatar || "/placeholder.svg"} alt={user.name} />
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            {/* User Information */}
                            <div className="flex-grow space-y-2">
                                <CardTitle className="text-2xl font-bold">{user.name}</CardTitle>
                                <CardDescription className="text-base">{user.email}</CardDescription>
                                {/* Display if user is verified or not */}
                                <Badge
                                    variant={user.isVerified ? "secondary" : "destructive"}
                                    className={`${user.isVerified ? "bg-green-500 text-white hover:bg-green-600" : ""}`}
                                >
                                    {user.isVerified ? "Verified" : "Unverified"}
                                </Badge>
                                <p className="text-sm mt-2">{userInfo?.bio || "No bio available"}</p>
                            </div>
                        </CardHeader>
                        {/* User Stats */}
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                <div className="bg-primary/10 p-4 rounded-lg">
                                    <p className="text-2xl font-bold">{reportsCount}</p>
                                    <p className="text-muted-foreground">Reports</p>
                                </div>
                                <div className="bg-primary/10 p-4 rounded-lg">
                                    <p className="text-2xl font-bold">{upvotes}</p>
                                    <p className="text-muted-foreground">Upvotes</p>
                                </div>
                                <div className="bg-primary/10 p-4 rounded-lg">
                                    <p className="text-2xl font-bold">{downvotes}</p>
                                    <p className="text-muted-foreground">Downvotes</p>
                                </div>
                                <div className="bg-primary/10 p-4 rounded-lg">
                                    <p className="text-2xl font-bold">{(verificationScore * 100).toFixed(0)}%</p>
                                    <p className="text-muted-foreground">Verification Score</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Display User Reports Section */}
                    <Card className="w-full">
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold">User Reports</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* Dynamically render user reports */}
                                {userReports.length === 0 ? (
                                    <p className="text-center text-sm text-gray-500">No reports found</p>
                                ) : (
                                    userReports.map((report) => (
                                        <div key={report._id} className="bg-gray-100 p-4 rounded-lg shadow">
                                            <p className="text-lg font-semibold">{report.title}</p>
                                            <p className="text-sm text-gray-500">{report.description}</p>
                                            <div className="mt-2">
                                                <Badge variant="outline" className="text-gray-700">
                                                    Status: {report.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}

export default UserProfile
