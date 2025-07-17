'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useJsApiLoader, GoogleMap } from '@react-google-maps/api'

// Define crime type colors with proper TypeScript typing
type CrimeType = 'theft' | 'assault' | 'burglary' | 'vandalism' | 'harassment' | 'other' | 'mixed';
type Libraries = Array<'places' | 'visualization' | 'routes'>;

const crimeColors: Record<CrimeType, string> = {
  'theft': '#FF5733', // Red-orange
  'assault': '#C70039', // Dark red
  'burglary': '#900C3F', // Burgundy
  'vandalism': '#581845', // Purple
  'harassment': '#FFC300', // Yellow
  'other': '#808080', // Gray
  'mixed': '#2874A6'  // Blue
};

interface LegendItem {
  type: string;
  label: string;
  color: string;
}

interface Hotspot {
  center: [number, number];
  radius: number;
  density: number;
  primary_type: string;
  _id?: string;
  count?: number;
  method?: string;
}

// Helper function to safely get color based on crime type
const getColorForCrimeType = (type: string): string => {
  return (type in crimeColors) 
    ? crimeColors[type as CrimeType] 
    : crimeColors.other;
};

// Component for Google Maps
const HotspotMap = ({ hotspots }: { hotspots: Hotspot[] }) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [circles, setCircles] = useState<google.maps.Circle[]>([]);
  
  const libraries = ['places', 'visualization', 'routes'] as Libraries;
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP_API as string,
    libraries: libraries,
  });

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    
    // If we have hotspots, adjust the map bounds to fit them all
    if (hotspots.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      
      hotspots.forEach(hotspot => {
        const [lng, lat] = hotspot.center;
        bounds.extend(new google.maps.LatLng(lat, lng));
      });
      
      map.fitBounds(bounds);
      
      // Add some padding to the bounds
      google.maps.event.addListenerOnce(map, 'idle', () => {
        if (map && map.getZoom() !== undefined) {
          map.setZoom((map.getZoom() ?? 12) - 1);
        }
      });
    }
  }, [hotspots]);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  useEffect(() => {
    // Clear previous circles when hotspots change or component unmounts
    return () => {
      circles.forEach(circle => {
        if (circle) circle.setMap(null);
      });
    };
  }, [circles]);

  useEffect(() => {
    // Create new circles only when map is loaded and available
    if (map && hotspots.length > 0) {
      // Clear any existing circles first
      circles.forEach(circle => circle.setMap(null));
      
      const newCircles = hotspots.map(hotspot => {
        const [lng, lat] = hotspot.center;
        const color = getColorForCrimeType(hotspot.primary_type);
        
        // Calculate opacity based on density
        const opacity = Math.min(0.3 + (hotspot.density / 10), 0.8);
        
        const circle = new google.maps.Circle({
          strokeColor: color,
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: color,
          fillOpacity: opacity,
          map: map,
          center: { lat, lng },
          radius: hotspot.radius * 1000, // Convert to meters
          clickable: true
        });
        
        // Add info window for when circle is clicked
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 12px;">
              <h3 style="margin: 0 0 8px 0; font-weight: bold;">Crime Hotspot</h3>
              <p><strong>Type:</strong> ${hotspot.primary_type.charAt(0).toUpperCase() + hotspot.primary_type.slice(1)}</p>
              <p><strong>Density:</strong> ${hotspot.density.toFixed(2)}</p>
              ${hotspot.count ? `<p><strong>Count:</strong> ${hotspot.count}</p>` : ''}
              ${hotspot.method ? `<p><strong>Detection method:</strong> ${hotspot.method}</p>` : ''}
            </div>
          `
        });
        
        circle.addListener('click', () => {
          infoWindow.setPosition({ lat, lng });
          infoWindow.open(map);
        });
        
        return circle;
      });
      
      setCircles(newCircles);
    }
  }, [map, hotspots]);

  if (!isLoaded) return <div className="w-full h-96 flex items-center justify-center">Loading Maps...</div>;

  return (
    <GoogleMap
      mapContainerClassName="w-full h-96 rounded-md border border-gray-300 overflow-hidden"
      center={{ lat: 21.1702, lng: 72.8311 }} // Default center on Surat
      zoom={12}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      }}
    />
  );
};

const getLegendItems = (): LegendItem[] => {
  const baseTypes = {
    'theft': 'Theft',
    'assault': 'Assault',
    'burglary': 'Burglary',
    'vandalism': 'Vandalism',
    'harassment': 'Harassment',
    'other': 'Other',
    'mixed': 'Multiple Types'
  };

  return Object.entries(baseTypes).map(([type, label]): LegendItem => ({
    type,
    label,
    color: getColorForCrimeType(type)
  }));
};

// Sample data for testing if API doesn't work
const sampleHotspots: Hotspot[] = [
  {
    center: [72.8311, 21.1702], // Surat coordinates
    radius: 2,
    density: 4.2,
    primary_type: 'theft'
  },
  {
    center: [72.8411, 21.1802],
    radius: 1.5,
    density: 3.1,
    primary_type: 'assault'
  },
  {
    center: [72.8211, 21.1602],
    radius: 1,
    density: 2.5,
    primary_type: 'burglary'
  }
];

// Add global declaration for Google Maps types
declare global {
  interface Window {
    google: any;
  }
}

export default function CrimeHotspots() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]) // Initialize with empty array
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [useSampleData, setUseSampleData] = useState(false)

  useEffect(() => {
    const fetchHotspots = async () => {
      try {
        const response = await fetch('/api/hotspot', {
          headers: {
          }
        })
        
        if (!response.ok) throw new Error('Failed to fetch hotspots')
        
        const data = await response.json()
        console.log('Fetched hotspots:', data); // Debug log
        
        let processedHotspots: Hotspot[] = [];
        
        if (Array.isArray(data)) {
          // Process each hotspot and swap lat/lng
          processedHotspots = data.map((item, index) => {
            const processed = { ...item };
            
            if (processed.center && Array.isArray(processed.center) && processed.center.length === 2) {
              // Swap longitude and latitude
              processed.center = [
                typeof processed.center[1] === 'number' ? processed.center[1] : parseFloat(processed.center[1]),
                typeof processed.center[0] === 'number' ? processed.center[0] : parseFloat(processed.center[0])
              ];
            } else {
              console.warn(`Hotspot ${index} has invalid center:`, processed.center);
              // Use a fallback center for Surat with small random offset
              const randomOffset = (Math.random() - 0.5) * 0.05;
              processed.center = [72.8311 + randomOffset, 21.1702 + randomOffset];
            }
            
            return processed;
          });
        } else if (data.clusters && Array.isArray(data.clusters)) {
          // Same processing for clusters
          processedHotspots = data.clusters.map((item:any, index:any) => {
            const processed = { ...item };
            
            if (processed.center && Array.isArray(processed.center) && processed.center.length === 2) {
              // Swap longitude and latitude
              processed.center = [
                typeof processed.center[1] === 'number' ? processed.center[1] : parseFloat(processed.center[1]),
                typeof processed.center[0] === 'number' ? processed.center[0] : parseFloat(processed.center[0])
              ];
            } else {
              console.warn(`Cluster ${index} has invalid center:`, processed.center);
              const randomOffset = (Math.random() - 0.5) * 0.05;
              processed.center = [72.8311 + randomOffset, 21.1702 + randomOffset];
            }
            
            return processed;
          });
        } else {
          console.error('Unexpected data format:', data);
          setError('Received data in unexpected format');
          setHotspots([]);
        }
        
        console.log('Processed hotspots:', processedHotspots);
        setHotspots(processedHotspots);
      } catch (err: any) {
        console.error('Error fetching hotspots:', err);
        setError(err?.message || 'An error occurred while fetching hotspots')
        setHotspots([]);
      } finally {
        setLoading(false)
      }
    }
  
    if (!useSampleData) {
      fetchHotspots()
    } else {
      setHotspots(sampleHotspots);
      setLoading(false);
    }
  }, [useSampleData]);

  const toggleSampleData = () => {
    setUseSampleData(prev => !prev);
  };
  
  console.log('Rendering with hotspots:', hotspots);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Crime Hotspots</CardTitle>
        <button 
          onClick={toggleSampleData}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {useSampleData ? 'Use API Data' : 'Use Sample Data'}
        </button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="p-4 text-center">Loading hotspot data...</div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">Error: {error}</div>
        ) : hotspots.length === 0 ? (
          <div className="p-4 text-center">No hotspot data available</div>
        ) : (
          <HotspotMap hotspots={hotspots} />
        )}
        <div className="mt-4 grid grid-cols-3 gap-4">
          {getLegendItems().map(({ type, label, color }) => (
            <div key={type} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded" 
                style={{ backgroundColor: color }}
              />
              <span className="capitalize">{label}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Note: Darker/more opaque circles indicate higher density crime areas
        </p>
      </CardContent>
    </Card>
  )
}