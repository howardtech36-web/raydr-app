import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  AlertTriangle,
  Camera,
  CheckCircle2,
  Navigation,
  ThumbsUp,
  ThumbsDown,
  Clock,
  MapPin,
  Eye,
  Trash2,
  User,
} from 'lucide-react';
import { HazardReport, ALPRCamera, LatLng } from '../types/navigation';
import { getDistanceMeters, formatNavDistance } from '../utils/geo';
import { deleteUserHazardReport } from '../services/hazardReporting';

interface HazardDetailCardProps {
  item: HazardReport | ALPRCamera | null;
  userLocation?: LatLng | null;
  onClose: () => void;
  onNavigateTo: (dest: { name: string; coords: LatLng }) => void;
  onDeleteReport?: (id: string) => void;
}

export const HazardDetailCard: React.FC<HazardDetailCardProps> = ({
  item,
  userLocation,
  onClose,
  onNavigateTo,
  onDeleteReport,
}) => {
  const [upvotes, setUpvotes] = useState<number>(() => {
    if (!item) return 0;
    return 'confirmations' in item ? item.confirmations : 18;
  });
  const [userVoted, setUserVoted] = useState<'yes' | 'cleared' | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  if (!item) return null;

  const isALPR = 'model' in item;
  const isPersonalReport = !isALPR && (
    (item as HazardReport).isUserReport ||
    (item as HazardReport).author === 'self' ||
    (item as HazardReport).id.startsWith('user-rep-')
  );

  const distanceMeters = userLocation
    ? getDistanceMeters(userLocation, item.location)
    : null;

  const handleConfirm = () => {
    if (userVoted === 'yes') return;
    setUpvotes((prev) => prev + 1);
    setUserVoted('yes');
  };

  const handleCleared = () => {
    if (userVoted === 'cleared') return;
    setUserVoted('cleared');
  };

  const handleDeletePersonalReport = () => {
    if (!isPersonalReport) return;
    setIsDeleting(true);
    deleteUserHazardReport(item.id);
    if (onDeleteReport) {
      onDeleteReport(item.id);
    }
    setTimeout(() => {
      onClose();
    }, 150);
  };

  return (
    <div className="absolute bottom-5 left-3 right-3 sm:left-auto sm:right-5 sm:w-96 z-[9998] pointer-events-auto animate-in slide-in-from-bottom-6 duration-200">
      <div className="bg-[#101826]/95 backdrop-blur-md border border-slate-700/80 rounded-3xl p-4 shadow-2xl text-slate-100 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {isALPR ? (
              <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shrink-0 shadow-lg shadow-cyan-500/10">
                <Camera className="w-6 h-6" />
              </div>
            ) : item.type === 'police_radar' || item.type === 'speed_trap' ? (
              <div className="w-11 h-11 rounded-2xl bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-blue-400 shrink-0 shadow-lg shadow-blue-500/10">
                <ShieldAlert className="w-6 h-6" />
              </div>
            ) : (
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/10">
                <AlertTriangle className="w-6 h-6" />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md font-bold tracking-wider bg-slate-800 text-cyan-400 border border-slate-700">
                  {isALPR ? 'ALPR ENFORCEMENT NODE' : (item as HazardReport).type.replace('_', ' ')}
                </span>
                {distanceMeters != null && (
                  <span className="text-[11px] font-bold text-slate-300">
                    {formatNavDistance(distanceMeters)} away
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-white mt-1 leading-snug">
                {isALPR ? (item as ALPRCamera).intersection : (item as HazardReport).title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Location & Details */}
        <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800/80 text-xs space-y-2">
          {/* Location Details */}
          <div className="flex items-center justify-between text-slate-300">
            <div className="flex items-center gap-1.5 min-w-0 pr-2">
              <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate font-medium text-white">
                {isALPR ? `${(item as ALPRCamera).intersection}, ${(item as ALPRCamera).city}, IN` : `${(item as HazardReport).roadName}, ${(item as HazardReport).city}, IN`}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 shrink-0">
              {item.location.lat.toFixed(4)}, {item.location.lng.toFixed(4)}
            </span>
          </div>

          {/* Explicit Enforcement Status */}
          <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/90 flex items-start gap-2 text-[11px]">
            <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-cyan-300">Enforcement Status:</span>
                <span className={`px-1.5 py-0.2 rounded font-mono font-bold text-[9px] uppercase ${
                  isALPR
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60'
                    : item.type === 'police_radar' || item.type === 'speed_trap'
                    ? 'bg-blue-950 text-blue-300 border border-blue-800/60'
                    : item.type === 'red_light_camera'
                    ? 'bg-red-950 text-red-300 border border-red-800/60'
                    : 'bg-amber-950 text-amber-300 border border-amber-800/60'
                }`}>
                  {isALPR ? `${(item as ALPRCamera).threatLevel.toUpperCase()} THREAT` : (item as HazardReport).type.toUpperCase().replace('_', ' ')}
                </span>
              </div>
              <p className="text-slate-300 mt-0.5 text-[11px] leading-tight">
                {isALPR
                  ? `Active 24/7 automated plate scanning node. Direction: ${(item as ALPRCamera).directionMonitored}.`
                  : item.type === 'police_radar' || item.type === 'speed_trap'
                  ? 'Active stationary speed radar trap monitored by ISP / Lake County units.'
                  : item.type === 'red_light_camera'
                  ? 'Automated intersection red-light & speed camera operational.'
                  : `${(item as HazardReport).description}`}
              </p>
            </div>
          </div>

          <p className="text-slate-400 leading-relaxed text-[11px]">
            {isALPR
              ? `Daily capture volume: ${(item as ALPRCamera).captureRatePerDay.toLocaleString()} vehicles/day.`
              : (item as HazardReport).description}
          </p>

          <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>
                {isALPR
                  ? `Installed ${(item as ALPRCamera).installedYear}`
                  : `Reported ${(item as HazardReport).reportedMinutesAgo} min ago`}
              </span>
            </div>
            <div className="flex items-center gap-1 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3 h-3" />
              <span>
                {isALPR
                  ? `${(item as ALPRCamera).threatLevel.toUpperCase()} THREAT`
                  : `${(item as HazardReport).confidence}% Confidence`}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-0.5">
          <button
            onClick={handleConfirm}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
              userVoted === 'yes'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800/80 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>Still There ({upvotes})</span>
          </button>

          <button
            onClick={handleCleared}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
              userVoted === 'cleared'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <ThumbsDown className="w-3.5 h-3.5" />
            <span>Cleared</span>
          </button>

          <button
            onClick={() => {
              onNavigateTo({
                name: isALPR ? (item as ALPRCamera).intersection : (item as HazardReport).roadName,
                coords: item.location,
              });
              onClose();
            }}
            className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-cyan-600/20 hover:brightness-110 active:scale-95 transition-transform"
          >
            <Navigation className="w-3.5 h-3.5 fill-white" />
            <span>Route</span>
          </button>
        </div>

        {/* User-Deletable Personal Hazard Action: prominent red Delete My Report button */}
        {isPersonalReport && (
          <div className="pt-1 border-t border-slate-800/80">
            <button
              onClick={handleDeletePersonalReport}
              disabled={isDeleting}
              className="w-full py-2 px-3 rounded-xl bg-rose-600/25 hover:bg-rose-600/40 border border-rose-500/60 text-rose-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-rose-900/30"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>{isDeleting ? 'Removing...' : 'Delete My Report'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
