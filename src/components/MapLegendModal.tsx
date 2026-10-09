import React from 'react';
import {
  X,
  Camera,
  ShieldAlert,
  AlertTriangle,
  TrafficCone,
  Compass,
  Navigation,
  Info,
} from 'lucide-react';

interface MapLegendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MapLegendModal: React.FC<MapLegendModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const legendItems = [
    {
      title: 'ALPR / License Plate Reader Node',
      description: 'Automated Flock Safety Falcon and municipal highway plate recognition cameras monitoring vehicle ingress and exit corridors across Lake County.',
      icon: (
        <div className="w-10 h-10 rounded-xl bg-cyan-950 border-2 border-cyan-400 flex items-center justify-center text-cyan-400 shadow-md shadow-cyan-500/20">
          <Camera className="w-5 h-5" />
        </div>
      ),
      badge: 'ALPR CAMERA',
      badgeColor: 'bg-cyan-950/80 text-cyan-400 border-cyan-800/60',
    },
    {
      title: 'Police Trap / Speed Enforcement Zone',
      description: 'Active Indiana State Police, Lake County Sheriff, or municipal police cruisers operating stationary radar, moving Ka-band, or laser speed checks.',
      icon: (
        <div className="w-10 h-10 rounded-xl bg-blue-950 border-2 border-blue-500 flex items-center justify-center text-blue-400 shadow-md shadow-blue-500/20">
          <ShieldAlert className="w-5 h-5" />
        </div>
      ),
      badge: 'SPEED TRAP / RADAR',
      badgeColor: 'bg-blue-950/80 text-blue-400 border-blue-800/60',
    },
    {
      title: 'Red Light & Speed Camera Intersection',
      description: 'Automated overhead stop bar and intersection monitoring cameras enforcing signal violations and intersection speed.',
      icon: (
        <div className="w-10 h-10 rounded-xl bg-red-950 border-2 border-red-500 flex items-center justify-center text-red-400 shadow-md shadow-red-500/20">
          <div className="flex flex-col items-center gap-0.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
        </div>
      ),
      badge: 'RED LIGHT CAMERA',
      badgeColor: 'bg-red-950/80 text-red-400 border-red-800/60',
    },
    {
      title: 'General Traffic Hazard / Roadwork',
      description: 'Active construction zones, single-lane alternating flow, stalled vehicles on the shoulder, or lane-blocking debris on highway corridors.',
      icon: (
        <div className="w-10 h-10 rounded-xl bg-amber-950 border-2 border-amber-500 flex items-center justify-center text-amber-400 shadow-md shadow-amber-500/20">
          <AlertTriangle className="w-5 h-5" />
        </div>
      ),
      badge: 'ROAD HAZARD / WORK',
      badgeColor: 'bg-amber-950/80 text-amber-400 border-amber-800/60',
    },
    {
      title: 'Live Vehicle Marker & Heading',
      description: 'Real-time physical GPS vehicle pointer with rotating heading vector and dynamic radar wave ring.',
      icon: (
        <div className="w-10 h-10 rounded-xl bg-slate-900 border-2 border-cyan-400 flex items-center justify-center text-cyan-300">
          <Navigation className="w-5 h-5 fill-cyan-400 rotate-45" />
        </div>
      ),
      badge: 'GPS POSITION',
      badgeColor: 'bg-cyan-950/80 text-cyan-300 border-cyan-800/60',
    },
    {
      title: 'Electric Purple / Deep Blue Route Line',
      description: 'Physical road-snapped driving corridor. Rendered with deep electric casing (#3A00E5) and vibrant blue-violet neon core (#8A2BE2).',
      icon: (
        <div className="w-10 h-10 rounded-xl bg-[#120038] border-2 border-[#8A2BE2] flex items-center justify-center shadow-md shadow-purple-500/20">
          <div className="w-6 h-2 rounded-full bg-[#8A2BE2] shadow-sm shadow-[#3A00E5]" />
        </div>
      ),
      badge: 'ROUTE CORRIDOR',
      badgeColor: 'bg-purple-950/80 text-purple-300 border-purple-800/60',
    },
  ];

  return (
    <div className="fixed inset-0 z-[10005] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 pointer-events-auto">
      <div className="bg-[#0f1726] border border-slate-700/80 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden max-h-[88vh] text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#121c2e]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Map Legend & Icon Key</h3>
              <p className="text-xs text-slate-400">Lake County Radar & Enforcement Guide</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Legend Items List */}
        <div className="overflow-y-auto flex-1 divide-y divide-slate-800/80 p-3 space-y-2">
          {legendItems.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3.5"
            >
              <div className="shrink-0 mt-0.5">{item.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-sm text-white truncate">{item.title}</h4>
                  <span
                    className={`text-[9px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-md border shrink-0 ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mt-1">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#111927] flex items-center justify-between text-xs text-slate-400">
          <span>70 Active Nodes Monitored in Lake County</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
