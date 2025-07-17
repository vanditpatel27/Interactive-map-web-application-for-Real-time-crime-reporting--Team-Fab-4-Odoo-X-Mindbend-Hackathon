"use client";
import { useState, useEffect } from 'react';
import { GoogleMap, Marker, DirectionsRenderer, useJsApiLoader, Libraries } from '@react-google-maps/api';
import io from 'socket.io-client';

let socket: any;

export default function UserSOS() {
  const [location, setLocation] = useState({ lat: 0, lng: 0 });
  const [location1, setLocation1] = useState({ lat: 0, lng: 0 });
  const [sosSent, setSosSent] = useState(false);
  const [sosAccepted, setSosAccepted] = useState(false);
  const [policeLocation, setPoliceLocation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [directions, setDirections] = useState<any>(null);
  const [distanceToPolice, setDistanceToPolice] = useState<string | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<string | null>(null);
  const [sosId, setSosId] = useState<any>(null);
  
  const libraries = ['places', 'visualization'];
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP_API as string,
    libraries: libraries as Libraries,
  });

  useEffect(() => {
    // Initialize socket connection
    socket = io('http://localhost:5000');

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Using hardcoded location for testing
          setLocation({
            lat: 19.0760,
            lng: 72.8777
          });
          setLocation1({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }

    // Clean up socket connection on component unmount
    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('sos-accepted', (data:any) => {
      setSosAccepted(true);
      setPoliceLocation(data.policeLocation);
      console.log("SOS accepted by police:", data);
      console.log("Police location:", data.policeLocation);
      
      // Calculate directions when police accepts the SOS
      if (data.policeLocation) {
        calculateDirections(location, data.policeLocation);
      }
    });

    socket.on('police-location-update', (data: any) => {
      console.log("Police location update:", data);
      setPoliceLocation(data.location);
      
      // Update directions when police location changes
      if (data.location) {
        calculateDirections(location, data.location);
      }
    });

    socket.on('sos-completed', (completedSosId:any) => {
      if (completedSosId === sosId) {
        setSosSent(false);
        setSosAccepted(false);
        setPoliceLocation(null);
        setDirections(null);
        setDistanceToPolice(null);
        setEstimatedTime(null);
        setSosId(null);
        alert("Your emergency has been resolved. Thank you for using our service.");
      }
    });

    return () => {
      socket.off('sos-accepted');
      socket.off('police-location-update');
      socket.off('sos-completed');
    };
  }, [location, sosId, socket]);

  const calculateDirections = (origin: any, destination: any) => {
    if (!window.google || !origin || !destination || 
        origin.lat === 0 || origin.lng === 0 || 
        destination.lat === 0 || destination.lng === 0) {
      console.error('Cannot calculate directions with invalid coordinates');
      return;
    }
    
    const directionsService = new google.maps.DirectionsService();
    
    directionsService.route(
      {
        origin,
        destination,
        travelMode: google.maps.TravelMode.DRIVING
      },
      (result: any, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
          setDirections(result);
          
          // Extract distance and time info
          const route = result.routes[0]?.legs[0];
          if (route) {
            setDistanceToPolice(route.distance.text);
            setEstimatedTime(route.duration.text);
          }
        } else {
          console.error("Directions request failed:", status);
        }
      }
    );
  };

  const sendSOS = async () => {
    setLoading(true);
    setLocation({
      lat: 19.0760,
      lng: 72.8777
    });
    try {
      const response = await fetch('/api/sos/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ location }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("SOS alert created:", data);
        // Store the SOS ID for later reference
        setSosId(data._id);
        
        socket.emit('sos-alert', {
          id: data._id,
          location,
          userId: data.userId
        });
        setSosSent(true);
      }
    } catch (error) {
      console.error("Error sending SOS:", error);
    } finally {
      console.log("sos",sosId);
      setLoading(false);
    }
  };

  const cancelSOS = async () => {
    if (!sosId) {
      console.error("No SOS ID to cancel");
      return;
    }
  
    console.log("Cancelling SOS with sosId via headers:", sosId);
  
    try {
      const response = await fetch('/api/sos/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-sos-id': sosId // ✅ custom header
        }
      });
  
      if (response.ok) {
        socket.emit('sos-cancelled', sosId);
        // Reset state
        setSosSent(false);
        setSosAccepted(false);
        setPoliceLocation(null);
        setDirections(null);
        setDistanceToPolice(null);
        setEstimatedTime(null);
        setSosId(null);
      } else {
        const error = await response.json();
        console.error("Server error:", error);
      }
    } catch (error) {
      console.error("Error cancelling SOS:", error);
    }
  };
  

  const mapContainerStyle = {
    width: '100%',
    height: '400px'
  };

  const onMapLoad = () => {
    setMapLoaded(true);
  };

  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Emergency SOS</h1>

      {!sosSent ? (
        <button
          onClick={sendSOS}
          disabled={loading}
          className="bg-red-600 text-white p-4 rounded-full w-32 h-32 flex items-center justify-center text-2xl font-bold mb-4 hover:bg-red-700"
        >
          {loading ? 'Sending...' : 'SOS'}
        </button>
      ) : !sosAccepted ? (
        <div className="mb-4">
          <p className="mb-2">SOS alert sent. Waiting for police response...</p>
          <button
            onClick={cancelSOS}
            className="bg-gray-600 text-white p-2 rounded"
          >
            Cancel SOS
          </button>
        </div>
      ) : (
        <div className="mb-4">
          <p className="text-green-600 font-bold">Help is on the way!</p>
          {distanceToPolice && estimatedTime && (
            <div className="mt-2 mb-2">
              <p><strong>Distance:</strong> {distanceToPolice}</p>
              <p><strong>ETA:</strong> {estimatedTime}</p>
            </div>
          )}
          <button
            onClick={cancelSOS}
            className="bg-gray-600 text-white p-2 rounded mt-2"
          >
            Cancel SOS
          </button>
        </div>
      )}

      <div className="mb-4">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={location}
          zoom={15}
          onLoad={onMapLoad}
        >
          {/* User location marker */}
          <Marker 
            position={location}

          />

          {/* Police location marker */}
          {policeLocation && (
            <Marker
              position={policeLocation}
              icon={{
                url: 'police.avif',
                scaledSize: new google.maps.Size(40, 40)
              }}
            />
          )}
          
          {/* Direction path between user and police */}
          {directions && (
            <DirectionsRenderer
              directions={directions}
              options={{
                polylineOptions: {
                  strokeColor: 'blue',
                  strokeWeight: 4
                },
                suppressMarkers: true // Hide default markers as we have our custom ones
              }}
            />
          )}
        </GoogleMap>
      </div>

      {sosAccepted && policeLocation && (
        <div className="mt-4 p-3 bg-blue-100 rounded">
          <p className="font-semibold">Police is on the way to your location</p>
          <p>Police coordinates: {policeLocation.lat.toFixed(4)}, {policeLocation.lng.toFixed(4)}</p>
        </div>
      )}
    </div>
  );
}