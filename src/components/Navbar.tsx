"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { usePathname, useRouter } from "next/navigation"
import { AlertCircle, FileText, Home, Map, User, LogOut, Menu, X, Bell } from "lucide-react"
import { useUserLoaded, useUser } from "@/hooks/user"
import PushSubscription from "./PushSubscription"
import { useState, useEffect } from "react"
import { cn } from "@/libs/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const Navbar = () => {
    const pathname = usePathname()
    const router = useRouter()
    const [user, setUser] = useUser();
    const [userLoaded, _] = useUserLoaded();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navItems = [
        { href: "/", label: "Home", icon: Home },
        { href: "/report", label: "Report Crime", icon: AlertCircle },
        { href: "/map", label: "Crime Map", icon: Map },
        { href: "/profile", label: "Profile", icon: User, role: "user" },
        { href: "/admin", label: "Admin", icon: FileText, role: "admin" },
    ]

    function logout() {
        fetch("/api/auth/logout")
            .then((res) => res.json())
            .then((data) => {
                if (!data.error) setUser(null);
            })
            .catch((error) => console.error(error));

        router.push("/");
        setMobileMenuOpen(false);
    }

    return (
        <div className={cn(
            "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur transition-all duration-200",
            scrolled ? "shadow-md" : "",
            "supports-[backdrop-filter]:bg-background/60"
        )}>
            <nav className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo/Brand */}
                    <div className="flex items-center">
                        <Link href="/" className="font-bold text-xl flex items-center mr-4">
                            <div className="bg-gradient-to-r from-blue-500 to-emerald-500 p-1.5 rounded-md mr-2">
                                <AlertCircle className="h-5 w-5 text-white" />
                            </div>
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-emerald-600">
                                Nigrani
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex md:items-center md:space-x-1">
                        {navItems.map((item) => (
                            (!item.role || (user?.role === 'admin' || user?.role === item.role)) && (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                        pathname === item.href
                                            ? "bg-gradient-to-r from-blue-500 to-emerald-500 text-white"
                                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                    )}
                                >
                                    <item.icon className="h-4 w-4 mr-2" />
                                    {item.label}
                                </Link>
                            )
                        ))}
                    </div>

                    {/* User actions, notifications & dark mode toggle */}
                    <div className="flex items-center space-x-4">
                        <div className="hidden md:flex items-center space-x-3">
                            <Button variant="ghost" size="icon" className="relative">
                                <Bell className="h-5 w-5" />
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">3</span>
                            </Button>
                            {/* <PushSubscription /> */}
                            <ModeToggle />
                            {!userLoaded ? (
                                <span className="text-xs">Loading...</span>
                            ) : user ? (
                                <div className="flex items-center space-x-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={""} />
                                        <AvatarFallback className="bg-gradient-to-br from-blue-400 to-emerald-400 text-white">
                                            {user.name?.substring(0, 2).toUpperCase() || "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <Button variant="outline" onClick={logout} size="sm" className="gap-2 bg-gradient-to-r from-blue-50 to-emerald-50 hover:from-blue-100 hover:to-emerald-100 dark:from-blue-950 dark:to-emerald-950 dark:hover:from-blue-900 dark:hover:to-emerald-900">
                                        <LogOut className="h-4 w-4" />
                                        <span>Logout</span>
                                    </Button>
                                </div>
                            ) : (
                                <Button variant="default" size="sm" asChild className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700">
                                    <Link href="/login">Login / Register</Link>
                                </Button>
                            )}
                        </div>

                        {/* Mobile menu button */}
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="md:hidden"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>

                {/* Mobile menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden py-4 border-t">
                        <div className="space-y-2">
                            {navItems.map((item) => (
                                (!item.role || (user?.role === 'admin' || user?.role === item.role)) && (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={cn(
                                            "flex items-center w-full px-4 py-2 text-sm rounded-md",
                                            pathname === item.href
                                                ? "bg-gradient-to-r from-blue-500 to-emerald-500 text-white"
                                                : "hover:bg-accent hover:text-accent-foreground"
                                        )}
                                    >
                                        <item.icon className="h-4 w-4 mr-3" />
                                        {item.label}
                                    </Link>
                                )
                            ))}
                            
                            <div className="pt-2 flex flex-col space-y-2 border-t mt-2">
                                <div className="flex items-center justify-between px-4 py-2">
                                    <span className="text-sm font-medium">Notifications</span>
                                    <div className="flex items-center space-x-2">
                                        <Button variant="ghost" size="icon" className="relative">
                                            <Bell className="h-5 w-5" />
                                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">3</span>
                                        </Button>
                                        <PushSubscription />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between px-4 py-2">
                                    <span className="text-sm font-medium">Theme</span>
                                    <ModeToggle />
                                </div>
                                {!userLoaded ? (
                                    <div className="px-4 py-2">
                                        <span className="text-xs">Loading...</span>
                                    </div>
                                ) : user ? (
                                    <Button 
                                        variant="outline" 
                                        onClick={logout} 
                                        className="mx-4 mt-2 justify-center gap-2 bg-gradient-to-r from-blue-50 to-emerald-50 hover:from-blue-100 hover:to-emerald-100 dark:from-blue-950 dark:to-emerald-950 dark:hover:from-blue-900 dark:hover:to-emerald-900"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        <span>Logout</span>
                                    </Button>
                                ) : (
                                    <Button 
                                        variant="default" 
                                        className="mx-4 mt-2 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700" 
                                        asChild
                                    >
                                        <Link href="/login">Login / Register</Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </nav>
        </div>
    )
}

export default Navbar