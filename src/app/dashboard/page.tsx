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
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Define interfaces
interface IPoliceAssignment {
  _id: string;
  policeId: string;
  assignedReports: string[];
}

interface IUser {
  _id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  isVerified: boolean;
  role: string;
  batchNo?: string;
  latitude?: string;
  longitude?: string;
}

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
}

// Updated data with Indian names and contexts
const dummyPoliceOfficers: IUser[] = [
  {
    _id: "po1",
    name: "Inspector Rajesh Kumar",
    email: "rajesh.kumar@police.gov.in",
    phoneNumber: "+919876543210",
    isVerified: true,
    role: "police",
    batchNo: "IPS-2145",
    latitude: "28.6139",
    longitude: "77.2090"
  },
  {
    _id: "po2",
    name: "Sub-Inspector Priya Singh",
    email: "priya.singh@police.gov.in",
    phoneNumber: "+919876543211",
    isVerified: true,
    role: "police",
    batchNo: "SI-3421",
    latitude: "28.6140",
    longitude: "77.2091"
  },
  {
    _id: "po3",
    name: "Constable Amit Sharma",
    email: "amit.sharma@police.gov.in",
    phoneNumber: "+919876543212",
    isVerified: true,
    role: "police",
    batchNo: "PC-8765",
    latitude: "28.6141",
    longitude: "77.2092"
  },
  {
    _id: "po4",
    name: "ASI Sunita Patel",
    email: "sunita.patel@police.gov.in",
    phoneNumber: "+919876543213",
    isVerified: true,
    role: "police",
    batchNo: "ASI-5421",
    latitude: "28.6142",
    longitude: "77.2093"
  }
];

const dummyCrimeReports: ICrimeReport[] = [
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
    createdAt: new Date("2025-03-20T16:15:00")
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
    createdAt: new Date("2025-03-19T21:20:00")
  },
  {
    _id: "cr3",
    title: "Flat Break-in at Vasant Kunj",
    description: "Door lock broken, jewelry and cash stolen from residence",
    location_name: "C-Block, Vasant Kunj",
    location: {
      type: "Point",
      coordinates: [28.5253, 77.1577]
    },
    images: [],
    videos: ["video1.mp4"],
    videoDescription: "CCTV footage from building entrance",
    reportedBy: "user3",
    upvotes: 8,
    downvotes: 0,
    comments: [],
    verified: true,
    verificationScore: 9,
    crimeTime: new Date("2025-03-21T03:45:00"),
    isAnonymous: false,
    suspicionLevel: 8,
    isBanned: false,
    updatedAt: new Date("2025-03-21T07:15:00"),
    givenTo: "po2",
    status: "investigating",
    createdAt: new Date("2025-03-21T06:30:00")
  },
  {
    _id: "cr4",
    title: "Suspicious Person Near DAV Public School",
    description: "Unknown man photographing school children during dismissal time",
    location_name: "DAV Public School, Sector 14",
    location: {
      type: "Point",
      coordinates: [28.5685, 77.3161]
    },
    images: ["image4.jpg"],
    videos: [],
    reportedBy: "user4",
    upvotes: 15,
    downvotes: 2,
    comments: ["comment4"],
    verified: true,
    verificationScore: 6,
    crimeTime: new Date("2025-03-22T12:15:00"),
    isAnonymous: true,
    suspicionLevel: 9,
    isBanned: false,
    updatedAt: new Date("2025-03-22T13:45:00"),
    givenTo: "po3",
    status: "verified",
    createdAt: new Date("2025-03-22T12:45:00")
  },
  {
    _id: "cr5",
    title: "Two-wheeler Theft in Saket",
    description: "Honda Activa scooter stolen from DLF Mall parking",
    location_name: "DLF Mall, Saket",
    location: {
      type: "Point",
      coordinates: [28.5245, 77.2132]
    },
    images: ["image5.jpg", "image6.jpg"],
    videos: [],
    reportedBy: "user5",
    upvotes: 3,
    downvotes: 0,
    comments: [],
    verified: false,
    verificationScore: 5,
    crimeTime: new Date("2025-03-23T19:30:00"),
    isAnonymous: false,
    suspicionLevel: 7,
    isBanned: false,
    updatedAt: new Date("2025-03-23T20:15:00"),
    givenTo: null,
    status: "not verified",
    createdAt: new Date("2025-03-23T20:00:00")
  },
  {
    _id: "cr6",
    title: "Drug Peddling Near Nehru Place Metro",
    description: "Group of individuals selling substances to college students",
    location_name: "Nehru Place Metro Exit Gate 3",
    location: {
      type: "Point",
      coordinates: [28.5425, 77.2539]
    },
    images: [],
    videos: ["video2.mp4"],
    videoDescription: "Video showing exchange of packets and money",
    reportedBy: "user6",
    upvotes: 7,
    downvotes: 1,
    comments: ["comment5", "comment6"],
    verified: false,
    verificationScore: 4,
    crimeTime: new Date("2025-03-24T22:10:00"),
    isAnonymous: true,
    suspicionLevel: 6,
    isBanned: false,
    updatedAt: new Date("2025-03-24T23:00:00"),
    givenTo: null,
    status: "not verified",
    createdAt: new Date("2025-03-24T22:45:00")
  },
  {
    _id: "cr7",
    title: "Late Night Nuisance in Malviya Nagar",
    description: "Loud party and disturbing noise from residential complex",
    location_name: "Shivalik Apartments, Malviya Nagar",
    location: {
      type: "Point",
      coordinates: [28.5360, 77.2162]
    },
    images: [],
    videos: [],
    reportedBy: "user7",
    upvotes: 2,
    downvotes: 8,
    comments: [],
    verified: false,
    verificationScore: 1,
    crimeTime: new Date("2025-03-25T01:30:00"),
    isAnonymous: false,
    suspicionLevel: 1,
    isBanned: false,
    updatedAt: new Date("2025-03-25T01:45:00"),
    givenTo: null,
    status: "fake",
    createdAt: new Date("2025-03-25T01:40:00")
  },
  {
    _id: "cr8",
    title: "Chain Snatching Incident in Karol Bagh",
    description: "Gold chain snatched by two men on motorcycle near metro station",
    location_name: "Karol Bagh Metro Station",
    location: {
      type: "Point",
      coordinates: [28.6444, 77.1907]
    },
    images: ["image7.jpg"],
    videos: [],
    reportedBy: "user8",
    upvotes: 9,
    downvotes: 0,
    comments: ["comment7"],
    verified: true,
    verificationScore: 8,
    crimeTime: new Date("2025-03-26T02:15:00"),
    isAnonymous: false,
    suspicionLevel: 8,
    isBanned: false,
    updatedAt: new Date("2025-03-26T03:30:00"),
    givenTo: "po4",
    status: "investigating",
    createdAt: new Date("2025-03-26T02:45:00")
  }
];

const dummyPoliceAssignments: IPoliceAssignment[] = [
  {
    _id: "pa1",
    policeId: "po1",
    assignedReports: ["cr1", "cr2"]
  },
  {
    _id: "pa2",
    policeId: "po2",
    assignedReports: ["cr3"]
  },
  {
    _id: "pa3",
    policeId: "po3",
    assignedReports: ["cr4"]
  },
  {
    _id: "pa4",
    policeId: "po4",
    assignedReports: ["cr8"]
  }
];

export default function Dashboard() {
  const [policeAssignments, setPoliceAssignments] = useState<IPoliceAssignment[]>(dummyPoliceAssignments);
  const [policeOfficers, setPoliceOfficers] = useState<IUser[]>(dummyPoliceOfficers);
  const [crimeReports, setCrimeReports] = useState<ICrimeReport[]>(dummyCrimeReports);
  const [selectedOfficer, setSelectedOfficer] = useState<string>('');
  const [unassignedReports, setUnassignedReports] = useState<ICrimeReport[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    // Filter unassigned reports
    const unassigned = crimeReports.filter(report => !report.givenTo);
    setUnassignedReports(unassigned);
  }, [crimeReports]);

  // Calculate statistics
  const totalReports = crimeReports.length;
  const assignedReports = crimeReports.filter(report => report.givenTo).length;
  const unassignedCount = unassignedReports.length;
  const verifiedReports = crimeReports.filter(report => report.verified).length;
  const resolvedReports = crimeReports.filter(report => report.status === 'resolved').length;
  
  // Get status counts for chart
  const statusCounts = {
    'verified': crimeReports.filter(report => report.status === 'verified').length,
    'investigating': crimeReports.filter(report => report.status === 'investigating').length,
    'resolved': crimeReports.filter(report => report.status === 'resolved').length,
    'not verified': crimeReports.filter(report => report.status === 'not verified').length,
    'fake': crimeReports.filter(report => report.status === 'fake').length,
  };

  // Chart data
  const statusChartData = {
    labels: Object.keys(statusCounts),
    datasets: [
      {
        data: Object.values(statusCounts),
        backgroundColor: [
          '#4CAF50', // verified - green
          '#2196F3', // investigating - blue
          '#9C27B0', // resolved - purple
          '#FFC107', // not verified - amber
          '#F44336', // fake - red
        ],
      },
    ],
  };

  // Officer workload chart
  const officerWorkloadData = {
    labels: policeOfficers.map(officer => officer.name.split(' ').slice(-1)[0]), // Use last name for chart brevity
    datasets: [
      {
        label: 'Assigned Reports',
        data: policeOfficers.map(officer => {
          const assignment = policeAssignments.find(pa => pa.policeId === officer._id);
          return assignment ? assignment.assignedReports.length : 0;
        }),
        backgroundColor: '#3B82F6',
      },
    ],
  };

  // Handle assignment change - now modifying local state without API calls
  const assignReportToOfficer = (reportId: string, officerId: string) => {
    // Find the officer's assignment
    const existingAssignmentIndex = policeAssignments.findIndex(assignment => assignment.policeId === officerId);
    
    // Update assignments
    const updatedAssignments = [...policeAssignments];
    
    if (existingAssignmentIndex >= 0) {
      // Update existing assignment
      updatedAssignments[existingAssignmentIndex] = {
        ...updatedAssignments[existingAssignmentIndex],
        assignedReports: [...updatedAssignments[existingAssignmentIndex].assignedReports, reportId]
      };
    } else {
      // Create new assignment
      updatedAssignments.push({
        _id: `pa${policeAssignments.length + 1}`,
        policeId: officerId,
        assignedReports: [reportId]
      });
    }
    
    // Update reports
    const updatedReports = crimeReports.map(report => 
      report._id === reportId 
        ? { ...report, givenTo: officerId, status: 'investigating' as const, updatedAt: new Date() }
        : report
    );
    
    // Update state
    setPoliceAssignments(updatedAssignments);
    setCrimeReports(updatedReports);
    setSelectedOfficer('');
  };

  // Filter reports based on search and status
  const filteredReports = crimeReports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         report.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.location_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Police Assignment Dashboard</h1>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm mb-1">Total Reports</h3>
          <p className="text-3xl font-bold">{totalReports}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm mb-1">Assigned Reports</h3>
          <p className="text-3xl font-bold">{assignedReports}</p>
          <p className="text-sm text-gray-500">{totalReports ? Math.round((assignedReports/totalReports)*100) : 0}% of total</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm mb-1">Unassigned Reports</h3>
          <p className="text-3xl font-bold text-amber-500">{unassignedCount}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm mb-1">Resolved Cases</h3>
          <p className="text-3xl font-bold text-green-500">{resolvedReports}</p>
          <p className="text-sm text-gray-500">{totalReports ? Math.round((resolvedReports/totalReports)*100) : 0}% resolution rate</p>
        </div>
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Report Status Distribution</h2>
          <div className="h-64">
            <Pie data={statusChartData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Officer Workload</h2>
          <div className="h-64">
            <Bar 
              data={officerWorkloadData} 
              options={{ 
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Number of Reports'
                    }
                  }
                }
              }} 
            />
          </div>
        </div>
      </div>
      
      {/* Search and Filter Section */}
      <div className="mb-8 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search reports by title, description or location..."
            className="w-full px-4 py-2 border rounded"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div>
          <select 
            className="px-4 py-2 border rounded"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="verified">Verified</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="not verified">Not Verified</option>
            <option value="fake">Fake</option>
          </select>
        </div>
      </div>
      
      {/* Crime Reports Table */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Crime Reports</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg shadow">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredReports.map((report) => {
                const assignedOfficer = policeOfficers.find(officer => officer._id === report.givenTo);
                
                return (
                  <tr key={report._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{report.title}</div>
                      {report.suspicionLevel > 7 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          High Suspicion
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
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
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {assignedOfficer ? (
                        <div className="text-gray-900">{assignedOfficer.name}</div>
                      ) : (
                        <span className="text-red-500">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {!report.givenTo ? (
                        <div className="flex items-center">
                          <select 
                            className="mr-2 px-2 py-1 border rounded text-sm"
                            value={selectedOfficer}
                            onChange={(e) => setSelectedOfficer(e.target.value)}
                          >
                            <option value="">Select Officer</option>
                            {policeOfficers.map(officer => (
                              <option key={officer._id} value={officer._id}>
                                {officer.name}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => selectedOfficer && assignReportToOfficer(report._id, selectedOfficer)}
                            disabled={!selectedOfficer}
                            className="bg-blue-500 hover:bg-blue-700 text-white py-1 px-3 rounded text-sm disabled:bg-blue-300"
                          >
                            Assign
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            // Simple reassign functionality - just unassign
                            const updatedReports = crimeReports.map(r => 
                              r._id === report._id 
                                ? { ...r, givenTo: null, status: 'not verified' as const, updatedAt: new Date() }
                                : r
                            );
                            
                            // Remove from assignments
                            const updatedAssignments = policeAssignments.map(assignment => {
                              if (assignment.policeId === report.givenTo) {
                                return {
                                  ...assignment,
                                  assignedReports: assignment.assignedReports.filter(id => id !== report._id)
                                };
                              }
                              return assignment;
                            });
                            
                            setCrimeReports(updatedReports);
                            setPoliceAssignments(updatedAssignments);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 text-sm"
                        >
                          Reassign
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Officer Assignments Section */}
      <div>
        <h2 className="text-xl font-bold mb-4">Officer Assignments</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {policeOfficers.map((officer) => {
            const assignment = policeAssignments.find(pa => pa.policeId === officer._id);
            const assignedReportCount = assignment ? assignment.assignedReports.length : 0;
            const officerReports = assignment ? 
              crimeReports.filter(report => assignment.assignedReports.includes(report._id)) : [];
            
            return (
              <div key={officer._id} className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">{officer.name}</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {assignedReportCount} Reports
                  </span>
                </div>
                <p className="text-gray-500 text-sm mb-4">Badge: {officer.batchNo || 'N/A'}</p>
                
                <h4 className="font-medium mb-2">Assigned Cases:</h4>
                {officerReports.length > 0 ? (
                  <ul className="space-y-2">
                    {officerReports.slice(0, 3).map(report => (
                      <li key={report._id} className="flex items-center justify-between text-sm">
                        <span className="truncate flex-1">{report.title}</span>
                        <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                          report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                          report.status === 'investigating' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {report.status}
                        </span>
                      </li>
                    ))}
                    {officerReports.length > 3 && (
                      <li className="text-sm text-blue-500">+ {officerReports.length - 3} more reports</li>
                    )}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm italic">No reports assigned</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}