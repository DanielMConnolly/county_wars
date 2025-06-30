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

export async function updateUserHighlightColor(userId: string, color: string): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:3001/api/users/${userId}/highlight-color`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ color }),
    });

    if (!response.ok) {
      console.error('Failed to save highlight color:', response.status);
      return false;
    } else {
      console.log('Highlight color saved successfully:', color);
      return true;
    }
  } catch (error) {
    console.error('Failed to update highlight color:', error);
    return false;
  }
}
