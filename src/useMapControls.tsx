import { useState } from 'react';
import { MapControls, MapStyle, BoundaryType } from './types/GameTypes';


const useMapControls = () => {
  const [mapControls, setMapControls] = useState<MapControls>({
    zoom: 4,
    style: 'terrain',
    boundaryType: 'states'
  });

  const changeMapStyle = (style: MapStyle) => {
    setMapControls(prev => ({ ...prev, style }));
  };

  const updateZoom = (zoom: number) => {
    setMapControls(prev => ({ ...prev, zoom }));
  };

  const changeBoundaryType = (boundaryType: BoundaryType) => {
    setMapControls(prev => ({ ...prev, boundaryType }));
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
    changeBoundaryType,
    toggleMapStyle
  };
};

export default useMapControls;
