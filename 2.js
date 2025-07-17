const {Web3} = require('web3');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const cloudinary = require('cloudinary').v2;
const { Buffer } = require('buffer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dvqumgwni',
  api_key: '766573831194222',
  api_secret: 'mbkeZ5yJg3sxxsFShA7_TV6u58o'
});

// Connect to MongoDB
mongoose.connect("mongodb+srv://ankit:ankit@cluster0.tiwrhj1.mongodb.net/UDOO?retryWrites=true&w=majority&appName=Cluster0", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define the CrimeReport schema based on the provided structure
const crimeReportSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  location_name: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'], required: true, default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  images: [{ type: String }],
  videos: [{ type: String }],
  videoDescription: { type: String },
  reportedBy: { type: String, default: "anonymous" }, // For blockchain reports, always anonymous
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  comments: [{ type: Schema.Types.ObjectId, ref: "comment" }],
  verified: { type: Boolean, default: false },
  verificationScore: { type: Number, default: 0 },
  crimeTime: { type: Date, default: Date.now },
  isAnonymous: { type: Boolean, default: true }, // Always true for blockchain reports
  suspicionLevel: { type: Number, default: -1 },
  isBanned: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['verified', 'investigating', 'resolved', 'not verified', 'fake'], default: 'not verified' },
  createdAt: { type: Date, default: Date.now },
  // Additional fields for blockchain tracking
  blockNumber: Number,
  transactionHash: String
});

const CrimeReport = mongoose.model('CrimeReport', crimeReportSchema);

// Connect to Ethereum
const web3 = new Web3("wss://sepolia.infura.io/ws/v3/eace6f939924423b99717199157688cb");
const contractABI = [
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
const contract = new web3.eth.Contract(contractABI, contractAddress);


// Function to upload base64 image to Cloudinary
async function uploadToCloudinary(base64Image) {
    try {
        // Check if the image is too large (>10MB)
        if (base64Image.length > 10 * 1024 * 1024) {
            console.warn('Image too large, reducing quality');
            // Could implement resizing logic here
        }
        
        // Extract the actual base64 string (remove data:image/jpeg;base64, prefix)
        const parts = base64Image.split(',');
        const mimePart = parts[0];
        const base64Data = parts[1];
        
        // Get the correct mime type from the prefix
        const mimeType = mimePart.match(/data:(.*?);/)[1];
        
        // Upload to cloudinary
        const result = await cloudinary.uploader.upload(`${mimePart},${base64Data}`, {
            folder: 'crime-reports',
            resource_type: 'auto'
        });
        
        //console.log('Image uploaded to Cloudinary:', result.secure_url);
        return result.secure_url;
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        return null;
    }
}

// Function to start listening for events
async function listenForEvents() {
    try {
        // Get the latest block number
        const latestBlock = await web3.eth.getBlockNumber();
        
        // Set up the event subscription
        const eventEmitter = contract.events.ReportReceived({
            fromBlock: latestBlock
        });
        
        // Event handlers
        eventEmitter.on('data', async (event) => {
            //console.log('New event received:', event.event);
            const { reportId, reportData } = event.returnValues;
            
            try {
                // Parse the JSON data from the blockchain
                const reportDataObj = JSON.parse(reportData);
                
                // Upload images to Cloudinary if they exist
                let cloudinaryImageUrls = [];
                if (reportDataObj.imageData && reportDataObj.imageData.length > 0) {
                    //console.log(Processing ${reportDataObj.imageData.length} images from imageData...);
                    
                    // Process each image
                    const uploadPromises = reportDataObj.imageData.map(base64Image => 
                        uploadToCloudinary(base64Image)
                    );
                    
                    // Wait for all uploads to complete
                    const results = await Promise.all(uploadPromises);
                    
                    // Filter out any failed uploads
                    cloudinaryImageUrls = results.filter(url => url !== null);
                    //console.log(Successfully uploaded ${cloudinaryImageUrls.length} images to Cloudinary);
                }
                
                // Create a new crime report with the required fields
                const crimeReport = new CrimeReport({
                    title: reportDataObj.title,
                    description: reportDataObj.description,
                    location_name: reportDataObj.location_name,
                    location: {
                        type: 'Point',
                        coordinates: reportDataObj.coordinates || [0, 0] // Default if not provided
                    },
                    images: cloudinaryImageUrls, // Store Cloudinary URLs
                    videos: reportDataObj.videos || [],
                    videoDescription: reportDataObj.videoDescription || '',
                    reportedBy: "anonymous", // Always anonymous for blockchain reports
                    crimeTime: reportDataObj.crimeTime ? new Date(reportDataObj.crimeTime) : new Date(),
                    isAnonymous: true, // Always true for blockchain reports
                    blockNumber: Number(event.blockNumber),
                    transactionHash: event.transactionHash
                });
                
                await crimeReport.save();
                //console.log(Crime Report ${reportId} saved to MongoDB with ${cloudinaryImageUrls.length} images);
            } catch (err) {
                console.error('Error parsing or saving report:', err);
            }
        });
        
        eventEmitter.on('connected', (subscriptionId) => {
            //console.log(Subscription established with ID: ${subscriptionId});
        });
        
        eventEmitter.on('error', (error) => {
            console.error('Error on event subscription:', error);
            // Try to reconnect
            setTimeout(listenForEvents, 5000);
        });
        
        //console.log('Event listener set up successfully');
    } catch (error) {
        console.error('Failed to set up event listener:', error);
        // Try to reconnect
        setTimeout(listenForEvents, 5000);
    }
}

// Start listening
listenForEvents();

// Handle WebSocket connection issues
web3.currentProvider.on('error', () => {
    console.error('WebSocket error. Reconnecting...');
    reconnect();
});

web3.currentProvider.on('end', () => {
    //console.log('WebSocket connection closed. Reconnecting...');
    reconnect();
});

function reconnect() {
    // Create a new provider
    const newProvider = new Web3.providers.WebsocketProvider("wss://sepolia.infura.io/ws/v3/eace6f939924423b99717199157688cb");
    web3.setProvider(newProvider);
    
    // Set up new event handlers
    setTimeout(listenForEvents, 5000);
}

// Keep the process running
process.on('SIGINT', async () => {
    //console.log('Closing connections...');
    await mongoose.connection.close();
    process.exit(0);
});

//console.log('Listener is running and waiting for events...');