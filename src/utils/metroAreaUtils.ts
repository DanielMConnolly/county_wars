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

interface State {
  NAME: string;
  [key: string]: any;
}

interface CensusGeocoderResponse {
  result: {
    geographies: {
      CBSAs?: CBSA[];
      States?: State[];
      "Urban Areas"?: any[];
      [key: string]: any;
    };
  };
}

/**
 * Get metro area name and state from lat/lng using U.S. Census Geocoding API
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Object with metro area name and state, or null if not found
 */
export const getMetroAreaFromCoordinates = async (lat: number, lng: number): Promise<{metroArea: string; state: string} | null> => {
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
    console.log("Census geocoder response:", data);
    console.log("STATE data: ", data.result.geographies["States"]);
    console.log("CBSA data: ", data.result.geographies["CBSAs"]);
    console.log("URBAN AREA DATA: ", data.result.geographies["Urban Areas"]);
    
    const urbanData = data.result.geographies["Urban Areas"]?.[0];
    const stateData = data.result.geographies["States"]?.[0];
    
    if (!urbanData || !stateData) {
      return null;
    }
    
    const metroArea = urbanData.NAME.split(",")[0].trim();
    const state = stateData.NAME;
    
    return { metroArea, state };
  } catch (error) {
    console.error("Error fetching metro area:", error);
    return null;
  }
};

/**
 * Get metro area with caching for performance
 */
