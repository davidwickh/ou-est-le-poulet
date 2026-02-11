import { Location } from '../types';

export interface Venue {
  id: string;
  name: string;
  location: Location;
  type: 'pub' | 'bar';
}

/**
 * Fetch pubs and bars within a radius of a center point using OpenStreetMap Overpass API.
 * @param center - The center location
 * @param radiusMeters - Search radius in meters
 * @returns Array of venues found
 */
export const fetchVenuesInRadius = async (
  center: Location,
  radiusMeters: number
): Promise<Venue[]> => {
  // Overpass API query for pubs and bars
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="pub"](around:${radiusMeters},${center.lat},${center.lng});
      node["amenity"="bar"](around:${radiusMeters},${center.lat},${center.lng});
      way["amenity"="pub"](around:${radiusMeters},${center.lat},${center.lng});
      way["amenity"="bar"](around:${radiusMeters},${center.lat},${center.lng});
    );
    out center;
  `;

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      console.error('Overpass API error:', response.status);
      return [];
    }

    const data = await response.json();
    
    const venues: Venue[] = data.elements
      .filter((el: any) => el.tags?.name) // Only include named venues
      .map((el: any) => {
        // For ways, use the center coordinates
        const lat = el.lat ?? el.center?.lat;
        const lng = el.lon ?? el.center?.lon;
        
        if (!lat || !lng) return null;

        return {
          id: `osm-${el.id}`,
          name: el.tags.name,
          location: { lat, lng },
          type: el.tags.amenity as 'pub' | 'bar',
        };
      })
      .filter((v: Venue | null): v is Venue => v !== null);

    console.log(`[VenueSearch] Found ${venues.length} pubs/bars within ${radiusMeters}m`);
    return venues;
  } catch (error) {
    console.error('Failed to fetch venues:', error);
    return [];
  }
};
