import { useState } from 'react';
import { MapControls } from './types/GameTypes';


const useMapControls = () => {
  const [mapControls, setMapControls] = useState<MapControls>({
    zoom: 4,
    style: 'terrain'
  });

  const changeMapStyle = (style: string) => {
    setMapControls(prev => ({ ...prev, style }));
  };

  const updateZoom = (zoom: string) => {
    setMapControls(prev => ({ ...prev, zoom }));
  };

  const toggleMapStyle = () => {
    const styles = ['terrain', 'satellite', 'dark', 'street'];
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
