"use client";

import AutoCompleteInput from "@/components/AutoCompleteInput";
import { MapProvider } from "@/components/MapProvider";
import { Sidebar } from "@/components/Sidebar";
import { Address, IEmergencyContact } from "@/types";
import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { SidebarToggle } from "@/components/SidebarToggle";
import { Phone, MapPin, Shield, User } from "lucide-react";
// Import the dummy police officers data function
import { getDummyPoliceOfficers } from "@/data/dummyPoliceOfficers";

export default function PoliceOfficers() {
  const [address, setAddress] = useState<Address | null>(null);
  const [officers, setOfficers] = useState<IEmergencyContact[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  useEffect(() => {
    // Check if we're on mobile and close sidebar by default
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false);
    }

    if (typeof window !== 'undefined' && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setAddress({
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
          });
        },
        () => {
          // Default location in India if geolocation fails (New Delhi coordinates)
          setAddress({
            location: {
              lat: 28.6139,
              lng: 77.2090,
            },
          });
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
    } else {
      // Default location for SSR (New Delhi)
      setAddress({
        location: {
          lat: 28.6139,
          lng: 77.2090,
        },
      });
    }
  }, []);

  useEffect(() => {
    if (!address || !address.location) return;
    
    setLoading(true);
    
    // Use setTimeout to simulate network delay
    setTimeout(() => {
      try {
        // Use our dummy police officers data
        const data = getDummyPoliceOfficers(
          address.location!.lat, 
          address.location!.lng
        );
        setOfficers(data.contacts);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 800); // Simulate loading delay
  }, [address]);

  const setUpdateStatus = (checked: boolean, officerId: string) => {
    console.log(`Officer ${officerId} information marked as outdated: ${checked}`);
    // Show a toast notification to improve UX
    alert(`Thank you for reporting. We'll verify the information for ${officerId} soon.`);
  };

  const getRankBadgeColor = (name: string) => {
    if (name.includes("Inspector")) {
      return "bg-blue-600 text-white";
    } else if (name.includes("Constable")) {
      return "bg-gray-600 text-white";
    } else if (name.includes("DSP") || name.includes("ACP")) {
      return "bg-purple-600 text-white";
    } else if (name.includes("SI") || name.includes("ASI")) {
      return "bg-green-600 text-white";
    } else {
      return "bg-blue-600 text-white";
    }
  };

  const getRank = (name: string) => {
    const ranks = ["Inspector", "Sub-Inspector", "SI", "DSP", "ACP", "Constable", "Head Constable", "ASI"];
    for (const rank of ranks) {
      if (name.includes(rank)) {
        return rank;
      }
    }
    return "Officer";
  };

  return (
    <div className="flex relative min-h-screen bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden" 
             onClick={() => setSidebarOpen(false)}
        />
      )}
      

      <main className="flex-1 p-4 md:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold text-blue-400">Police Officers</h1>
            <div className="block md:hidden">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2"
              >
                <SidebarToggle />
              </Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="w-full">
              <MapProvider>
                <AutoCompleteInput address={address} setAddress={setAddress} />
              </MapProvider>
            </div>
          </div>

          {address?.location && (
            <div className="text-sm text-gray-400 flex items-center gap-2">
              <MapPin size={14} />
              <span>
                Showing police officers near latitude: {address.location.lat.toFixed(4)}, 
                longitude: {address.location.lng.toFixed(4)}
              </span>
            </div>
          )}

          <div className="mt-4">
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : officers.length === 0 ? (
              <div className="bg-gray-800 bg-opacity-30 p-6 rounded-lg text-center">
                <p className="text-gray-300">No police officers found in this area</p>
                <p className="text-sm text-gray-400 mt-2">Try adjusting your location</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {officers.map((officer, i) => (
                  <div
                    key={i + officer.name}
                    className="bg-white bg-opacity-10 p-4 rounded-lg shadow hover:bg-opacity-15 transition-all"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-800 rounded-full p-2 flex items-center justify-center">
                          <User size={18} className="text-blue-200" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-blue-200">
                            {officer.name}
                          </h2>
                          <span className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${getRankBadgeColor(officer.name)}`}>
                            {getRank(officer.name)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 my-3">
                      <Phone size={16} className="text-blue-300" />
                      <a 
                        href={`tel:${officer.contact_number}`}
                        className="font-medium text-blue-300 hover:text-blue-200 transition-colors"
                      >
                        {officer.contact_number}
                      </a>
                    </div>

                    <div className="flex items-center gap-2 my-2">
                      <MapPin size={16} className="text-gray-400" />
                      <p className="text-sm text-gray-300 line-clamp-2">{officer.address}</p>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <Shield size={14} className="text-blue-500" />
                      <span className="text-xs text-blue-500">Police Emergency: 100</span>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-3 text-xs text-gray-400 pt-2 border-t border-gray-700">
                      <Checkbox 
                        id={`officer-${i}`} 
                        onCheckedChange={(checked) => 
                          setUpdateStatus(checked as boolean, officer.name)
                        }
                      />
                      <label htmlFor={`officer-${i}`} className="cursor-pointer">
                        Mark information as outdated
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}