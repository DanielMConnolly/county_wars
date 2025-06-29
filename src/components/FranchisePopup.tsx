import React from 'react';
import { renderToString } from 'react-dom/server';
import { Franchise } from '../types/GameTypes';

interface FranchisePopupProps {
  franchise: Franchise;
  isOwnedByUser: boolean;
}

interface ClickLocationPopupProps {
  locationName?: string;
  dateTime?: string;
}

// React components for popups
export const FranchisePopup: React.FC<FranchisePopupProps> = ({
  franchise,
  isOwnedByUser,
}) => {
  const ownershipText = isOwnedByUser ? 'Your franchise' : `Owned by ${franchise.username}`;
  const ownershipColor = isOwnedByUser ? '#10b981' : '#6b7280';
  console.log("PLACED AT: ", franchise.placedAt);
  return (
    <div style={{ fontSize: '14px' }}>
      <strong>{franchise.name}</strong><br />
      <small>Placed: {new Date(franchise.placedAt).toLocaleString()}</small><br />
      <small style={{ color: ownershipColor }}>{ownershipText}</small>
    </div>
  );
};

export const ClickLocationPopup: React.FC<ClickLocationPopupProps> = ({
  locationName = 'Selected Location',
  dateTime = new Date().toLocaleString(),
}) => {
  return (
    <div style={{ fontSize: '14px' }}>
      <strong>{locationName}</strong><br />
      <small>Selected: {dateTime}</small>
    </div>
  );
};

// Helper functions that convert React components to HTML strings for Leaflet
export const createFranchisePopupHTML = (props: FranchisePopupProps): string => {
  return renderToString(<FranchisePopup {...props} />);
};

export const createClickLocationPopupHTML = (props: ClickLocationPopupProps): string => {
  return renderToString(<ClickLocationPopup {...props} />);
};
