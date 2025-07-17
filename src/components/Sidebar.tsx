"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/libs/utils"
import { useUserLoaded, useUser } from "@/hooks/user"
import { 
  ChevronLeft, 
  Home, 
  Map, 
  BarChart2, 
  AlertCircle, 
  Settings, 
  PlusCircle, 
  Menu, 
  Phone,
  Shield,
  BookOpen,
  UserCircle,
  X,
  Newspaper,
  BellRing
} from "lucide-react"

// Define TypeScript interfaces
interface NavLinkProps {
  link: {
    title: string;
    icon: React.ComponentType<any>;
    href: string;
    role?: string;
  };
  pathname: string;
  isCollapsed: boolean;
  isMobile: boolean;
}

interface SidebarLink {
  title: string;
  icon: React.ComponentType<any>;
  href: string;
  role?: string;
}

export function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState<boolean>(false)
    const [isMobile, setIsMobile] = useState<boolean>(false)
    const [mobileOpen, setMobileOpen] = useState<boolean>(false)
    const pathname = usePathname()
    const router = useRouter()
    const [userLoaded, _] = useUserLoaded()
    const [user, setUser] = useUser()
    
    // Handle responsive behavior
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 1024)
            if (window.innerWidth >= 1024) {
                setMobileOpen(false)
            }
        }
        
        checkScreenSize()
        window.addEventListener('resize', checkScreenSize)
        return () => window.removeEventListener('resize', checkScreenSize)
    }, [])

    // Close mobile sidebar when navigating
    useEffect(() => {
        setMobileOpen(false)
    }, [pathname])

    const handleNewReport = () => {
        router.push("/report")
    }

    // Base sidebar links that are always available (regardless of login status)
    const baseLinks: SidebarLink[] = [
        {
            title: "Home",
            icon: Home,
            href: "/",
        },
        {
            title: "Report Crime",
            icon: AlertCircle,
            href: "/report",
        },
    ];
    
    // Protected links that require login with role-based access
    const getProtectedLinks = (): SidebarLink[] => {
        // Not logged in - return empty array
        if (!user) return [];
        
        const links: SidebarLink[] = [];
        
        // SOS Alarm - show for regular users and police but not admin
        if (user.role === "user" || user.role === "admin") {
            links.push({
                title: "SOS Alarm",
                icon: AlertCircle,
                href: "#",
            });
        }
        
        // Police Dashboard - only for police and admin users
        if (user.role === "police") {
            links.push({
                title: "Police Dashboard",
                icon: AlertCircle,
                href: "#",
            });
        }
        
        return links;
    };
    
    // Common resource links
    const resourceLinks: SidebarLink[] = [
        {
            title: "Crime Map",
            icon: Map,
            href: "/map",
        },
        {
            title: "Emergency Contacts",
            icon: Phone,
            href: "/emergency-contacts",
        },
        // {
        //     title: "Leaderboard",
        //     icon: BarChart2,
        //     href: "/leaderboard",
        // },
    ];
    
    // Account-related links
    const accountLinks: SidebarLink[] = [
        {
            title: "Safety Tips",
            icon: Shield,
            href: "/safetytips",
        },
        {
            title: "News",
            icon: Newspaper,
            href: "/news",
        },
        {
            title: "My Profile",
            icon: UserCircle,
            href: "/profile",
        },
    ];

    // Group sidebar links into categories
    const categories = {
        main: [...baseLinks, ...getProtectedLinks()],
        resources: resourceLinks,
        account: accountLinks
    }

    // Mobile sidebar toggle button (fixed position)
    const MobileToggle = () => (
        <Button
            variant="outline"
            size="icon"
            className={cn(
                "fixed left-4 bottom-4 z-50 rounded-full shadow-lg",
                "bg-gradient-to-r from-blue-600 to-emerald-600 text-white border-none",
                mobileOpen && "hidden"
            )}
            onClick={() => setMobileOpen(true)}
        >
            <Menu className="h-5 w-5" />
        </Button>
    )

    return (
        <>
            {isMobile && <MobileToggle />}
            
            <div
                className={cn(
                    "flex flex-col border-r bg-card/95 backdrop-blur transition-all duration-300 h-screen",
                    "shadow-lg lg:shadow-none",
                    isCollapsed ? "lg:w-[70px]" : "lg:w-[240px]",
                    isMobile ? "fixed inset-y-0 left-0 z-50" : "relative",
                    isMobile && !mobileOpen ? "-translate-x-full" : "translate-x-0"
                )}
            >
                {/* Header with logo and collapse button */}
                <div className="flex h-16 items-center justify-between border-b px-3 bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-600">
                    {!isCollapsed && !isMobile && (
                        <span className="font-semibold text-white flex items-center">
                            <EyeIcon className="h-5 w-5 mr-2" />
                            Nigrani
                        </span>
                    )}
                    
                    {isMobile ? (
                        <Button variant="ghost" size="icon" className="ml-auto text-white" onClick={() => setMobileOpen(false)}>
                            <X className="h-5 w-5" />
                        </Button>
                    ) : (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className={cn("text-white hover:bg-white/20", isCollapsed ? "mx-auto" : "ml-auto")}
                            onClick={() => setIsCollapsed(!isCollapsed)}
                        >
                            {isCollapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                        </Button>
                    )}
                </div>
                
                {/* Navigation links */}
                <ScrollArea className="flex-1 px-2 py-4">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            {!isCollapsed && !isMobile && (
                                <h3 className="text-xs font-medium text-muted-foreground ml-3 mb-1">MAIN</h3>
                            )}
                            {categories.main.map((link) => (
                                <NavLink 
                                    key={link.href} 
                                    link={link} 
                                    pathname={pathname} 
                                    isCollapsed={isCollapsed} 
                                    isMobile={isMobile} 
                                />
                            ))}
                        </div>
                        
                        {/* Resources Navigation */}
                        <div className="space-y-2">
                            {!isCollapsed && !isMobile && (
                                <h3 className="text-xs font-medium text-muted-foreground ml-3 mb-1">RESOURCES</h3>
                            )}
                            {categories.resources.map((link) => (
                                <NavLink 
                                    key={link.href} 
                                    link={link} 
                                    pathname={pathname} 
                                    isCollapsed={isCollapsed} 
                                    isMobile={isMobile} 
                                />
                            ))}
                        </div>
                        
                        {/* Account Navigation */}
                        <div className="space-y-2">
                            {!isCollapsed && !isMobile && (
                                <h3 className="text-xs font-medium text-muted-foreground ml-3 mb-1">ACCOUNT</h3>
                            )}
                            {categories.account.map((link) => (
                                <NavLink 
                                    key={link.href} 
                                    link={link} 
                                    pathname={pathname} 
                                    isCollapsed={isCollapsed} 
                                    isMobile={isMobile} 
                                />
                            ))}
                        </div>
                    </div>
                </ScrollArea>
                
                {/* New report button */}
                <div className="border-t p-3 sticky bottom-0 bg-card/90 backdrop-blur">
                    <Button 
                        onClick={handleNewReport} 
                        className={cn(
                            "w-full justify-start bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white shadow-md",
                            isCollapsed && !isMobile && "justify-center px-2"
                        )}
                    >
                        <PlusCircle className={cn("h-5 w-5", (!isCollapsed || isMobile) && "mr-2")} />
                        {(!isCollapsed || isMobile) && <span>New Report</span>}
                    </Button>
                </div>
            </div>
            
            {/* Overlay for mobile */}
            {isMobile && mobileOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={() => setMobileOpen(false)} 
                />
            )}
        </>
    )
}

// NavLink component for cleaner code
const NavLink: React.FC<NavLinkProps> = ({ link, pathname, isCollapsed, isMobile }) => {
    return (
        <Link href={link.href}>
            <Button
                variant={pathname === link.href ? "secondary" : "ghost"}
                className={cn(
                    "w-full justify-start transition-all",
                    isCollapsed && !isMobile && "justify-center px-2",
                    pathname === link.href 
                        ? "bg-gradient-to-r from-blue-100 to-emerald-100 dark:from-blue-900/40 dark:to-emerald-900/40 text-blue-700 dark:text-blue-300" 
                        : "hover:bg-muted"
                )}
            >
                <link.icon className={cn(
                    "h-5 w-5",
                    pathname === link.href 
                        ? "text-blue-600 dark:text-blue-400" 
                        : "text-muted-foreground",
                    !isCollapsed && !isMobile && "mr-3"
                )} />
                {(!isCollapsed || isMobile) && (
                    <span className={pathname === link.href ? "font-medium" : ""}>{link.title}</span>
                )}
            </Button>
        </Link>
    )
}

// Eye Icon component
function EyeIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}