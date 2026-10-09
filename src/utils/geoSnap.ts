import { LatLng } from '../types/navigation';

/**
 * Validates whether a coordinate point is on land and within Lake County, Indiana.
 * Also checks distance against major water bodies (e.g. Lake Michigan, Cedar Lake, Grand Calumet River, Lake George)
 * to avoid floating water pins.
 */

// Bounding box for Lake County, Indiana (including drivable highways MM 0-16 of Borman)
export const LAKE_COUNTY_BOUNDS = {
  minLat: 41.1600, // South border near Lowell / Kankakee River
  maxLat: 41.6900, // North border (shoreline with Lake Michigan ~41.62 - 41.65, Whiting/Hammond casino piers ~41.68)
  minLng: -87.5320, // West border (Illinois state line)
  maxLng: -87.2100, // East border (Porter County line)
};

// Known Lake Michigan and major open water polygons/centers to prevent floating pins
const WATER_EXCLUSION_CIRCLES = [
  // Lake Michigan (anything north of coastal road envelope in Hammond/Whiting/Gary)
  { lat: 41.7200, lng: -87.4500, radiusMeters: 5000 },
  { lat: 41.6500, lng: -87.3500, radiusMeters: 2200 },
  { lat: 41.6600, lng: -87.2700, radiusMeters: 2500 },
  // Cedar Lake water core (Lake County)
  { lat: 41.3650, lng: -87.4350, radiusMeters: 1000 },
  // Lake George water center (Hobart)
  { lat: 41.5280, lng: -87.2550, radiusMeters: 450 },
  // Wolf Lake water center (Hammond)
  { lat: 41.6660, lng: -87.5100, radiusMeters: 1100 },
  // George Lake water center (Whiting / Hammond)
  { lat: 41.6700, lng: -87.4850, radiusMeters: 700 },
];

// Curated list of known valid onshore drivable road nodes across Lake County highway and arterial network
export const VALID_ONSHORE_ROAD_NODES: { name: string; roadType: string; coords: LatLng }[] = [
  // I-80 / I-94 Borman Expressway
  { name: 'I-80/94 MM 1 Calumet Ave', roadType: 'motorway', coords: { lat: 41.5842, lng: -87.5098 } },
  { name: 'I-80/94 MM 2 Indianapolis Blvd', roadType: 'motorway', coords: { lat: 41.5838, lng: -87.4725 } },
  { name: 'I-80/94 MM 3 Kennedy Ave', roadType: 'motorway', coords: { lat: 41.5832, lng: -87.4520 } },
  { name: 'I-80/94 MM 5 Cline Ave', roadType: 'motorway', coords: { lat: 41.5824, lng: -87.4320 } },
  { name: 'I-80/94 MM 7 Burr St', roadType: 'motorway', coords: { lat: 41.5810, lng: -87.4100 } },
  { name: 'I-80/94 MM 9 Grant St', roadType: 'motorway', coords: { lat: 41.5802, lng: -87.3556 } },
  { name: 'I-80/94 MM 10 Broadway', roadType: 'motorway', coords: { lat: 41.5794, lng: -87.3340 } },
  { name: 'I-80/94 MM 12 I-65 Interchange', roadType: 'motorway', coords: { lat: 41.5788, lng: -87.3180 } },
  { name: 'I-80/94 MM 15 Central Ave / Ripley', roadType: 'motorway', coords: { lat: 41.5780, lng: -87.2510 } },

  // I-65 Corridor
  { name: 'I-65 at 61st Ave (Exit 255)', roadType: 'motorway', coords: { lat: 41.5200, lng: -87.3180 } },
  { name: 'I-65 at US-30 (Exit 253)', roadType: 'motorway', coords: { lat: 41.4710, lng: -87.3195 } },
  { name: 'I-65 at 93rd Ave (Exit 250)', roadType: 'motorway', coords: { lat: 41.4420, lng: -87.3150 } },
  { name: 'I-65 at 109th Ave (Exit 249)', roadType: 'motorway', coords: { lat: 41.4250, lng: -87.3130 } },
  { name: 'I-65 at US-231 (Exit 247)', roadType: 'motorway', coords: { lat: 41.3850, lng: -87.3110 } },
  { name: 'I-65 at IN-2 (Exit 240 Lowell)', roadType: 'motorway', coords: { lat: 41.2950, lng: -87.3050 } },

  // US-30 (Lincoln Highway)
  { name: 'US-30 & US-41 Crossroads Schererville', roadType: 'primary', coords: { lat: 41.4912, lng: -87.4729 } },
  { name: 'US-30 & Burr St', roadType: 'primary', coords: { lat: 41.4915, lng: -87.4100 } },
  { name: 'US-30 & Taft St (IN-55)', roadType: 'primary', coords: { lat: 41.4910, lng: -87.3640 } },
  { name: 'US-30 & Broadway (IN-53)', roadType: 'primary', coords: { lat: 41.4702, lng: -87.3345 } },
  { name: 'US-30 & Colorado St (Hobart)', roadType: 'primary', coords: { lat: 41.4700, lng: -87.2750 } },

  // US-41 (Indianapolis Blvd)
  { name: 'US-41 & 165th St Hammond', roadType: 'primary', coords: { lat: 41.5950, lng: -87.4690 } },
  { name: 'US-41 & Ridge Rd Highland', roadType: 'primary', coords: { lat: 41.5580, lng: -87.4700 } },
  { name: 'US-41 & 45th St Highland', roadType: 'primary', coords: { lat: 41.5510, lng: -87.4705 } },
  { name: 'US-41 & Main St Schererville', roadType: 'primary', coords: { lat: 41.4880, lng: -87.4720 } },
  { name: 'US-41 & 93rd Ave St. John', roadType: 'primary', coords: { lat: 41.4480, lng: -87.4725 } },
  { name: 'US-41 & 109th Ave St. John', roadType: 'primary', coords: { lat: 41.4200, lng: -87.4728 } },

  // Broadway (IN-53) & Crown Point Square
  { name: 'Broadway & 5th Ave Gary', roadType: 'primary', coords: { lat: 41.6010, lng: -87.3340 } },
  { name: 'Broadway & Ridge Rd (37th Ave)', roadType: 'primary', coords: { lat: 41.5520, lng: -87.3342 } },
  { name: 'Broadway & 61st Ave Merrillville', roadType: 'primary', coords: { lat: 41.5200, lng: -87.3340 } },
  { name: 'Broadway & 93rd Ave Crown Point', roadType: 'primary', coords: { lat: 41.4420, lng: -87.3325 } },
  { name: 'Crown Point Court Square (Main & Clark)', roadType: 'primary', coords: { lat: 41.4172, lng: -87.3638 } },
  { name: '109th Ave & Randolph St Winfield', roadType: 'secondary', coords: { lat: 41.4060, lng: -87.2390 } },

  // Calumet Ave (Munster / Hammond)
  { name: 'Calumet Ave & Ridge Rd Munster', roadType: 'primary', coords: { lat: 41.5580, lng: -87.5085 } },
  { name: 'Calumet Ave & 45th St Munster', roadType: 'primary', coords: { lat: 41.5450, lng: -87.5090 } },
  { name: 'Calumet Ave & River Oaks (Hammond)', roadType: 'primary', coords: { lat: 41.6050, lng: -87.5080 } },

  // Cline Ave Expressway (IN-912)
  { name: 'Cline Ave & Columbus Dr East Chicago', roadType: 'trunk', coords: { lat: 41.6310, lng: -87.4520 } },
  { name: 'Cline Ave & Ridge Rd Griffith', roadType: 'trunk', coords: { lat: 41.5600, lng: -87.4320 } },
];

function haversineMeters(c1: LatLng, c2: LatLng): number {
  const R = 6371e3;
  const dLat = ((c2.lat - c1.lat) * Math.PI) / 180;
  const dLng = ((c2.lng - c1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((c1.lat * Math.PI) / 180) *
      Math.cos((c2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Blacklisted non-drivable back street / ATV / pedestrian alleyway segments.
 * Explicitly blocks known inaccessible Cedar Lake back-alley dirt paths, easement trails,
 * private boat ramps, and non-accessible shoreline ATV tracks.
 */
export interface BlacklistedSegment {
  id: string;
  name: string;
  area: string;
  reason: string;
  center: LatLng;
  radiusMeters: number;
}

export const BLACKLISTED_NON_DRIVABLE_SEGMENTS: BlacklistedSegment[] = [
  // Cedar Lake West Shore non-drivable ATV easement / pedestrian shoreline path
  {
    id: 'cedar-lake-west-easement',
    name: 'Cedar Lake West Shore ATV / Foot Trail',
    area: 'Cedar Lake',
    reason: 'Non-drivable pedestrian / ATV dirt easement and private boat ramp access',
    center: { lat: 41.3685, lng: -87.4435 },
    radiusMeters: 380,
  },
  // Cedar Lake South Shore unpaved marsh trail
  {
    id: 'cedar-lake-south-marsh-alley',
    name: 'South Lake Marsh Access Path',
    area: 'Cedar Lake',
    reason: 'Unpaved swamp easement / gated maintenance track impassable to motor vehicles',
    center: { lat: 41.3520, lng: -87.4380 },
    radiusMeters: 320,
  },
  // Cedar Lake East Shore narrow lakeside pedestrian boardwalk / cart lane
  {
    id: 'cedar-lake-east-shore-cartway',
    name: 'East Shore Cartway & Private Lakeside Alleys',
    area: 'Cedar Lake',
    reason: 'Inaccessible narrow pedestrian boardwalk and golf-cart only lane',
    center: { lat: 41.3710, lng: -87.4260 },
    radiusMeters: 340,
  },
  // Cedar Creek non-accessible utility service corridor
  {
    id: 'cedar-lake-northwest-utility',
    name: 'Northwest Cedar Lake Drainage Service Track',
    area: 'Cedar Lake',
    reason: 'Ungraded utility easement blocked by bollards',
    center: { lat: 41.3820, lng: -87.4470 },
    radiusMeters: 290,
  },
];

/**
 * Checks if a coordinate falls inside any blacklisted non-drivable back street or ATV path
 */
export function isCoordinateBlacklisted(coords: LatLng): boolean {
  for (const seg of BLACKLISTED_NON_DRIVABLE_SEGMENTS) {
    if (haversineMeters(coords, seg.center) < seg.radiusMeters) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if a coordinate is strictly onshore, within drivable Lake County limits,
 * and not within blacklisted non-accessible back streets.
 */
export function isCoordinateOnshoreAndValid(coords: LatLng): boolean {
  if (
    coords.lat < LAKE_COUNTY_BOUNDS.minLat ||
    coords.lat > LAKE_COUNTY_BOUNDS.maxLat ||
    coords.lng < LAKE_COUNTY_BOUNDS.minLng ||
    coords.lng > LAKE_COUNTY_BOUNDS.maxLng
  ) {
    return false;
  }

  // Check water exclusion zones
  for (const w of WATER_EXCLUSION_CIRCLES) {
    if (haversineMeters(coords, { lat: w.lat, lng: w.lng }) < w.radiusMeters) {
      return false;
    }
  }

  // Check Cedar Lake non-drivable back street / ATV blacklist
  if (isCoordinateBlacklisted(coords)) {
    return false;
  }

  return true;
}

/**
 * Snaps any coordinate to the nearest verified onshore road segment
 * within Lake County network if it falls in water or outside roads.
 */
export function snapCoordinateToOnshoreRoad(coords: LatLng): LatLng {
  if (isCoordinateOnshoreAndValid(coords)) {
    return coords;
  }

  // Find closest valid onshore road node
  let bestNode = VALID_ONSHORE_ROAD_NODES[0];
  let minDistance = Infinity;

  for (const node of VALID_ONSHORE_ROAD_NODES) {
    const d = haversineMeters(coords, node.coords);
    if (d < minDistance) {
      minDistance = d;
      bestNode = node;
    }
  }

  return { lat: bestNode.coords.lat, lng: bestNode.coords.lng };
}

/**
 * Standard allowed drivable road highway classifications (motor-vehicles only)
 */
export const ALLOWED_MOTOR_VEHICLE_HIGHWAYS = new Set([
  'motorway',
  'trunk',
  'primary',
  'secondary',
  'tertiary',
  'residential',
  'unclassified',
  'living_street',
]);

/**
 * Disallowed non-motorized ways to exclude
 */
export const EXCLUDED_NON_MOTORIZED_HIGHWAYS = new Set([
  'footway',
  'path',
  'pedestrian',
  'track',
  'cycleway',
  'bridleway',
  'steps',
  'corridor',
  'platform',
]);
