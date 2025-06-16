import { useState } from 'react';
import { MapControls, MapStyle } from './types/GameTypes';


const useMapControls = () => {
  const [mapControls, setMapControls] = useState<MapControls>({
    zoom: 4,
    style: 'terrain'
  });

  const changeMapStyle = (style: MapStyle) => {
    setMapControls(prev => ({ ...prev, style }));
  };

  const updateZoom = (zoom: number) => {
    setMapControls(prev => ({ ...prev, zoom }));
  };

  const toggleMapStyle = () => {
    const styles: Array<MapStyle> = ['terrain', 'satellite', 'dark', 'street'];
    const currentIndex = styles.indexOf(mapControls.style);
    const nextIndex = (currentIndex + 1) % styles.length;
    changeMapStyle(styles[nextIndex]);
  };

  return {
    mapControls,
    changeMapStyle,
    updateZoom,
    toggleMapStyle
  };
};

export default useMapControls;
