import leaflet, { Polyline } from "leaflet";
import { loadCountyData } from "./utils/reverseGeocode";

const defaultStyle = {
  fillColor: "#3388ff",
  weight: 1,
  opacity: 1,
  color: "white",
  fillOpacity: 0.3,
};

export interface LoadCountiesOptions {
  mapInstance: leaflet.Map;
  selectCounty: (county: { name: string; stateFP: string; countyFP: string } | null) => void;
  onSuccess: (layer: leaflet.GeoJSON) => void;
  onError: () => void;
}

export interface LoadStatesOptions {
  mapInstance: leaflet.Map;
  selectCounty: (county: { name: string; stateFP: string; countyFP: string } | null) => void;
  onSuccess: (layer: leaflet.GeoJSON) => void;
  onError: () => void;
}

/**
 * Load counties GeoJSON data and add to map
 */
export const loadCounties = async (options: LoadCountiesOptions): Promise<void> => {
  const { mapInstance, selectCounty, onSuccess, onError } = options;

  try {
    const response = await fetch("/counties.geojson");

    if (!response.ok) {
      throw new Error(`Failed to fetch counties: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Load county data for reverse geocoding
    await loadCountyData();

    const layer = leaflet.geoJSON(data, {
      style: defaultStyle,
      onEachFeature: function (feature, layer: Polyline) {
        layer.on("click", () => {
          selectCounty({
            name: layer.feature?.properties.NAME,
            stateFP: layer.feature?.properties.STATEFP,
            countyFP: layer.feature?.properties.COUNTYFP,
          });
        });
        layer.on("mouseover", function () {
          // Optional hover effects can be added here
        });
        layer.on("mouseout", function () {
          // Optional hover effects can be added here
        });
      },
    });

    layer.addTo(mapInstance);
    onSuccess(layer);
  } catch (error) {
    console.error('Error loading counties:', error);
    onError();
  }
};

/**
 * Load states GeoJSON data and add to map
 */
export const loadStates = async (options: LoadStatesOptions): Promise<void> => {
  const { mapInstance, selectCounty, onSuccess, onError } = options;

  try {
    const response = await fetch("/us-states.geojson");

    if (!response.ok) {
      throw new Error(`Failed to fetch states: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    const layer = leaflet.geoJSON(data, {
      style: defaultStyle,
      onEachFeature: function (feature, layer: Polyline) {
        layer.on("click", () => {
          // For states, we might want different behavior than counties
          // For now, clear any selected county since state view is more zoomed out
          selectCounty(null);
        });
        layer.on("mouseover", function () {
          // Optional hover effects can be added here
        });
        layer.on("mouseout", function () {
          // Optional hover effects can be added here
        });
      },
    });

    layer.addTo(mapInstance);
    onSuccess(layer);
  } catch (error) {
    console.error('Error loading states:', error);
    onError();
  }
};