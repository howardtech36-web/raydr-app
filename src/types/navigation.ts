export interface LatLng {
  lat: number;
  lng: number;
}

export interface SavedLocation {
  id: string;
  type: 'home' | 'work' | 'custom';
  customLabel?: string;
  name: string;
  address: string;
  coords: LatLng;
  savedAt: number;
}

export type HazardType =
  | 'police_radar'
  | 'speed_trap'
  | 'red_light_camera'
  | 'stalled_vehicle'
  | 'construction'
  | 'road_hazard'
  | 'pothole'
  | 'traffic'
  | 'crash'
  | 'closure'
  | 'blocked_lane'
  | 'map_issue';

export interface HazardReport {
  id: string;
  reportId?: string;
  author?: 'self' | 'system' | 'indot_feed';
  timestamp?: number;
  type: HazardType;
  title: string;
  description: string;
  location: LatLng;
  roadName: string;
  city: string;
  reportedMinutesAgo: number;
  confirmations: number;
  confidence: number; // 0 - 100
  speedLimit?: number;
  isUserReport?: boolean;
  ttl?: number;
}

export interface ALPRCamera {
  id: string;
  model: 'Flock Safety Falcon' | 'Genetec AutoVu' | 'Motorola Vigilant' | 'Municipal Highway ALPR';
  intersection: string;
  city: string;
  location: LatLng;
  directionMonitored: string;
  status: 'active' | 'warning' | 'maintenance';
  captureRatePerDay: number;
  threatLevel: 'high' | 'medium' | 'extreme';
  installedYear: number;
}

export interface RouteStep {
  instruction: string;
  modifier?: string;
  type: string;
  name: string;
  distance: number; // meters
  duration: number; // seconds
  location: [number, number]; // [lng, lat]
}

export interface NavRoute {
  id: 'fastest' | 'avoidance' | 'balanced' | 'direct' | 'stealth';
  name: string;
  description: string;
  geometry: [number, number][]; // [lat, lng] array for Leaflet
  distanceMeters: number;
  durationSeconds: number;
  hazardCount: number;
  alprCount: number;
  steps: RouteStep[];
  isAvoidance: boolean;
  score: number;
}

export interface UserLocationState {
  coords: LatLng;
  heading: number; // degrees 0-360
  speedMph: number;
  accuracy: number; // meters
  altitude?: number | null;
  timestamp: number;
  isSimulated: false;
  isLocked: boolean;
}

export interface AppSettings {
  voiceGuidance: boolean;
  avoidanceSensitivity: 'low' | 'balanced' | 'high';
  isPremium: boolean;
  darkMode: boolean;
  speedUnits: 'mph' | 'kmh';
  soundAlerts: boolean;
  showALPRLayer: boolean;
  showHazardsLayer: boolean;
}
