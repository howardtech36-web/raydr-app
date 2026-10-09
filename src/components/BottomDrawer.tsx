import React, { useState, useEffect } from 'react';
import {
  Home,
  Briefcase,
  ChevronUp,
  ChevronDown,
  Navigation,
  Compass,
  MapPin,
  Bookmark,
  Sparkles,
  Settings,
  AlertTriangle,
} from 'lucide-react';
import { LatLng, SavedLocation } from '../types/navigation';
import { LAKE_COUNTY_PRESETS } from '../services/nominatim';
import { getSavedLocations } from '../services/savedLocations';
import { EditSavedPlacesModal } from './EditSavedPlacesModal';

interface BottomDrawerProps {
  onSelectDestination: (dest: { name: string; address?: string; coords: LatLng }) => void;
  speedMph: number;
  speedLimitMph?: number;
  speedUnits: 'mph' | 'kmh';
  isNavigating: boolean;
  onCenterUser: () => void;
  onOpenReport?: () => void;
  onExpandedChange?: (expanded: boolean) => void;
}

export const BottomDrawer: React.FC<BottomDrawerProps> = ({
  onSelectDestination,
  speedMph,
  speedLimitMph = 45,
  speedUnits,
  isNavigating,
  onCenterUser,
  onOpenReport,
  onExpandedChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [savedPlaces, setSavedPlaces] = useState<SavedLocation[]>(() => getSavedLocations());
  const [isEditSavedOpen, setIsEditSavedOpen] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      onExpandedChange?.(next);
      return next;
    });
  };

  useEffect(() => {
    const handleUpdate = () => {
      setSavedPlaces(getSavedLocations());
    };
    window.addEventListener('raydr_saved_locations_updated', handleUpdate);
    return () => window.removeEventListener('raydr_saved_locations_updated', handleUpdate);
  }, []);

  // When active 3D navigation is on, the BottomDrawer is replaced by the ActiveNavigationHUD
  if (isNavigating) return null;

  const displaySpeed = speedUnits === 'kmh' ? Math.round(speedMph * 1.60934) : speedMph;
  const displayLimit = speedUnits === 'kmh' ? Math.round(speedLimitMph * 1.60934) : speedLimitMph;

  const isSpeeding = displaySpeed > displayLimit + 5;

  const homePlace = savedPlaces.find((p) => p.type === 'home');
  const workPlace = savedPlaces.find((p) => p.type === 'work');
  const customPlaces = savedPlaces.filter((p) => p.type === 'custom');

  return (
    <>
      <div className="absolute bottom-0 left-0 right-0 z-[9990] flex flex-col items-center pointer-events-none">
        {/* Floating Speedometer & Speed Limit Badge Row (Floating above drawer) */}
        <div className="w-full px-4 mb-3 flex items-end justify-between pointer-events-auto">
          {/* Speed Limit & Live Speedometer Cluster */}
          <div className="flex items-center gap-2.5">
            {/* Speed Limit Sign Badge */}
            <div className="w-12 h-14 bg-white border-2 border-black rounded-lg shadow-xl flex flex-col items-center justify-center p-0.5 select-none shrink-0">
              <span className="text-[8px] font-black tracking-tighter text-black uppercase leading-none">
                SPEED
              </span>
              <span className="text-[8px] font-black tracking-tighter text-black uppercase leading-none">
                LIMIT
              </span>
              <span className="text-lg font-black text-black leading-tight mt-0.5 font-mono">
                {displayLimit}
              </span>
            </div>

            {/* Live Digital Speedometer Circle */}
            <div
              className={`w-16 h-16 rounded-full bg-[#111927]/95 border-2 shadow-2xl backdrop-blur-md flex flex-col items-center justify-center select-none transition-colors ${
                isSpeeding
                  ? 'border-rose-500 shadow-rose-500/30 text-rose-400'
                  : displaySpeed > 0
                  ? 'border-cyan-400 shadow-cyan-500/20 text-cyan-300'
                  : 'border-slate-700 text-slate-200'
              }`}
            >
              <span className="text-2xl font-black font-mono leading-none tracking-tight">
                {displaySpeed}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                {speedUnits.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Drawer Container */}
        <div className="w-full max-w-lg bg-[#0e1625]/95 backdrop-blur-md border-t border-slate-800 rounded-t-3xl shadow-2xl pointer-events-auto transition-all duration-300 ease-out flex flex-col">
          {/* Drag / Pull handle bar */}
          <div
            onClick={toggleExpanded}
            className="pt-2.5 pb-2 px-4 cursor-pointer flex flex-col items-center select-none group"
          >
            <div className="w-12 h-1.5 rounded-full bg-slate-600 group-hover:bg-cyan-400 transition-colors" />
            <div className="flex items-center justify-between w-full mt-1.5 text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Saved Destinations & Shortcuts</span>
              <div className="flex items-center gap-1 text-[11px] text-cyan-400">
                <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </div>
            </div>
          </div>

          {/* Primary Shortcuts: Home & Work */}
          <div className="px-4 pb-3 grid grid-cols-2 gap-2.5">
            {/* Home shortcut */}
            <button
              onClick={() => {
                if (homePlace) {
                  onSelectDestination({ name: 'Home', address: homePlace.address, coords: homePlace.coords });
                } else {
                  onSelectDestination({
                    name: 'Home (Crown Point)',
                    address: 'Historic Lake County Courthouse, Crown Point, IN',
                    coords: { lat: 41.4170, lng: -87.3653 },
                  });
                }
              }}
              className="p-3 rounded-2xl bg-[#141f30] hover:bg-[#1a2940] border border-slate-700/70 flex items-center gap-3 text-left transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <Home className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-white text-sm block truncate group-hover:text-cyan-300">
                  Home
                </span>
                <span className="text-[11px] text-slate-400 block truncate">
                  {homePlace ? homePlace.address.split(',')[0] : 'Crown Point'}
                </span>
              </div>
            </button>

            {/* Work shortcut */}
            <button
              onClick={() => {
                if (workPlace) {
                  onSelectDestination({ name: 'Work', address: workPlace.address, coords: workPlace.coords });
                } else {
                  onSelectDestination({
                    name: 'Work (Merrillville US-30)',
                    address: '2109 Southlake Mall, US-30, Merrillville, IN',
                    coords: { lat: 41.4700, lng: -87.3320 },
                  });
                }
              }}
              className="p-3 rounded-2xl bg-[#141f30] hover:bg-[#1a2940] border border-slate-700/70 flex items-center gap-3 text-left transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-white text-sm block truncate group-hover:text-amber-300">
                  Work
                </span>
                <span className="text-[11px] text-slate-400 block truncate">
                  {workPlace ? workPlace.address.split(',')[0] : 'Merrillville'}
                </span>
              </div>
            </button>
          </div>

          {/* Expanded Shortcuts Carousel / List */}
          {isExpanded && (
            <div className="px-4 pb-4 space-y-3 border-t border-slate-800/80 pt-3 max-h-60 overflow-y-auto animate-in fade-in duration-200">
              {/* Custom Saved Favorites */}
              {customPlaces.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                      Custom Saved Places
                    </span>
                    <button
                      onClick={() => setIsEditSavedOpen(true)}
                      className="text-[10px] text-slate-400 hover:text-cyan-300 font-mono"
                    >
                      Manage
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                    {customPlaces.map((cp) => (
                      <div
                        key={cp.id}
                        onClick={() =>
                          onSelectDestination({
                            name: cp.customLabel || cp.name,
                            address: cp.address,
                            coords: cp.coords,
                          })
                        }
                        className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 flex items-center gap-2.5 cursor-pointer transition-colors group"
                      >
                        <Bookmark className="w-4 h-4 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-white truncate group-hover:text-emerald-300">
                            {cp.customLabel || cp.name}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">{cp.address}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Waypoints */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Lake County Waypoints
                  </span>
                  <button
                    onClick={() => setIsEditSavedOpen(true)}
                    className="text-[10px] text-cyan-400 hover:underline font-mono"
                  >
                    Edit Saved Places
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {LAKE_COUNTY_PRESETS.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onSelectDestination({ name: item.name, address: item.address, coords: item.coords })}
                      className="p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 flex items-center gap-2.5 cursor-pointer transition-colors group"
                    >
                      <MapPin className="w-4 h-4 text-cyan-400 shrink-0 group-hover:scale-110 transition-transform" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-white truncate group-hover:text-cyan-300">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">{item.category}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Saved Places Modal */}
      <EditSavedPlacesModal
        isOpen={isEditSavedOpen}
        onClose={() => setIsEditSavedOpen(false)}
        onSelectPlace={(place) => {
          onSelectDestination({ name: place.customLabel || place.name, address: place.address, coords: place.coords });
          setIsEditSavedOpen(false);
        }}
      />
    </>
  );
};
