const OSRM_URL = 'https://router.project-osrm.org/route/v1';

export const getRouteCoordinates = async (points) => {
  try {
    // OSRM expects coordinates in format: lng,lat;lng,lat;...
    const coordinates = points
      .map(point => `${point[1]},${point[0]}`)
      .join(';');

    const response = await fetch(
      `${OSRM_URL}/driving/${coordinates}?overview=full&geometries=geojson`
    );
    const data = await response.json();

    if (data.code !== 'Ok') {
      throw new Error('Failed to get route');
    }

    // Return the route coordinates
    return data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
  } catch (error) {
    console.error('Routing error:', error);
    // Fall back to straight lines if routing fails
    return points;
  }
}; 