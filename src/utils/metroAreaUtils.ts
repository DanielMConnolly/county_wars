/**
 * Utility functions for getting metro area information from coordinates
 */

interface CBSA {
  "CBSA Code": string;
  NAME: string;
  [key: string]: any;
}

interface Geographies {
  CBSAs?: CBSA[];
  [key: string]: any;
}

interface CensusGeocoderResponse {
  result: {
    geographies: Geographies;
  };
}

/**
 * Get metro area name from lat/lng using U.S. Census Geocoding API
 * @param lat - Latitude
 * @param long - Longitude
 * @returns Metro area name or fallback string
 */
export const getMetroAreaFromCoordinates = async (lat: number, lng: number): Promise<string | null> => {
  const baseUrl =
    "https://geocoding.geo.census.gov/geocoder/geographies/coordinates";
  const params = new URLSearchParams({
    x: lng.toString(),
    y: lat.toString(),
    benchmark: "Public_AR_Current",
    vintage: "Current_Current",
    format: "json",
  });

  const url = `${baseUrl}?${params.toString()}`;

  try {
    const response = await fetch(url);

    const data = (await response.json()) as CensusGeocoderResponse;
    const urbanData = data.result.geographies["Urban Areas"][0];
    const name = urbanData.NAME;
    const trimmedName = name.split(",")[0].trim();
    console.log("Metro area:", trimmedName);
    return trimmedName;
  } catch (error) {
    console.error("Error fetching metro area:", error);
    return null;
  }
};

/**
 * Get metro area with caching for performance
 */
