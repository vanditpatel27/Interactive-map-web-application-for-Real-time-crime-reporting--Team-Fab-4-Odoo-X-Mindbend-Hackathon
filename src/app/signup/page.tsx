"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { FormEvent, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { User, Mail, Lock, Check, X, EyeOff, Eye, Phone, MapPin } from 'lucide-react'
import { TypewriterEffectSmooth } from '@/components/ui/typewriter-effect'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import Script from 'next/script'

function SignUp() {
    const words = [
        { text: "Welcome" },
        { text: "to" },
        { text: "our" },
        { text: "platform", className: "text-blue-500 dark:text-blue-500" }
    ]

    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [mapLoaded, setMapLoaded] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        userType: 'Citizen',
        batchNo: '',
        phoneNo: '',
        latitude: '',
        longitude: ''
    })
      
    const [validations, setValidations] = useState({
        name: false,
        email: false,
        password: false,
        confirmPassword: false,
        batchNo: true,
        phoneNo: false,
        location: false
    })
    
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/

    // Initialize the map after the script has loaded
    useEffect(() => {
        if (typeof window !== 'undefined' && window.google && mapLoaded) {
            initMap()
        }
    }, [mapLoaded])

    const initMap = () => {
        try {
            const mapElement = document.getElementById('map')
            if (!mapElement) return

            const defaultLocation = { lat: 20.5937, lng: 78.9629 } // Default center of India
            
            const map = new google.maps.Map(mapElement, {
                center: defaultLocation,
                zoom: 5,
                mapTypeControl: false,
                streetViewControl: false
            })

            const marker = new google.maps.Marker({
                position: defaultLocation,
                map: map,
                draggable: true
            })

            // Try to get user's current location
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((position) => {
                    const userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    }
                    
                    map.setCenter(userLocation)
                    map.setZoom(15)
                    marker.setPosition(userLocation)
                    
                    setFormData(prev => ({
                        ...prev,
                        latitude: userLocation.lat.toString(),
                        longitude: userLocation.lng.toString()
                    }))
                    
                    setValidations(prev => ({
                        ...prev,
                        location: true
                    }))
                })
            }

            // Update latitude and longitude when marker is dragged
            google.maps.event.addListener(marker, 'dragend', function() {
                const position = marker.getPosition()
                if (position) {
                    setFormData(prev => ({
                        ...prev,
                        latitude: position.lat().toString(),
                        longitude: position.lng().toString()
                    }))
                    
                    setValidations(prev => ({
                        ...prev,
                        location: true
                    }))
                }
            })

            // Search box for finding locations
            const input = document.getElementById('location-search') as HTMLInputElement
            const searchBox = new google.maps.places.SearchBox(input)
            
            map.addListener('bounds_changed', () => {
                searchBox.setBounds(map.getBounds() as google.maps.LatLngBounds)
            })

            searchBox.addListener('places_changed', () => {
                const places = searchBox.getPlaces()
                if (!places || places.length === 0) return

                const place :any= places[0]
                if (!place.geometry || !place.geometry.location) return

                // Update the map
                map.setCenter(place.geometry.location)
                map.setZoom(17)
                marker.setPosition(place.geometry.location)

                // Update form data
                setFormData(prev => ({
                    ...prev,
                    latitude: place.geometry.location.lat().toString(),
                    longitude: place.geometry.location.lng().toString()
                }))
                
                setValidations(prev => ({
                    ...prev,
                    location: true
                }))
            })
        } catch (error) {
            console.error("Error initializing map:", error)
            toast.error("Failed to initialize map. Please try again later.")
        }
    }

    const handleScriptLoad = () => {
        setMapLoaded(true)
    }

    const getPasswordRequirements = (password: string) => [
        { text: "At least 8 characters", met: password.length >= 8 },
        { text: "One uppercase letter", met: /[A-Z]/.test(password) },
        { text: "One lowercase letter", met: /[a-z]/.test(password) },
        { text: "One number", met: /\d/.test(password) },
        { text: "One special character", met: /[!@#$%^&*(),.?":{}|<>]/.test(password) }
    ]

    const validatePassword = (password: string) => {
        return getPasswordRequirements(password).every(req => req.met)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    // Validate all fields whenever they change
    useEffect(() => {
        setValidations({
          name: formData.name.length >= 3,
          email: emailRegex.test(formData.email),
          password: validatePassword(formData.password),
          confirmPassword: formData.password === formData.confirmPassword && formData.confirmPassword !== '',
          batchNo: formData.userType === "Police" ? formData.batchNo.length >= 3 : true,
          phoneNo: /^\d{10}$/.test(formData.phoneNo),
          location: formData.latitude !== '' && formData.longitude !== ''
        })
    }, [formData])
      
    const isFormValid = () => {
        return Object.values(validations).every(v => v)
    }

    const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (!isFormValid()) {
            toast.error("Please fill all fields correctly")
            return
        }

        setLoading(true)

        try {
            console.log(formData)
            const response = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    batchNo: formData.batchNo,
                    phoneNumber: formData.phoneNo,
                    latitude: formData.latitude,
                    longitude: formData.longitude
                }),
            })

            const data = await response.json()

            if (response.ok) {
                toast.success("Account created successfully!")
                router.push("/login")
            } else {
                throw new Error(data.error || 'Failed to create account')
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "An unexpected error occurred")
        } finally {
            setLoading(false)
        }
    }

    const passwordRequirements = getPasswordRequirements(formData.password)

    return (
        <div className="flex flex-col md:flex-row min-h-screen">
            {/* Google Maps Script */}
            <Script
                src={`https://maps.googleapis.com/maps/api/js?key=AIzaSyBURKoHDahIVHQi0HKWEpZBWAu9dvMohpE&libraries=places`}
                onLoad={handleScriptLoad}
                strategy="lazyOnload"
            />
            
            {/* Form Section */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-background p-4 sm:p-6 lg:p-12">
                <Card className="w-full max-w-md mx-auto shadow-lg border-opacity-50">
                    <CardHeader>
                        <CardTitle className="text-2xl sm:text-3xl font-bold text-center">
                            Create an Account
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={onSubmit} className="space-y-6">
                            <div className="space-y-4">
                                {/* User Type Selector */}
                                <div className="space-y-2">
                                    <Label>User Type</Label>
                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="userType"
                                                value="Citizen"
                                                checked={formData.userType === "Citizen"}
                                                onChange={handleInputChange}
                                                className="accent-blue-500"
                                            />
                                            Citizen
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="userType"
                                                value="Police"
                                                checked={formData.userType === "Police"}
                                                onChange={handleInputChange}
                                                className="accent-blue-500"
                                            />
                                            Police
                                        </label>
                                    </div>
                                </div>

                                {/* Username field */}
                                <div className="space-y-2">
                                    <Label htmlFor="name">Username</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                                        <Input
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder="Enter your username"
                                            className={`pl-10 ${formData.name && !validations.name ? 'border-red-500' : ''}`}
                                        />
                                        <AnimatePresence>
                                            {formData.name && (
                                                <motion.div 
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                                >
                                                    {validations.name ?
                                                        <Check className="h-5 w-5 text-green-500" /> :
                                                        <X className="h-5 w-5 text-red-500" />
                                                    }
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    <AnimatePresence>
                                        {formData.name && !validations.name && (
                                            <motion.p 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="text-sm text-red-500"
                                            >
                                                Username must be at least 3 characters
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Email field */}
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            placeholder="Enter your email"
                                            className={`pl-10 ${formData.email && !validations.email ? 'border-red-500' : ''}`}
                                        />
                                        <AnimatePresence>
                                            {formData.email && (
                                                <motion.div 
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                                >
                                                    {validations.email ?
                                                        <Check className="h-5 w-5 text-green-500" /> :
                                                        <X className="h-5 w-5 text-red-500" />
                                                    }
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    <AnimatePresence>
                                        {formData.email && !validations.email && (
                                            <motion.p 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="text-sm text-red-500"
                                            >
                                                Please enter a valid email address
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </div>
                                
                                {/* Phone Number field */}
                                <div className="space-y-2">
                                    <Label htmlFor="phoneNo">Phone Number</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                                        <Input
                                            id="phoneNo"
                                            name="phoneNo"
                                            type="tel"
                                            value={formData.phoneNo}
                                            onChange={handleInputChange}
                                            placeholder="Enter your phone number"
                                            className={`pl-10 ${formData.phoneNo && !validations.phoneNo ? 'border-red-500' : ''}`}
                                        />
                                        <AnimatePresence>
                                            {formData.phoneNo && (
                                                <motion.div 
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                                >
                                                    {validations.phoneNo ? (
                                                        <Check className="h-5 w-5 text-green-500" />
                                                    ) : (
                                                        <X className="h-5 w-5 text-red-500" />
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    <AnimatePresence>
                                        {formData.phoneNo && !validations.phoneNo && (
                                            <motion.p 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="text-sm text-red-500"
                                            >
                                                Please enter a valid 10-digit phone number
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Password field */}
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                                        <Input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            placeholder="Enter your password"
                                            className={`pl-10 pr-10 ${formData.password && !validations.password ? 'border-red-500' : ''}`}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-0 top-1/2 -translate-y-1/2 h-full px-3 py-2 hover:bg-transparent"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>

                                    {/* Password requirements */}
                                    <AnimatePresence>
                                        {formData.password && (
                                            <motion.div 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mt-2 bg-slate-50 dark:bg-slate-900 p-3 rounded-md border border-slate-200 dark:border-slate-800"
                                            >
                                                <ul className="text-sm space-y-1">
                                                    {passwordRequirements.map((req, index) => (
                                                        <motion.li 
                                                            key={index} 
                                                            className="flex items-center gap-2"
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: index * 0.1 }}
                                                        >
                                                            {req.met ? (
                                                                <Check className="h-4 w-4 text-green-500" />
                                                            ) : (
                                                                <X className="h-4 w-4 text-red-500" />
                                                            )}
                                                            <span className={req.met ? 'text-green-500' : 'text-red-500'}>
                                                                {req.text}
                                                            </span>
                                                        </motion.li>
                                                    ))}
                                                </ul>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Confirm Password field */}
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                                        <Input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type={showPassword ? "text" : "password"}
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            placeholder="Confirm your password"
                                            className={`pl-10 ${formData.confirmPassword && !validations.confirmPassword ? 'border-red-500' : ''}`}
                                        />
                                        <AnimatePresence>
                                            {formData.confirmPassword && (
                                                <motion.div 
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                                >
                                                    {validations.confirmPassword ?
                                                        <Check className="h-5 w-5 text-green-500" /> :
                                                        <X className="h-5 w-5 text-red-500" />
                                                    }
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    <AnimatePresence>
                                        {formData.confirmPassword && !validations.confirmPassword && (
                                            <motion.p 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="text-sm text-red-500"
                                            >
                                                Passwords do not match
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Batch No field (for Police user type) */}
                                {formData.userType === "Police" && (
                                    <div className="space-y-2">
                                        <Label htmlFor="batchNo">Batch No</Label>
                                        <Input
                                            id="batchNo"
                                            name="batchNo"
                                            value={formData.batchNo}
                                            onChange={handleInputChange}
                                            placeholder="Enter your Batch Number"
                                            className={`pl-4 ${formData.batchNo && !validations.batchNo ? 'border-red-500' : ''}`}
                                        />
                                        <AnimatePresence>
                                            {formData.batchNo && !validations.batchNo && (
                                                <motion.p 
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="text-sm text-red-500"
                                                >
                                                    Batch No must be at least 3 characters
                                                </motion.p>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}

                                {/* Location field */}
                                <div className="space-y-2">
                                    <Label htmlFor="location">Your Location</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                                        <Input
                                            id="location-search"
                                            name="location-search"
                                            placeholder="Search for your location"
                                            className="pl-10 mb-2"
                                        />
                                    </div>
                                    
                                    {/* Map Container */}
                                    <div 
                                        id="map" 
                                        className="w-full h-48 rounded-md border border-slate-200 dark:border-slate-800"
                                    ></div>
                                    
                                    {/* Hidden inputs for lat/lng */}
                                    <div className="flex space-x-2 text-sm text-muted-foreground mt-1">
                                        <div>
                                            <span>Latitude: </span>
                                            <span>{formData.latitude ? parseFloat(formData.latitude).toFixed(6) : 'Not set'}</span>
                                        </div>
                                        <div>
                                            <span>Longitude: </span>
                                            <span>{formData.longitude ? parseFloat(formData.longitude).toFixed(6) : 'Not set'}</span>
                                        </div>
                                    </div>
                                    <AnimatePresence>
                                        {!validations.location && (
                                            <motion.p 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="text-sm text-red-500"
                                            >
                                                Please select your location on the map
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Button
                                    type="submit"
                                    disabled={loading || !isFormValid()}
                                    className="w-full transition-all duration-300"
                                >
                                    {loading ? "Creating Account..." : "Create Account"}
                                </Button>

                                <p className="text-sm text-center text-muted-foreground">
                                    Already have an account?{" "}
                                    <Link
                                        href="/login"
                                        className="text-primary hover:underline font-medium transition-colors"
                                    >
                                        Login
                                    </Link>
                                </p>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>

            {/* Welcome Section with Video */}
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
        </div>
    )
}

export default SignUp