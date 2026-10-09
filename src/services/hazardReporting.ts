import { HazardReport, LatLng } from '../types/navigation';
import { LAKE_COUNTY_HAZARDS } from '../data/lakeCountyHazards';
import { isCoordinateOnshoreAndValid, snapCoordinateToOnshoreRoad } from '../utils/geoSnap';
import { getSyncedIncidents } from './incidentSync';

const USER_REPORTS_STORAGE_KEY = 'raydr_user_reported_hazards';

export type MainCategory =
  | 'traffic'
  | 'police'
  | 'crash'
  | 'hazard'
  | 'closure'
  | 'blocked_lane'
  | 'map_issue';

export interface ReportSubmissionPayload {
  category: MainCategory;
  subType: string;
  notes?: string;
  direction?: 'both' | 'current' | 'opposite';
  lane?: 'left' | 'center' | 'right' | 'all';
}

export function getCustomHazardReports(): HazardReport[] {
  try {
    const raw = localStorage.getItem(USER_REPORTS_STORAGE_KEY);
    if (!raw) return [];
    const list: HazardReport[] = JSON.parse(raw);
    // Filter and sanitize to onshore road segments only, marking isUserReport: true
    return list.map((item) => ({
      ...item,
      isUserReport: true,
      author: 'self',
      location: snapCoordinateToOnshoreRoad(item.location),
    }));
  } catch (err) {
    console.error('Failed to load user reported hazards:', err);
    return [];
  }
}

/**
 * Returns all contributions specifically submitted by the current user
 */
export function getUserContributions(): HazardReport[] {
  return getCustomHazardReports().filter((item) => item.author === 'self' || item.isUserReport);
}

/**
 * Deletes a user-submitted report by ID or reportId from localStorage and dispatches refresh event
 */
export function deleteUserHazardReport(reportId: string): boolean {
  try {
    const raw = localStorage.getItem(USER_REPORTS_STORAGE_KEY);
    if (!raw) return false;
    const list: HazardReport[] = JSON.parse(raw);
    const filtered = list.filter((item) => item.id !== reportId && item.reportId !== reportId);
    localStorage.setItem(USER_REPORTS_STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent('raydr_hazards_updated'));
    return true;
  } catch (err) {
    console.error('Failed to delete user reported hazard:', err);
    return false;
  }
}

/**
 * Returns all hazards: User Contributions + 15-min Live Synced Incidents + Base Lake County Hazards
 * Filtered strictly to valid, onshore Lake County road network coordinates
 */
export function getAllHazards(): HazardReport[] {
  const custom = getCustomHazardReports();
  const synced = getSyncedIncidents();
  // Ensure default hazards also satisfy onshore validation
  const validCountyHazards = LAKE_COUNTY_HAZARDS.filter((hz) =>
    isCoordinateOnshoreAndValid(hz.location)
  );
  return [...custom, ...synced, ...validCountyHazards];
}

/**
 * Creates and persists a rich Waze-style drill-down hazard report
 */
export function addDetailedHazardReport(
  payload: ReportSubmissionPayload,
  rawCoords: LatLng
): HazardReport {
  // Guarantee coordinate is snapped strictly to onshore road segment
  const snappedCoords = snapCoordinateToOnshoreRoad(rawCoords);

  let hazardType: HazardReport['type'] = 'road_hazard';
  let title = `${payload.category.toUpperCase()}: ${payload.subType}`;
  let description = payload.notes || `Reported ${payload.subType}`;

  switch (payload.category) {
    case 'police':
      hazardType = payload.subType.toLowerCase().includes('camera')
        ? 'police_radar'
        : 'speed_trap';
      title = `Police: ${payload.subType}`;
      description = payload.notes || `Driver reported ${payload.subType} enforcement`;
      break;

    case 'traffic':
      hazardType = 'traffic';
      title = `Traffic: ${payload.subType}`;
      description = payload.notes || `Traffic condition: ${payload.subType}`;
      break;

    case 'crash':
      hazardType = 'crash';
      title = `Crash: ${payload.subType}`;
      description = payload.notes || `Vehicle accident: ${payload.subType}`;
      break;

    case 'hazard':
      if (payload.subType.toLowerCase().includes('construction')) {
        hazardType = 'construction';
      } else if (payload.subType.toLowerCase().includes('pothole')) {
        hazardType = 'pothole';
      } else if (payload.subType.toLowerCase().includes('car on shoulder')) {
        hazardType = 'stalled_vehicle';
      } else if (payload.subType.toLowerCase().includes('traffic light')) {
        hazardType = 'red_light_camera';
      } else {
        hazardType = 'road_hazard';
      }
      title = `Hazard: ${payload.subType}`;
      description = payload.notes || `Road condition: ${payload.subType}`;
      break;

    case 'blocked_lane':
      hazardType = 'blocked_lane';
      title = `Blocked Lane: ${payload.subType}`;
      description = payload.notes || `${payload.subType} obstructed`;
      break;

    case 'closure':
      hazardType = 'closure';
      title = `Road Closure: ${payload.subType}`;
      description = payload.notes || `Closure active: ${payload.subType} direction`;
      break;

    case 'map_issue':
      hazardType = 'map_issue';
      title = `Map Issue`;
      description = payload.notes || payload.subType || 'User reported map layout/geometry issue';
      break;
  }

  const repId = `user-rep-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const newReport: HazardReport = {
    id: repId,
    reportId: repId,
    author: 'self',
    timestamp: Date.now(),
    type: hazardType,
    title,
    description,
    location: snappedCoords,
    roadName: payload.direction ? `Near segment (${payload.direction})` : 'Active Road Segment',
    city: 'Lake County',
    reportedMinutesAgo: 0,
    confirmations: 1,
    confidence: 100,
    speedLimit: 45,
    isUserReport: true,
  };

  const existing = getCustomHazardReports();
  const updated = [newReport, ...existing];

  try {
    localStorage.setItem(USER_REPORTS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('raydr_hazards_updated'));
  } catch (err) {
    console.error('Failed to save user reported hazard:', err);
  }

  return newReport;
}

/**
 * Backward compatibility helper for legacy 1-tap calls
 */
export function addUserHazardReport(
  category: 'police' | 'alpr' | 'hazard' | 'red_light',
  userCoords: LatLng,
  customNote?: string
): HazardReport {
  let mappedCategory: MainCategory = 'hazard';
  let subType = 'Hazard';

  if (category === 'police') {
    mappedCategory = 'police';
    subType = 'Police';
  } else if (category === 'alpr') {
    mappedCategory = 'police';
    subType = 'Mobile camera';
  } else if (category === 'red_light') {
    mappedCategory = 'hazard';
    subType = 'Broken traffic light';
  }

  return addDetailedHazardReport(
    {
      category: mappedCategory,
      subType,
      notes: customNote,
    },
    userCoords
  );
}
