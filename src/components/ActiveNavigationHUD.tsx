import React, { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  ArrowUpLeft,
  ArrowUp,
  CornerUpRight,
  CornerUpLeft,
  RotateCcw,
  Navigation,
  X,
  Volume2,
  VolumeX,
  Shield,
  Clock,
  Compass,
  AlertTriangle,
  ChevronUp,
  MapPin,
  Flag,
} from 'lucide-react';
import { NavRoute, RouteStep, LatLng } from '../types/navigation';
import {
  formatNavDistance,
  formatNavDuration,
  getETAString,
  getDistanceMeters,
  speakInstruction,
} from '../utils/geo';

interface ActiveNavigationHUDProps {
  route: NavRoute;
  userCoords: LatLng;
  speedMph: number;
  speedLimitMph?: number;
  speedUnits: 'mph' | 'kmh';
  voiceGuidance: boolean;
  onToggleVoice: () => void;
  onEndNavigation: () => void;
  onRecenter: () => void;
  onOpenReport?: () => void;
  destinationName?: string;
  destinationAddress?: string;
}

export const ActiveNavigationHUD: React.FC<ActiveNavigationHUDProps> = ({
  route,
  userCoords,
  speedMph,
  speedLimitMph = 45,
  speedUnits,
  voiceGuidance,
  onToggleVoice,
  onEndNavigation,
  onRecenter,
  onOpenReport,
  destinationName,
  destinationAddress,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepRemainingDistance, setStepRemainingDistance] = useState(0);
  const [totalRemainingDistance, setTotalRemainingDistance] = useState(route.distanceMeters);
  const [totalRemainingDuration, setTotalRemainingDuration] = useState(route.durationSeconds);
  const [isDirectionsSheetOpen, setIsDirectionsSheetOpen] = useState(false);

  // Dynamic progress tracker based on actual physical GPS coordinates
  useEffect(() => {
    if (!route.steps || route.steps.length === 0) return;

    // Find closest step in the route ahead
    let closestIndex = currentStepIndex;
    let minDistance = Infinity;

    for (let i = currentStepIndex; i < route.steps.length; i++) {
      const step = route.steps[i];
      const stepCoord: LatLng = { lat: step.location[1], lng: step.location[0] };
      const dist = getDistanceMeters(userCoords, stepCoord);

      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = i;
      }
    }

    // If driver reached within 35 meters of current maneuver waypoint, advance to next maneuver
    if (minDistance < 35 && closestIndex < route.steps.length - 1) {
      closestIndex = closestIndex + 1;
    }

    setCurrentStepIndex(closestIndex);
    const activeStep = route.steps[closestIndex] || route.steps[0];
    const distToManeuver = getDistanceMeters(userCoords, {
      lat: activeStep.location[1],
      lng: activeStep.location[0],
    });
    setStepRemainingDistance(Math.max(10, Math.round(distToManeuver)));

    // Calculate total remaining distance
    let remDist = distToManeuver;
    for (let j = closestIndex + 1; j < route.steps.length; j++) {
      remDist += route.steps[j].distance;
    }
    setTotalRemainingDistance(remDist);

    // Calculate estimated remaining duration based on speed or remaining distance
    const effectiveSpeedMps = Math.max(speedMph * 0.44704, 11); // minimum baseline 25 mph equivalent
    const remDurationSec = Math.round(remDist / effectiveSpeedMps);
    setTotalRemainingDuration(remDurationSec);

    // Trigger voice guidance synthesis when entering prompt range
    if (voiceGuidance && activeStep) {
      const formattedDist = formatNavDistance(distToManeuver, speedUnits);
      const textToSpeak = `In ${formattedDist}, ${activeStep.instruction}`;
      speakInstruction(textToSpeak);
    }
  }, [userCoords, route, voiceGuidance, speedMph, speedUnits]);

  const currentStep = route.steps[currentStepIndex] || route.steps[0] || {
    instruction: 'Continue straight',
    name: 'Physical Road Snapped',
    type: 'continue',
    distance: 500,
  };

  const nextStep = route.steps[currentStepIndex + 1];

  const displaySpeed = speedUnits === 'kmh' ? Math.round(speedMph * 1.60934) : speedMph;
  const displayLimit = speedUnits === 'kmh' ? Math.round(speedLimitMph * 1.60934) : speedLimitMph;
  const isSpeeding = displaySpeed > displayLimit + 5;

  // Maneuver Icon Selection
  const renderManeuverIcon = (step: RouteStep, size = 'w-9 h-9') => {
    const mod = step.modifier?.toLowerCase() || '';
    const type = step.type?.toLowerCase() || '';
    if (type === 'arrive') {
      return <Flag className={`${size} text-emerald-400`} />;
    }
    if (mod.includes('left')) {
      if (mod.includes('sharp')) return <CornerUpLeft className={`${size} text-cyan-300`} />;
      return <ArrowUpLeft className={`${size} text-cyan-300`} />;
    }
    if (mod.includes('right')) {
      if (mod.includes('sharp')) return <CornerUpRight className={`${size} text-cyan-300`} />;
      return <ArrowUpRight className={`${size} text-cyan-300`} />;
    }
    if (mod.includes('u-turn')) return <RotateCcw className={`${size} text-cyan-300`} />;
    return <ArrowUp className={`${size} text-cyan-300`} />;
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-[9990] flex flex-col justify-between p-3 sm:p-4">
      {/* TOP COCKPIT: Turn Maneuver Banner (Persistent fixed card with high z-[1100] visibility while free-panning) */}
      <div className="w-full max-w-lg mx-auto pointer-events-auto space-y-2 animate-in slide-in-from-top-6 duration-200 z-[1100] relative">
        <div className="bg-[#0b121e]/95 backdrop-blur-md border border-cyan-500/50 rounded-3xl p-3.5 shadow-2xl shadow-cyan-950/50 flex items-center gap-3.5 text-white">
          {/* Turn Arrow Glyph */}
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400/60 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/20">
            {renderManeuverIcon(currentStep)}
          </div>

          {/* Turn Instruction Text & Countdown */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono tracking-tight text-cyan-300">
                {formatNavDistance(stepRemainingDistance, speedUnits)}
              </span>
              <span className="text-xs text-slate-400 font-mono">then</span>
            </div>
            <h2 className="text-base font-bold text-white truncate leading-tight mt-0.5">
              {currentStep.instruction}
            </h2>
          </div>

          {/* Voice Guidance Toggle in Maneuver Banner */}
          <button
            onClick={onToggleVoice}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all shrink-0 ${
              voiceGuidance
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title="Toggle Voice Guidance"
          >
            {voiceGuidance ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>

        {/* Current Street Pill & Upcoming Maneuver Preview */}
        <div className="flex items-center justify-between px-2 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-slate-300 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold truncate max-w-[200px]">
              {currentStep.name || 'Lake County Highway'}
            </span>
          </div>

          {nextStep && (
            <div className="text-[11px] text-slate-400 bg-slate-900/80 px-2.5 py-0.5 rounded-full border border-slate-800/80 truncate max-w-[170px]">
              Then: {nextStep.name}
            </div>
          )}
        </div>
      </div>

      {/* FLOATING MIDDLE CONTROLS: Speedometer & Speed Limit */}
      <div className="w-full max-w-lg mx-auto flex items-end justify-between pointer-events-auto px-1">
        {/* Speed Cluster */}
        <div className="flex items-center gap-2.5">
          {/* Speed Limit Badge */}
          <div className="w-12 h-14 bg-white border-2 border-black rounded-lg shadow-2xl flex flex-col items-center justify-center p-0.5 select-none shrink-0">
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
            className={`w-18 h-18 rounded-full bg-[#0b121e]/95 border-2 shadow-2xl backdrop-blur-md flex flex-col items-center justify-center select-none transition-all ${
              isSpeeding
                ? 'border-rose-500 shadow-rose-500/40 text-rose-400 scale-105'
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

      {/* BOTTOM COCKPIT: Live ETA & Route Progress Card (Interactive: Tap to expand Turn-by-Turn Guidance Sheet) */}
      <div className="w-full max-w-lg mx-auto pointer-events-auto animate-in slide-in-from-bottom-6 duration-200">
        <div
          onClick={() => setIsDirectionsSheetOpen(true)}
          className="bg-[#0b121e]/95 backdrop-blur-md border border-slate-700/80 rounded-3xl p-4 shadow-2xl flex items-center justify-between gap-4 text-white cursor-pointer hover:border-cyan-500/60 transition-all group select-none"
          title="Tap to open Turn-by-Turn Route Guidance"
        >
          {/* ETA Metrics */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                  {getETAString(totalRemainingDuration)}
                </span>
                <span className="text-xs font-semibold text-emerald-400 font-mono">ETA</span>
              </div>
              <span className="text-[10px] text-cyan-400/90 font-bold bg-cyan-950/70 border border-cyan-800/60 px-2 py-0.5 rounded-full flex items-center gap-1 ml-auto">
                <ChevronUp className="w-3 h-3 group-hover:-translate-y-0.5 transition-transform" />
                <span>Turns</span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mt-0.5">
              <span>{formatNavDuration(totalRemainingDuration)}</span>
              <span>•</span>
              <span>{formatNavDistance(totalRemainingDistance, speedUnits)}</span>
              <span>•</span>
              <span className="text-cyan-400 font-mono text-[11px] truncate">
                {route.id === 'stealth' || route.id === 'avoidance' ? '🛡️ Stealth Guard' : '⚡ Direct'}
              </span>
            </div>
          </div>

          {/* End Navigation Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEndNavigation();
            }}
            className="px-4 py-2.5 rounded-2xl bg-rose-600/90 hover:bg-rose-600 active:scale-95 text-white text-xs font-extrabold tracking-wider uppercase flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all shrink-0"
          >
            <X className="w-4 h-4" />
            <span>End Nav</span>
          </button>
        </div>
      </div>

      {/* FULL-HEIGHT SLIDE-UP SHEET: Turn-by-Turn Route Guidance */}
      {isDirectionsSheetOpen && (
        <div className="fixed inset-0 z-[10005] bg-black/80 backdrop-blur-md flex flex-col justify-end animate-in fade-in duration-200 pointer-events-auto">
          {/* Backdrop click dismiss */}
          <div
            className="flex-1"
            onClick={() => setIsDirectionsSheetOpen(false)}
          />

          <div className="w-full max-w-xl mx-auto bg-[#0c1424] border-t border-slate-700/80 rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 text-white">
            {/* Top Drag Handle */}
            <div
              onClick={() => setIsDirectionsSheetOpen(false)}
              className="pt-3 pb-1 cursor-pointer flex flex-col items-center group select-none"
            >
              <div className="w-12 h-1.5 rounded-full bg-slate-600 group-hover:bg-cyan-400 transition-colors" />
            </div>

            {/* Sheet Header */}
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="min-w-0 flex-1 pr-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-950/80 border border-cyan-800/60 px-2 py-0.5 rounded-md">
                    Turn-by-Turn Route Guidance
                  </span>
                </div>
                <h3 className="font-extrabold text-lg text-white truncate mt-1">
                  {destinationName || 'Destination'}
                </h3>
                <p className="text-xs text-slate-400 truncate">
                  {destinationAddress || 'Lake County Corridor, IN'}
                </p>
              </div>

              <button
                onClick={() => setIsDirectionsSheetOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors shrink-0"
                aria-label="Close directions sheet"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Summary Card */}
            <div className="p-4 bg-[#111c30]/80 border-b border-slate-800">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">ETA</span>
                  <span className="text-lg font-black font-mono text-emerald-400">
                    {getETAString(totalRemainingDuration)}
                  </span>
                </div>
                <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Duration</span>
                  <span className="text-lg font-black font-mono text-cyan-300">
                    {formatNavDuration(totalRemainingDuration)}
                  </span>
                </div>
                <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Distance</span>
                  <span className="text-lg font-black font-mono text-white">
                    {formatNavDistance(totalRemainingDistance, speedUnits)}
                  </span>
                </div>
              </div>
            </div>

            {/* Step-by-Step Maneuver List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-800/60">
              {route.steps && route.steps.length > 0 ? (
                route.steps.map((step, idx) => {
                  const isCurrent = idx === currentStepIndex;
                  const isPast = idx < currentStepIndex;
                  const stepDist = idx === currentStepIndex ? stepRemainingDistance : step.distance;

                  return (
                    <div
                      key={idx}
                      className={`pt-2.5 first:pt-0 flex items-start gap-3.5 rounded-2xl p-2.5 transition-all ${
                        isCurrent
                          ? 'bg-cyan-950/40 border-2 border-cyan-400/80 shadow-lg shadow-cyan-950/50'
                          : isPast
                          ? 'opacity-40'
                          : 'bg-slate-900/40 border border-slate-800/60'
                      }`}
                    >
                      {/* Maneuver Arrow Glyph */}
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                          isCurrent
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/30'
                            : 'bg-slate-800/80 border-slate-700/80 text-slate-400'
                        }`}
                      >
                        {renderManeuverIcon(step, 'w-6 h-6')}
                      </div>

                      {/* Step Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-xs font-mono font-bold ${
                              isCurrent ? 'text-cyan-300' : 'text-slate-400'
                            }`}
                          >
                            In {formatNavDistance(stepDist, speedUnits)}
                          </span>
                          {isCurrent && (
                            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 animate-pulse">
                              NEXT TURN
                            </span>
                          )}
                          {isPast && (
                            <span className="text-[9px] text-slate-500 font-bold uppercase">
                              COMPLETED
                            </span>
                          )}
                        </div>

                        <p className="text-sm font-bold text-white mt-0.5 leading-snug">
                          {step.instruction}
                        </p>

                        {step.name && (
                          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                            <span>{step.name}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-slate-400 text-sm">
                  Proceed along the highlighted route corridor.
                </div>
              )}
            </div>

            {/* Bottom Action Footer */}
            <div className="p-3.5 border-t border-slate-800 bg-[#0e1627] flex items-center justify-between gap-3">
              <span className="text-xs text-slate-400 font-medium">
                {route.steps?.length || 0} Total Guidance Steps
              </span>
              <button
                onClick={() => setIsDirectionsSheetOpen(false)}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white font-bold text-xs transition-colors"
              >
                Resume Navigation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
