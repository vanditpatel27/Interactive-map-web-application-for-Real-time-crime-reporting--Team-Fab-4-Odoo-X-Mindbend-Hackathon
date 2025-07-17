"use client"

import { useState } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

interface Notification {
    id: number
    message: string
    timestamp: string
    read: boolean
}

const dummyNotifications: Notification[] = [
    { id: 1, message: "New comment on your report", timestamp: "2 hours ago", read: false },
    { id: 2, message: "Your report has been verified", timestamp: "1 day ago", read: false },
    { id: 3, message: "New crime reported in your area", timestamp: "3 days ago", read: true },
]

export function NotificationDropdown() {
    const [notifications, setNotifications] = useState(dummyNotifications)

    const unreadCount = notifications.filter((n) => !n.read).length

    const markAsRead = (id: number) => {
        setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)))
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge variant="destructive" className="absolute -top-1 -right-1 px-1 min-w-[1.25rem] h-5">
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                {notifications.map((notification) => (
                    <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-4">
                        <div className="flex justify-between w-full">
                            <span className={`font-medium ${notification.read ? "text-muted-foreground" : ""}`}>
                                {notification.message}
                            </span>
                            {!notification.read && (
                                <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
                                    Mark as read
                                </Button>
                            )}
                        </div>
                        <span className="text-sm text-muted-foreground">{notification.timestamp}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

