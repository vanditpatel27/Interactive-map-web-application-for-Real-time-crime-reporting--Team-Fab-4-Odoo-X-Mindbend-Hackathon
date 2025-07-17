import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { leaderboardData } from "@/libs/dummy-data"
import { Sidebar } from "@/components/Sidebar"

export default function Leaderboard() {
    return (
        <div className="flex min-h-screen">
            {/* <Sidebar /> */}
            <main className="flex-1">
                <div className="container mx-auto py-6 px-4 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Top Contributors</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {leaderboardData.map((use:any, index:any) => (
                                    <div key={user.id} className="flex items-center space-x-4">
                                        <div className="flex-shrink-0 w-8">
                                            <span
                                                className={`text-lg font-semibold ${index === 0 ? "text-yellow-500" : index === 1 ? "text-gray-400" : index === 2 ? "text-amber-600" : ""}`}
                                            >
                                                {index + 1}
                                            </span>
                                        </div>
                                        <Avatar>
                                            <AvatarImage src={user.avatar} alt={user.name} />
                                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-grow">
                                            <p className="font-semibold">{user.name}</p>
                                            <p className="text-sm text-muted-foreground">{user.reports} reports</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">{user.score}</p>
                                            <p className="text-sm text-muted-foreground">points</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}

