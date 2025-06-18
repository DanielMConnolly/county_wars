export async function fetchUserCounties(userId: string): Promise<string[]> {
  try {
    console.log('Fetching initial counties for userId:', userId);
    const response = await fetch(`http://localhost:3001/api/counties/${userId}`);
    console.log('Counties HTTP response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('Fetched initial counties via HTTP:', data.ownedCounties);
      return data.ownedCounties;
    } else {
      console.error('Counties HTTP request failed with status:', response.status);
      return [];
    }
  } catch (error) {
    console.error('Failed to fetch initial counties:', error);
    return [];
  }
}

export async function fetchUserHighlightColor(userId: string): Promise<string> {
  try {
    console.log('Fetching highlight color for userId:', userId);
    const response = await fetch(`http://localhost:3001/api/users/${userId}/highlight-color`);
    console.log('Color HTTP response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('Fetched saved highlight color:', data.color);
      return data.color;
    } else {
      console.error('Color HTTP request failed with status:', response.status);
      return 'red'; // Default color
    }
  } catch (error) {
    console.error('Failed to fetch highlight color:', error);
    return 'red'; // Default color
  }
}