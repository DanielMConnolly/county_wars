"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const useMapControls = () => {
    const [mapControls, setMapControls] = (0, react_1.useState)({
        zoom: 4,
        style: 'terrain'
    });
    const changeMapStyle = (style) => {
        setMapControls(prev => (Object.assign(Object.assign({}, prev), { style })));
    };
    const updateZoom = (zoom) => {
        setMapControls(prev => (Object.assign(Object.assign({}, prev), { zoom })));
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
exports.default = useMapControls;
