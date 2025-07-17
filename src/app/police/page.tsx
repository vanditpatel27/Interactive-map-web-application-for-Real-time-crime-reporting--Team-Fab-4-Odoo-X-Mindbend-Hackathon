"use client";
import { useState, useEffect } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import io from 'socket.io-client';
import { Libraries } from '@react-google-maps/api';
let socket: any;

export default function PoliceDashboard() {
  const [sosAlerts, setSosAlerts] = useState<any[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number }>({ lat: 0, lng: 0 });
  const [acceptedSOS, setAcceptedSOS] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const libraries = ['places', 'visualization'];
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP_API as string,
    libraries: libraries as Libraries,
  });

  // Moved fetchActiveAlerts here so it can be reused
  const fetchActiveAlerts = async () => {
    try {
      console.log("Fetching active alerts...");
      const response = await fetch('/api/sos/active');
      if (response.ok) {
        const data = await response.json();
        setSosAlerts(data);
      }
    } catch (error) {
      console.error("Error fetching active alerts:", error);
    }
  };

  useEffect(() => {
    setIsClient(true);
    socket = io('http://localhost:5000');

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isClient) return;

    let watchId: number;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(newLocation);

          if (acceptedSOS && socket) {
            socket.emit('police-location-update', {
              sosId: acceptedSOS._id, // Changed from id to _id
              location: newLocation,
            });
          }

          if (map) {
            map.panTo(newLocation);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }

    fetchActiveAlerts();

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [acceptedSOS, isClient, map]);

  useEffect(() => {
    if (!isClient || !socket) return;

    // Listen for new SOS alerts and re-fetch from server
    socket.on('sos-alert', async () => {
      await fetchActiveAlerts();
    });

    socket.on('sos-accepted-by-other', (sosId: string) => {
      console.log("Accepted SOS by other:", sosId);
      // Fix: Use _id instead of id for filtering
      setSosAlerts((prev) => prev.filter((alert) => alert._id !== sosId));
    });

    socket.on('sos-cancelled', (sosId: string) => {
      // Fix: Use _id instead of id for filtering
      setSosAlerts((prev) => prev.filter((alert) => alert._id !== sosId));
      if (acceptedSOS && acceptedSOS._id === sosId) {
        setAcceptedSOS(null);
      }
    });

    return () => {
      socket.off('sos-alert');
      socket.off('sos-accepted-by-other');
      socket.off('sos-cancelled');
    };
  }, [isClient, acceptedSOS]);

  const acceptSOS = async (sos: any) => {
    if (!socket) return;
    console.log("Accepting SOS:", sos);
    try {
      const response = await fetch('/api/sos/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sosId: sos._id,
          policeLocation: currentLocation,
        }),
      });
      console.log("Response from accept SOS:", response);
      if (response.ok) {
        socket.emit('sos-accepted', {
          sosId: sos._id,
          policeLocation: currentLocation,
        });

        setAcceptedSOS(sos);
        // Fix: Use _id instead of id for filtering
        setSosAlerts((prev) => prev.filter((alert) => alert._id !== sos._id));

        window.location.href = `/police/respond/${sos._id}`;
      }
    } catch (error) {
      console.error("Error accepting SOS:", error);
    }
  };

  const mapContainerStyle = {
    width: '100%',
    height: '400px',
  };

  const onMapLoad = (map: google.maps.Map) => {
    setMap(map);
  };

  if (!isClient || !isLoaded) {
    return <div>Loading map...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Police Dashboard</h1>

      <div className="mb-4">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={currentLocation}
          zoom={12}
          onLoad={onMapLoad}
        >
          <Marker
            position={currentLocation}
            icon={
              isLoaded
                ? {
                    url: 'police.avif',
                    scaledSize: new window.google.maps.Size(40, 40),
                  }
                : undefined
            }
          />

          {sosAlerts.map((sos, index) => (
            <Marker
              key={sos._id || index} // Added optional fallback to index
              position={sos.location}
              icon={
                isLoaded
                  ? {
                      url: 'police.avif',
                      scaledSize: new window.google.maps.Size(40, 40),
                    }
                  : undefined
              }
            />
          ))}
        </GoogleMap>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-2">Active SOS Alerts</h2>
        {sosAlerts.length === 0 ? (
          <p>No active SOS alerts.</p>
        ) : (
          <div className="space-y-4">
            {sosAlerts.map((sos, index) => (
              <div key={sos._id || index} className="border p-4 rounded bg-red-50"> {/* Added optional fallback to index */}
                <p>
                  <strong>Emergency Alert</strong>
                </p>
                <p>User ID: {sos.userId}</p>
                <p>
                  Location: {sos.location.lat.toFixed(6)},{' '}
                  {sos.location.lng.toFixed(6)}
                </p>
                <button
                  onClick={() => acceptSOS(sos)}
                  className="bg-blue-600 text-white p-2 rounded mt-2 hover:bg-blue-700"
                >
                  Accept & Respond
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}