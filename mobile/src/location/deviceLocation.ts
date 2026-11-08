import { currentSearchLocation } from './currentSearchLocation';
import indiaCitiesData from './india-cities.json';
import canonicalData from './canonical-locations.json';

export interface NearestCityMatch {
  id: string;
  name: string;
  stateCode: string;
  stateName: string;
  districtName: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
}

export interface DeviceLocationResult {
  granted: boolean;
  latitude?: number;
  longitude?: number;
  district?: string;
  city?: string;
  exactVillageOrLocality?: string;
  cityId?: string;
  stateCode?: string;
  stateName?: string;
  postalCode?: string;
  displayLocation?: string;
  error?: string;
}

/**
 * Calculates great-circle distance between two coordinates in kilometers.
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Normalizes district names (e.g. "Bangalore Urban" -> "Bengaluru", "Krishnagiri District" -> "Krishnagiri").
 */
function normalizeDistrictName(raw: string): string {
  if (!raw) return '';
  const cleaned = raw
    .replace(/\s+District$/i, '')
    .replace(/^District\s+/i, '')
    .replace(/\s+Urban$/i, '')
    .replace(/\s+Rural$/i, '')
    .replace(/\s+City$/i, '')
    .trim();

  if (/bangalore|bengaluru/i.test(cleaned)) {
    return 'Bengaluru';
  }
  return cleaned;
}

/**
 * Finds the nearest known canonical city and resolves its parent District.
 * If a user is located in a village, the district name is used for marketplace matching
 * and display, while the exact village is preserved for detailed job addresses.
 */
export function findNearestIndianCityWithDistrict(
  latitude: number,
  longitude: number,
): NearestCityMatch {
  const defaultCity = indiaCitiesData.cities[0]!;
  let best = defaultCity;
  let minDistance = Infinity;

  for (const c of indiaCitiesData.cities) {
    if (!c) continue;
    const dist = haversineDistance(
      latitude,
      longitude,
      c.latitude,
      c.longitude,
    );
    if (dist < minDistance) {
      minDistance = dist;
      best = c;
    }
  }

  // Find canonical district for this city
  let districtName = best.name;
  const canonicalCity = canonicalData.cities.find(
    (c) => c.id === String(best.id),
  );
  if (
    canonicalCity &&
    canonicalCity.districtIds &&
    canonicalCity.districtIds.length > 0
  ) {
    const districtObj = canonicalData.districts.find(
      (d) => d.id === canonicalCity.districtIds[0],
    );
    if (districtObj && districtObj.name) {
      districtName = normalizeDistrictName(districtObj.name);
    }
  }

  const matchedState = indiaCitiesData.states.find(
    (s) => s.code === best.stateCode,
  );

  return {
    id: String(best.id),
    name: best.name,
    stateCode: best.stateCode,
    stateName: matchedState?.name || best.stateCode,
    districtName,
    latitude: best.latitude,
    longitude: best.longitude,
    distanceKm: Math.round(minDistance * 10) / 10,
  };
}

/**
 * Reads OS-provided coordinates after permission. This does not establish
 * administrative boundaries; profile location remains explicit manual input.
 */
export async function detectDeviceLocation(): Promise<DeviceLocationResult> {
  try {
    const { latitude, longitude } = await currentSearchLocation();
    // Catalogue points are not administrative boundary polygons. Never infer
    // a user's district/state from proximity, including when geocoding fails.
    return {
      granted: true,
      latitude,
      longitude,
      error:
        'GPS coordinates detected. State and district have not been geographically verified. Please enter your state, district and city manually.',
    };
  } catch (err: any) {
    return {
      granted: false,
      error: err?.message || 'Could not determine device location.',
    };
  }
}
