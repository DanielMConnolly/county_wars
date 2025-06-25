import { divIcon } from "leaflet";
import { DataTestIDs } from "./DataTestIDs";

export const createFranchiseIcon = (backgroundColor?: string) => {
  return divIcon({
    className: 'franchise-marker',
    html: `<div
      ${backgroundColor ? `data-testid="${DataTestIDs.FRANCHISE_MARKER}"` : ''}
      style="
      ${backgroundColor ? `background: ${backgroundColor};` : ''}
      border: 2px solid white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">
      <div style="
        background: white;
        border-radius: 50%;
        width: 8px;
        height: 8px;
      "></div>
    </div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};