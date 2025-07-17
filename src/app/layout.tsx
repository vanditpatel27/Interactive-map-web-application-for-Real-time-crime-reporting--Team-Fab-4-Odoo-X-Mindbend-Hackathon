import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import "./globals.css"
import Navbar from "@/components/Navbar"
import type React from "react"
import { ThemeProvider } from "next-themes"
import { Toaster } from "react-hot-toast";
import LoadUser from "@/components/LoadUser";
import Image from "next/image"
import { Eye } from "lucide-react"
import { Sidebar } from "@/components/Sidebar"
import SplashScreen from "@/components/SplashScreen"
import { LocationProvider } from '@/components/context/LocationContext';

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Nigrani | Community Crime Reporting",
  description: "Empowering communities through vigilant crime reporting",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <LoadUser />
          <Toaster position="top-center" />
          <div className="flex h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col">
              <Navbar />
              <main className="flex-1 overflow-auto p-4">
                <SplashScreen />
                <LocationProvider>
                  {children}
                </LocationProvider>
              </main>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}