import { LatLng } from '../types/navigation';

/**
 * Calculates the great circle distance between two points in meters using Haversine formula
 */
export function getDistanceMeters(p1: LatLng, p2: LatLng): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates the bearing in degrees (0 to 360) from p1 to p2 using Math.atan2
 */
export function getBearing(p1: LatLng, p2: LatLng): number {
  const lat1 = (p1.lat * Math.PI) / 180;
  const lat2 = (p2.lat * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

/**
 * Smooth angle interpolation (lerp) handling the 360°/0° wraparound
 */
export function lerpAngle(start: number, end: number, alpha: number): number {
  const diff = ((end - start + 540) % 360) - 180;
  return (start + diff * alpha + 360) % 360;
}

/**
 * Low-Pass Filter / Linear Interpolator for GPS coordinates to eliminate jitter
 */
export class GPSFilter {
  private smoothedLat: number | null = null;
  private smoothedLng: number | null = null;
  private smoothedHeading: number = 0;
  private smoothedSpeedMph: number = 0;

  /**
   * Filter an incoming raw GPS coordinate.
   * alpha: smoothing factor between 0.15 (heavy smooth) and 0.5 (more reactive)
   */
  public update(
    raw: LatLng,
    rawHeading: number | null | undefined,
    rawSpeedMps: number | null | undefined,
    alpha = 0.35
  ): { coords: LatLng; heading: number; speedMph: number } {
    const rawSpeedMph = rawSpeedMps != null && rawSpeedMps >= 0 ? rawSpeedMps * 2.23694 : 0;

    if (this.smoothedLat === null || this.smoothedLng === null) {
      this.smoothedLat = raw.lat;
      this.smoothedLng = raw.lng;
      this.smoothedHeading = rawHeading ?? 0;
      this.smoothedSpeedMph = rawSpeedMph;
      return {
        coords: { lat: raw.lat, lng: raw.lng },
        heading: this.smoothedHeading,
        speedMph: Math.round(this.smoothedSpeedMph),
      };
    }

    const dist = getDistanceMeters(
      { lat: this.smoothedLat, lng: this.smoothedLng },
      raw
    );

    // If movement is very small (< 0.5m), treat as GPS noise / drift while stopped
    if (dist < 0.5) {
      return {
        coords: { lat: this.smoothedLat, lng: this.smoothedLng },
        heading: this.smoothedHeading,
        speedMph: 0,
      };
    }

    // Adaptive alpha: if sudden jump is large (> 40m), step closer faster
    const effAlpha = dist > 40 ? 0.8 : alpha;

    this.smoothedLat = this.smoothedLat + (raw.lat - this.smoothedLat) * effAlpha;
    this.smoothedLng = this.smoothedLng + (raw.lng - this.smoothedLng) * effAlpha;

    // Calculate heading from vector if device heading is absent or stationary
    let targetHeading = this.smoothedHeading;
    if (rawHeading != null && !isNaN(rawHeading) && rawHeading >= 0) {
      targetHeading = rawHeading;
    } else if (dist > 1.2) {
      targetHeading = getBearing(
        { lat: this.smoothedLat, lng: this.smoothedLng },
        raw
      );
    }

    this.smoothedHeading = lerpAngle(this.smoothedHeading, targetHeading, 0.3);
    this.smoothedSpeedMph = this.smoothedSpeedMph + (rawSpeedMph - this.smoothedSpeedMph) * 0.4;

    return {
      coords: { lat: this.smoothedLat, lng: this.smoothedLng },
      heading: Math.round(this.smoothedHeading),
      speedMph: Math.round(this.smoothedSpeedMph),
    };
  }

  public reset(pos?: LatLng) {
    if (pos) {
      this.smoothedLat = pos.lat;
      this.smoothedLng = pos.lng;
    } else {
      this.smoothedLat = null;
      this.smoothedLng = null;
    }
  }
}

/**
 * Format distance for driver navigation display
 */
export function formatNavDistance(meters: number, units: 'mph' | 'kmh' = 'mph'): string {
  if (units === 'mph') {
    const feet = meters * 3.28084;
    if (feet < 1000) {
      return `${Math.round(feet / 50) * 50} ft`;
    }
    const miles = meters / 1609.344;
    return `${miles.toFixed(1)} mi`;
  } else {
    if (meters < 900) {
      return `${Math.round(meters / 50) * 50} m`;
    }
    const km = meters / 1000;
    return `${km.toFixed(1)} km`;
  }
}

/**
 * Format duration in minutes / hours
 */
export function formatNavDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return `${hours} hr ${remMinutes} min`;
}

/**
 * Calculate estimated time of arrival (ETA) string like "11:54 PM"
 */
export function getETAString(secondsFromNow: number): string {
  const targetDate = new Date(Date.now() + secondsFromNow * 1000);
  return targetDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

let lastSpokenText = '';
let lastSpokenTime = 0;

/**
 * Clean voice guidance speech synthesis
 */
export function speakInstruction(text: string, force = false): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const now = Date.now();
  if (!force && text === lastSpokenText && now - lastSpokenTime < 15000) {
    return;
  }
  lastSpokenText = text;
  lastSpokenTime = now;

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Graceful fallback if speech is blocked
  }
}
