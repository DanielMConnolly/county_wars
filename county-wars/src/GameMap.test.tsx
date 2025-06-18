import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import GameMap from './GameMap.react';
import { GameStateProvider } from './GameStateProvider.react';
import { MapControls } from './types/GameTypes';

// Mock fetch to return sample GeoJSON data
const mockCountyData = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        COUNTYFP: "001",
        STATEFP: "01",
        NAME: "Test County"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[[-86.0, 32.0], [-86.0, 33.0], [-85.0, 33.0], [-85.0, 32.0], [-86.0, 32.0]]]
      }
    }
  ]
};

beforeEach(() => {
  // Mock the fetch call for counties.geojson
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => mockCountyData
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

// Mock map controls
const mockMapControls: MapControls = {
  zoom: 4,
  style: 'terrain'
};

describe('GameMap Component', () => {
  test('renders map container on page load', () => {
    render(
      <GameStateProvider>
        <GameMap mapControls={mockMapControls} />
      </GameStateProvider>
    );

    // Check that the main map container is rendered
    const mapContainer = screen.getByTestId('game-map');
    expect(mapContainer).toBeInTheDocument();
    expect(mapContainer).toHaveClass('fixed', 'top-16', 'left-0', 'right-0', 'bottom-0');
  });

  test('map has proper styling and positioning', () => {
    render(
      <GameStateProvider>
        <GameMap mapControls={mockMapControls} />
      </GameStateProvider>
    );

    const mapContainer = screen.getByTestId('game-map');
    
    // Check positioning classes
    expect(mapContainer).toHaveClass('fixed');
    expect(mapContainer).toHaveClass('top-16');
    expect(mapContainer).toHaveClass('left-0');
    expect(mapContainer).toHaveClass('right-0');
    expect(mapContainer).toHaveClass('bottom-0');
    
    // Check z-index
    expect(mapContainer).toHaveClass('z-[1]');
  });

  test('loads county data from GeoJSON', async () => {
    render(
      <GameStateProvider>
        <GameMap mapControls={mockMapControls} />
      </GameStateProvider>
    );

    // Verify map container exists
    const mapContainer = screen.getByTestId('game-map');
    expect(mapContainer).toBeInTheDocument();

    // Wait for fetch to be called (counties.geojson) 
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('counties.geojson');
    });

    // Verify the map container is properly positioned and styled
    expect(mapContainer).toHaveClass('fixed', 'top-16', 'left-0', 'right-0', 'bottom-0');
  });

  test('handles map loading delay', async () => {
    // Mock fetch to simulate loading delay
    (global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => mockCountyData
      }), 50))
    );

    render(
      <GameStateProvider>
        <GameMap mapControls={mockMapControls} />
      </GameStateProvider>
    );

    // Map container should be present immediately
    const mapContainer = screen.getByTestId('game-map');
    expect(mapContainer).toBeInTheDocument();

    // Wait for county data to load
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('counties.geojson');
    }, { timeout: 3000 });
  });
});