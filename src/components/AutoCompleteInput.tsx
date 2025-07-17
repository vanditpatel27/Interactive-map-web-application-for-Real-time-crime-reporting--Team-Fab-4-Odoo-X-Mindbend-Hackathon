import { Address } from "@/types";
import { useEffect, useRef, useState } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Loader2, MapPin } from "lucide-react";
import { cn } from "@/libs/utils";

interface AutoCompleteInputProps {
  address: Address | null;
  setAddress: (address: Address) => void;
  as?: string;
  value?: string;
  placeholder?: string;
  className?: string;
  label?: string;
  required?: boolean;
}

export default function AutoCompleteInput({
  address, 
  setAddress, 
  as, 
  value, 
  placeholder = "Search and Select a Location", 
  className,
  label = "Location",
  required = true
}: AutoCompleteInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  
  // Initialize Google Maps Autocomplete
  useEffect(() => {
    if (!inputRef.current || !window.google) return;
    
    setLoading(true);
    
    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, { 
      componentRestrictions: { country: "in" },
      fields: ["address_components", "formatted_address", "geometry"]
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      
      if (!place.geometry || !place.geometry.location) {
        if(inputRef.current) inputRef.current.value = "";
        return;
      }

      setAddress({
        location: {
          lng: place.geometry.location.lng(),
          lat: place.geometry.location.lat(),
        },
        name: inputRef.current?.value || place.formatted_address,
      });
    });
    
    setLoading(false);

    return () => {
      google.maps.event.clearListeners(autocomplete, 'place_changed');
    };
  }, [setAddress]);

  // For custom rendering as a plain input
  if (as) {
    return (
      <div className="relative w-full">
        <div className="flex items-center">
          <MapPin className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            className={cn(
              "pl-9 text-ellipsis bg-transparent outline-none block w-full",
              loading && "pr-9",
              className
            )}
            defaultValue={value || address?.name}
            placeholder={placeholder}
            required={required}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          {loading && (
            <Loader2 className="absolute right-3 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        {focused && (
          <div className="absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-[#a9b2f7] to-[#1e8b4a] rounded-full transform origin-left transition-transform duration-300 ease-out" />
        )}
      </div>
    );
  }

  // Default rendering with label and styling
  return (
    <div className="w-full space-y-2">
      {label && <Label htmlFor="location-input">{label}{required && <span className="text-red-500 ml-1">*</span>}</Label>}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <MapPin className="h-4 w-4 text-muted-foreground" />
        </div>
        <Input
          id="location-input"
          ref={inputRef}
          type="text"
          defaultValue={value || address?.name}
          className={cn(
            "pl-9 w-full focus:ring-2 focus:ring-primary/20 transition-all",
            loading && "pr-9"
          )}
          placeholder={placeholder}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {loading && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
        {focused && (
          <div className="absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-[#a9b2f7] to-[#1e8b4a] rounded-full transform origin-left transition-all duration-300 ease-out" />
        )}
      </div>
    </div>
  );
}