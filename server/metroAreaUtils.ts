/**
 * Utility functions for getting metro area information from coordinates
 */



/**
 * Get metro area name and state from lat/lng using U.S. Census Geocoding API
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Object with metro area name and state, or null if not found
 */
export const getGeoDataFromCoordinates
  = async (lat: number, lng: number): Promise<{ metroArea: string | null; state: string, county: string } | null> => {
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

      const geoData = (await response.json()).result.geographies;


      let metroArea = null;
      if("Urban Areas" in geoData){
        metroArea = geoData["Urban Areas"][0].NAME.split(",")[0].trim();
      }



      const state = geoData["States"]?.[0].NAME;
      const county = geoData["Counties"]?.[0].NAME;

      return { metroArea, state, county };
    } catch (error) {
      console.error("Error fetching metro area:", error);
      return null;
    }
  };
