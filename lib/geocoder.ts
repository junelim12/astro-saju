// lib/geocoder.ts

type GeoData = {
  lat: number;
  lng: number;
  name: string;
};

// Major city coordinate database (US-first; add more as needed)
const CITY_DB: Record<string, GeoData> = {
  // United States
  "new york": { lat: 40.7128, lng: -74.006, name: "New York" },
  "los angeles": { lat: 34.0522, lng: -118.2437, name: "Los Angeles" },
  chicago: { lat: 41.8781, lng: -87.6298, name: "Chicago" },
  houston: { lat: 29.7604, lng: -95.3698, name: "Houston" },
  phoenix: { lat: 33.4484, lng: -112.074, name: "Phoenix" },
  philadelphia: { lat: 39.9526, lng: -75.1652, name: "Philadelphia" },
  "san antonio": { lat: 29.4241, lng: -98.4936, name: "San Antonio" },
  "san diego": { lat: 32.7157, lng: -117.1611, name: "San Diego" },
  dallas: { lat: 32.7767, lng: -96.797, name: "Dallas" },
  austin: { lat: 30.2672, lng: -97.7431, name: "Austin" },
  "san jose": { lat: 37.3382, lng: -121.8863, name: "San Jose" },
  "san francisco": { lat: 37.7749, lng: -122.4194, name: "San Francisco" },
  seattle: { lat: 47.6062, lng: -122.3321, name: "Seattle" },
  denver: { lat: 39.7392, lng: -104.9903, name: "Denver" },
  boston: { lat: 42.3601, lng: -71.0589, name: "Boston" },
  "washington dc": { lat: 38.9072, lng: -77.0369, name: "Washington, DC" },
  nashville: { lat: 36.1627, lng: -86.7816, name: "Nashville" },
  atlanta: { lat: 33.749, lng: -84.388, name: "Atlanta" },
  miami: { lat: 25.7617, lng: -80.1918, name: "Miami" },
  "las vegas": { lat: 36.1699, lng: -115.1398, name: "Las Vegas" },
  portland: { lat: 45.5152, lng: -122.6784, name: "Portland" },
  minneapolis: { lat: 44.9778, lng: -93.265, name: "Minneapolis" },
  detroit: { lat: 42.3314, lng: -83.0458, name: "Detroit" },
  "new orleans": { lat: 29.9511, lng: -90.0715, name: "New Orleans" },
  charlotte: { lat: 35.2271, lng: -80.8431, name: "Charlotte" },
  orlando: { lat: 28.5384, lng: -81.3789, name: "Orlando" },
  "salt lake city": { lat: 40.7608, lng: -111.891, name: "Salt Lake City" },
  honolulu: { lat: 21.3069, lng: -157.8583, name: "Honolulu" },
  anchorage: { lat: 61.2181, lng: -149.9003, name: "Anchorage" },
  "kansas city": { lat: 39.0997, lng: -94.5786, name: "Kansas City" },
  "st. louis": { lat: 38.627, lng: -90.1994, name: "St. Louis" },
  pittsburgh: { lat: 40.4406, lng: -79.9959, name: "Pittsburgh" },
  baltimore: { lat: 39.2904, lng: -76.6122, name: "Baltimore" },
  sacramento: { lat: 38.5816, lng: -121.4944, name: "Sacramento" },
  raleigh: { lat: 35.7796, lng: -78.6382, name: "Raleigh" },
  columbus: { lat: 39.9612, lng: -82.9988, name: "Columbus" },
  indianapolis: { lat: 39.7684, lng: -86.1581, name: "Indianapolis" },
  milwaukee: { lat: 43.0389, lng: -87.9065, name: "Milwaukee" },
  memphis: { lat: 35.1495, lng: -90.049, name: "Memphis" },
  "oklahoma city": { lat: 35.4676, lng: -97.5164, name: "Oklahoma City" },

  // Canada
  toronto: { lat: 43.6532, lng: -79.3832, name: "Toronto" },
  vancouver: { lat: 49.2827, lng: -123.1207, name: "Vancouver" },
  montreal: { lat: 45.5019, lng: -73.5674, name: "Montreal" },

  // United Kingdom
  london: { lat: 51.5074, lng: -0.1278, name: "London" },
  manchester: { lat: 53.4808, lng: -2.2426, name: "Manchester" },
  edinburgh: { lat: 55.9533, lng: -3.1883, name: "Edinburgh" },

  // Other major world cities
  paris: { lat: 48.8566, lng: 2.3522, name: "Paris" },
  tokyo: { lat: 35.6762, lng: 139.6503, name: "Tokyo" },
  seoul: { lat: 37.5665, lng: 126.978, name: "Seoul" },
  sydney: { lat: -33.8688, lng: 151.2093, name: "Sydney" },
  "mexico city": { lat: 19.4326, lng: -99.1332, name: "Mexico City" },
  mumbai: { lat: 19.076, lng: 72.8777, name: "Mumbai" },
  manila: { lat: 14.5995, lng: 120.9842, name: "Manila" },
};

export function getCoordinates(input: string): GeoData {
  const key = input.trim().toLowerCase();

  if (CITY_DB[key]) {
    return CITY_DB[key];
  }

  // Fallback: default to New York's coordinates (most common timezone reference)
  // but keep the original name so the AI can still work with it.
  return { lat: 40.7128, lng: -74.006, name: input };
}

/** City -> UTC offset (hours, standard time). Used for chart calculation. */
const CITY_TIMEZONE: Record<string, number> = {
  // United States
  "new york": -5, "los angeles": -8, chicago: -6, houston: -6, phoenix: -7,
  philadelphia: -5, "san antonio": -6, "san diego": -8, dallas: -6, austin: -6,
  "san jose": -8, "san francisco": -8, seattle: -8, denver: -7, boston: -5,
  "washington dc": -5, nashville: -6, atlanta: -5, miami: -5, "las vegas": -8,
  portland: -8, minneapolis: -6, detroit: -5, "new orleans": -6, charlotte: -5,
  orlando: -5, "salt lake city": -7, honolulu: -10, anchorage: -9,
  "kansas city": -6, "st. louis": -6, pittsburgh: -5, baltimore: -5,
  sacramento: -8, raleigh: -5, columbus: -5, indianapolis: -5, milwaukee: -6,
  memphis: -6, "oklahoma city": -6,

  // Canada
  toronto: -5, vancouver: -8, montreal: -5,

  // United Kingdom
  london: 0, manchester: 0, edinburgh: 0,

  // Other
  paris: 1, tokyo: 9, seoul: 9, sydney: 10, "mexico city": -6, mumbai: 5.5, manila: 8,
};

export function getTimezoneOffset(cityInput: string): number {
  const key = cityInput.trim().toLowerCase();
  return CITY_TIMEZONE[key] ?? -5;
}
