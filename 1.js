// // server.js
// const express = require('express');
// const http = require('http');
// const { Server } = require('socket.io');
// const mongoose = require('mongoose');
// const cors = require('cors');
// require('dotenv').config();

// // MongoDB connection function
// async function dbConnect() {
//   try {
//     await mongoose.connect("mongodb+srv://ankit:ankit@cluster0.tiwrhj1.mongodb.net/UDOO?retryWrites=true&w=majority&appName=Cluster0");
//     console.log('Connected to MongoDB');
//   } catch (error) {
//     console.error('MongoDB connection error:', error);
//     process.exit(1);
//   }
// }

// // Interface types (for reference)
// /**
//  * @typedef {Object} LocationData
//  * @property {number} lat
//  * @property {number} lng
//  */

// /**
//  * @typedef {Object} SosAlertData
//  * @property {string} sosId
//  * @property {string} userId
//  * @property {LocationData} location
//  */

// /**
//  * @typedef {Object} SosAcceptedData
//  * @property {string} sosId
//  * @property {string} policeId
//  * @property {LocationData} policeLocation
//  */

// /**
//  * @typedef {Object} PoliceLocationUpdateData
//  * @property {string} sosId
//  * @property {string} policeId
//  * @property {LocationData} location
//  */

// /**
//  * @typedef {Object} SosCompletedData
//  * @property {string} sosId
//  * @property {string} policeId
//  */

// // Initialize express app
// const app = express();
// app.use(cors());
// app.use(express.json());

// // Create HTTP server
// const server = http.createServer(app);

// // Initialize Socket.IO
// const io = new Server(server, {
//   cors: {
//     origin: '*', // Adjust this according to your security requirements
//     methods: ['GET', 'POST']
//   }
// });

// // API health check route
// app.get('/api/socket', (req, res) => {
//   res.json({ message: 'Socket API is running' });
// });

// // Connect to MongoDB when server starts
// (async function startServer() {
//   await dbConnect();
  
//   // Socket.IO connection handling
//   io.on('connection', (socket) => {
//     console.log('A user connected', socket.id);
    
//     // Listen to 'sos-alert'
//     socket.on('sos-alert', (data) => {
//       // Broadcast to all police users
//       console.log('SOS alert received:', data);
//       socket.broadcast.emit('sos-alert', data);
//     });
    
//     // Listen to 'sos-accepted'
//     socket.on('sos-accepted', (data) => {
//       // Notify the user who sent the SOS
//       console.log('SOS accepted:', data);
//       socket.broadcast.emit('sos-accepted', data);
//       // Notify other police officers
//       socket.broadcast.emit('sos-accepted-by-other', data.sosId);
//     });
    
//     // Listen to 'police-location-update'
//     socket.on('police-location-update', (data) => {
//       // Send to the user who sent the SOS
//       console.log('Police location update:', data);
//       socket.broadcast.emit('police-location-update', data);
//     });
    
//     // Listen to 'sos-cancelled'
//     socket.on('sos-cancelled', (sosId) => {
//       console.log('SOS cancelled:', sosId);
//       // Pass the sosId to all clients, including police officers
//       socket.broadcast.emit('sos-cancelled', sosId);
//     });
    
//     // Listen to 'sos-completed'
//     socket.on('sos-completed', (data) => {
//       console.log('SOS completed:', data);
//       socket.broadcast.emit('sos-completed', data.sosId);
//     });
    
//     socket.on('disconnect', () => {
//       console.log('User disconnected');
//     });
//   });
  
//   // Start the server
//   const PORT = 5000;
//   server.listen(PORT, () => {
//     console.log(`Socket.IO server running on port ${PORT}`);
//   });
// })();



// server.js - with Hotspot Notification additions
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const CrimeHotspot = require('./src/db/mongodb/models/CrimeHotspot.js'); // Adjust the path as necessary

// MongoDB connection function
async function dbConnect() {
  try {
    await mongoose.connect("mongodb+srv://ankit:ankit@cluster0.tiwrhj1.mongodb.net/UDOO?retryWrites=true&w=majority&appName=Cluster0");
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}



// Initialize express app
const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*', // Adjust this according to your security requirements
    methods: ['GET', 'POST']
  }
});

// API health check route
app.get('/api/socket', (req, res) => {
  res.json({ message: 'Socket API is running' });
});

// Connect to MongoDB when server starts
async function ensureTestHotspots() {
  try {
    const existingHotspots = await CrimeHotspot.findOne({});
    if (!existingHotspots) {
      // console.log('Creating test hotspots...');
      await CrimeHotspot.create({
        clusters: [
          {
            center: [-77.03131835344179, 38.910676563868], // White House area
            radius: 500, // 500 meters
            primary_type: 'TEST_CRIME',
            density: 75
          },
          {
            center: [-77.036560, 38.897957], // Another DC location
            radius: 500,
            primary_type: 'TEST_CRIME_2',
            density: 65
          }
        ]
      });
      // console.log('Test hotspots created successfully');
    }
  } catch (error) {
    console.error('Error creating test hotspots:', error);
  }
}

(async function startServer() {
  await dbConnect();
  await ensureTestHotspots();

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log('A user connected', socket.id);
    
    // Map to track which users have already been notified about specific hotspots
    // to prevent duplicate notifications
    const userHotspotNotifications = new Map();

    // Listen to 'sos-alert'
    socket.on('sos-alert', (data) => {
      console.log('SOS alert received:', data);
      socket.broadcast.emit('sos-alert', data);
    });

    // Listen to 'sos-accepted'
    socket.on('sos-accepted', (data) => {
      console.log('SOS accepted:', data);
      socket.broadcast.emit('sos-accepted', data);
      // Notify other police officers
      socket.broadcast.emit('sos-accepted-by-other', data.sosId);
    });

    // Listen to 'police-location-update'
    socket.on('police-location-update', (data) => {
      console.log('Police location update:', data);
      socket.broadcast.emit('police-location-update', data);
    });

    // Listen to 'sos-cancelled'
    socket.on('sos-cancelled', (sosId) => {
      console.log('SOS cancelled:', sosId);
      socket.broadcast.emit('sos-cancelled', sosId);
    });

    // Listen to 'sos-completed'
    socket.on('sos-completed', (data) => {
      console.log('SOS completed:', data);
      socket.broadcast.emit('sos-completed', data.sosId);
    });

    // NEW: Listen for user location updates to check hotspots
    // Inside the socket.on('user-location-update') handler:

// Replace the existing user-location-update handler with this version:
socket.on('user-location-update', async (data) => {
  try {
    console.log('📍 User location update received:', data);
    
    // Enhanced validation
    if (!data.location?.lat || !data.location?.lng) {
      console.error('❌ Invalid location data:', data.location);
      return;
    }
    
    if (!data.userId) {
      console.error('❌ No userId provided');
      return;
    }

    const matchingHotspots = await checkUserInHotspot(data.location);
    console.log(`✓ Found ${matchingHotspots.length} hotspots for user ${data.userId}`);

    if (matchingHotspots.length > 0) {
      const hotspot = matchingHotspots[0];
      const notification = {
        hotspotInfo: {
          center: hotspot.center,
          radius: hotspot.radius,
          crimeType: hotspot.primary_type || 'Unknown',  // Fallback if type is missing
          density: hotspot.density
        },
        message: `⚠️ Warning: You are entering a high crime area. Recent incidents: ${hotspot.primary_type}`,
        timestamp: new Date()
      };

      // console.log('🔔 Sending notification to user:', data.userId);
      socket.emit('hotspot-alert', notification);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
});

    // NEW: Listen for hotspot-alert broadcasts from server-side processes
    socket.on('hotspot-alert', (data) => {
      // console.log('Hotspot alert to broadcast:', data);
      
      // Find the socket for the specific user and emit to them
      const targetUserId = data.userId;
      
      // If this is a system-generated alert, broadcast to the specific user
      // In a production system, you would store user socket mappings
      // This is a simplified version
      io.to(socket.id).emit('hotspot-alert', data);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });

  // Start the server
  const PORT = 5000;
  server.listen(PORT, () => {
    console.log(`Socket.IO server running on port ${PORT}`);
  });
})();

// Update the checkUserInHotspot function to handle coordinate order correctly
async function checkUserInHotspot(userLocation) {
  try {
    const hotspotData = await CrimeHotspot.findOne({}).lean();
    
    if (!hotspotData?.clusters) return [];
    
    // Make sure these are numbers, not strings
    const userPoint = [
      Number(userLocation.lat), 
      Number(userLocation.lng)
    ];
    
    // console.log('User coordinates:', userPoint);
    
    const matchingHotspots = hotspotData.clusters.filter(cluster => {
      // Convert hotspot coordinates - make sure these are numbers too
      const hotspotPoint = [
        Number(cluster.center[1]), 
        Number(cluster.center[0])
      ];
      
      const distance = calculateDistance(hotspotPoint, userPoint);
      const radiusInKm = cluster.radius / 1000;
      
      // console.log(`Checking hotspot:`, {
      //   hotspotCoords: hotspotPoint,
      //   userCoords: userPoint,
      //   distance: distance.toFixed(3) + ' km',
      //   radius: radiusInKm.toFixed(3) + ' km'
      // });
      
      return distance <= radiusInKm;
    });
    
    return matchingHotspots;
  } catch (error) {
    console.error('Error checking hotspots:', error);
    return [];
  }
}

// Update the calculateDistance function
function calculateDistance(point1, point2) {
  // Both points are in [lat, lng] format
  const [lat1, lng1] = point1;
  const [lat2, lng2] = point2;
  
  // Quick check for identical points
  if (lat1 === lat2 && lng1 === lng2) {
    return 0;
  }
  
  // Convert to radians
  const lat1Rad = Number(lat1) * Math.PI / 180;
  const lat2Rad = Number(lat2) * Math.PI / 180;
  const lng1Rad = Number(lng1) * Math.PI / 180;
  const lng2Rad = Number(lng2) * Math.PI / 180;
  
  const R = 6371; // Earth's radius in kilometers
  const dLat = lat2Rad - lat1Rad;
  const dLng = lng2Rad - lng1Rad;
  
  // Haversine formula
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance;
}