// IndexedDB persistence and Overpass API loader for Lake County drivable motor-vehicle road network

export interface RoadWaySegment {
  id: number;
  type: 'motorway_trunk' | 'primary_secondary' | 'residential';
  name?: string;
  coords: [number, number][]; // [lat, lng]
}

export interface CachedRoadDataset {
  timestamp: number;
  motorwayTrunk: [number, number][][];
  primarySecondary: [number, number][][];
  residential: [number, number][][];
}

const DB_NAME = 'RaydrLakeCountyVectorDB';
const DB_VERSION = 1;
const STORE_NAME = 'roads_cache';
const CACHE_KEY = 'lake_county_drivable_v1';

// Open or create IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Retrieve cached road dataset from IndexedDB
export async function getCachedRoads(): Promise<CachedRoadDataset | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(CACHE_KEY);
      getReq.onsuccess = () => {
        resolve(getReq.result || null);
      };
      getReq.onerror = () => {
        resolve(null);
      };
    });
  } catch (err) {
    console.warn('IndexedDB read failed:', err);
    return null;
  }
}

// Save road dataset into IndexedDB
export async function setCachedRoads(data: CachedRoadDataset): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const putReq = store.put(data, CACHE_KEY);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    });
  } catch (err) {
    console.warn('IndexedDB write failed:', err);
  }
}

// Overpass API fetcher for Lake County drivable motor-vehicle roads
// Strictly excludes footways, cycleways, bridleways, paths, steps, pedestrian
export async function fetchOverpassLakeCountyRoads(
  onProgress?: (status: string) => void
): Promise<CachedRoadDataset | null> {
  const overpassEndpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
  ];

  // Lake County Bounding Box: 41.15, -87.53, 41.76, -87.20
  const overpassQuery = `[out:json][timeout:35];
(
  way["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential|unclassified|living_street)$"](41.15,-87.53,41.76,-87.20);
);
out geom;`;

  for (const endpoint of overpassEndpoints) {
    try {
      onProgress?.('Contacting Overpass vector gateway...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 38000);

      const res = await fetch(`${endpoint}?data=${encodeURIComponent(overpassQuery)}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        continue;
      }

      onProgress?.('Parsing Lake County vector road geometry...');
      const json = await res.json();
      if (!json || !Array.isArray(json.elements)) {
        continue;
      }

      const motorwayTrunk: [number, number][][] = [];
      const primarySecondary: [number, number][][] = [];
      const residential: [number, number][][] = [];

      for (const el of json.elements) {
        if (el.type === 'way' && Array.isArray(el.geometry) && el.geometry.length >= 2) {
          const hw = el.tags?.highway;
          // Filter out any non-drivable pedestrian trails that might slip through
          if (
            hw === 'footway' ||
            hw === 'cycleway' ||
            hw === 'path' ||
            hw === 'pedestrian' ||
            hw === 'steps' ||
            hw === 'bridleway'
          ) {
            continue;
          }

          const line: [number, number][] = el.geometry.map((pt: { lat: number; lon: number }) => [
            pt.lat,
            pt.lon,
          ]);

          if (hw === 'motorway' || hw === 'trunk' || hw === 'motorway_link' || hw === 'trunk_link') {
            motorwayTrunk.push(line);
          } else if (
            hw === 'primary' ||
            hw === 'secondary' ||
            hw === 'primary_link' ||
            hw === 'secondary_link'
          ) {
            primarySecondary.push(line);
          } else {
            residential.push(line);
          }
        }
      }

      const dataset: CachedRoadDataset = {
        timestamp: Date.now(),
        motorwayTrunk,
        primarySecondary,
        residential,
      };

      // Save to IndexedDB asynchronously
      setCachedRoads(dataset).catch((e) => console.warn('Could not cache roads:', e));

      return dataset;
    } catch (err) {
      console.warn(`Overpass fetch from ${endpoint} failed, trying next mirror:`, err);
    }
  }

  return null;
}
