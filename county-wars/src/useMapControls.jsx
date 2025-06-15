import { useState } from 'react';

const useMapControls = () => {
  const [mapControls, setMapControls] = useState({
    zoom: 4,
    style: 'terrain'
  });

  const changeMapStyle = (style) => {
    setMapControls(prev => ({ ...prev, style }));
  };

  const updateZoom = (zoom) => {
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
