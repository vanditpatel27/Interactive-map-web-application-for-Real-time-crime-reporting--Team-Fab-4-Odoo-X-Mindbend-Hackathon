export const darkBlueMapStyle = {
  styles: [
    {
      elementType: "geometry",
      stylers: [{ color: "#1a1d2a" }], // Deep blue background
    },
    {
      elementType: "labels.text.fill",
      stylers: [{ color: "#87cefa" }], // Light blue labels
    },
    {
      elementType: "labels.text.stroke",
      stylers: [{ color: "#000000" }], // Dark label outline
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#324a7e" }], // Bluish roads
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#2d6aa3" }], // Vibrant blue water
    },
    {
      featureType: "poi",
      elementType: "geometry",
      stylers: [{ color: "#1f3c5d" }], // Dark blue POIs
    },
  ],
};

export const darkRedMapStyle = {
    styles: [
      {
        elementType: "geometry",
        stylers: [{ color: "#2d2d2d" }], // Dark base
      },
      {
        elementType: "labels.text.fill",
        stylers: [{ color: "#ff4d4d" }], // Reddish text
      },
      {
        elementType: "labels.text.stroke",
        stylers: [{ color: "#222222" }], // Darker label background
      },
      {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#551111" }], // Dark red roads
      },
      {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#3e3e3e" }], // Dark water
      },
      {
        featureType: "poi",
        elementType: "geometry",
        stylers: [{ color: "#2d2d2d" }], // Dark points of interest
      },
    ],
  };