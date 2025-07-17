"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { toast } from "react-hot-toast"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, Loader2, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/libs/utils"

interface LoginFormData {
  email: string
  password: string
}

const Login = () => {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState<LoginFormData>({ email: "", password: "" })
  const [errors, setErrors] = useState<Partial<LoginFormData>>({})
  const [attempts, setAttempts] = useState(0)
  const searchParams = useSearchParams()
  const returnTo = searchParams.get("returnTo")

  useEffect(() => {
    const timer = setTimeout(() => setAttempts(0), 1800000)
    return () => clearTimeout(timer)
  }, [])

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {}

    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name as keyof LoginFormData]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (attempts >= 5) {
      toast.error("Too many login attempts. Please try again later.")
      return
    }

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        if (!data.error) {
          // Store user ID for location tracking
          localStorage.setItem('userId', data.userId);
          console.log('✅ UserID stored:', data.userId); // Add this log

          // Request notification permission
          if (Notification.permission !== 'granted') {
            await Notification.requestPermission();
          }

          toast.success("Successfully logged in!")
          window.location.href = returnTo || "/"
        } else {
          setAttempts((prev) => prev + 1)
          toast.error("Invalid credentials.")
        }
      } else {
        const error = await response.json()
        toast.error(error.error || "An error occurred during login.")
        setAttempts((prev) => prev + 1)
      }
    } catch (error) {
      toast.error("Network error. Please check your connection.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
            <div className="hidden sm:flex items-center justify-center w-full lg:w-1/2 min-h-[400px] lg:min-h-screen relative bg-background">
  {/* 16:9 Aspect Ratio Wrapper */}
  <div className="relative w-[90%] max-w-[720px] pt-[56.25%]">
    <video
      className="absolute top-0 left-0 w-full h-full object-contain z-0 opacity-100"
      src="/intro1.mp4"
      autoPlay
      loop
      playsInline
    />
  </div>
</div>
      
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-bold text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">Sign in to continue to Nigrani</CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence>
              {attempts >= 3 && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mb-4"
                >
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Multiple failed login attempts detected. Please verify your credentials carefully.
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  className={cn(errors.email && "border-destructive focus-visible:ring-destructive")}
                />
                {errors.email && <p className="text-sm font-medium text-destructive">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    className={cn(errors.password && "border-destructive focus-visible:ring-destructive")}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.password && <p className="text-sm font-medium text-destructive">{errors.password}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={loading || attempts >= 5}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : attempts >= 7 ? (
                  "Too many attempts"
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="flex items-center justify-between w-full">
              <Button variant="link" asChild className="h-auto p-0">
                <Link href="/reset-password" className="text-primary">
                  Forgot Password?
                </Link>
              </Button>
              <Button variant="link" asChild className="h-auto p-0">
                <Link href="/signup" className="text-primary">
                  Sign Up
                </Link>
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default Login