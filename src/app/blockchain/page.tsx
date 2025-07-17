"use client"
import React, { useState, useRef, useEffect } from 'react';
import { ethers } from 'ethers';

// Ensure you have the Google Maps library type definitions installed:
// npm install --save-dev @types/google.maps

const contractAbi = [
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "string",
          "name": "reportId",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "reportData",
          "type": "string"
        }
      ],
      "name": "ReportReceived",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "reportId",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "reportData",
          "type": "string"
        }
      ],
      "name": "receiveReport",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
];

const contractAddress = "0x9a6C46F22C797a617AEbAaC455EeFf6689A538e2";

// IMPORTANT: This should be in a secure environment variable in production
// Never expose private keys in frontend code in a real application
const HARDCODED_PRIVATE_KEY = "e32b6c1396014df244c3105909f3598b39395aa0fb699452f40389a2070f26a9"; // Replace with your actual private key

// Replace with your Google Maps API key
const GOOGLE_MAPS_API_KEY = "AIzaSyBURKoHDahIVHQi0HKWEpZBWAu9dvMohpE"; // Should be in environment variables in production

interface CrimeReportData {
    title: string;
    description: string;
    location_name: string;
    coordinates: [number, number] | null; // [longitude, latitude]
    crimeTime: string;
    images?: string[];  // Changed to store image hashes instead of full base64
    videos?: string[];
    videoDescription?: string;
}

const CrimeReportForm = () => {
    const [formData, setFormData] = useState<CrimeReportData>({
        title: '',
        description: '',
        location_name: '',
        coordinates: null,
        crimeTime: new Date().toISOString().slice(0, 16), // Format: YYYY-MM-DDThh:mm
        images: [],
    });
    
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [txHash, setTxHash] = useState('');
    const [imagePreview, setImagePreview] = useState<string[]>([]);
    const [originalImages, setOriginalImages] = useState<string[]>([]);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const locationInputRef = useRef<HTMLInputElement>(null);
    const placesAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    
    // Load Google Maps API script
    useEffect(() => {
        // Check if Google Maps script is already loaded
        if (!window.google?.maps?.places) {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
            script.async = true;
            script.defer = true;
            script.onload = initPlacesAutocomplete;
            document.head.appendChild(script);
            
            return () => {
                // Clean up script if component unmounts during loading
                document.head.removeChild(script);
            };
        } else {
            // Initialize if script is already loaded
            initPlacesAutocomplete();
        }
    }, []);
    
    const initPlacesAutocomplete = () => {
        if (locationInputRef.current && window.google?.maps?.places) {
            placesAutocompleteRef.current = new google.maps.places.Autocomplete(
                locationInputRef.current,
                { types: ['geocode', 'establishment'] }
            );
            
            // Add listener for place selection
            placesAutocompleteRef.current.addListener('place_changed', handlePlaceSelect);
        }
    };
    
    const handlePlaceSelect = () => {
        if (placesAutocompleteRef.current) {
            const place = placesAutocompleteRef.current.getPlace();
            
            if (place.geometry && place.formatted_address) {
                const lat = place.geometry.location?.lat();
                const lng = place.geometry.location?.lng();
                
                // Update form data with location info
                setFormData(prev => ({
                    ...prev,
                    location_name: place.formatted_address || place.name || '',
                    coordinates: lng !== undefined && lat !== undefined ? [lng, lat] : null
                }));
            }
        }
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        // Special handling for location_name to reset coordinates when manually edited
        if (name === 'location_name' && locationInputRef.current === document.activeElement) {
            setFormData(prev => ({ 
                ...prev, 
                [name]: value,
                // Only reset coordinates if user is manually typing and not selecting from dropdown
                coordinates: null
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    // Function to create a hash of an image instead of sending the full base64
    const hashImage = async (base64String: string): Promise<string> => {
        const encoder = new TextEncoder();
        const data = encoder.encode(base64String);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    };
    
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newPreviews: string[] = [...imagePreview];
            const newOriginals: string[] = [...originalImages];
            const newImageHashes: string[] = [...(formData.images || [])];
            
            for (const file of Array.from(e.target.files)) {
                if (file.type.startsWith('image/')) {
                    try {
                        const base64String = await readFileAsDataURL(file);
                        
                        // Store original for preview
                        newOriginals.push(base64String);
                        newPreviews.push(base64String);
                        
                        // Hash the image and store the hash
                        const imageHash = await hashImage(base64String);
                        newImageHashes.push(imageHash);
                    } catch (err) {
                        console.error("Error processing image:", err);
                    }
                }
            }
            
            // Update state
            setOriginalImages(newOriginals);
            setImagePreview(newPreviews);
            setFormData(prev => ({ ...prev, images: newImageHashes }));
            
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };
    
    const readFileAsDataURL = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    resolve(event.target.result as string);
                } else {
                    reject(new Error("Failed to read file"));
                }
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });
    };
    
    const removeImage = (index: number) => {
        const newOriginals = [...originalImages];
        const newPreviews = [...imagePreview];
        const newImageHashes = [...(formData.images || [])];
        
        newOriginals.splice(index, 1);
        newPreviews.splice(index, 1);
        newImageHashes.splice(index, 1);
        
        setOriginalImages(newOriginals);
        setImagePreview(newPreviews);
        setFormData(prev => ({ ...prev, images: newImageHashes }));
    };
    
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);
        setTxHash('');
    
        try {
            console.log("Starting submission process...");
            
            // Connect to provider - using a public RPC endpoint instead of MetaMask
            console.log("Connecting to provider...");
            const provider = new ethers.JsonRpcProvider("https://sepolia.infura.io/v3/eace6f939924423b99717199157688cb");
            
            // Create wallet from hardcoded private key
            const wallet = new ethers.Wallet(HARDCODED_PRIVATE_KEY, provider);
            console.log("Using wallet:", wallet.address);
    
            // Get network details
            const network = await provider.getNetwork();
            console.log("Network:", network.name);
    
            // Calculate gas requirements
            console.log("Calculating gas requirements...");
            
            let gasPrice;
            try {
                const feeData = await provider.getFeeData();
                if (feeData.gasPrice) {
                    gasPrice = feeData.gasPrice;
                } else {
                    // Fallback if gasPrice is null
                    const averageGasPrice = await provider.send("eth_gasPrice", []);
                    gasPrice = BigInt(averageGasPrice);
                }
            } catch (feeError) {
                console.warn("Error getting fee data:", feeError);
                // Fallback to manual gas price
                gasPrice = ethers.parseUnits("5", "gwei");
            }
            
            console.log("Current gas price:", ethers.formatUnits(gasPrice, "gwei"), "gwei");
            
            // Create contract instance with the hardcoded wallet
            console.log("Creating contract instance...");
            const contract = new ethers.Contract(
                contractAddress,
                contractAbi,
                wallet
            );
    
            // Generate a random report ID
            const reportId = `crime-report-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
            
            // Create a new formData object with image data
            const reportSubmitData = {
                ...formData,
                // Send image hashes and original base64 data for backend processing
                imageData: originalImages,
                isAnonymous: true,
            };
            
            // Estimate gas for the transaction
            const gasEstimate = await contract.receiveReport.estimateGas(
                reportId, 
                JSON.stringify(reportSubmitData)
            );
            
            console.log("Estimated gas:", gasEstimate.toString());
            
            // Add a buffer to ensure we have enough gas
            const gasLimit = gasEstimate * BigInt(120) / BigInt(100); // 20% buffer
            
            // Submit report using the hardcoded wallet with explicit gas settings
            console.log("Submitting report via contract...");
            const tx = await contract.receiveReport(reportId, JSON.stringify(reportSubmitData), {
                gasLimit: gasLimit,
                gasPrice: gasPrice  // Use the gas price we calculated earlier
            });
            
            console.log("Report transaction sent:", tx.hash);
            setTxHash(tx.hash);
            
            console.log("Waiting for report transaction confirmation...");
            const receipt = await tx.wait();
            console.log("Report transaction confirmed:", receipt);
    
            setSuccess(true);
            setFormData({
                title: '',
                description: '',
                location_name: '',
                coordinates: null,
                crimeTime: new Date().toISOString().slice(0, 16),
                images: [],
            });
            setImagePreview([]);
            setOriginalImages([]);
        } catch (err: any) {
            console.error('Error submitting report:', err);
            setError(err.message || 'Failed to submit report. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="report-form-container max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-center">Submit Anonymous Crime Report</h2>
            
            {success && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded">
                    <p className="font-bold">Report submitted successfully!</p>
                    <p>Your identity remains protected. Your report will be reviewed by authorities.</p>
                    {txHash && (
                        <p className="mt-2 text-sm">
                            Transaction hash: <span className="font-mono break-all">{txHash}</span>
                        </p>
                    )}
                </div>
            )}
            
            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
                    {error}
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-group">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                        Report Title: <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        placeholder="Brief title describing the incident"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                        Detailed Description: <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={8}
                        required
                        placeholder="Provide details about what happened, who was involved, and any other relevant information"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="location_name" className="block text-sm font-medium text-gray-700 mb-1">
                        Location: <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="location_name"
                        name="location_name"
                        ref={locationInputRef}
                        value={formData.location_name}
                        onChange={handleChange}
                        required
                        placeholder="Start typing an address or place name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {formData.coordinates && (
                        <div className="mt-1 text-xs text-gray-500">
                            Location coordinates: {formData.coordinates[1].toFixed(6)}, {formData.coordinates[0].toFixed(6)}
                        </div>
                    )}
                </div>
                
                <div className="form-group">
                    <label htmlFor="crimeTime" className="block text-sm font-medium text-gray-700 mb-1">
                        Date and Time of Incident: <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="datetime-local"
                        id="crimeTime"
                        name="crimeTime"
                        value={formData.crimeTime}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                
                {/* Image Upload Section */}
                <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Evidence Images:
                    </label>
                    <div className="mt-1 flex items-center">
                        <input
                            type="file"
                            id="imageUpload"
                            ref={fileInputRef}
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            className="sr-only"
                        />
                        <label
                            htmlFor="imageUpload"
                            className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Upload Images
                        </label>
                        <span className="ml-2 text-xs text-gray-500">
                            {imagePreview.length > 0 
                                ? `${imagePreview.length} image(s) selected` 
                                : 'No images selected'}
                        </span>
                    </div>
                    
                    {/* Image Preview */}
                    {imagePreview.length > 0 && (
                        <div className="mt-3 grid grid-cols-3 gap-3">
                            {imagePreview.map((src, index) => (
                                <div key={index} className="relative group">
                                    <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-md bg-gray-200">
                                        <img 
                                            src={src} 
                                            alt={`Preview ${index + 1}`} 
                                            className="object-cover h-24 w-full"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 focus:outline-none"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                <button 
                    type="submit" 
                    disabled={loading || !formData.title.trim() || !formData.description.trim() || !formData.location_name.trim()}
                    className={`w-full py-3 px-4 rounded-md text-white font-medium
                        ${loading || !formData.title.trim() || !formData.description.trim() || !formData.location_name.trim()
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                        }`}
                >
                    {loading ? 'Submitting...' : 'Submit Anonymous Report'}
                </button>
            </form>
            
            <div className="mt-8 border-t pt-6 text-sm text-gray-600">
                <p className="font-bold mb-2">Privacy & Security:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Your report is submitted anonymously through a blockchain-based system.</li>
                    <li>Your identity is protected throughout the process.</li>
                    <li>Your IP address is not tracked or stored.</li>
                    <li>Only the information you provide in this form is recorded.</li>
                    <li>This platform is designed for legitimate crime reporting only.</li>
                </ul>
            </div>
        </div>
    );
};

export default CrimeReportForm;