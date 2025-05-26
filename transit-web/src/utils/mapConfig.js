export const MAP_CONFIG = {
  defaultCenter: [38.6748, 39.2225], // Elazığ coordinates
  zoom: 13,
  tileLayer: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
};

export const useCurrentLocation = (map) => {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // Check if within ~50km of Elazığ
        const distance = getDistance(
          latitude,
          longitude,
          MAP_CONFIG.defaultCenter[0],
          MAP_CONFIG.defaultCenter[1]
        );
        if (distance < 50) {
          map.setView([latitude, longitude], MAP_CONFIG.zoom);
        }
      },
      (error) => {
        console.log("Error getting location:", error);
      }
    );
  }
};

// Helper function to calculate distance between two points in km
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

export const createDefaultIcon = (L) => {
  return new L.Icon({
    iconUrl: '/marker-icon.png',
    iconRetinaUrl: '/marker-icon-2x.png',
    shadowUrl: '/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
}; 