/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LatLng, HazardReport, ALPRCamera, NavRoute, AppSettings } from './types/navigation';
import { LAKE_COUNTY_CENTER, LAKE_COUNTY_HAZARDS, LAKE_COUNTY_ALPR_CAMERAS } from './data/lakeCountyHazards';
import { GPSFilter, getDistanceMeters, speakInstruction } from './utils/geo';
import { snapCoordinateToOnshoreRoad } from './utils/geoSnap';
import { fetchOSRMNavigation } from './services/osrm';
import { MapContainer } from './components/MapContainer';
import { TopHeader } from './components/TopHeader';
import { SettingsDrawer } from './components/SettingsDrawer';
import { BottomDrawer } from './components/BottomDrawer';
import { RouteSelectionCard } from './components/RouteSelectionCard';
import { ActiveNavigationHUD } from './components/ActiveNavigationHUD';
import { HazardDetailCard } from './components/HazardDetailCard';
import { ReportHazardSheet } from './components/ReportHazardSheet';
import { OnMapClosureSelector } from './components/OnMapClosureSelector';
import { MyContributionsModal } from './components/MyContributionsModal';
import { initIncidentSync } from './services/incidentSync';
import { Shield, ShieldAlert, Camera, AlertCircle, CheckCircle } from 'lucide-react';

export default function App() {
  // Application Settings
  const [settings, setSettings] = useState<AppSettings>({
    voiceGuidance: true,
    avoidanceSensitivity: 'balanced',
    isPremium: true, // Default to true so user immediately sees FLOCK radar protection capabilities
    darkMode: true,
    speedUnits: 'mph',
    soundAlerts: true,
    showALPRLayer: true,
    showHazardsLayer: true,
  });

  // User Live GPS State (Strictly Native Physical GPS with Low-Pass Filtering)
  const [userCoords, setUserCoords] = useState<LatLng>(LAKE_COUNTY_CENTER);
  const [rawGpsAccuracy, setRawGpsAccuracy] = useState<number | null>(null);
  const [speedMph, setSpeedMph] = useState<number>(0);
  const [heading, setHeading] = useState<number>(0);
  const [gpsLocked, setGpsLocked] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Recenter map trigger counter
  const [recenterCount, setRecenterCount] = useState<number>(0);

  // UI Modals & Drawers
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isContributionsModalOpen, setIsContributionsModalOpen] = useState(false);
  const [selectedHazardOrALPR, setSelectedHazardOrALPR] = useState<HazardReport | ALPRCamera | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isClosureMode, setIsClosureMode] = useState(false);
  const [reportToast, setReportToast] = useState<string | null>(null);

  // -------------------------------------------------------------
  // 15-MINUTE ONLINE INCIDENT SYNC SERVICE (INDOT/511 CORRIDORS)
  // -------------------------------------------------------------
  useEffect(() => {
    const cancelSync = initIncidentSync();
    return () => {
      cancelSync();
    };
  }, []);

  // Routing State
  const [destination, setDestination] = useState<{ name: string; address?: string; coords: LatLng } | null>(null);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState<boolean>(false);
  const [fastestRoute, setFastestRoute] = useState<NavRoute | null>(null);
  const [avoidanceRoute, setAvoidanceRoute] = useState<NavRoute | null>(null);
  const [balancedRoute, setBalancedRoute] = useState<NavRoute | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<'fastest' | 'avoidance' | 'balanced'>('avoidance');

  // Active 3D Driver Guidance Mode
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [isDrawerExpanded, setIsDrawerExpanded] = useState<boolean>(false);

  // Nearby Proximity Threat Banner
  const [activeHazardAlert, setActiveHazardAlert] = useState<{
    title: string;
    distanceMeters: number;
    type: 'hazard' | 'alpr';
  } | null>(null);

  // Low-Pass GPS Filter instance
  const gpsFilterRef = useRef<GPSFilter>(new GPSFilter());
  const lastAlertTimeRef = useRef<number>(0);

  // In-Motion Safety Guardrail: Lock complex deep settings when driving > 5 MPH
  const isMotionLocked = speedMph > 5;

  // -------------------------------------------------------------
  // NATIVE PHYSICAL GPS ENGINE (NO SIMULATION)
  // Uses navigator.geolocation.watchPosition with enableHighAccuracy: true
  // -------------------------------------------------------------
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGpsError('Geolocation is not supported by this browser.');
      return;
    }

    const geoOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 1000,
    };

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const rawCoords: LatLng = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        setRawGpsAccuracy(Math.round(pos.coords.accuracy));
        setGpsLocked(true);
        setGpsError(null);

        // Run through Low-Pass Filter / Linear Interpolator to eliminate micro-jitter
        const filtered = gpsFilterRef.current.update(
          rawCoords,
          pos.coords.heading,
          pos.coords.speed,
          0.35
        );

        setUserCoords(filtered.coords);
        setHeading(filtered.heading);
        setSpeedMph(filtered.speedMph);
      },
      (err) => {
        console.warn('Physical GPS watch error:', err.message);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError('Location permission denied. Showing Lake County view.');
        } else {
          setGpsError('Acquiring high-accuracy satellite lock...');
        }
      },
      geoOptions
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // -------------------------------------------------------------
  // REAL OSRM ROUTE CALCULATION (FASTEST, AVOIDANCE, AND BALANCED)
  // -------------------------------------------------------------
  const calculateRoutes = async (destCoords: LatLng, destName: string) => {
    setIsLoadingRoutes(true);
    setFastestRoute(null);
    setAvoidanceRoute(null);
    setBalancedRoute(null);

    try {
      const routes = await fetchOSRMNavigation(userCoords, destCoords);
      setFastestRoute(routes.fastest);
      setAvoidanceRoute(routes.avoidance);
      setBalancedRoute(routes.balanced);

      // Default selection: If Avoidance Sensitivity is High or Premium is active, default to Avoidance
      if (settings.avoidanceSensitivity === 'high' || settings.isPremium) {
        setSelectedRouteId('avoidance');
      } else {
        setSelectedRouteId('fastest');
      }
    } catch (err) {
      console.error('Failed to compute OSRM routes:', err);
    } finally {
      setIsLoadingRoutes(false);
    }
  };

  const handleSelectDestination = (dest: { name: string; address?: string; coords: LatLng }) => {
    // Snap destination to valid onshore road segment
    const validDestCoords = snapCoordinateToOnshoreRoad(dest.coords);
    const sanitizedDest = { ...dest, coords: validDestCoords };
    setDestination(sanitizedDest);
    calculateRoutes(validDestCoords, dest.name);
  };

  const handleStartNavigation = () => {
    setIsNavigating(true);
    // Trigger immediate recenter & GPS focus
    setRecenterCount((c) => c + 1);
    // Voice prompt announcement
    if (settings.voiceGuidance) {
      const chosen = selectedRouteId === 'avoidance' ? avoidanceRoute : selectedRouteId === 'balanced' ? balancedRoute : fastestRoute;
      const initialStep = chosen?.steps[0]?.instruction || 'Proceed to highlighted road';
      speakInstruction(`Starting ${chosen?.name || 'route'} to ${destination?.name || 'destination'}. ${initialStep}.`, true);
    }
  };

  const handleEndNavigation = () => {
    setIsNavigating(false);
    setDestination(null);
    setFastestRoute(null);
    setAvoidanceRoute(null);
    setBalancedRoute(null);
    if (settings.voiceGuidance) {
      speakInstruction('Navigation ended.');
    }
  };

  // -------------------------------------------------------------
  // REAL-TIME HAZARD & ALPR PROXIMITY SCANNER
  // Detects if vehicle is within 400m (1,300 ft) of an enforcement node
  // -------------------------------------------------------------
  useEffect(() => {
    if (!settings.soundAlerts && !settings.voiceGuidance) return;

    const now = Date.now();
    if (now - lastAlertTimeRef.current < 20000) return; // debounce alerts 20s

    // Check closest hazard
    let closestThreat: { title: string; distance: number; type: 'hazard' | 'alpr' } | null = null;
    let minD = 400; // 400 meters alert threshold

    for (const hz of LAKE_COUNTY_HAZARDS) {
      const d = getDistanceMeters(userCoords, hz.location);
      if (d < minD) {
        minD = d;
        closestThreat = {
          title: `${hz.title} on ${hz.roadName}`,
          distance: Math.round(d),
          type: 'hazard',
        };
      }
    }

    if (settings.isPremium) {
      for (const alpr of LAKE_COUNTY_ALPR_CAMERAS) {
        const d = getDistanceMeters(userCoords, alpr.location);
        if (d < minD) {
          minD = d;
          closestThreat = {
            title: `FLOCK ALPR Camera at ${alpr.intersection}`,
            distance: Math.round(d),
            type: 'alpr',
          };
        }
      }
    }

    if (closestThreat) {
      lastAlertTimeRef.current = now;
      setActiveHazardAlert({
        title: closestThreat.title,
        distanceMeters: closestThreat.distance,
        type: closestThreat.type,
      });

      if (settings.voiceGuidance) {
        speakInstruction(`Caution: ${closestThreat.title} ahead in ${Math.round(closestThreat.distance * 3.28)} feet.`);
      }

      // Auto-dismiss alert banner after 8 seconds
      setTimeout(() => {
        setActiveHazardAlert(null);
      }, 8000);
    }
  }, [userCoords, settings.soundAlerts, settings.voiceGuidance, settings.isPremium]);

  const activeRoute =
    selectedRouteId === 'avoidance'
      ? avoidanceRoute || fastestRoute
      : selectedRouteId === 'balanced'
      ? balancedRoute || fastestRoute
      : fastestRoute || avoidanceRoute;

  return (
    <div className={`relative w-screen h-screen overflow-hidden ${settings.darkMode ? 'dark bg-[#0b101b]' : 'light bg-[#e2e8f0]'}`}>
      {/* FULL-SCREEN LEAFLET MAP */}
      <MapContainer
        darkMode={settings.darkMode}
        userCoords={userCoords}
        heading={heading}
        isNavigating={isNavigating}
        activeRoute={activeRoute}
        previewRoutes={
          destination
            ? {
                fastest: fastestRoute,
                avoidance: avoidanceRoute,
                balanced: balancedRoute,
              }
            : null
        }
        selectedRouteId={selectedRouteId}
        showALPRLayer={settings.showALPRLayer && settings.isPremium}
        showHazardsLayer={settings.showHazardsLayer}
        onSelectHazardOrALPR={(item) => setSelectedHazardOrALPR(item)}
        onMapClick={() => {
          setSelectedHazardOrALPR(null);
        }}
        recenterTrigger={recenterCount}
        onOpenReport={() => setIsReportOpen(true)}
        isBottomDrawerExpanded={!isNavigating && !destination && isDrawerExpanded}
      />

      {/* TOP FLOATING HEADER & SEARCH BAR */}
      <TopHeader
        darkMode={settings.darkMode}
        onToggleDarkMode={() => setSettings((s) => ({ ...s, darkMode: !s.darkMode }))}
        isPremium={settings.isPremium}
        onTogglePremium={() => setSettings((s) => ({ ...s, isPremium: !s.isPremium }))}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSelectDestination={handleSelectDestination}
        isNavigating={isNavigating}
        isMotionLocked={isMotionLocked}
      />

      {/* GPS STATUS / ACCURACY TOAST (Discreet pill at top) */}
      {!isNavigating && (
        <div className="absolute top-16 left-3.5 z-[9000] pointer-events-none flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#111927]/90 backdrop-blur-md border border-slate-800 text-[10px] font-mono text-slate-300">
          <div className={`w-2 h-2 rounded-full ${gpsLocked ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span>{gpsLocked ? `GPS Locked ±${rawGpsAccuracy ?? 12}ft` : 'Acquiring GPS Fix'}</span>
        </div>
      )}

      {/* NEARBY PROXIMITY HAZARD ALERT TOAST BANNER */}
      {activeHazardAlert && (
        <div className="absolute top-24 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-[9997] pointer-events-auto animate-in slide-in-from-top-4 duration-200">
          <div className="p-3 rounded-2xl bg-gradient-to-r from-rose-900/90 to-slate-900/90 border border-rose-500/60 backdrop-blur-md shadow-2xl flex items-center gap-3 text-white">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400 shrink-0 animate-bounce">
              {activeHazardAlert.type === 'alpr' ? <Camera className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-rose-300 block">
                {activeHazardAlert.type === 'alpr' ? 'FLOCK ALPR DETECTED' : 'RADAR / HAZARD ALERT'}
              </span>
              <p className="text-xs font-bold text-white truncate">{activeHazardAlert.title}</p>
              <p className="text-[11px] text-rose-200/80 font-mono mt-0.5">
                Approx {Math.round(activeHazardAlert.distanceMeters * 3.28)} ft ahead
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS DRAWER (with In-Motion Safety Guardrail) */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newSettings) => setSettings((s) => ({ ...s, ...newSettings }))}
        isMotionLocked={isMotionLocked}
        currentSpeedMph={speedMph}
        onSelectDestination={handleSelectDestination}
        onOpenMyContributions={() => setIsContributionsModalOpen(true)}
      />

      {/* HAZARD / ALPR DETAIL CARD (When a pin is tapped) */}
      {selectedHazardOrALPR && (
        <HazardDetailCard
          item={selectedHazardOrALPR}
          userLocation={userCoords}
          onClose={() => setSelectedHazardOrALPR(null)}
          onNavigateTo={handleSelectDestination}
        />
      )}

      {/* ROUTE SELECTION CARD (Fastest, Avoidance, and Balanced) */}
      {destination && !isNavigating && (
        <RouteSelectionCard
          destinationName={destination.name}
          fastestRoute={fastestRoute}
          avoidanceRoute={avoidanceRoute}
          balancedRoute={balancedRoute}
          selectedRouteId={selectedRouteId}
          onSelectRoute={(id) => setSelectedRouteId(id)}
          onStartNavigation={handleStartNavigation}
          onCancel={() => {
            setDestination(null);
            setFastestRoute(null);
            setAvoidanceRoute(null);
            setBalancedRoute(null);
          }}
          isLoading={isLoadingRoutes}
          isPremium={settings.isPremium}
          speedUnits={settings.speedUnits}
        />
      )}

      {/* BOTTOM DRAWER (Pre-navigation: shortcuts, live speedometer circle, speed limit sign) */}
      {!isNavigating && !destination && (
        <BottomDrawer
          onSelectDestination={handleSelectDestination}
          speedMph={speedMph}
          speedLimitMph={45}
          speedUnits={settings.speedUnits}
          isNavigating={isNavigating}
          onCenterUser={() => setRecenterCount((c) => c + 1)}
          onOpenReport={() => setIsReportOpen(true)}
          onExpandedChange={(expanded) => setIsDrawerExpanded(expanded)}
        />
      )}

      {/* 3D DRIVER GUIDANCE MODE HUD */}
      {isNavigating && activeRoute && (
        <ActiveNavigationHUD
          route={activeRoute}
          userCoords={userCoords}
          speedMph={speedMph}
          speedLimitMph={45}
          speedUnits={settings.speedUnits}
          voiceGuidance={settings.voiceGuidance}
          onToggleVoice={() => setSettings((s) => ({ ...s, voiceGuidance: !s.voiceGuidance }))}
          onEndNavigation={handleEndNavigation}
          onRecenter={() => setRecenterCount((c) => c + 1)}
          onOpenReport={() => setIsReportOpen(true)}
          destinationName={destination?.name}
          destinationAddress={destination?.address}
        />
      )}

      {/* DEDICATED "MY CONTRIBUTIONS" MODAL */}
      <MyContributionsModal
        isOpen={isContributionsModalOpen}
        onClose={() => setIsContributionsModalOpen(false)}
        onReportDeleted={(title) => {
          setReportToast(`Deleted report: ${title}`);
          setTimeout(() => setReportToast(null), 3500);
        }}
      />

      {/* 1-TAP HAZARD & COP REPORTING MODAL */}
      <ReportHazardSheet
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        userCoords={userCoords}
        onReportSubmitted={(label) => {
          setReportToast(`Reported: ${label} added at current coordinates!`);
          setTimeout(() => setReportToast(null), 4000);
        }}
        onRequestOnMapClosure={() => {
          setIsReportOpen(false);
          setIsClosureMode(true);
        }}
      />

      {/* WAZE-STYLE ON-MAP CLOSURE SELECTOR */}
      <OnMapClosureSelector
        isOpen={isClosureMode}
        userCoords={userCoords}
        onClose={() => setIsClosureMode(false)}
        onClosureBroadcasted={(summary) => {
          setReportToast(summary);
          setTimeout(() => setReportToast(null), 5000);
        }}
      />

      {/* REPORT SUBMISSION CONFIRMATION TOAST */}
      {reportToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[10005] bg-emerald-950/95 border border-emerald-500/80 text-emerald-200 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-top-4 duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{reportToast}</span>
        </div>
      )}
    </div>
  );
}
