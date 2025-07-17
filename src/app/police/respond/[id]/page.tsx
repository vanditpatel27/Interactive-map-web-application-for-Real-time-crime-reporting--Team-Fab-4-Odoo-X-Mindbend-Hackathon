"use client";
import { useState, useEffect, useRef } from 'react';
import { GoogleMap, Marker, DirectionsRenderer, useJsApiLoader, Libraries } from '@react-google-maps/api';
import io from 'socket.io-client';

let socket: any;

export default function RespondToSOS() {
  const [id, setId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sosDetails, setSosDetails] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState({ lat: 0, lng: 0 });
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [distanceToVictim, setDistanceToVictim] = useState<string | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  
  // Use refs to prevent excessive re-renders
  const currentLocationRef = useRef({ lat: 0, lng: 0 });
  const sosDetailsRef = useRef<any>(null);

  // Load Google Maps JS API
  const libraries = ['places', 'visualization', 'routes'] as Libraries;
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP_API as string,
    libraries: libraries,
  });

  // Get SOS ID from URL
  useEffect(() => {
    setIsNavigating(false);
    setId(window.location.href.split('/')[5]);
    
    // Initialize socket connection
    socket = io('http://localhost:5000');
    
    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  // Fetch SOS details and set up location watching
  useEffect(() => {
    if (!id || !isLoaded) return;
    
    const fetchSOSDetails = async () => {
      try {
        const res = await fetch(`/api/sos/${id}`);
        if (res.ok) {
          const data = await res.json();
          setSosDetails(data);
          sosDetailsRef.current = data;
          
          // Initialize directions service if we have valid location data
          if (currentLocationRef.current.lat !== 0 && currentLocationRef.current.lng !== 0) {
            calculateRoute(currentLocationRef.current, data.location);
          }
        }
      } catch (err) {
        console.error("Failed to fetch SOS details:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSOSDetails();
    
    // Set up location watching
    let watchId: number;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          // Update ref immediately to avoid dependency issues
          currentLocationRef.current = newLocation;
          
          // Update state less frequently to avoid re-renders
          setCurrentLocation(newLocation);
          
          // Emit location to victim via socket
          if (socket && id) {
            socket.emit('police-location-update', {
              sosId: id,
              location: newLocation
            });
          }
          
          // Update directions if navigating and both locations are valid
          if (isNavigating && sosDetailsRef.current && directionsService) {
            calculateRoute(newLocation, sosDetailsRef.current.location);
          }
          
          // Center map on current location if navigating
          if (map && isNavigating) {
            map.panTo(newLocation);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
        },
        { 
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 5000
        }
      );
    }
    
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [id, isLoaded]);
  
  // Handle navigation toggle
  useEffect(() => {
    if (isNavigating && sosDetailsRef.current && currentLocationRef.current.lat !== 0) {
      calculateRoute(currentLocationRef.current, sosDetailsRef.current.location);
    }
  }, [isNavigating]);

  // Calculate route between points
  const calculateRoute = (origin: any, destination: any) => {
    if (!directionsService) return;
    
    // Verify coordinates are valid
    if (
      !origin || !destination ||
      origin.lat === 0 || origin.lng === 0 ||
      destination.lat === 0 || destination.lng === 0
    ) {
      console.error('Invalid coordinates, cannot fetch directions');
      return;
    }
    
    directionsService.route(
      {
        origin: new google.maps.LatLng(origin.lat, origin.lng),
        destination: new google.maps.LatLng(destination.lat, destination.lng),
        travelMode: google.maps.TravelMode.DRIVING
      },
      (result:any, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
          setDirections(result);
          const route = result.routes[0]?.legs[0];
          if (route) {
            setDistanceToVictim(route.distance.text);
            setEstimatedTime(route.duration.text);
          }
        } else {
          console.error("Directions request failed:", status);
        }
      }
    );
  };

  // Toggle navigation mode
  const toggleNavigation = () => {
    setIsNavigating(!isNavigating);
  };
  
  // Initialize Google Map
  const onMapLoad = (mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    setDirectionsService(new google.maps.DirectionsService());
  };

  // Mark SOS as resolved
  const completeResponse = async () => {
    if (!id) return;
    try {
      await fetch(`/api/sos/complete/${id}`, {
        method: 'POST',
      });

      socket.emit('sos-completed', { sosId: id });
      window.location.href = '/police';
    } catch (error) {
      console.error("Error completing response:", error);
    }
  };

  const mapContainerStyle = {
    width: '100%',
    height: '500px'
  };

  // Open native navigation app
  const openNativeNavigation = () => {
    if (!sosDetails) return;
    
    const { lat, lng } = sosDetails.location;
    // For mobile devices, open in Google Maps app
    const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    window.open(navUrl, '_blank');
  };

  if (!isLoaded || loading) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Loading SOS details...</h1>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Responding to Emergency</h1>

      {sosDetails && (
        <div className="bg-blue-50 p-4 rounded mb-4">
          <div className="flex justify-between items-center">
            <div>
              <p><strong>User ID:</strong> {sosDetails.userId}</p>
              {distanceToVictim && (
                <p><strong>Distance:</strong> {distanceToVictim}</p>
              )}
              {estimatedTime && (
                <p><strong>ETA:</strong> {estimatedTime}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={toggleNavigation}
                className={`px-4 py-2 rounded font-medium ${
                  isNavigating 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-blue-600 text-white'
                }`}
              >
                {isNavigating ? 'Stop Navigation' : 'Start Navigation'}
              </button>
              
              <button
                onClick={openNativeNavigation}
                className="bg-green-600 text-white px-4 py-2 rounded font-medium"
              >
                Open in Maps App
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={currentLocation}
          zoom={14}
          onLoad={onMapLoad}
          options={{
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: true,
            fullscreenControl: true,
          }}
        >
          <Marker
            position={currentLocation}
            icon={{
              url: '/images/police.avif',
              scaledSize: isLoaded ? new window.google.maps.Size(40, 40) : undefined
            }}
          />

          {sosDetails && (
            <Marker
              position={sosDetails.location}
              icon={{
                url: '/images/sos.avif',
                scaledSize: isLoaded ? new window.google.maps.Size(40, 40) : undefined
              }}
            />
          )}

          {directions && isNavigating && (
            <DirectionsRenderer
              directions={directions}
              options={{
                polylineOptions: {
                  strokeColor: 'blue',
                  strokeWeight: 5
                },
                suppressMarkers: true
              }}
            />
          )}
        </GoogleMap>
      </div>

      {isNavigating && directions && (
        <div className="mb-4 p-4 bg-yellow-50 rounded border">
          <h3 className="font-bold mb-2">Turn-by-Turn Directions</h3>
          <div className="max-h-60 overflow-y-auto">
            {directions.routes[0]?.legs[0]?.steps.map((step, i) => (
              <div key={i} className="mb-2 border-b pb-2">
                <p dangerouslySetInnerHTML={{ __html: step.instructions }}></p>
                <p className="text-sm text-gray-600">
                  {step.distance?.text} - {step.duration?.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={completeResponse}
        className="bg-green-600 text-white p-3 rounded w-full hover:bg-green-700"
      >
        Mark as Resolved
      </button>
    </div>
  );
}