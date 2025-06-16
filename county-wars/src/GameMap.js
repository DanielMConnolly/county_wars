"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const mapStyles_1 = require("./data/mapStyles");
const leaflet_1 = require("leaflet");
require("leaflet/dist/leaflet.css");
const leaflet_2 = __importDefault(require("leaflet"));
const GameStateContext_1 = require("./GameStateContext");
const gameUtils_1 = require("./utils/gameUtils");
const defaultStyle = {
    fillColor: "#3388ff",
    weight: 1,
    opacity: 1,
    color: "white",
    fillOpacity: 0.3,
};
const highlightStyle = {
    fillColor: "#ff7800",
    weight: 3,
    opacity: 1,
    color: "#666",
    fillOpacity: 0.7,
};
const GameMap = ({ mapControls }) => {
    const { gameState, selectCounty } = (0, react_1.useContext)(GameStateContext_1.GameStateContext);
    const mapRef = (0, react_1.useRef)(null);
    const mapInstance = (0, react_1.useRef)(null);
    const [currentHighlighted, setCurrentHighlighted] = (0, react_1.useState)(null);
    if (currentHighlighted != null) {
        currentHighlighted.setStyle(highlightStyle);
    }
    const handleTileClick = (0, react_1.useCallback)((layer) => {
        setCurrentHighlighted(prevLayer => {
            const prevLayerCounty = {
                name: prevLayer === null || prevLayer === void 0 ? void 0 : prevLayer.feature.properties.NAME,
                state: prevLayer === null || prevLayer === void 0 ? void 0 : prevLayer.feature.properties.STATEFP,
                pop: 10000,
                difficulty: 1,
            };
            const wasPreviouslySelectedCountyOwned = (0, gameUtils_1.useIsCountyOwned)(prevLayerCounty);
            if (!wasPreviouslySelectedCountyOwned) {
                prevLayer === null || prevLayer === void 0 ? void 0 : prevLayer.setStyle(defaultStyle);
            }
            return layer;
        });
        selectCounty({
            name: layer.feature.properties.NAME,
            pop: 10000,
            difficulty: 1,
            state: layer.feature.properties.STATEFP,
        });
    }, [currentHighlighted]);
    // Initialize map
    (0, react_1.useEffect)(() => {
        const highlightStyles = highlightStyle;
        highlightStyles.fillColor = gameState.highlightColor;
        if (!mapRef.current || mapInstance.current)
            return;
        if (mapRef.current != null) {
            mapInstance.current = (0, leaflet_1.map)(mapRef.current).setView([39.8283, -98.5795], 4);
        }
        fetch("counties.geojson")
            .then((response) => response.json())
            .then((data) => {
            const layer = leaflet_2.default.geoJSON(data, {
                style: defaultStyle,
                onEachFeature: function (feature, layer) {
                    if (layer.feature.properties.NAME + layer.feature.properties.STATE_FP in gameState.ownedCounties) {
                        layer.setStyle(highlightStyles);
                    }
                    // Add click event to each county
                    layer.on("click", () => handleTileClick(layer));
                    layer.on("mouseover", function (e) {
                    });
                    layer.on("mouseout", function (e) {
                    });
                },
            });
            if (mapInstance.current) {
                layer.addTo(mapInstance.current);
            }
        })
            .catch((error) => console.error("Error loading counties:", error));
        return () => {
        };
    }, [handleTileClick]);
    (0, react_1.useEffect)(() => {
        function highlightCounty(layer) {
            layer.setStyle(highlightStyle);
            setCurrentHighlighted(layer);
        }
        mapInstance.current.eachLayer((layer) => {
            if (!layer.feature)
                return;
            if (gameState.ownedCounties.has(layer.feature.properties.NAME + layer.feature.properties.STATEFP)) {
                highlightCounty(layer);
            }
        });
    }, [gameState.highlightColor, gameState.ownedCounties]);
    // Update map style
    (0, react_1.useEffect)(() => {
        if (mapInstance.current == null || !leaflet_2.default)
            return;
        mapInstance.current.eachLayer((layer) => {
            if (layer instanceof leaflet_2.default.TileLayer) {
                mapInstance.current.removeLayer(layer);
            }
        });
        leaflet_2.default
            .tileLayer(mapStyles_1.mapStyles[mapControls.style], {
            attribution: (0, mapStyles_1.getAttribution)(mapControls.style),
        })
            .addTo(mapInstance.current);
    }, [mapControls.style]);
    // Update zoom
    (0, react_1.useEffect)(() => {
        if (!mapInstance.current)
            return;
        mapInstance.current.setZoom(mapControls.zoom);
    }, []);
    return (<div ref={mapRef} className="fixed top-16 left-0 right-0 bottom-0 z-[1]" style={{ height: "calc(100vh - 64px)" }}> </div>);
};
exports.default = GameMap;
