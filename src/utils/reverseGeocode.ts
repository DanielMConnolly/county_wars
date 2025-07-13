import leaflet from 'leaflet';

// Global reference to county layer data - will be set when counties are loaded
let countyData: any = null;

/**
 * Load county GeoJSON data for reverse geocoding
 * This should be called once when the map initializes
 */
export const loadCountyData = async (): Promise<void> => {
  if (countyData) return; // Already loaded

  try {
    const response = await fetch("/counties.geojson");
    if (!response.ok) {
      throw new Error(`Failed to fetch counties: ${response.status}`);
    }
    countyData = await response.json();
    console.log('County data loaded for reverse geocoding');
  } catch (error) {
    console.error('Failed to load county data for reverse geocoding:', error);
  }
};

/**
 * Convert lat/lng coordinates to county name
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns County name or "Unknown Location" if not found
 */
export const getCountyNameFromCoordinates = (lat: number, lng: number): string => {
  if (!countyData || !countyData.features) {
    return "Unknown Location";
  }

  const point = leaflet.latLng(lat, lng);

  // Check each county feature to see if the point is within its boundaries
  for (const feature of countyData.features) {
    if (feature.geometry && feature.properties) {
      try {
        // Create a temporary layer to check bounds
        const tempLayer = leaflet.geoJSON(feature);

        // Check if point is within the bounding box of this county
        if (tempLayer.getBounds().contains(point)) {
          // For more precise checking, we could use a point-in-polygon algorithm
          // but bounding box check should be sufficient for most cases
          return feature.properties.NAME || "Unknown County";
        }
      } catch (error) {
        // Continue to next feature if this one fails
        continue;
      }
    }
  }

  return "Unknown Location";
};
