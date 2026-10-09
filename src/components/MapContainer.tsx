import React, { useEffect, useState } from 'react';
import { MapContainer as LeafletMap, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapProps {
  currentPosition?: [number, number];
  heading?: number;
  routeCoordinates?: [number, number][];
  isNavigating?: boolean;
}

// Forward-pointing vehicle puck
const carIcon = L.divIcon({
  className: 'raydr-vehicle-puck',
  html: `
    <div style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#3B82F6" stroke="#FFFFFF" stroke-width="2.5" />
        <polygon points="12,4 17,16 12,13 7,16" fill="#FFFFFF" />
      </svg>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Camera controller anchoring the vehicle puck at 75% bottom-center
function CameraController({
  position,
  isNavigating,
  autoFollow,
}: {
  position: [number, number];
  isNavigating: boolean;
  autoFollow: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (!position || !autoFollow) return;

    if (isNavigating) {
      const centerPoint = map.latLngToContainerPoint(position);
      const forwardOffset = window.innerHeight * 0.22;
      const targetPoint = L.point(centerPoint.x, centerPoint.y - forwardOffset);
      const targetLatLng = map.containerPointToLatLng(targetPoint);
      map.setView(targetLatLng, 18, { animate: false });
    } else {
      map.setView(position, 16, { animate: true });
    }
  }, [position, isNavigating, autoFollow, map]);

  return null;
}

export const MapContainer: React.FC<MapProps> = ({
  currentPosition = [41.3742, -87.4689],
  heading = 0,
  routeCoordinates = [],
  isNavigating = false,
}) => {
  const [autoFollow, setAutoFollow] = useState(true);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0B0E14]">
      {/* 3D Heads-Up Perspective Wrapper */}
      <div
        id="raydr-map-stage"
        className="w-[140%] h-[140%] -left-[20%] -top-[20%] absolute transition-transform duration-300 ease-out origin-[50%_75%]"
        style={{
          transform:
            isNavigating && autoFollow
              ? `perspective(800px) rotateX(45deg) rotateZ(${-heading}deg)`
              : 'none',
        }}
        onTouchStart={() => setAutoFollow(false)}
        onMouseDown={() => setAutoFollow(false)}
      >
        <LeafletMap
          center={currentPosition}
          zoom={17}
          zoomControl={false}
          attributionControl={false}
          className="w-full h-full"
        >
          {/* Voyager Clean Base Layer - Eliminates road class labels */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png"
            maxZoom={19}
          />

          {/* Drivable Route Polylines Only - No Floating Step Badges */}
          {routeCoordinates.length > 0 && (
            <>
              <Polyline
                positions={routeCoordinates}
                pathOptions={{ color: '#4F46E5', weight: 8, opacity: 0.6 }}
              />
              <Polyline
                positions={routeCoordinates}
                pathOptions={{ color: '#818CF8', weight: 4, opacity: 1.0 }}
              />
            </>
          )}

          {/* Locked Forward Vehicle Puck */}
          <Marker position={currentPosition} icon={carIcon} />

          <CameraController
            position={currentPosition}
            isNavigating={isNavigating}
            autoFollow={autoFollow}
          />
        </LeafletMap>
      </div>

      {/* Floating Re-center Button for free-panning mode */}
      {!autoFollow && isNavigating && (
        <button
          onClick={() => setAutoFollow(true)}
          className="absolute bottom-24 right-6 z-[1000] bg-blue-600 text-white font-semibold py-2 px-4 rounded-full shadow-lg active:scale-95 transition-all"
        >
          Re-center 3D
        </button>
      )}
    </div>
  );
};

export default MapContainer;
