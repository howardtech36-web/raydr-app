import React, { useState, useEffect } from 'react';
import {
  X,
  Info,
  Shield,
  ShieldAlert,
  AlertTriangle,
  Car,
  Ban,
  Split,
  Flame,
  MessageSquare,
  Clock,
  Trash2,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { HazardReport } from '../types/navigation';
import {
  getUserContributions,
  deleteUserHazardReport,
} from '../services/hazardReporting';

interface MyContributionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportDeleted?: (reportTitle: string) => void;
}

export const MyContributionsModal: React.FC<MyContributionsModalProps> = ({
  isOpen,
  onClose,
  onReportDeleted,
}) => {
  const [reports, setReports] = useState<HazardReport[]>([]);

  // Sync user contributions from storage
  useEffect(() => {
    if (!isOpen) return;

    const loadReports = () => {
      setReports(getUserContributions());
    };

    loadReports();

    const handleUpdated = () => {
      loadReports();
    };

    window.addEventListener('raydr_hazards_updated', handleUpdated);
    return () => window.removeEventListener('raydr_hazards_updated', handleUpdated);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDelete = (reportId: string, title: string) => {
    deleteUserHazardReport(reportId);
    setReports((prev) => prev.filter((r) => r.id !== reportId && r.reportId !== reportId));
    onReportDeleted?.(title);
  };

  const getCategoryVisuals = (rep: HazardReport) => {
    if (rep.type === 'police_radar' || rep.type === 'speed_trap') {
      return {
        badge: 'POLICE / RADAR',
        badgeColor: 'bg-blue-950/80 text-blue-400 border-blue-800/60',
        icon: (
          <div className="w-10 h-10 rounded-xl bg-blue-950 border-2 border-blue-500 flex items-center justify-center text-blue-400 shadow-md shadow-blue-500/20 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
        ),
      };
    }
    if (rep.type === 'crash') {
      return {
        badge: 'ACCIDENT / CRASH',
        badgeColor: 'bg-rose-950/80 text-rose-400 border-rose-800/60',
        icon: (
          <div className="w-10 h-10 rounded-xl bg-rose-950 border-2 border-rose-500 flex items-center justify-center text-rose-400 shadow-md shadow-rose-500/20 shrink-0">
            <Car className="w-5 h-5" />
          </div>
        ),
      };
    }
    if (rep.type === 'closure') {
      return {
        badge: 'ROAD CLOSURE',
        badgeColor: 'bg-red-950/80 text-red-400 border-red-800/60',
        icon: (
          <div className="w-10 h-10 rounded-xl bg-red-950 border-2 border-red-500 flex items-center justify-center text-red-400 shadow-md shadow-red-500/20 shrink-0">
            <Ban className="w-5 h-5" />
          </div>
        ),
      };
    }
    if (rep.type === 'traffic') {
      return {
        badge: 'TRAFFIC JAM',
        badgeColor: 'bg-amber-950/80 text-amber-400 border-amber-800/60',
        icon: (
          <div className="w-10 h-10 rounded-xl bg-amber-950 border-2 border-amber-500 flex items-center justify-center text-amber-400 shadow-md shadow-amber-500/20 shrink-0">
            <Flame className="w-5 h-5" />
          </div>
        ),
      };
    }
    if (rep.type === 'blocked_lane') {
      return {
        badge: 'BLOCKED LANE',
        badgeColor: 'bg-orange-950/80 text-orange-400 border-orange-800/60',
        icon: (
          <div className="w-10 h-10 rounded-xl bg-orange-950 border-2 border-orange-500 flex items-center justify-center text-orange-400 shadow-md shadow-orange-500/20 shrink-0">
            <Split className="w-5 h-5" />
          </div>
        ),
      };
    }
    // Default hazard
    return {
      badge: 'ROAD HAZARD',
      badgeColor: 'bg-amber-950/80 text-amber-400 border-amber-800/60',
      icon: (
        <div className="w-10 h-10 rounded-xl bg-amber-950 border-2 border-amber-500 flex items-center justify-center text-amber-400 shadow-md shadow-amber-500/20 shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
      ),
    };
  };

  return (
    <div className="fixed inset-0 z-[10005] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 pointer-events-auto">
      <div className="bg-[#0f1726] border border-slate-700/80 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden max-h-[88vh] text-slate-100">
        {/* Header - Identical to MapLegendModal */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#121c2e]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">My Active Reports & Hazards</h3>
              <p className="text-xs text-slate-400">Manage or delete your community reports</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content List */}
        <div className="overflow-y-auto flex-1 divide-y divide-slate-800/80 p-3 space-y-2">
          {reports.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center space-y-3 bg-slate-900/40 rounded-2xl border border-slate-800/80">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">No Active Personal Reports</h4>
                <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed">
                  Hazards, police traps, and road closures you submit while driving will appear here with full deletion control.
                </p>
              </div>
            </div>
          ) : (
            reports.map((rep) => {
              const visuals = getCategoryVisuals(rep);
              const elapsedMins = rep.timestamp
                ? Math.floor((Date.now() - rep.timestamp) / 60000)
                : rep.reportedMinutesAgo || 0;
              const timeString =
                elapsedMins < 1 ? 'Just now' : `${elapsedMins}m ago`;
              const roadName = rep.roadName || 'Lake County Corridor';

              return (
                <div
                  key={rep.id}
                  className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between gap-3 backdrop-blur-md"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {visuals.icon}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-white truncate">{rep.title}</h4>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1 truncate text-slate-300">
                          <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span className="truncate">Reported {timeString} on {roadName}</span>
                        </span>
                      </div>
                      {rep.description && (
                        <p className="text-[11px] text-slate-400/90 truncate mt-0.5">
                          {rep.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Red Delete Report Button */}
                  <button
                    onClick={() => handleDelete(rep.id, rep.title)}
                    className="px-3 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 active:scale-95 border border-rose-500/60 text-rose-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 shadow-sm"
                    title="Delete this report from live Leaflet map and storage"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Delete Report</span>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#111927] flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono">
            {reports.length} {reports.length === 1 ? 'Active Report' : 'Active Reports'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white font-bold transition-colors shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
