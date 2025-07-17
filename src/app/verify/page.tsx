"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import toast from "react-hot-toast"

import { useRouter } from "next/navigation"
import { useUserLoaded, useUser } from "@/hooks/user"
import OtpInput from "@/components/OtpInput"

export default function VerifyAccount() {
    const router = useRouter()
    const [user, setUser] = useUser();
    const [userLoaded, _] = useUserLoaded();

    const [email, setEmail] = useState("")
    const [otp, setOtp] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [showOtpDialog, setShowOtpDialog] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    useEffect(() => {
        if (userLoaded && !user) {
            router.push("/login")
        }
    }, [userLoaded, user, router])

    if (!userLoaded) return <div className="text-center">Loading...</div>;
    if (!user) return <div className="text-center">Redirecting...</div>;

    const handlePhoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        try {
            const response = await fetch("/api/user/phone", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            })
            const data = await response.json()
            if (response.ok) {
                setShowOtpDialog(true)
            } else {
                setError(data.error)
            }
        } catch (err) {
            setError("Failed to update phone number. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleResendOtp = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await fetch("/api/user/phone/otp/send")
            const data = await response.json()
            if (response.ok) {
                toast("A new OTP has been sent to your phone.", { icon: "📱" })
            } else {
                setError(data.error)
            }
        } catch (err) {
            setError("Failed to resend OTP. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        try {
            const response = await fetch("/api/user/phone/otp/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ otp }),
            })
            const data = await response.json()
            if (response.ok) {
                setSuccess("Your account has been verified successfully!")
                setShowOtpDialog(false)
                // Show success message for a short duration before redirecting
                setTimeout(() => {
                    router.push("/profile")
                    router.refresh()
                }, 2000) // Wait for 2 seconds before redirecting
            } else {
                setError(data.message)
            }
        } catch (err) {
            setError("Failed to verify OTP. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="max-w-md mx-auto p-4">
            <Card>
                <CardHeader>
                    <CardTitle>Verify Your Account</CardTitle>
                    <CardDescription>Verify with email</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handlePhoneSubmit}>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        {error && (
                            <Alert variant="destructive" className="mt-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        {success && (
                            <Alert variant="default" className="mt-4 border border-green-500">
                                <CheckCircle2 className="h-4 w-4" color='green' />
                                <AlertTitle className='text-green-500'>Success</AlertTitle>
                                <AlertDescription className='text-green-500'>{success}</AlertDescription>
                            </Alert>
                        )}
                    </form>
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" disabled={isLoading} onClick={handlePhoneSubmit}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isLoading ? "Sending OTP..." : "Send OTP"}
                    </Button>
                </CardFooter>
            </Card>

            <Dialog open={showOtpDialog} onOpenChange={setShowOtpDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Enter OTP</DialogTitle>
                        <DialogDescription>We've sent a one-time password to your phone.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleOtpSubmit}>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="otp">One-Time Password</Label>
                                <OtpInput value={otp} onChange={setOtp} />
                            </div>
                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {isLoading ? "Verifying..." : "Verify OTP"}
                            </Button>
                            <Button variant="outline" className="w-full" onClick={handleResendOtp} disabled={isLoading}>
                                Resend OTP
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

