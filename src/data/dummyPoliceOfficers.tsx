// Create this file as src/data/dummyPoliceOfficers.ts

// Function to generate dummy police officer contacts based on provided coordinates
export const getDummyPoliceOfficers = (
  lat: any, 
  lng: any
): { contacts: any } => {
  // Base police officer data with Indian names and contact numbers
  const allContacts: any= [
    {
      name: "Inspector Rajesh Kumar",
      type: "Police Officer",
      contact_number: "+91 98765 43210",
      address: "Kotwali Police Station, MG Road",
      location: {
        lat: lat + 0.008,
        lng: lng - 0.005
      }
    },
    {
      name: "Sub-Inspector Priya Singh",
      type: "Police Officer",
      contact_number: "+91 87654 32109",
      address: "Civil Lines Police Station, Nehru Marg",
      location: {
        lat: lat + 0.015,
        lng: lng + 0.012
      }
    },
    {
      name: "Head Constable Amit Sharma",
      type: "Police Officer",
      contact_number: "+91 76543 21098",
      address: "Gandhi Nagar Police Chowki",
      location: {
        lat: lat - 0.010,
        lng: lng + 0.008
      }
    },
    {
      name: "DSP Vikram Patel",
      type: "Police Officer",
      contact_number: "+91 96543 21098",
      address: "SP Office, Police Lines",
      location: {
        lat: lat - 0.005,
        lng: lng - 0.008
      }
    },
    {
      name: "ASI Sanjay Verma",
      type: "Police Officer",
      contact_number: "+91 95432 10987",
      address: "Sadar Police Station, Cantonment Area",
      location: {
        lat: lat + 0.012,
        lng: lng - 0.015
      }
    },
    {
      name: "Inspector Sunita Deshmukh",
      type: "Police Officer",
      contact_number: "+91 95678 12345",
      address: "Women's Police Station, City Center",
      location: {
        lat: lat - 0.008,
        lng: lng + 0.005
      }
    },
    {
      name: "SI Deepak Gupta",
      type: "Police Officer",
      contact_number: "+91 88765 43210",
      address: "Traffic Police Office, Railway Station Road",
      location: {
        lat: lat + 0.020,
        lng: lng + 0.018
      }
    },
    {
      name: "Constable Ramesh Yadav",
      type: "Police Officer",
      contact_number: "+91 85432 10987",
      address: "Highway Patrol, National Highway 8",
      location: {
        lat: lat - 0.018,
        lng: lng - 0.012
      }
    },
    {
      name: "ACP Meenakshi Rathore",
      type: "Police Officer",
      contact_number: "+91 99876 54321",
      address: "Crime Branch Office, Police Headquarters",
      location: {
        lat: lat + 0.003,
        lng: lng - 0.002
      }
    },
    {
      name: "Inspector Arjun Malhotra",
      type: "Police Officer",
      contact_number: "+91 97890 12345",
      address: "Cyber Crime Cell, IT Park Road",
      location: {
        lat: lat - 0.015,
        lng: lng + 0.010
      }
    },
    {
      name: "Constable Vijay Chauhan",
      type: "Police Officer",
      contact_number: "+91 93456 78901",
      address: "Beat Box 7, Market Area",
      location: {
        lat: lat + 0.007,
        lng: lng + 0.009
      }
    },
    {
      name: "SI Ananya Joshi",
      type: "Police Officer",
      contact_number: "+91 89012 34567",
      address: "Special Branch, District HQ",
      location: {
        lat: lat - 0.009,
        lng: lng - 0.006
      }
    }
  ];

  // Add some small random variation to simulate different queries
  const randomizedContacts = allContacts.map((contact:any) => ({
    ...contact,
    location: {
      lat: contact.location.lat + (Math.random() * 0.002 - 0.001),
      lng: contact.location.lng + (Math.random() * 0.002 - 0.001)
    }
  }));

  return { contacts: randomizedContacts };
};