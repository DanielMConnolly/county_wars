import { County } from '../types/GameTypes';

export async function fetchPopulationData(county: County): Promise<number | null> {
  try {
    const response = await fetch(
      `https://api.census.gov/data/2023/pep/charv?get=POP&for=county:${county.countyFP}` +
      `&in=state:${county.stateFP}&YEAR=2023`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch population data');
    }

    const data = await response.json();
    return parseInt(data[1][0]);
  } catch (error) {
    console.error('Error fetching population data:', error);
    return null;
  }
}
