import { LatLng } from '../types/navigation';

export interface SearchResult {
  id: string;
  name: string;
  address: string;
  category: string;
  coords: LatLng;
}

export const LAKE_COUNTY_PRESETS: SearchResult[] = [
  {
    id: 'preset-1',
    name: 'Crown Point Square',
    address: 'Historic Lake County Courthouse, Crown Point, IN',
    category: 'Civic & Historic',
    coords: { lat: 41.4170, lng: -87.3653 },
  },
  {
    id: 'preset-2',
    name: 'Southlake Mall',
    address: '2109 Southlake Mall, US-30, Merrillville, IN',
    category: 'Shopping & Retail',
    coords: { lat: 41.4700, lng: -87.3320 },
  },
  {
    id: 'preset-3',
    name: 'Schererville Crossroads',
    address: 'Intersection US-30 & US-41 (Indianapolis Blvd), IN',
    category: 'Commercial Corridor',
    coords: { lat: 41.4914, lng: -87.4728 },
  },
  {
    id: 'preset-4',
    name: 'Munster Community Hospital',
    address: '901 MacArthur Blvd, Munster, IN',
    category: 'Medical Center',
    coords: { lat: 41.5540, lng: -87.5090 },
  },
  {
    id: 'preset-5',
    name: 'Marquette Park & Beach',
    address: 'Lake Michigan Shoreline, Gary, IN',
    category: 'Park & Waterfront',
    coords: { lat: 41.6186, lng: -87.2617 },
  },
  {
    id: 'preset-6',
    name: 'Hammond South Shore Station',
    address: '4531 Hohman Ave, Hammond, IN',
    category: 'Transit Center',
    coords: { lat: 41.6320, lng: -87.5250 },
  },
  {
    id: 'preset-7',
    name: 'Lake George & Old Hobart',
    address: 'Main St & 3rd St, Hobart, IN',
    category: 'Downtown Lake',
    coords: { lat: 41.5320, lng: -87.2550 },
  },
  {
    id: 'preset-8',
    name: 'Cedar Lake Town Grounds',
    address: '7408 Constitution Ave, Cedar Lake, IN',
    category: 'Lakeside Recreation',
    coords: { lat: 41.3650, lng: -87.4320 },
  },
];

/**
 * Sanitizes address input for high-accuracy OpenStreetMap / Nominatim geocoding:
 * - Strips unit/suite/apartment designators using regex ("Ste C", "Suite 100", "Apt 4B", "Unit 2")
 * - Converts abbreviated highway strings ("US-41" -> "US 41", "I-65", "IN-53")
 */
export function sanitizeSearchAddress(raw: string): string {
  let cleaned = raw.trim();

  // 1. Strip suite / unit / apartment / floor / building designators
  cleaned = cleaned.replace(
    /\b(?:ste|suite|apt|apartment|unit|bldg|building|fl|floor|dept|room|rm|spc|space|lot)\.?\s*#?\s*[a-z0-9\-]+\b/gi,
    ''
  );
  cleaned = cleaned.replace(/#\s*[a-z0-9\-]+/gi, '');

  // 2. Convert abbreviated highway strings
  // US-41 -> US 41 / US Route 41
  cleaned = cleaned.replace(/\bus[-\s]?(\d+)\b/gi, 'US $1');
  // I-65 / I 65 -> I-$1
  cleaned = cleaned.replace(/\b(?:interstate|i)[-\s]?(\d+)\b/gi, 'I-$1');
  // IN-53 / State Road 53 -> IN-$1
  cleaned = cleaned.replace(/\b(?:indiana|in|sr|state road)[-\s]?(\d+)\b/gi, 'IN-$1');

  // 3. Clean up commas, leftover punctuation and whitespace
  cleaned = cleaned.replace(/,\s*,+/g, ',');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  cleaned = cleaned.replace(/^,\s*|,\s*$/g, '');

  return cleaned;
}

/**
 * Removes street number for fallback road-level geocoding
 * e.g., "10425 US 41, Schererville, IN 46375" -> "US 41, Schererville, IN 46375"
 */
export function stripStreetNumber(address: string): string | null {
  const match = address.match(/^\s*\d+[\s\-]+(.*)$/);
  if (match && match[1] && match[1].trim().length > 3) {
    return match[1].trim();
  }
  return null;
}

/**
 * Internal single fetch to Nominatim API
 */
async function queryNominatim(queryStr: string): Promise<SearchResult[]> {
  try {
    // Append Indiana if no state specified to prioritize Lake County region
    const searchParam =
      queryStr.toLowerCase().includes('in') || queryStr.toLowerCase().includes('indiana')
        ? queryStr
        : `${queryStr}, Lake County, Indiana`;

    const encoded = encodeURIComponent(searchParam);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&addressdetails=1&limit=6`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    clearTimeout(timer);

    if (!res.ok) return [];

    const data = await res.json();
    return data.map((item: any, idx: number) => {
      const parts = (item.display_name || '').split(',');
      const shortName = parts[0] || item.name || 'Location';
      const address = parts.slice(1, 4).join(',').trim() || item.display_name;
      return {
        id: `nom-${item.osm_id || idx}-${Date.now()}`,
        name: shortName,
        address: address,
        category: item.type ? item.type.replace('_', ' ') : 'Place',
        coords: {
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        },
      };
    });
  } catch (err) {
    return [];
  }
}

/**
 * Searches locations using OpenStreetMap Nominatim with Lake County focus
 * Includes address sanitization and automatic fallback without street number if 0 results
 */
export async function searchLocations(query: string): Promise<SearchResult[]> {
  const rawQ = query.trim();
  if (!rawQ) return [];

  const cleanQ = rawQ.toLowerCase();

  // 1. Instant local match from presets first
  const localMatches = LAKE_COUNTY_PRESETS.filter(
    (p) =>
      p.name.toLowerCase().includes(cleanQ) ||
      p.address.toLowerCase().includes(cleanQ) ||
      p.category.toLowerCase().includes(cleanQ)
  );

  // If query is very short, return local matches
  if (rawQ.length < 3) {
    return localMatches;
  }

  // 2. Sanitize address string (strip "Ste C", "Suite 100", normalize "US-41" -> "US 41")
  const sanitized = sanitizeSearchAddress(rawQ);

  // 3. Fire primary Nominatim fetch
  let fetchedResults = await queryNominatim(sanitized);

  // 4. Street Number Fallback: If 0 results, fall back to searching without the street number
  if (fetchedResults.length === 0) {
    const withoutStreetNumber = stripStreetNumber(sanitized);
    if (withoutStreetNumber) {
      fetchedResults = await queryNominatim(withoutStreetNumber);
    }
  }

  // 5. Merge results without duplicates
  const combined = [...localMatches];
  for (const r of fetchedResults) {
    if (
      !combined.some(
        (c) =>
          Math.abs(c.coords.lat - r.coords.lat) < 0.001 &&
          Math.abs(c.coords.lng - r.coords.lng) < 0.001
      )
    ) {
      combined.push(r);
    }
  }

  if (combined.length === 0 && localMatches.length > 0) {
    return localMatches;
  }

  return combined.slice(0, 6);
}
