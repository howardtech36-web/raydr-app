import { SavedLocation, LatLng } from '../types/navigation';

const STORAGE_KEY = 'raydr_saved_locations';

export const DEFAULT_SAVED_LOCATIONS: SavedLocation[] = [
  {
    id: 'default-home',
    type: 'home',
    name: 'Home',
    address: 'Historic Courthouse Square, Crown Point, IN',
    coords: { lat: 41.4170, lng: -87.3653 },
    savedAt: 1710000000000,
  },
  {
    id: 'default-work',
    type: 'work',
    name: 'Work',
    address: 'Southlake US-30 Commercial Center, Merrillville, IN',
    coords: { lat: 41.4700, lng: -87.3320 },
    savedAt: 1710000000000,
  },
  {
    id: 'default-custom-1',
    type: 'custom',
    customLabel: 'Crossroads Gym',
    name: 'Schererville Crossroads',
    address: 'US-30 & US-41 Crossroads Center, Schererville, IN',
    coords: { lat: 41.4914, lng: -87.4728 },
    savedAt: 1710000000000,
  },
];

/**
 * Loads all saved locations from localStorage with fallback defaults
 */
export function getSavedLocations(): SavedLocation[] {
  if (typeof window === 'undefined') return DEFAULT_SAVED_LOCATIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SAVED_LOCATIONS));
      return DEFAULT_SAVED_LOCATIONS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_SAVED_LOCATIONS;
  } catch (err) {
    console.warn('Failed to load saved locations from localStorage:', err);
    return DEFAULT_SAVED_LOCATIONS;
  }
}

/**
 * Persists saved locations list to localStorage and emits an update event
 */
function persistSavedLocations(locations: SavedLocation[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
    window.dispatchEvent(new Event('raydr_saved_locations_updated'));
  } catch (err) {
    console.error('Failed to save locations to localStorage:', err);
  }
}

/**
 * Saves or updates a destination (Home, Work, or Custom)
 */
export function saveDestination(
  type: 'home' | 'work' | 'custom',
  name: string,
  address: string,
  coords: LatLng,
  customLabel?: string
): SavedLocation {
  const current = getSavedLocations();

  // If saving as Home or Work, overwrite existing Home/Work
  if (type === 'home' || type === 'work') {
    const existingIndex = current.findIndex((item) => item.type === type);
    const updatedItem: SavedLocation = {
      id: existingIndex >= 0 ? current[existingIndex].id : `saved-${type}-${Date.now()}`,
      type,
      name: type === 'home' ? 'Home' : 'Work',
      address,
      coords,
      savedAt: Date.now(),
    };

    if (existingIndex >= 0) {
      current[existingIndex] = updatedItem;
    } else {
      current.unshift(updatedItem);
    }

    persistSavedLocations(current);
    return updatedItem;
  }

  // Custom favorite
  const newCustomItem: SavedLocation = {
    id: `saved-custom-${Date.now()}`,
    type: 'custom',
    customLabel: customLabel || name,
    name: name,
    address,
    coords,
    savedAt: Date.now(),
  };

  current.push(newCustomItem);
  persistSavedLocations(current);
  return newCustomItem;
}

/**
 * Updates an existing saved location by ID
 */
export function updateSavedDestination(
  id: string,
  updates: Partial<Omit<SavedLocation, 'id'>>
): void {
  const current = getSavedLocations();
  const idx = current.findIndex((item) => item.id === id);
  if (idx >= 0) {
    current[idx] = { ...current[idx], ...updates, savedAt: Date.now() };
    persistSavedLocations(current);
  }
}

/**
 * Deletes a saved destination by ID
 */
export function deleteSavedDestination(id: string): void {
  const current = getSavedLocations();
  const filtered = current.filter((item) => item.id !== id);
  persistSavedLocations(filtered);
}

/**
 * Resets saved locations to defaults
 */
export function resetSavedDestinations(): void {
  persistSavedLocations(DEFAULT_SAVED_LOCATIONS);
}
