import leaflet, { Polyline } from "leaflet";

const defaultStyle = {
  fillColor: "#3388ff",
  weight: 1,
  opacity: 1,
  color: "white",
  fillOpacity: 0.3,
};

export interface LoadCountiesOptions {
  mapInstance: leaflet.Map;
  onSuccess: (layer: leaflet.GeoJSON) => void;
}

export interface LoadStatesOptions {
  mapInstance: leaflet.Map;
  onSuccess: (layer: leaflet.GeoJSON) => void;
  onError: () => void;
  onStateClick?: (stateName: string) => void;
  selectedState?: string | null;
}

/**
 * Load counties GeoJSON data and add to map
 */
export const loadCounties = async (options: LoadCountiesOptions): Promise<void> => {
  const { mapInstance, onSuccess} = options;
  if (!mapInstance) return;

  const response = await fetch("/counties.geojson");

  if (!response.ok) {
    throw new Error(`Failed to fetch counties: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();


  const layer = leaflet.geoJSON(data, {
    style: defaultStyle,
    onEachFeature: function (feature, layer: Polyline) {
      layer.on("click", () => {
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
};

/**
 * Load states GeoJSON data and add to map
 */
export const loadStates = async (options: LoadStatesOptions): Promise<void> => {
  const { mapInstance, onSuccess, onStateClick, selectedState } = options;
  if (!mapInstance) return;

  const response = await fetch("/us-states.geojson");

  if (!response.ok) {
    throw new Error(`Failed to fetch states: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  const layer = leaflet.geoJSON(data, {
    style: (feature) => {
      const stateName = feature?.properties?.NAME || feature?.properties?.name;
      const isSelected = selectedState && stateName === selectedState;
      
      if (isSelected) {
        return {
          fillColor: "#10b981", // Green color for selected state
          weight: 3,
          opacity: 1,
          color: "#059669", // Darker green border
          fillOpacity: 0.6,
        };
      }
      
      return defaultStyle;
    },
    onEachFeature: function (feature, layer: Polyline) {
      layer.on("click", () => {
        if (onStateClick && feature.properties) {
          const stateName = feature.properties.NAME || feature.properties.name;
          if (stateName) {
            onStateClick(stateName);
          }
        }
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
};
