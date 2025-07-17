"use client";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import {
  GoogleMap,
  Marker,
  HeatmapLayer,
  MarkerF,
  InfoWindowF,
  DirectionsService,
  DirectionsRenderer,
  Circle,
  Autocomplete,
} from "@react-google-maps/api";
import ReportCrime from "@/components/ReportCrime"
import { darkBlueMapStyle, darkRedMapStyle } from "@/libs/map-styles";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sidebar } from "@/components/Sidebar";
import { MapProvider } from "@/components/MapProvider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarToggle } from "@/components/SidebarToggle";
import { 
  MapPin, 
  Navigation, 
  Thermometer, 
  AlertTriangle, 
  Filter, 
  Layers, 
  LocateFixed,
  CalendarDays,
  Clock,
  Ruler,
  Search,
  PlusCircle,
  X,
  Check,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Result } from "postcss";
// import { toast } from "@/components/ui/use-toast";

export default function CrimeMap() {
  const [center, setCenter] = useState<{ lat: number; lng: number }>({
    lat: 23.8103,
    lng: 90.4125,
  });
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address,setAddress]=useState<string>("")
  const [crimes, setCrimes] = useState<any[]>([]);
  const [filteredCrimes, setFilteredCrimes] = useState<any[]>([]);
  const [selectedCrime, setSelectedCrime] = useState<any | null>(null);
  const [mapType, setMapType] = useState<"map" | "heatmap">("map");
  const [radius, setRadius] = useState<number>(10);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [showRadius, setShowRadius] = useState<boolean>(true);
  const mapRef = useRef<google.maps.Map | null>(null);
  const searchBoxRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [open,setOpen]=useState<boolean>(false);
  // New state variables for crime reporting
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);
  const [newCrimeMarker, setNewCrimeMarker] = useState<{ lat: number; lng: number } | null>(null);
  const [reportForm, setReportForm] = useState({
    title: "",
    description: "",
    location_name: "",
    crime_type: "theft",
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [reportMarkerAddress, setReportMarkerAddress] = useState<string>("");

  // Set up map instance reference
  const onMapLoad = (map: google.maps.Map) => {
    mapRef.current = map;
    
    // Add click listener to map for crime reporting
    map.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        
        setNewCrimeMarker({ lat, lng });
        getAddressFromLatLng(lat, lng);
        setTimeout(() => {
          setReportModalOpen(true);
        }, 1000);
      }
    });
  };

  // Load autocomplete for search
  const onLoadSearchBox = (autocomplete: google.maps.places.Autocomplete) => {
    searchBoxRef.current = autocomplete;
  };

  // Handle place changed in search box
  const onPlaceChanged = () => {
    if (searchBoxRef.current !== null && mapRef.current !== null) {
      const place = searchBoxRef.current.getPlace();
      if (place.geometry && place.geometry.location) {
        const newLocation = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        setCenter(newLocation);
        mapRef.current.panTo(newLocation);
        mapRef.current.setZoom(15);
      }
    }
  };
  // Get address from latitude and longitude for the crime report
  const getAddressFromLatLng = async (lat: number, lng: number) => {
    try {
      console.log("hello");
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode(
        { location: { lat, lng } },
        (results: any, status: any) => {
          if (status === "OK" && results[0]) {
            const formattedAddress = results[0].formatted_address;
            console.log(results[0]);
            setReportMarkerAddress(formattedAddress);
            setAddress(formattedAddress); // ✅ Update address state
            setReportForm(prev => ({
              ...prev,
              location_name: formattedAddress
            }));
          } else {
            const fallbackAddress = `Lat: ${lat}, Lng: ${lng}`;
            setReportMarkerAddress("Address not found");
            setAddress(fallbackAddress); // ✅ Update address state
            setReportForm(prev => ({
              ...prev,
              location_name: fallbackAddress
            }));
          }
        }
      );
    } catch (error) {
      console.error("Error getting address:", error);
      setReportMarkerAddress("Error getting address");
      setAddress("Error getting address"); // ✅ Handle error case
    }
  };
  

  // Get user location
  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCenter(newLocation);
          setUserLocation(newLocation);
        },
        () => {
          setCenter({ lat: 23.8103, lng: 90.4125 });
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // Fetch crimes when center or radius changes
  useEffect(() => {
    const fetchCrimes = async () => {
      try {
        const response = await fetch(
          `/api/report?lat=${center.lat}&lng=${center.lng}&radius=${radius}`
        );
        const data = await response.json();
        console.log("a",data);
        setCrimes(data.contents || []);
      } catch (error) {
        console.log("Error fetching crime reports:", error);
      }
    };
    fetchCrimes();

  }, [center, radius]);

  // Apply filters
  useEffect(() => {
    let filtered = [...crimes];
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(crime => crime.status === statusFilter);
    }
    
    if (dateFilter === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filtered = filtered.filter(crime => {
        const crimeDate = new Date(crime.createdAt);
        return crimeDate >= today;
      });
    } else if (dateFilter === "week") {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      filtered = filtered.filter(crime => {
        const crimeDate = new Date(crime.createdAt);
        return crimeDate >= lastWeek;
      });
    } else if (dateFilter === "month") {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      filtered = filtered.filter(crime => {
        const crimeDate = new Date(crime.createdAt);
        return crimeDate >= lastMonth;
      });
    }
    
    setFilteredCrimes(filtered);
  }, [crimes, statusFilter, dateFilter]);

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return Math.round(distance * 100) / 100;
  };

  const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
  };

  // Get directions to selected crime location
  const getDirections = () => {
    if (!selectedCrime || !userLocation) return;
    
    const directionsService = new google.maps.DirectionsService();
    
    directionsService.route(
      {
        origin: new google.maps.LatLng(userLocation.lat, userLocation.lng),
        destination: new google.maps.LatLng(
          selectedCrime.location.coordinates[1],
          selectedCrime.location.coordinates[0]
        ),
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
          setDirections(result);
        } else {
          console.error(`Error fetching directions: ${status}`);
        }
      }
    );
  };

  // Clear directions
  const clearDirections = () => {
    setDirections(null);
  };

  // Center map on user location
  const centerOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.panTo(userLocation);
      mapRef.current.setZoom(15);
    }
  };

  // Function to format the date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Check for mobile device
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle input change for crime report form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setReportForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit crime report
  const submitCrimeReport = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCrimeMarker) return;
    
    setIsSubmitting(true);
    
    try {
      const reportData = {
        ...reportForm,
        location: {
          type: "Point",
          coordinates: [newCrimeMarker.lng, newCrimeMarker.lat]
        },
        status: "not verified"
      };
      
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData)
      });
      
      if (response.ok) {
        // Refresh crime data
        const refreshResponse = await fetch(
          `/api/report?lat=${center.lat}&lng=${center.lng}&radius=${radius}`
        );
        const refreshData = await refreshResponse.json();
        setCrimes(refreshData.contents || []);
        
        // Reset form and close modal
        setReportForm({
          title: "",
          description: "",
          location_name: "",
          crime_type: "theft"
        });
        setNewCrimeMarker(null);
        setReportModalOpen(false);
        // toast({
        //   title: "Report Submitted",
        //   description: "Your crime report has been submitted successfully.",
        //   duration: 5000,
        // });
      } else {
        // toast({
        //   title: "Error",
        //   description: "Failed to submit crime report. Please try again.",
        //   variant: "destructive",
        //   duration: 5000,
        // });
      }
    } catch (error) {
      console.error("Error submitting crime report:", error);
      // toast({
      //   title: "Error",
      //   description: "An unexpected error occurred. Please try again.",
      //   variant: "destructive",
      //   duration: 5000,
      // });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel crime report
  const cancelReport = () => {
    setReportModalOpen(false);
    setNewCrimeMarker(null);
    setReportForm({
      title: "",
      description: "",
      location_name: "",
      crime_type: "theft"
    });
  };

  return (


    <div className="flex min-h-screen bg-background relative">
      {reportModalOpen &&
<ReportCrime onClose={()=>{setReportModalOpen(false)}} location_name={reportForm.location_name}/>}
      <main className="flex-1">
        <div className="container mx-auto py-4 px-4 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="md:hidden">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 mr-2"
                >
                  <SidebarToggle />
                </Button>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-blue-400 flex items-center gap-2">
                <AlertTriangle className="h-6 w-6" />
                Crime Activity Map
              </h1>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={centerOnUser}
                className="flex items-center gap-1"
              >
                <LocateFixed className="h-4 w-4" />
                <span className="hidden md:inline">Find Me</span>
              </Button>
              <Button
                variant="default"
                size="sm"
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  if (userLocation) {
                    setNewCrimeMarker(userLocation);
                    getAddressFromLatLng(userLocation.lat, userLocation.lng);
                    setReportModalOpen(true);
                  } else {
                    // toast({
                    //   title: "Location Required",
                    //   description: "We need your location to report a crime. Please enable location services.",
                    //   variant: "destructive",
                    //   duration: 5000,
                    // });
                  }
                }}
              >
                <PlusCircle className="h-4 w-4" />
                <span className="hidden md:inline">Report Crime</span>
              </Button>
            </div>
          </div>

          <Card className="bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <CardTitle>Crime Activity</CardTitle>
                  <CardDescription>
                    {filteredCrimes.length} reports in a {radius}km radius
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select onValueChange={(value) => setMapType(value as any)} defaultValue={mapType}>
                    <SelectTrigger className="w-full sm:w-40">
                      <Layers className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Map Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="map">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>Location-wise</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="heatmap">
                        <div className="flex items-center gap-2">
                          <Thermometer className="h-4 w-4" />
                          <span>Heatmap</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Search places */}
              <div className="w-full">
                <div className="flex items-center bg-card border border-border rounded-md pr-2">
                  <MapProvider>
                    <Autocomplete
                      onLoad={onLoadSearchBox}
                      onPlaceChanged={onPlaceChanged}
                      restrictions={{ country: "IN" }} 
                    >
                      <Input 
                        placeholder="Search for a location..." 
                        className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </Autocomplete>
                  </MapProvider>
                  <Search className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Search for an address or click on the map to report a crime
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1">
                    <Ruler className="h-4 w-4" />
                    Search Radius: {radius}km
                  </label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[radius]}
                      min={1}
                      max={50}
                      step={1}
                      onValueChange={(value) => setRadius(value[0])}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRadius(!showRadius)}
                      className="h-8 w-8 p-0"
                    >
                      {showRadius ? "Hide" : "Show"}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium flex items-center gap-1">
                    <Filter className="h-4 w-4" />
                    Filter by Status
                  </label>
                  <Select onValueChange={setStatusFilter} defaultValue="all">
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="not verified">Not Verified</SelectItem>
                      <SelectItem value="investigating">Investigating</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="fake">Fake</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium flex items-center gap-1">
                    <CalendarDays className="h-4 w-4" />
                    Filter by Time
                  </label>
                  <Select onValueChange={setDateFilter} defaultValue="all">
                    <SelectTrigger>
                      <SelectValue placeholder="Time Period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">Past Week</SelectItem>
                      <SelectItem value="month">Past Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="h-[500px] md:h-[600px] w-full rounded-lg overflow-hidden border border-border/50">
                <MapProvider>
                  {mapType === "map" ? (
                    <GenericMap
                      center={center}
                      crimes={filteredCrimes}
                      selectedCrime={selectedCrime}
                      setSelectedCrime={setSelectedCrime}
                      userLocation={userLocation}
                      directions={directions}
                      onMapLoad={onMapLoad}
                      showRadius={showRadius}
                      radius={radius}
                      calculateDistance={calculateDistance}
                      newCrimeMarker={newCrimeMarker}
                    />
                  ) : (
                    <CrimeHeatMap 
                      center={center} 
                      crimes={filteredCrimes}
                      onMapLoad={onMapLoad}
                      userLocation={userLocation}
                      showRadius={showRadius}
                      radius={radius}
                    />
                  )}
                </MapProvider>
              </div>

              {selectedCrime && (
                <Card className="mt-4 border-blue-500/50 animate-fadeIn">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg text-blue-300">
                        {selectedCrime.title}
                      </CardTitle>
                      <Badge 
                        className={`${
                          selectedCrime.status === "fake"
                          ? "bg-red-600"
                          : selectedCrime.status === "verified"
                          ? "bg-green-600"
                          : selectedCrime.status === "resolved"
                          ? "bg-blue-600"
                          : selectedCrime.status === "investigating"
                          ? "bg-yellow-600 text-black"
                          : "bg-gray-600"
                        }`}
                      >
                        {selectedCrime.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm">{selectedCrime.description}</p>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-gray-400 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="font-medium">Location:</span> 
                          {selectedCrime.location_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span className="font-medium">Reported:</span> 
                          {formatDate(selectedCrime.createdAt)}
                        </p>
                      </div>
                    </div>

                    {userLocation && (
                      <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <div className="text-xs flex items-center">
                          <span className="font-medium mr-1">Distance:</span>
                          {calculateDistance(
                            userLocation.lat,
                            userLocation.lng,
                            selectedCrime.location.coordinates[1],
                            selectedCrime.location.coordinates[0]
                          )}{" "}
                          km away
                        </div>
                        
                        {!directions ? (
                          <Button 
                            onClick={getDirections}
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            <Navigation className="h-4 w-4" />
                            Get Directions
                          </Button>
                        ) : (
                          <Button 
                            onClick={clearDirections}
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-1"
                          >
                            <Navigation className="h-4 w-4" />
                            Hide Directions
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Crime Report Dialog */}
      {/* <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report a Crime</DialogTitle>
            <DialogDescription>
              Fill in the details about the incident you want to report.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitCrimeReport}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Brief title of the incident"
                  value={reportForm.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="crime_type">Type of Crime</Label>
                <Select 
                  name="crime_type" 
                  value={reportForm.crime_type}
                  onValueChange={(value) => setReportForm(prev => ({ ...prev, crime_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select crime type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="theft">Theft</SelectItem>
                    <SelectItem value="robbery">Robbery</SelectItem>
                    <SelectItem value="assault">Assault</SelectItem>
                    <SelectItem value="vandalism">Vandalism</SelectItem>
                    <SelectItem value="harassment">Harassment</SelectItem>
                    <SelectItem value="scam">Scam</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Detailed description of what happened"
                  value={reportForm.description}
                  onChange={handleInputChange}
                  rows={4}
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="location_name">Location</Label>
                <div className="border rounded-md p-3 bg-muted/50 text-sm">
                  {reportMarkerAddress}
                </div>
                <Input
                  id="location_name"
                  name="location_name"
                  placeholder="Additional location details (optional)"
                  value={reportForm.location_name}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={cancelReport} disabled={isSubmitting}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>Submitting...</>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Submit Report
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog> */}
    </div>
  );
}

function CrimeHeatMap({
  center,
  crimes,
  onMapLoad,
  userLocation,
  showRadius,
  radius,
}:any) {
  const mapOptions = useMemo(() => ({
    ...darkRedMapStyle,
    gestureHandling: "greedy",
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
  }), []);

  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: "100%" }}
      center={center}
      zoom={14}
      options={mapOptions}
      onLoad={onMapLoad}
    >
      {userLocation && (
        <MarkerF
          position={userLocation}
          icon={{
            url: "/user-location.png",
            scaledSize: new google.maps.Size(30, 30),
          }}
        />
      )}
      
      {showRadius && userLocation && (
        <Circle
          center={userLocation}
          radius={radius * 1000} // Convert km to meters
          options={{
            fillColor: "rgba(66, 133, 244, 0.1)",
            fillOpacity: 0.3,
            strokeColor: "rgba(66, 133, 244, 0.8)",
            strokeOpacity: 0.8,
            strokeWeight: 2,
            clickable: false // Make the circle non-clickable
          }}
        />
      )}

      <HeatmapLayer
        data={crimes.map(
          (crime:any) =>
            new google.maps.LatLng(
              crime.location.coordinates[1],
              crime.location.coordinates[0]
            )
        )}
        options={{
          radius: 20,
          opacity: 0.7,
          gradient: [
            "rgba(0, 255, 255, 0)",
            "rgba(0, 255, 255, 1)",
            "rgba(0, 191, 255, 1)",
            "rgba(0, 127, 255, 1)",
            "rgba(0, 63, 255, 1)",
            "rgba(0, 0, 255, 1)",
            "rgba(63, 0, 255, 1)",
            "rgba(127, 0, 255, 1)",
            "rgba(191, 0, 255, 1)",
            "rgba(255, 0, 255, 1)"
          ]
        }}
      />
    </GoogleMap>
  );
}
function GenericMap({
  center,
  crimes,
  selectedCrime,
  setSelectedCrime,
  userLocation,
  directions,
  onMapLoad,
  showRadius,
  radius,
  calculateDistance,
  newCrimeMarker,
}:any) {
  const [infoOpen, setInfoOpen] = useState<any>(false);
  const [selectedMarker, setSelectedMarker] = useState<any>(null);
  
  const mapOptions = useMemo(() => ({
    ...darkBlueMapStyle,
    gestureHandling: "greedy",
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
  }), []);

  const getStatusIcon = (status:any) => {
    switch (status) {
      case "verified":
        return "/verified-marker.png";
      case "not verified":
        return "/unverified-marker.png";
      case "investigating":
        return "/investigating-marker.png";
      case "resolved":
        return "/resolved-marker.png";
      case "fake":
        return "/fake-marker.png";
      default:
        return "/default-marker.png";
    }
  };

  const handleMarkerClick = (crime:any) => {
    setSelectedMarker(crime);
    setInfoOpen(true);
    setSelectedCrime(crime);
  };

  const closeInfoWindow = () => {
    setInfoOpen(false);
    setSelectedMarker(null);
  };

  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: "100%" }}
      center={center}
      zoom={14}
      options={mapOptions}
      onLoad={onMapLoad}
    >
      {userLocation && (
        <MarkerF
          position={userLocation}
        />
      )}
      
      {showRadius && userLocation && (
        <Circle
          center={userLocation}
          radius={radius * 1000} // Convert km to meters
          options={{
            fillColor: "rgba(66, 133, 244, 0.1)",
            fillOpacity: 0.3,
            strokeColor: "rgba(66, 133, 244, 0.8)",
            strokeOpacity: 0.8,
            strokeWeight: 2,
            clickable: false // Make the circle non-clickable
          }}
        />
      )}

      {newCrimeMarker && (
        <MarkerF
          position={newCrimeMarker}
        />
      )}

      {crimes.map((crime:any) => (
        <MarkerF
          key={crime._id}
          position={{
            lat: crime.location.coordinates[1],
            lng: crime.location.coordinates[0],
          }}
          onClick={() => handleMarkerClick(crime)}
          icon={{
            url: "marker.png",
            scaledSize: new google.maps.Size(24, 24),
          }}
          animation={
            selectedCrime && selectedCrime._id === crime._id
              ? google.maps.Animation.BOUNCE
              : undefined
          }
        />
      ))}

      {selectedMarker && infoOpen && (
        <InfoWindowF
          position={{
            lat: selectedMarker.location.coordinates[1],
            lng: selectedMarker.location.coordinates[0],
          }}
          onCloseClick={closeInfoWindow}
        >
          <div className="p-1 max-w-xs">
            <div className="font-bold text-gray-800">{selectedMarker.title}</div>
            <div className="text-xs text-gray-600 mt-1">
              {selectedMarker.location_name}
            </div>
            {userLocation && (
              <div className="text-xs text-gray-600 mt-1">
                Distance:{" "}
                {calculateDistance(
                  userLocation.lat,
                  userLocation.lng,
                  selectedMarker.location.coordinates[1],
                  selectedMarker.location.coordinates[0]
                )}{" "}
                km
              </div>
            )}
          </div>
        </InfoWindowF>
      )}

      {directions && (
        <DirectionsRenderer
          directions={directions}
          options={{
            polylineOptions: {
              strokeColor: "#4285F4",
              strokeWeight: 5,
              strokeOpacity: 0.8,
            },
            suppressMarkers: true,
          }}
        />
      )}
    </GoogleMap>

  );
}