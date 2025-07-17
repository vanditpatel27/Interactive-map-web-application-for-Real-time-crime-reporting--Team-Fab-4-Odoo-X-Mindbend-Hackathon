"use client"
import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

// Define interfaces
interface ICrimeReport {
  _id: string;
  title: string;
  description: string;
  location_name: string;
  location: {
    type: string;
    coordinates: number[];
  };
  images: string[];
  videos: string[];
  videoDescription?: string;
  reportedBy: string;
  upvotes: number;
  downvotes: number;
  comments: string[];
  verified: boolean;
  verificationScore: number;
  crimeTime: Date;
  isAnonymous: boolean;
  suspicionLevel: number;
  isBanned: boolean;
  updatedAt: Date;
  givenTo: string | null;
  status: 'verified' | 'investigating' | 'resolved' | 'not verified' | 'fake';
  createdAt: Date;
  priority?: 'high' | 'medium' | 'low';
}

interface IPoliceOfficer {
  _id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  isVerified: boolean;
  role: string;
  batchNo?: string;
  latitude?: string;
  longitude?: string;
  department?: string;
  rank?: string;
  joinDate?: Date;
  profileImage?: string;
  casesResolved?: number;
  casesInProgress?: number;
  successRate?: number;
}

// Sample data for a single police officer
const currentOfficer: IPoliceOfficer = {
  _id: "po1",
  name: "Inspector Rajesh Kumar",
  email: "rajesh.kumar@police.gov.in",
  phoneNumber: "+919876543210",
  isVerified: true,
  role: "police",
  batchNo: "IPS-2145",
  latitude: "28.6139",
  longitude: "77.2090",
  department: "Crime Branch",
  rank: "Inspector",
  joinDate: new Date("2015-06-15"),
  profileImage: "/profile.jpg",
  casesResolved: 147,
  casesInProgress: 4,
  successRate: 92
};

// Sample data for assigned reports
const assignedReports: ICrimeReport[] = [
  {
    _id: "cr1",
    title: "Mobile Theft at Lajpat Nagar Market",
    description: "iPhone 14 Pro stolen while shopping in crowded area",
    location_name: "Lajpat Nagar Central Market",
    location: {
      type: "Point",
      coordinates: [28.5700, 77.2300]
    },
    images: ["image1.jpg"],
    videos: [],
    reportedBy: "user1",
    upvotes: 5,
    downvotes: 0,
    comments: ["comment1"],
    verified: true,
    verificationScore: 8,
    crimeTime: new Date("2025-03-20T14:30:00"),
    isAnonymous: false,
    suspicionLevel: 3,
    isBanned: false,
    updatedAt: new Date("2025-03-20T16:45:00"),
    givenTo: "po1",
    status: "investigating",
    createdAt: new Date("2025-03-20T16:15:00"),
    priority: "medium"
  },
  {
    _id: "cr2",
    title: "Public Property Vandalism at Lodhi Gardens",
    description: "Heritage structure defaced with graffiti near entrance",
    location_name: "Lodhi Gardens",
    location: {
      type: "Point",
      coordinates: [28.5918, 77.2197]
    },
    images: ["image2.jpg", "image3.jpg"],
    videos: [],
    reportedBy: "user2",
    upvotes: 12,
    downvotes: 1,
    comments: ["comment2", "comment3"],
    verified: true,
    verificationScore: 7,
    crimeTime: new Date("2025-03-19T20:15:00"),
    isAnonymous: false,
    suspicionLevel: 2,
    isBanned: false,
    updatedAt: new Date("2025-03-20T09:30:00"),
    givenTo: "po1",
    status: "resolved",
    createdAt: new Date("2025-03-19T21:20:00"),
    priority: "low"
  },
  {
    _id: "cr9",
    title: "ATM Card Skimming in Connaught Place",
    description: "Suspicious device found attached to HDFC Bank ATM",
    location_name: "HDFC Bank ATM, Block C, Connaught Place",
    location: {
      type: "Point",
      coordinates: [28.6315, 77.2167]
    },
    images: ["image8.jpg", "image9.jpg"],
    videos: ["video3.mp4"],
    videoDescription: "Video showing the skimming device",
    reportedBy: "user9",
    upvotes: 18,
    downvotes: 0,
    comments: ["comment8", "comment9", "comment10"],
    verified: true,
    verificationScore: 9,
    crimeTime: new Date("2025-03-27T10:45:00"),
    isAnonymous: false,
    suspicionLevel: 9,
    isBanned: false,
    updatedAt: new Date("2025-03-27T11:30:00"),
    givenTo: "po1",
    status: "investigating",
    createdAt: new Date("2025-03-27T11:15:00"),
    priority: "high"
  },
  {
    _id: "cr10",
    title: "Pickpocketing at India Gate",
    description: "Tourist wallet stolen during evening visit",
    location_name: "India Gate, Rajpath",
    location: {
      type: "Point",
      coordinates: [28.6129, 77.2295]
    },
    images: [],
    videos: [],
    reportedBy: "user10",
    upvotes: 4,
    downvotes: 1,
    comments: ["comment11"],
    verified: true,
    verificationScore: 6,
    crimeTime: new Date("2025-03-28T18:30:00"),
    isAnonymous: true,
    suspicionLevel: 5,
    isBanned: false,
    updatedAt: new Date("2025-03-28T19:45:00"),
    givenTo: "po1",
    status: "investigating",
    createdAt: new Date("2025-03-28T19:15:00"),
    priority: "medium"
  },
  {
    _id: "cr11",
    title: "Shop Burglary in Chandni Chowk",
    description: "Jewelry shop broken into overnight, items worth ₹5 lakhs stolen",
    location_name: "Meena Jewelers, Chandni Chowk",
    location: {
      type: "Point",
      coordinates: [28.6505, 77.2303]
    },
    images: ["image10.jpg", "image11.jpg", "image12.jpg"],
    videos: ["video4.mp4"],
    videoDescription: "CCTV footage from nearby shop",
    reportedBy: "user11",
    upvotes: 22,
    downvotes: 0,
    comments: ["comment12", "comment13", "comment14", "comment15"],
    verified: true,
    verificationScore: 10,
    crimeTime: new Date("2025-03-29T02:15:00"),
    isAnonymous: false,
    suspicionLevel: 10,
    isBanned: false,
    updatedAt: new Date("2025-03-29T07:30:00"),
    givenTo: "po1",
    status: "investigating",
    createdAt: new Date("2025-03-29T06:45:00"),
    priority: "high"
  }
];

// Monthly performance data
const monthlyPerformanceData = [
  { month: 'Oct', resolved: 12, assigned: 15 },
  { month: 'Nov', resolved: 14, assigned: 16 },
  { month: 'Dec', resolved: 10, assigned: 12 },
  { month: 'Jan', resolved: 13, assigned: 14 },
  { month: 'Feb', resolved: 15, assigned: 15 },
  { month: 'Mar', resolved: 12, assigned: 14 },
  { month: 'Apr', resolved: 4, assigned: 7 }
];

// Recent activities data
const recentActivities = [
  { date: new Date('2025-04-05T14:30:00'), action: 'Updated status of case #CR11 to "Evidence Collection"' },
  { date: new Date('2025-04-04T11:45:00'), action: 'Added witness statement to case #CR9' },
  { date: new Date('2025-04-03T16:20:00'), action: 'Marked case #CR2 as "Resolved"' },
  { date: new Date('2025-04-02T09:15:00'), action: 'Scheduled interview for case #CR10' },
  { date: new Date('2025-04-01T13:50:00'), action: 'Added new evidence photos to case #CR1' }
];

export default function OfficerDashboard() {
  const [reports, setReports] = useState<ICrimeReport[]>(assignedReports);
  const [officer, setOfficer] = useState<IPoliceOfficer>(currentOfficer);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<ICrimeReport | null>(null);

  // Calculate statistics
  const totalAssigned = reports.length;
  const investigating = reports.filter(report => report.status === 'investigating').length;
  const resolved = reports.filter(report => report.status === 'resolved').length;
  const highPriority = reports.filter(report => report.priority === 'high').length;
  
  // Status distribution for pie chart
  const statusData = {
    labels: ['Investigating', 'Resolved', 'Verified'],
    datasets: [
      {
        data: [
          reports.filter(r => r.status === 'investigating').length,
          reports.filter(r => r.status === 'resolved').length,
          reports.filter(r => r.status === 'verified').length
        ],
        backgroundColor: ['#2196F3', '#9C27B0', '#4CAF50'],
      },
    ],
  };

  // Monthly performance chart
  const performanceData = {
    labels: monthlyPerformanceData.map(d => d.month),
    datasets: [
      {
        label: 'Assigned',
        data: monthlyPerformanceData.map(d => d.assigned),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        tension: 0.4,
      },
      {
        label: 'Resolved',
        data: monthlyPerformanceData.map(d => d.resolved),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        tension: 0.4,
      }
    ],
  };

  // Filter reports based on status and priority
  const filteredReports = reports.filter(report => {
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || report.priority === priorityFilter;
    return matchesStatus && matchesPriority;
  });

  // Update report status
  const updateReportStatus = (reportId: string, newStatus: ICrimeReport['status']) => {
    const updatedReports = reports.map(report => 
      report._id === reportId 
        ? { ...report, status: newStatus, updatedAt: new Date() }
        : report
    );
    setReports(updatedReports);
    
    if (selectedReport && selectedReport._id === reportId) {
      setSelectedReport({ ...selectedReport, status: newStatus, updatedAt: new Date() });
    }
  };

  // Format date to readable string
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };
  
  // Format time to readable string
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      {/* Officer Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center">
          <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold mb-4 md:mb-0 md:mr-6">
            {officer.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex-grow">
            <h1 className="text-2xl font-bold">{officer.name}</h1>
            <div className="flex flex-col sm:flex-row sm:items-center text-gray-600 mt-1">
              <span className="mr-4">{officer.rank}</span>
              <span className="mr-4">Badge: {officer.batchNo}</span>
              <span>{officer.department}</span>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              <span className="mr-4">{officer.email}</span>
              <span>{officer.phoneNumber}</span>
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col items-end">
            <div className="text-right">
              <span className="block text-sm text-gray-500">Last Active</span>
              <span className="block font-medium">Today, 15:42</span>
            </div>
            <button className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm">
              View Full Profile
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-gray-500 text-sm">Total Assigned</h3>
              <p className="text-2xl font-bold">{totalAssigned}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-gray-500 text-sm">Investigating</h3>
              <p className="text-2xl font-bold">{investigating}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-gray-500 text-sm">Resolved</h3>
              <p className="text-2xl font-bold">{resolved}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-gray-500 text-sm">High Priority</h3>
              <p className="text-2xl font-bold">{highPriority}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-bold mb-4">Monthly Performance</h2>
          <div className="h-64">
            <Line data={performanceData} options={{ 
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top' as const,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Number of Cases'
                  }
                }
              }
            }} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-bold mb-4">Current Case Status</h2>
          <div className="h-64 flex items-center justify-center">
            <Pie data={statusData} options={{ 
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom' as const,
                }
              }
            }} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cases Table */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <h2 className="text-lg font-bold mb-2 sm:mb-0">Assigned Cases</h2>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <select 
                    className="px-3 py-2 border rounded text-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="investigating">Investigating</option>
                    <option value="resolved">Resolved</option>
                    <option value="verified">Verified</option>
                  </select>
                  <select 
                    className="px-3 py-2 border rounded text-sm"
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                  >
                    <option value="all">All Priorities</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Case Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredReports.length > 0 ? filteredReports.map((report) => (
                    <tr key={report._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div>
                            <div className="font-medium text-gray-900 flex items-center">
                              {report.title}
                              {report.priority === 'high' && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                  High Priority
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              Reported: {formatDate(new Date(report.createdAt))}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {report.location_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          report.status === 'verified' ? 'bg-green-100 text-green-800' :
                          report.status === 'investigating' ? 'bg-blue-100 text-blue-800' :
                          report.status === 'resolved' ? 'bg-purple-100 text-purple-800' :
                          report.status === 'fake' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => setSelectedReport(report)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          View
                        </button>
                        {report.status !== 'resolved' && (
                          <button 
                            onClick={() => updateReportStatus(report._id, 'resolved')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Mark Resolved
                          </button>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                        No cases match the selected filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Selected Case Details */}
          {selectedReport ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start">
                <h2 className="text-lg font-bold">{selectedReport.title}</h2>
                <button 
                  onClick={() => setSelectedReport(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              <div className="mt-4 space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">Case ID:</span>
                  <span className="ml-2 text-sm">{selectedReport._id}</span>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-500">Status:</span>
                  <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                    selectedReport.status === 'verified' ? 'bg-green-100 text-green-800' :
                    selectedReport.status === 'investigating' ? 'bg-blue-100 text-blue-800' :
                    selectedReport.status === 'resolved' ? 'bg-purple-100 text-purple-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedReport.status.charAt(0).toUpperCase() + selectedReport.status.slice(1)}
                  </span>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-500">Priority:</span>
                  <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                    selectedReport.priority === 'high' ? 'bg-red-100 text-red-800' :
                    selectedReport.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {selectedReport.priority?.charAt(0).toUpperCase() + (selectedReport.priority?.slice(1) || '')}
                  </span>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-500">Location:</span>
                  <span className="ml-2 text-sm">{selectedReport.location_name}</span>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-500">Crime Time:</span>
                  <span className="ml-2 text-sm">
                    {formatDate(new Date(selectedReport.crimeTime))} at {formatTime(new Date(selectedReport.crimeTime))}
                  </span>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-500">Description:</span>
                  <p className="mt-1 text-sm text-gray-600">{selectedReport.description}</p>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-500">Evidence:</span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {selectedReport.images.length > 0 && selectedReport.images.map((img, i) => (
                      <div key={i} className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                        IMG
                      </div>
                    ))}
                    {selectedReport.videos.length > 0 && selectedReport.videos.map((vid, i) => (
  <div key={i} className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
    VID
  </div>
))}
                  </div>
                </div>
                
                <div className="pt-3 flex justify-between">
                  {selectedReport.status !== 'resolved' ? (
                    <button 
                      onClick={() => updateReportStatus(selectedReport._id, 'resolved')}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm"
                    >
                      Mark as Resolved
                    </button>
                  ) : (
                    <button 
                      onClick={() => updateReportStatus(selectedReport._id, 'investigating')}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
                    >
                      Reopen Case
                    </button>
                  )}
                  <button className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded text-sm">
                    Full Details
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <p className="text-gray-500">Select a case to view details</p>
            </div>
          )}
          
          {/* Recent Activities */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold mb-4">Recent Activities</h2>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start">
                  <div className="flex-shrink-0 h-4 w-4 mt-1 rounded-full bg-blue-500"></div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">{activity.action}</p>
                    <p className="text-xs text-gray-400">{formatDate(activity.date)} at {formatTime(activity.date)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <button className="text-blue-500 hover:text-blue-700 text-sm font-medium">
                View All Activities
              </button>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium py-2 px-4 rounded flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Create Report
              </button>
              <button className="w-full bg-green-50 hover:bg-green-100 text-green-600 font-medium py-2 px-4 rounded flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Download Case Files
              </button>
              <button className="w-full bg-purple-50 hover:bg-purple-100 text-purple-600 font-medium py-2 px-4 rounded flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}