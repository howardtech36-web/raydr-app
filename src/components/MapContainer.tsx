import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Compass, Navigation as NavIcon, Crosshair, Map as MapOverviewIcon, AlertTriangle } from 'lucide-react';
import { LatLng, HazardReport, ALPRCamera, NavRoute } from '../types/navigation';
import { LAKE_COUNTY_ALPR_CAMERAS } from '../data/lakeCountyHazards';
import { getAllHazards } from '../services/hazardReporting';
import { isCoordinateOnshoreAndValid } from '../utils/geoSnap';
import { formatNavDistance, formatNavDuration } from '../utils/geo';

// Free public OpenStreetMap tile engine
const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

interface MapContainerProps {
  darkMode: boolean;
  userCoords: LatLng;
  heading: number;
  isNavigating: boolean;
  activeRoute: NavRoute | null;
  previewRoutes?: {
    fastest?: NavRoute | null;
    avoidance?: NavRoute | null;
    balanced?: NavRoute | null;
    direct?: NavRoute | null;
    stealth?: NavRoute | null;
  } | null;
  selectedRouteId?: 'fastest' | 'avoidance' | 'balanced' | 'direct' | 'stealth';
  showALPRLayer: boolean;
  showHazardsLayer: boolean;
  onSelectHazardOrALPR: (item: HazardReport | ALPRCamera) => void;
  onMapClick?: () => void;
  recenterTrigger: number;
  onAutoFollowChange?: (isTracking: boolean) => void;
  onOpenReport?: () => void;
  isBottomDrawerExpanded?: boolean;
}

function getCardinal(deg: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round((((deg % 360) + 360) % 360) / 45) % 8;
  return directions[index];
}

export const MapContainer: React.FC<MapContainerProps> = ({
  darkMode,
  userCoords,
  heading,
  isNavigating,
  activeRoute,
  previewRoutes,
  selectedRouteId,
  showALPRLayer,
  showHazardsLayer,
  onSelectHazardOrALPR,
  onMapClick,
  recenterTrigger,
  onAutoFollowChange,
  onOpenReport,
  isBottomDrawerExpanded = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const vectorWaterGroupRef = useRef<L.LayerGroup | null>(null);
  const vectorRoadsGroupRef = useRef<L.LayerGroup | null>(null);
  const vectorTownsGroupRef = useRef<L.LayerGroup | null>(null);
  const vehicleMarkerRef = useRef<L.Marker | null>(null);
  const hazardsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const alprLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const routeLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const streetBadgesGroupRef = useRef<L.LayerGroup | null>(null);
  const activeRoutePolylineRef = useRef<L.Polyline | null>(null);

  // Manual Map Pan / Zoom Override State with autoFollowRef
  const [autoFollow, setAutoFollow] = useState<boolean>(true);
  const autoFollowRef = useRef<boolean>(true);
  const isNavigatingRef = useRef<boolean>(isNavigating);
  isNavigatingRef.current = isNavigating;
  const isProgrammaticPanRef = useRef<boolean>(false);
  const headingRef = useRef<number>(heading);
  headingRef.current = heading;

  // Helper to sync autoFollow state with ref and external callback
  const setAutoFollowState = (tracking: boolean) => {
    autoFollowRef.current = tracking;
    setAutoFollow(tracking);
    onAutoFollowChange?.(tracking);
  };

  // Clear manual vector overlays so Carto pre-made Dark & Light theme tiles render crisp and unblocked
  const renderVectorBasemap = () => {
    if (vectorWaterGroupRef.current) vectorWaterGroupRef.current.clearLayers();
    if (vectorRoadsGroupRef.current) vectorRoadsGroupRef.current.clearLayers();
    if (vectorTownsGroupRef.current) vectorTownsGroupRef.current.clearLayers();
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = typeof userCoords?.lat === 'number' && !isNaN(userCoords.lat) ? userCoords.lat : 41.4170;
    const initialLng = typeof userCoords?.lng === 'number' && !isNaN(userCoords.lng) ? userCoords.lng : -87.3653;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      touchZoom: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
      preferCanvas: true,
      inertia: true,
      inertiaDeceleration: 3000,
      inertiaMaxSpeed: 1500,
      easeLinearity: 0.25,
      zoomAnimation: true,
    } as any);

    (map as any).options.tap = false;
    (map as any).options.gestureHandling = false;
    mapInstanceRef.current = map;

    // Explicitly guarantee map dragging and touch zooming are enabled at all times
    map.dragging.enable();
    map.touchZoom.enable();
    map.scrollWheelZoom.enable();
    map.doubleClickZoom.enable();

    // Detect manual user single-finger touch drag, pinch zoom, or pan to immediately pause auto-follow
    const pauseTracking = () => {
      if (!isProgrammaticPanRef.current) {
        setAutoFollowState(false);
      }
    };

    map.on('dragstart movestart', (e: L.LeafletEvent) => {
      const originalEvt = (e as any).originalEvent;
      if (originalEvt || !isProgrammaticPanRef.current) {
        pauseTracking();
      }
    });

    map.on('touchstart', pauseTracking);
    map.on('zoomstart', (e: L.LeafletEvent) => {
      const originalEvt = (e as any).originalEvent;
      if (originalEvt || !isProgrammaticPanRef.current) {
        pauseTracking();
      }
    });

    // Also attach native DOM listeners on the container to unblock single-finger manual panning
    const container = mapContainerRef.current;
    if (container) {
      container.addEventListener('pointerdown', pauseTracking, { passive: true });
      container.addEventListener('touchstart', pauseTracking, { passive: true });
      container.addEventListener('touchmove', pauseTracking, { passive: true });
      container.addEventListener('wheel', pauseTracking, { passive: true });
    }

    // Dynamic zoom scaling for street badges
    map.on('zoomend', () => {
      const z = map.getZoom();
      const badges = document.querySelectorAll('.street-name-marker');
      badges.forEach((el) => {
        const scale = z >= 17 ? 1.15 : z >= 15 ? 1.0 : z >= 13 ? 0.85 : 0.7;
        (el as HTMLElement).style.transform = `scale(${scale})`;
      });
    });

    // FORCE LEAFLET LAYER PURGE:
    // Remove any existing TileLayer instances before mounting new layer
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    // Mount free public OpenStreetMap basemap engine with built-in CSS themes
    const tileLayer = L.tileLayer(OSM_TILE_URL, {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      className: darkMode ? 'raydr-custom-dark' : 'raydr-custom-light',
      keepBuffer: 6,
      updateWhenIdle: false,
      updateWhenZooming: true,
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    // Layer Groups
    vectorWaterGroupRef.current = L.layerGroup().addTo(map);
    vectorRoadsGroupRef.current = L.layerGroup().addTo(map);
    vectorTownsGroupRef.current = L.layerGroup().addTo(map);
    routeLayerGroupRef.current = L.layerGroup().addTo(map);
    streetBadgesGroupRef.current = L.layerGroup().addTo(map);
    hazardsLayerGroupRef.current = L.layerGroup().addTo(map);
    alprLayerGroupRef.current = L.layerGroup().addTo(map);

    // Render town markers, water features, and highway geometry
    renderVectorBasemap();

    // Initial vehicle marker
    const vehicleIcon = createVehicleDivIcon(heading);
    const vehicleMarker = L.marker([initialLat, initialLng], {
      icon: vehicleIcon,
      zIndexOffset: 1000,
    }).addTo(map);
    vehicleMarkerRef.current = vehicleMarker;

    // Window resize handler to invalidate map size
    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    map.on('click', () => {
      onMapClick?.();
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      if (container) {
        container.removeEventListener('pointerdown', pauseTracking);
        container.removeEventListener('touchstart', pauseTracking);
        container.removeEventListener('touchmove', pauseTracking);
        container.removeEventListener('wheel', pauseTracking);
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Dynamically update basemap CSS theme classes when dark / light mode changes
  useEffect(() => {
    if (!tileLayerRef.current) return;
    const container = tileLayerRef.current.getContainer();
    if (container) {
      container.className = `leaflet-layer ${darkMode ? 'raydr-custom-dark' : 'raydr-custom-light'}`;
    }
  }, [darkMode]);

  // Immediate GPS focus & invalidateSize when active navigation starts and guarantee drag/touch enabled
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.dragging.enable();
      mapInstanceRef.current.touchZoom.enable();
      mapInstanceRef.current.scrollWheelZoom.enable();
      mapInstanceRef.current.doubleClickZoom.enable();
      mapInstanceRef.current.invalidateSize();
    }
    if (isNavigating) {
      setAutoFollowState(true);
      if (mapInstanceRef.current) {
        // Immediate GPS snap on navigation start
        const validLat = typeof userCoords?.lat === 'number' && !isNaN(userCoords.lat) ? userCoords.lat : 41.4170;
        const validLng = typeof userCoords?.lng === 'number' && !isNaN(userCoords.lng) ? userCoords.lng : -87.3653;
        isProgrammaticPanRef.current = true;
        mapInstanceRef.current.setView([validLat, validLng], 17, { animate: true });
        setTimeout(() => {
          isProgrammaticPanRef.current = false;
        }, 600);
      }
    } else {
      // Reset map pane rotation when navigating ends
      if (mapContainerRef.current) {
        const mapPane = mapContainerRef.current.querySelector('.leaflet-map-pane') as HTMLElement | null;
        if (mapPane) {
          mapPane.style.transform = '';
          mapPane.style.transformOrigin = '';
        }
      }
    }
  }, [isNavigating]);

  // -------------------------------------------------------------
  // 60FPS VECTOR ACCELERATION & LERP PUCK GLIDE ENGINE
  // Seamlessly interpolates vehicle arrowhead puck along road geometry
  // -------------------------------------------------------------
  const targetCoordsRef = useRef<LatLng>(userCoords);
  const currentLerpCoordsRef = useRef<LatLng>({ ...userCoords });
  const targetHeadingRef = useRef<number>(heading);
  const currentLerpHeadingRef = useRef<number>(heading);
  const animFrameIdRef = useRef<number | null>(null);

  // Sync targets on every incoming GPS tick
  if (userCoords && typeof userCoords.lat === 'number' && !isNaN(userCoords.lat) && typeof userCoords.lng === 'number' && !isNaN(userCoords.lng)) {
    targetCoordsRef.current = userCoords;
  }
  if (typeof heading === 'number' && !isNaN(heading)) {
    targetHeadingRef.current = heading;
  }

  useEffect(() => {
    let isRunning = true;

    const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

    // Angle lerp along shortest rotational circle arc
    const lerpAngle = (start: number, end: number, t: number) => {
      let diff = (end - start) % 360;
      if (diff < -180) diff += 360;
      if (diff > 180) diff += 360;
      return start + diff * t;
    };

    const animateGlide = () => {
      if (!isRunning) return;

      const targetPos = targetCoordsRef.current;
      const curPos = currentLerpCoordsRef.current;
      const targetH = targetHeadingRef.current;
      const curH = currentLerpHeadingRef.current;

      // 60fps lerp delta factors
      const posLerpFactor = 0.14;
      const headingLerpFactor = 0.16;

      const newLat = lerp(curPos.lat, targetPos.lat, posLerpFactor);
      const newLng = lerp(curPos.lng, targetPos.lng, posLerpFactor);
      const newH = lerpAngle(curH, targetH, headingLerpFactor);

      if (!isNaN(newLat) && !isNaN(newLng)) {
        currentLerpCoordsRef.current = { lat: newLat, lng: newLng };
        if (vehicleMarkerRef.current) {
          vehicleMarkerRef.current.setLatLng([newLat, newLng]);
        }
      }

      if (!isNaN(newH)) {
        currentLerpHeadingRef.current = newH;
        // Direct DOM rotation of vehicle puck chevron avoiding full DOM icon re-instantiation
        const arrowEl = document.getElementById('vehicle-puck-icon');
        if (arrowEl) {
          arrowEl.style.transform = `rotate(${newH}deg)`;
        } else if (vehicleMarkerRef.current) {
          vehicleMarkerRef.current.setIcon(createVehicleDivIcon(newH));
        }
      }

      // Drive Camera Follow Logic (Only if autoFollow is active and navigating)
      if (autoFollowRef.current && isNavigatingRef.current && mapContainerRef.current) {
        const mapPane = mapContainerRef.current.querySelector('.leaflet-map-pane') as HTMLElement | null;
        if (mapPane) {
          mapPane.style.transformOrigin = '50% 75%'; // Pivot around bottom-centered puck
          mapPane.style.transform = `rotate(${-newH}deg)`;
        }
      }

      animFrameIdRef.current = requestAnimationFrame(animateGlide);
    };

    animFrameIdRef.current = requestAnimationFrame(animateGlide);

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, []);

  // Follow camera offset during active navigation
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (isNavigating && autoFollowRef.current) {
      const map = mapInstanceRef.current;
      const validLat = typeof userCoords?.lat === 'number' && !isNaN(userCoords.lat) ? userCoords.lat : null;
      const validLng = typeof userCoords?.lng === 'number' && !isNaN(userCoords.lng) ? userCoords.lng : null;
      if (validLat === null || validLng === null) return;

      const validH = typeof heading === 'number' && !isNaN(heading) ? heading : 0;
      // Waze view: Vehicle puck positioned in the lower third by offsetting camera center ahead
      const rad = (validH * Math.PI) / 180;
      const lookAheadDist = 0.0016; // ~150 meters ahead
      const offsetLat = Math.cos(rad) * lookAheadDist;
      const offsetLng = Math.sin(rad) * lookAheadDist;
      if (isNaN(offsetLat) || isNaN(offsetLng)) return;

      const targetLat = validLat + offsetLat;
      const targetLng = validLng + offsetLng;

      isProgrammaticPanRef.current = true;
      map.panTo([targetLat, targetLng], {
        animate: true,
        duration: 0.8,
        easeLinearity: 0.25,
      });
      setTimeout(() => {
        isProgrammaticPanRef.current = false;
      }, 850);
    }
  }, [userCoords, heading, isNavigating, autoFollow]);

  // Re-center handler: smoothly pans/zooms to GPS coords ([lat, lng], 17), re-locks heading rotation, and re-anchors puck at bottom-third driving position
  const handleRecenter = () => {
    setAutoFollowState(true);
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    map.dragging.enable();
    map.touchZoom.enable();
    isProgrammaticPanRef.current = true;

    const validLat = typeof userCoords?.lat === 'number' && !isNaN(userCoords.lat) ? userCoords.lat : 41.4170;
    const validLng = typeof userCoords?.lng === 'number' && !isNaN(userCoords.lng) ? userCoords.lng : -87.3653;
    const validHeading = typeof headingRef.current === 'number' && !isNaN(headingRef.current)
      ? headingRef.current
      : typeof heading === 'number' && !isNaN(heading)
      ? heading
      : 0;

    let targetLat = validLat;
    let targetLng = validLng;

    if (isNavigating) {
      // Re-apply driving rotation to map pane
      if (mapContainerRef.current) {
        const mapPane = mapContainerRef.current.querySelector('.leaflet-map-pane') as HTMLElement | null;
        if (mapPane) {
          mapPane.style.transformOrigin = '50% 75%'; // Pivot around bottom-centered puck
          mapPane.style.transform = `rotate(${-validHeading}deg)`;
        }
      }

      // Bottom-centered camera offset (vehicle in lower third)
      const rad = (validHeading * Math.PI) / 180;
      const lookAheadDist = 0.0016;
      const offsetLat = Math.cos(rad) * lookAheadDist;
      const offsetLng = Math.sin(rad) * lookAheadDist;
      if (!isNaN(offsetLat) && !isNaN(offsetLng)) {
        targetLat = validLat + offsetLat;
        targetLng = validLng + offsetLng;
      }
    }

    // Leaflet flyTo safeguard: requires positive container dimensions to avoid (NaN, NaN) division by zero
    const size = map.getSize();
    if (!size || size.x === 0 || size.y === 0) {
      map.invalidateSize();
      map.setView([targetLat, targetLng], 17);
    } else {
      try {
        map.flyTo([targetLat, targetLng], 17, {
          animate: true,
          duration: 0.8,
          easeLinearity: 0.25,
        });
      } catch (err) {
        map.setView([targetLat, targetLng], 17);
      }
    }

    setTimeout(() => {
      isProgrammaticPanRef.current = false;
    }, 850);
  };

  // Overview handler: fits active trip from start to destination on screen
  const handleOverview = () => {
    setAutoFollowState(false);
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    isProgrammaticPanRef.current = true;

    // Reset map pane rotation during full overview mode
    if (mapContainerRef.current) {
      const mapPane = mapContainerRef.current.querySelector('.leaflet-map-pane') as HTMLElement | null;
      if (mapPane) {
        mapPane.style.transform = '';
        mapPane.style.transformOrigin = '';
      }
    }

    try {
      if (activeRoutePolylineRef.current) {
        const bounds = activeRoutePolylineRef.current.getBounds();
        if (bounds && bounds.isValid()) {
          map.fitBounds(bounds, {
            paddingTopLeft: [40, 80],
            paddingBottomRight: [40, 160],
            animate: true,
          });
        }
      } else if (activeRoute && activeRoute.geometry.length > 0) {
        const validPoints = activeRoute.geometry.filter(
          (pt) => typeof pt[0] === 'number' && !isNaN(pt[0]) && typeof pt[1] === 'number' && !isNaN(pt[1])
        );
        if (validPoints.length > 0) {
          const b = L.latLngBounds(validPoints.map((pt) => [pt[0], pt[1]]));
          if (b.isValid()) {
            map.fitBounds(b, {
              paddingTopLeft: [40, 80],
              paddingBottomRight: [40, 160],
              animate: true,
            });
          }
        }
      }
    } catch (err) {
      console.warn('Overview fitBounds error:', err);
    }

    setTimeout(() => {
      isProgrammaticPanRef.current = false;
    }, 900);
  };

  // Handle Recenter trigger from external props (e.g. Compass tap) - Only when recenterTrigger > 0
  useEffect(() => {
    if (!mapInstanceRef.current || !recenterTrigger) return;
    handleRecenter();
  }, [recenterTrigger]);

  // Render Lake County Hazard Pins + User-Reported Hazards (Clickable React Modal Trigger)
  const renderHazards = () => {
    const lg = hazardsLayerGroupRef.current;
    if (!lg) return;
    lg.clearLayers();

    if (!showHazardsLayer) return;

    const allHazards = getAllHazards();
    allHazards.forEach((hz) => {
      const icon = createHazardDivIcon(hz);
      const marker = L.marker([hz.location.lat, hz.location.lng], {
        icon,
        interactive: true,
        bubblingMouseEvents: false,
      });
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectHazardOrALPR(hz);
      });
      marker.addTo(lg);
    });
  };

  useEffect(() => {
    renderHazards();

    const handleHazardsUpdated = () => {
      renderHazards();
    };
    window.addEventListener('raydr_hazards_updated', handleHazardsUpdated);
    return () => window.removeEventListener('raydr_hazards_updated', handleHazardsUpdated);
  }, [showHazardsLayer]);

  // Render 30 Lake County ALPR Camera Pins (Clickable React Modal Trigger)
  useEffect(() => {
    const lg = alprLayerGroupRef.current;
    if (!lg) return;
    lg.clearLayers();

    if (!showALPRLayer) return;

    const validALPRCameras = LAKE_COUNTY_ALPR_CAMERAS.filter((alpr) =>
      isCoordinateOnshoreAndValid(alpr.location)
    );

    validALPRCameras.forEach((alpr) => {
      const icon = createALPRDivIcon(alpr);
      const marker = L.marker([alpr.location.lat, alpr.location.lng], {
        icon,
        interactive: true,
        bubblingMouseEvents: false,
      });
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectHazardOrALPR(alpr);
      });
      marker.addTo(lg);
    });
  }, [showALPRLayer]);

  // Render Road-Snapped Route Polylines (ELECTRIC PURPLE / DEEP BLUE PALETTE - NO GREEN)
  useEffect(() => {
    const lg = routeLayerGroupRef.current;
    if (!lg || !mapInstanceRef.current) return;
    lg.clearLayers();

    const map = mapInstanceRef.current;

    // Active driving route takes top priority
    if (isNavigating && activeRoute) {
      // 1. Casing / Glow Underlay: Deep Electric Indigo/Purple (#3A00E5)
      L.polyline(activeRoute.geometry, {
        color: '#3A00E5',
        weight: 12,
        opacity: 0.5,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(lg);

      // 2. Primary Core Route Line: Vibrant Blue-Violet/Purple (#8A2BE2)
      const primaryLine = L.polyline(activeRoute.geometry, {
        color: '#8A2BE2',
        weight: 7,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(lg);
      activeRoutePolylineRef.current = primaryLine;

      // Destination target pin
      if (activeRoute.geometry.length > 0) {
        const lastPt = activeRoute.geometry[activeRoute.geometry.length - 1];
        L.marker(lastPt, {
          icon: createDestinationDivIcon(),
        }).addTo(lg);
      }

      // Waze Street Name Badges over active path in bold white high-contrast text boxes
      const bg = streetBadgesGroupRef.current;
      if (bg && activeRoute.steps && activeRoute.steps.length > 0) {
        bg.clearLayers();
        activeRoute.steps.forEach((step, idx) => {
          if (step.name && step.name.trim().length > 0 && idx % 2 === 0) {
            const stepCoord: [number, number] = [step.location[1], step.location[0]];
            const streetBadge = L.marker(stepCoord, {
              icon: createStreetBadgeDivIcon(step.name),
              interactive: false,
            });
            streetBadge.addTo(bg);
          }
        });
      }
      return;
    }

    // Clear badges when not navigating
    if (streetBadgesGroupRef.current) {
      streetBadgesGroupRef.current.clearLayers();
    }

    // Preview mode: Multi-Route Selection (3 Alternative Paths: Fastest, Avoidance/Stealth, and Balanced)
    if (previewRoutes) {
      const fastest = previewRoutes.fastest || previewRoutes.direct;
      const avoidance = previewRoutes.avoidance || previewRoutes.stealth;
      const balanced = previewRoutes.balanced;

      const routesToRender: { id: string; route: NavRoute; altColor: string }[] = [];
      if (fastest) routesToRender.push({ id: 'fastest', route: fastest, altColor: '#8A2BE2' });
      if (avoidance) routesToRender.push({ id: 'avoidance', route: avoidance, altColor: '#00D8FF' });
      if (balanced) routesToRender.push({ id: 'balanced', route: balanced, altColor: '#FF9900' });

      if (routesToRender.length > 0) {
        const bounds = L.latLngBounds([]);

        // Determine currently active route item
        const activeEntry =
          routesToRender.find(
            (r) =>
              r.id === selectedRouteId ||
              (selectedRouteId === 'stealth' && r.id === 'avoidance') ||
              (selectedRouteId === 'direct' && r.id === 'fastest')
          ) || routesToRender[0];

        // 1. First render inactive routes as distinct colored dashed/solid underlays
        routesToRender.forEach((entry) => {
          if (entry.id !== activeEntry.id) {
            // Alternative route underlay (distinct colored line #00D8FF or #FF9900, weight 6, opacity 0.7)
            L.polyline(entry.route.geometry, {
              color: entry.altColor,
              weight: 6,
              opacity: 0.7,
              dashArray: '8, 8',
              lineCap: 'round',
              lineJoin: 'round',
            }).addTo(lg);

            entry.route.geometry.forEach((pt) => bounds.extend(pt));
          }
        });

        // 2. Render primary selected route on top with thick high-visibility polyline + casing underlay
        if (activeEntry && activeEntry.route) {
          const primaryCoreColor = darkMode ? '#A855F7' : '#581C87';
          const primaryCasingColor = darkMode ? '#6B21A8' : '#9333EA';

          // Glowing Violet / Purple casing underlay
          L.polyline(activeEntry.route.geometry, {
            color: primaryCasingColor,
            weight: 13,
            opacity: 0.85,
            lineCap: 'round',
            lineJoin: 'round',
          }).addTo(lg);

          // Primary Core Line (Electric Amethyst #A855F7 in dark mode, Deep Royal Indigo #581C87 in light mode, weight 8, opacity 0.95)
          L.polyline(activeEntry.route.geometry, {
            color: primaryCoreColor,
            weight: 8,
            opacity: 0.95,
            lineCap: 'round',
            lineJoin: 'round',
          }).addTo(lg);

          activeEntry.route.geometry.forEach((pt) => bounds.extend(pt));

          // Destination flag pin
          if (activeEntry.route.geometry.length > 0) {
            const destPt = activeEntry.route.geometry[activeEntry.route.geometry.length - 1];
            L.marker(destPt, {
              icon: createDestinationDivIcon(),
            }).addTo(lg);
          }
        }

        if (bounds.isValid()) {
          map.fitBounds(bounds, {
            padding: [70, 70],
            maxZoom: 15,
          });
        }
      }
    }
  }, [isNavigating, activeRoute, previewRoutes, selectedRouteId, darkMode]);

  return (
    <div className={`relative w-full h-full overflow-hidden ${darkMode ? 'bg-[#0B0E14]' : 'bg-[#e4e8ec]'}`}>
      {/* ISOLATE COMPASS & REPORT BUTTONS INTO A DEDICATED VERTICAL STACK */}
      <div
        className={`absolute right-4 ${
          isBottomDrawerExpanded ? 'bottom-[52%]' : 'bottom-44 sm:bottom-48'
        } z-[1000] flex flex-col items-center gap-4 pointer-events-none transition-all duration-300`}
      >
        {/* Top Slot: Compass / Re-center Widget (circular, 48x48px) */}
        <div className="pointer-events-auto">
          <button
            onClick={handleRecenter}
            className={`w-12 h-12 rounded-full flex flex-col items-center justify-center transition-all shadow-2xl active:scale-95 group relative ${
              !autoFollow
                ? 'bg-[#09111e]/98 border-2 border-cyan-400 ring-4 ring-cyan-500/25 shadow-cyan-500/30'
                : darkMode
                ? 'bg-[#0b1322]/90 border border-slate-700/80 hover:border-cyan-500/60 backdrop-blur-md'
                : 'bg-white/95 border border-slate-300 hover:border-cyan-500/60 shadow-lg text-slate-800'
            }`}
            title={
              !autoFollow
                ? 'Map unlocked - Tap compass to re-center GPS position'
                : `Heading: ${Math.round(heading)}° / ${getCardinal(heading)} (Auto-Follow Active)`
            }
          >
            {/* Rotating Compass Needle (Reflects real-time vehicle bearing) */}
            <div
              className="w-5 h-5 flex items-center justify-center transition-transform duration-200"
              style={{ transform: `rotate(${-heading}deg)` }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                {/* North Pointer (Red) */}
                <polygon points="12,2 15,12 12,10 9,12" fill="#ef4444" stroke="#f87171" strokeWidth="0.5" />
                {/* South Pointer (Cyan) */}
                <polygon points="12,22 15,12 12,14 9,12" fill="#06b6d4" stroke="#67e8f9" strokeWidth="0.5" />
                <circle cx="12" cy="12" r="1.5" fill="#ffffff" />
              </svg>
            </div>

            {/* Subtext: Degree or Center */}
            <span
              className={`text-[8px] font-black uppercase tracking-tight leading-none mt-0.5 ${
                !autoFollow
                  ? 'text-cyan-400 font-bold'
                  : darkMode
                  ? 'text-slate-400'
                  : 'text-slate-600'
              }`}
            >
              {!autoFollow ? 'Center' : `${Math.round(heading)}°`}
            </span>
          </button>
        </div>

        {/* Bottom Slot: Yellow REPORT Hazard Button (56x56px pill/rounded rectangle) */}
        {onOpenReport && (
          <div className="pointer-events-auto">
            <button
              onClick={onOpenReport}
              className="w-14 h-14 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black shadow-xl shadow-amber-500/40 border-2 border-amber-300 flex flex-col items-center justify-center transition-all group"
              title="Report Police or Road Hazard"
            >
              <AlertTriangle className="w-5 h-5 text-slate-950 group-hover:scale-110 transition-transform" />
              <span className="text-[8px] font-black uppercase tracking-tight leading-none mt-0.5">
                REPORT
              </span>
            </button>
          </div>
        )}
      </div>

      {/* WAZE BOTTOM CONTROLS BAR (RE-CENTER & OVERVIEW):
          Slides in when autoFollow === false during active navigation */}
      {isNavigating && !autoFollow && (
        <div className="absolute bottom-5 left-0 right-0 z-[1050] pointer-events-auto px-4 flex justify-center animate-in slide-in-from-bottom-8 duration-300">
          <div className="bg-[#0b121e]/95 backdrop-blur-md border border-cyan-500/60 rounded-3xl p-2.5 shadow-2xl shadow-cyan-950/60 flex items-center gap-3 text-white max-w-md w-full">
            {/* Left Side: Re-center Pill Button with Target Icon & ETA Subtitle */}
            <button
              onClick={handleRecenter}
              className="flex-1 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 active:scale-95 text-white flex items-center gap-3 shadow-lg shadow-cyan-500/30 transition-all text-left"
            >
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Crosshair className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-black uppercase tracking-wider block leading-none">
                  Re-center
                </span>
                {activeRoute && (
                  <span className="text-[10px] text-cyan-200 font-mono font-semibold block mt-0.5 truncate">
                    {formatNavDuration(activeRoute.durationSeconds)} • {formatNavDistance(activeRoute.distanceMeters)}
                  </span>
                )}
              </div>
            </button>

            {/* Right Side: Overview Button */}
            <button
              onClick={handleOverview}
              className="py-2.5 px-4 rounded-2xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 active:scale-95 text-slate-200 text-xs font-black tracking-wide flex items-center gap-2 transition-all shrink-0"
              title="Fit entire route on screen"
            >
              <MapOverviewIcon className="w-4 h-4 text-cyan-400" />
              <span>Overview</span>
            </button>
          </div>
        </div>
      )}

      {/* Clean Waze 2D Top-Down Navigation Canvas (No 3D pitch/skew transform outlines) */}
      <div className="w-full h-full">
        <div
          id="map"
          ref={mapContainerRef}
          className="absolute inset-0 w-full h-full z-[1] bg-[#0B0E14]"
        />
      </div>
    </div>
  );
};

// ===================== CUSTOM DIVICONS =====================

function createStreetBadgeDivIcon(streetName: string) {
  return L.divIcon({
    className: 'street-name-marker',
    iconSize: [140, 24],
    iconAnchor: [70, 12],
    html: `
      <div style="background: rgba(15, 23, 42, 0.95); border: 1.5px solid rgba(6, 182, 212, 0.85); box-shadow: 0 4px 12px rgba(0,0,0,0.7); border-radius: 9999px; padding: 2.5px 10px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px; pointer-events: none; backdrop-filter: blur(4px);">
        <span style="color: #ffffff; font-weight: 800; font-size: 11px; letter-spacing: -0.01em; font-family: system-ui, -apple-system, sans-serif;">
          ${streetName}
        </span>
      </div>
    `,
  });
}

function createVehicleDivIcon(heading: number) {
  return L.divIcon({
    className: 'vehicle-marker-wrapper',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    html: `
      <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; pointer-events: none;">
        <!-- Pulsing radar wave ring -->
        <div style="position: absolute; inset: 0; border-radius: 9999px; background: rgba(6, 182, 212, 0.25); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <!-- Outer glowing halo -->
        <div style="position: absolute; width: 34px; height: 34px; border-radius: 9999px; background: rgba(14, 165, 233, 0.4); border: 2px solid rgba(56, 189, 248, 0.8);"></div>
        <!-- Rotating Navigation Chevron (Driven smoothly at 60fps by LERP glide engine) -->
        <div id="vehicle-puck-icon" style="position: relative; z-index: 10; transform: rotate(${heading}deg); display: flex; align-items: center; justify-content: center;">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L20 21L12 17L4 21L12 2Z" fill="#00e5ff" stroke="#003852" stroke-width="2" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
    `,
  });
}

function createHazardDivIcon(hz: HazardReport) {
  let bgColor = '#f59e0b';
  let svgPath = '';

  if (hz.type === 'police_radar' || hz.type === 'speed_trap') {
    bgColor = '#3b82f6';
    svgPath = `
      <path d="M12 2L4 6V12C4 17.5 7.4 22.6 12 24C16.6 22.6 20 17.5 20 12V6L12 2Z" fill="#1e40af" stroke="#60a5fa" stroke-width="1.5"/>
      <circle cx="12" cy="11" r="3" fill="#60a5fa"/>
    `;
  } else if (hz.type === 'traffic') {
    bgColor = '#f59e0b';
    svgPath = `
      <rect x="3" y="6" width="18" height="12" rx="3" fill="#b45309" stroke="#fcd34d" stroke-width="1.5"/>
      <circle cx="7" cy="15" r="2" fill="#fef08a"/>
      <circle cx="17" cy="15" r="2" fill="#fef08a"/>
      <line x1="6" y1="9" x2="18" y2="9" stroke="#fef08a" stroke-width="1.5"/>
    `;
  } else if (hz.type === 'crash') {
    bgColor = '#e11d48';
    svgPath = `
      <path d="M12 2L15 9H22L16 13L18 20L12 16L6 20L8 13L2 9H9L12 2Z" fill="#9f1239" stroke="#fda4af" stroke-width="1.5"/>
    `;
  } else if (hz.type === 'closure') {
    bgColor = '#dc2626';
    svgPath = `
      <circle cx="12" cy="12" r="9" fill="#991b1b" stroke="#fca5a5" stroke-width="1.5"/>
      <line x1="6" y1="12" x2="18" y2="12" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
    `;
  } else if (hz.type === 'blocked_lane') {
    bgColor = '#ea580c';
    svgPath = `
      <rect x="4" y="4" width="16" height="16" rx="2" fill="#9a3412" stroke="#fdba74" stroke-width="1.5"/>
      <line x1="8" y1="4" x2="8" y2="20" stroke="#fdba74" stroke-width="1.5" stroke-dasharray="2 2"/>
      <line x1="16" y1="8" x2="12" y2="16" stroke="#ffffff" stroke-width="2"/>
      <line x1="12" y1="8" x2="16" y2="16" stroke="#ffffff" stroke-width="2"/>
    `;
  } else if (hz.type === 'map_issue') {
    bgColor = '#0d9488';
    svgPath = `
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" fill="#115e59" stroke="#5eead4" stroke-width="1.5"/>
    `;
  } else if (hz.type === 'red_light_camera') {
    bgColor = '#ef4444';
    svgPath = `
      <rect x="6" y="2" width="12" height="20" rx="3" fill="#991b1b" stroke="#f87171" stroke-width="1.5"/>
      <circle cx="12" cy="6" r="2" fill="#ef4444"/>
      <circle cx="12" cy="12" r="2" fill="#eab308"/>
      <circle cx="12" cy="18" r="2" fill="#22c55e"/>
    `;
  } else if (hz.type === 'construction') {
    bgColor = '#f97316';
    svgPath = `
      <path d="M12 3L2 21H22L12 3Z" fill="#c2410c" stroke="#fb923c" stroke-width="1.5"/>
      <path d="M7 16H17M9 12H15" stroke="#ffffff" stroke-width="1.5"/>
    `;
  } else {
    bgColor = '#eab308';
    svgPath = `
      <path d="M12 3L2 21H22L12 3Z" fill="#854d0e" stroke="#facc15" stroke-width="1.5"/>
      <line x1="12" y1="9" x2="12" y2="14" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
      <circle cx="12" cy="17" r="1" fill="#ffffff"/>
    `;
  }

  return L.divIcon({
    className: 'hazard-pin-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    html: `
      <div style="width: 32px; height: 32px; border-radius: 12px; background: rgba(15, 23, 42, 0.95); border: 2px solid ${bgColor}; box-shadow: 0 4px 12px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; cursor: pointer; pointer-events: auto; transition: transform 0.15s ease;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="pointer-events: none;">
          ${svgPath}
        </svg>
      </div>
    `,
  });
}

function createALPRDivIcon(alpr: ALPRCamera) {
  return L.divIcon({
    className: 'alpr-pin-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    html: `
      <div style="width: 30px; height: 30px; border-radius: 10px; background: #09131f; border: 2px solid #06b6d4; box-shadow: 0 0 10px rgba(6, 182, 212, 0.4); display: flex; align-items: center; justify-content: center; cursor: pointer; pointer-events: auto;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;">
          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
          <circle cx="12" cy="13" r="3"/>
        </svg>
      </div>
    `,
  });
}

function createDestinationDivIcon() {
  return L.divIcon({
    className: 'destination-marker',
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    html: `
      <div style="display: flex; flex-direction: column; align-items: center;">
        <div style="width: 32px; height: 32px; border-radius: 9999px; background: #10b981; border: 3px solid #ffffff; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.6); display: flex; align-items: center; justify-content: center;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#ffffff">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/>
          </svg>
        </div>
        <div style="width: 2px; height: 8px; background: #ffffff;"></div>
      </div>
    `,
  });
}
