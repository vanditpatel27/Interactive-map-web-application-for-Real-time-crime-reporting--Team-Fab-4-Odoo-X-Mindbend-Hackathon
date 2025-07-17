"use client"
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { toast } from 'react-hot-toast';

// Update TEST_LOCATIONS to match your hotspot coordinates
const TEST_LOCATIONS = [
  { 
    lat: 38.910676563868, 
    lng: -77.03131835344179,
    name: "White House Area"
  },
  { 
    lat: -77.03131835344179, 
    lng: 38.910676563868,
    name: "Lafayette Square"
  },
  // Add more test locations if needed
];

// Add this interface above LocationContextType
interface LocationContextType {
  socket: Socket | null;
  notification: { message: string } | null;
  simulateLocation: (index: number) => void; // Add this new function
  currentLocation: UserLocation | null; // Add this to context value
}

// Add this near your other interfaces
interface UserLocation {
  lat: number;
  lng: number;
}

const LocationContext = createContext<LocationContextType | null>(null);

export const LocationProvider = ({ children }: { children: React.ReactNode }) => {
  const socketRef = useRef<Socket | null>(null);
  const [notification, setNotification] = useState<{ message: string } | null>(null);
  const watchPositionRef = useRef<number | null>(null);
  // Add state for tracking current location
  const [currentLocation, setCurrentLocation] = useState<UserLocation | null>(null);

  // Update the startLocationTracking function
  const startLocationTracking = () => {
    if (!socketRef.current) return;

    const handlePositionUpdate = (position: GeolocationPosition) => {
      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      // Update current location state
      setCurrentLocation(location);
      console.log('📍 Real location updated:', location);

      socketRef.current?.emit('user-location-update', {
        userId: localStorage.getItem('userId'),
        location
      });
    };

    // Get initial position with error handling
    navigator.geolocation.getCurrentPosition(
      handlePositionUpdate,
      (error) => {
        console.error('Error getting initial position:', error);
        toast.error('Unable to get your location');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    // Start watching position with more frequent updates
    watchPositionRef.current = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      (error) => {
        console.error('Error watching location:', error);
        toast.error('Location tracking error');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000, // Update if position is older than 2 seconds
        timeout: 5000
      }
    );
  };

  // Update the simulateLocation function
  const simulateLocation = (index: number) => {
    const location = TEST_LOCATIONS[index];
    const userId = localStorage.getItem('userId');

    if (!userId) {
      toast.error('Please log in first');
      return;
    }

    if (!socketRef.current) {
      toast.error('Socket not connected');
      return;
    }

    // Update current location state with simulated location
    setCurrentLocation({
      lat: location.lat,
      lng: location.lng
    });

    console.log('🎯 Simulating location:', {
      name: location.name,
      coordinates: [location.lng, location.lat],
      userId
    });

    socketRef.current.emit('user-location-update', {
      userId,
      location: {
        lat: location.lat,
        lng: location.lng
      }
    });

    toast.success(`Location set to ${location.name}`);
  };

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      console.log('No userId found in localStorage');
      return;
    }

    socketRef.current = io('http://localhost:5000');
    
    socketRef.current.on('connect', () => {
      console.log('✅ Connected to socket server with userId:', userId);
    });

    // Listen for hotspot alerts
    socketRef.current.on('hotspot-alert', (data) => {
      console.log('🔔 Received hotspot alert:', data);
      setNotification(data);
      
      // Auto-dismiss after 10 seconds
      setTimeout(() => setNotification(null), 10000);
    });

    // Start location tracking if user is logged in
    if (localStorage.getItem('userId')) {
      startLocationTracking();
    }

    return () => {
      socketRef.current?.disconnect();
      if (watchPositionRef.current) {
        navigator.geolocation.clearWatch(watchPositionRef.current);
      }
    };
  }, []);

  // Update the return JSX to show current location
  return (
    <LocationContext.Provider value={{ 
      socket: socketRef.current, 
      notification,
      simulateLocation,
      currentLocation // Add this to context value
    }}>
      {children}
      {/* Test Buttons Panel */}
      {/* <div className="fixed left-4 top-1/2 -translate-y-1/2 space-y-2 z-50">
        <div className="bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200">
          <h3 className="text-sm font-semibold mb-2 text-gray-700">Test Locations</h3>
+
          {currentLocation && (
            <div className="mb-3 text-xs text-gray-600">
              Current Location:<br />
              Lat: {currentLocation.lat.toFixed(6)}<br />
              Lng: {currentLocation.lng.toFixed(6)}
            </div>
          )}
          {TEST_LOCATIONS.map((loc, index) => (
            <button
              key={index}
              onClick={() => simulateLocation(index)}
              className="block w-full mb-2 last:mb-0 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
            >
              {loc.name}
            </button>
          ))}
        </div>
      </div> */}
      {/* Existing notification component */}
      {notification && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg max-w-sm animate-fade-in z-50">
          <h3 className="font-bold mb-2">⚠️ Safety Alert</h3>
          <p>{notification.message}</p>
          <button
            onClick={() => setNotification(null)}
            className="mt-2 bg-white text-red-600 px-2 py-1 rounded text-sm"
          >
            Dismiss
          </button>
        </div>
      )}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};