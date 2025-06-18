import { MapStyle } from "../types/GameTypes";

export const mapStyles = {
  terrain: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
  satellite:
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  street: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
};


export const getAttribution = (style: MapStyle) => {
  const attributions = {
    terrain: '© OpenTopoMap contributors',
    satellite: '© Esri',
    dark: '© CartoDB',
    street: '© OpenStreetMap contributors'
  };
  return attributions[style] || '';
};
