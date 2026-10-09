import React from 'react';
import {
  Navigation,
  Shield,
  ShieldCheck,
  Zap,
  ArrowRight,
  X,
  Camera,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Compass,
} from 'lucide-react';
import { NavRoute } from '../types/navigation';
import { formatNavDistance, formatNavDuration, getETAString } from '../utils/geo';

interface RouteSelectionCardProps {
  destinationName: string;
  fastestRoute: NavRoute | null;
  avoidanceRoute: NavRoute | null;
  balancedRoute?: NavRoute | null;
  selectedRouteId: 'fastest' | 'avoidance' | 'balanced' | 'direct' | 'stealth';
  onSelectRoute: (id: 'fastest' | 'avoidance' | 'balanced') => void;
  onStartNavigation: () => void;
  onCancel: () => void;
  isLoading: boolean;
  isPremium: boolean;
  speedUnits: 'mph' | 'kmh';
}

export const RouteSelectionCard: React.FC<RouteSelectionCardProps> = ({
  destinationName,
  fastestRoute,
  avoidanceRoute,
  balancedRoute,
  selectedRouteId,
  onSelectRoute,
  onStartNavigation,
  onCancel,
  isLoading,
  isPremium,
  speedUnits,
}) => {
  if (isLoading) {
    return (
      <div className="absolute bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-[9995] pointer-events-auto">
        <div className="bg-[#101826]/95 backdrop-blur-md border border-cyan-500/40 rounded-3xl p-5 shadow-2xl flex flex-col items-center justify-center gap-3 text-slate-200">
          <div className="w-8 h-8 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <div className="text-center">
            <h4 className="font-bold text-sm text-white">Computing 3 Distinct Multi-Route Paths</h4>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Querying OSRM & actively calculating ALPR avoidance corridors...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!fastestRoute && !avoidanceRoute && !balancedRoute) return null;

  const currentActiveRoute =
    selectedRouteId === 'avoidance' || selectedRouteId === 'stealth'
      ? (avoidanceRoute || fastestRoute)
      : selectedRouteId === 'balanced'
      ? (balancedRoute || fastestRoute)
      : (fastestRoute || avoidanceRoute);

  return (
    <div className="absolute bottom-4 left-3 right-3 sm:left-auto sm:right-5 sm:w-[490px] z-[9995] pointer-events-auto animate-in slide-in-from-bottom-6 duration-200">
      <div className="bg-[#0e1625]/95 backdrop-blur-md border border-slate-700/80 rounded-3xl p-4 shadow-2xl flex flex-col gap-3 text-slate-100">
        {/* Header Title Row */}
        <div className="flex items-center justify-between pb-1">
          <div className="min-w-0 pr-2">
            <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-cyan-400">
              3 ALTERNATIVE PATHS AVAILABLE
            </span>
            <h3 className="text-base font-bold text-white truncate leading-tight">
              {destinationName}
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors shrink-0"
            title="Cancel Route"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Distinct Route Cards: Fastest, Avoidance, and Balanced */}
        <div className="grid grid-cols-3 gap-2">
          {/* Card 1: Fastest Route (Time-Optimized) */}
          {fastestRoute && (
            <div
              onClick={() => onSelectRoute('fastest')}
              className={`p-2.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                selectedRouteId === 'fastest' || selectedRouteId === 'direct'
                  ? 'bg-purple-950/60 border-[#8A2BE2] shadow-lg shadow-purple-600/25 ring-2 ring-[#8A2BE2]'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-200 truncate">Fastest</span>
                  {(selectedRouteId === 'fastest' || selectedRouteId === 'direct') && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#8A2BE2] shrink-0 ml-1" />
                  )}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-[#8A2BE2] shrink-0" />
                  <span className="text-[9px] font-semibold text-purple-300">Fastest</span>
                </div>

                <div className="mt-2">
                  <span className="text-lg font-black text-white leading-none font-mono">
                    {formatNavDuration(fastestRoute.durationSeconds)}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-1 space-y-0.5">
                    <div className="font-medium truncate">
                      {formatNavDistance(fastestRoute.distanceMeters, speedUnits)}
                    </div>
                    <div className="text-purple-300 font-mono text-[9px]">
                      ETA {getETAString(fastestRoute.durationSeconds)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Hazard & ALPR Counts */}
              <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] space-y-0.5">
                <div className="flex items-center gap-1 text-amber-400 font-medium truncate">
                  <Camera className="w-3 h-3 shrink-0" />
                  <span>{fastestRoute.alprCount} ALPR</span>
                </div>
                <div className="flex items-center gap-1 text-rose-400 font-medium truncate">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>{fastestRoute.hazardCount} Traps</span>
                </div>
              </div>
            </div>
          )}

          {/* Card 2: Avoidance / Stealth Route (Enforcement-Optimized) */}
          {avoidanceRoute && (
            <div
              onClick={() => onSelectRoute('avoidance')}
              className={`p-2.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                selectedRouteId === 'avoidance' || selectedRouteId === 'stealth'
                  ? 'bg-cyan-950/60 border-[#00D8FF] shadow-lg shadow-cyan-600/25 ring-2 ring-[#00D8FF]'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 min-w-0">
                    <Shield className="w-3 h-3 text-[#00D8FF] shrink-0" />
                    <span className="text-[11px] font-bold text-slate-200 truncate">Avoidance</span>
                  </div>
                  {(selectedRouteId === 'avoidance' || selectedRouteId === 'stealth') && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00D8FF] shrink-0 ml-1" />
                  )}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-[#00D8FF] shrink-0" />
                  <span className="text-[9px] font-semibold text-cyan-300">Stealth</span>
                </div>

                <div className="mt-2">
                  <span className="text-lg font-black text-cyan-300 leading-none font-mono">
                    {formatNavDuration(avoidanceRoute.durationSeconds)}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-1 space-y-0.5">
                    <div className="font-medium truncate">
                      {formatNavDistance(avoidanceRoute.distanceMeters, speedUnits)}
                    </div>
                    <div className="text-cyan-300 font-mono text-[9px]">
                      ETA {getETAString(avoidanceRoute.durationSeconds)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Hazard & ALPR Counts */}
              <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] space-y-0.5">
                <div className="flex items-center gap-1 text-cyan-300 font-bold truncate">
                  <ShieldCheck className="w-3 h-3 text-[#00D8FF] shrink-0" />
                  <span>
                    {avoidanceRoute.alprCount === 0 ? '0 ALPR' : `${avoidanceRoute.alprCount} ALPR`}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-slate-300 font-medium truncate">
                  <Zap className="w-3 h-3 text-[#00D8FF] shrink-0" />
                  <span>{avoidanceRoute.hazardCount} Traps</span>
                </div>
              </div>
            </div>
          )}

          {/* Card 3: Balanced Route (Hybrid Compromise) */}
          {balancedRoute && (
            <div
              onClick={() => onSelectRoute('balanced')}
              className={`p-2.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                selectedRouteId === 'balanced'
                  ? 'bg-amber-950/60 border-[#FF9900] shadow-lg shadow-amber-600/25 ring-2 ring-[#FF9900]'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-200 truncate">Balanced</span>
                  {selectedRouteId === 'balanced' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#FF9900] shrink-0 ml-1" />
                  )}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-[#FF9900] shrink-0" />
                  <span className="text-[9px] font-semibold text-amber-300">Hybrid</span>
                </div>

                <div className="mt-2">
                  <span className="text-lg font-black text-amber-300 leading-none font-mono">
                    {formatNavDuration(balancedRoute.durationSeconds)}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-1 space-y-0.5">
                    <div className="font-medium truncate">
                      {formatNavDistance(balancedRoute.distanceMeters, speedUnits)}
                    </div>
                    <div className="text-amber-300 font-mono text-[9px]">
                      ETA {getETAString(balancedRoute.durationSeconds)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Hazard & ALPR Counts */}
              <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] space-y-0.5">
                <div className="flex items-center gap-1 text-amber-300 font-medium truncate">
                  <Camera className="w-3 h-3 shrink-0" />
                  <span>{balancedRoute.alprCount} ALPR</span>
                </div>
                <div className="flex items-center gap-1 text-slate-300 font-medium truncate">
                  <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>{balancedRoute.hazardCount} Traps</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Selected Route Summary Banner */}
        {currentActiveRoute && (
          <div className="px-3.5 py-2 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-200 min-w-0 pr-2">
              <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="font-semibold truncate">
                {currentActiveRoute.name} • Arrive at {getETAString(currentActiveRoute.durationSeconds)}
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 shrink-0">
              {formatNavDistance(currentActiveRoute.distanceMeters, speedUnits)}
            </span>
          </div>
        )}

        {/* "Go Now" 3D Driver Guidance Launcher */}
        <button
          onClick={onStartNavigation}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:brightness-110 text-white font-extrabold text-base tracking-wide flex items-center justify-center gap-2 shadow-xl shadow-purple-600/30 active:scale-[0.98] transition-all"
        >
          <Navigation className="w-5 h-5 fill-white" />
          <span>GO NOW • 3D GUIDANCE</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );
};
