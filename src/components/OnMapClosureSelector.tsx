import React, { useState } from 'react';
import {
  Ban,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Send,
  X,
  Compass,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { LatLng } from '../types/navigation';
import { addDetailedHazardReport } from '../services/hazardReporting';

interface ClosureBranch {
  id: string;
  name: string;
  direction: string;
  arrowDeg: number;
  offsetLat: number;
  offsetLng: number;
  dx: number;
  dy: number;
}

interface OnMapClosureSelectorProps {
  isOpen: boolean;
  userCoords: LatLng;
  onClose: () => void;
  onClosureBroadcasted: (summary: string) => void;
}

export const OnMapClosureSelector: React.FC<OnMapClosureSelectorProps> = ({
  isOpen,
  userCoords,
  onClose,
  onClosureBroadcasted,
}) => {
  const [selectedBranchId, setSelectedBranchId] = useState<string>('north');
  const [closureScope, setClosureScope] = useState<'single' | 'both'>('single');
  const [roadLabel, setRoadLabel] = useState<string>('Active Corridor / US-231');

  if (!isOpen) return null;

  // 4 directional branches radiating from center
  const branches: ClosureBranch[] = [
    {
      id: 'north',
      name: 'Northbound',
      direction: 'North',
      arrowDeg: 0,
      offsetLat: 0.0018,
      offsetLng: 0,
      dx: 0,
      dy: -90,
    },
    {
      id: 'east',
      name: 'Eastbound',
      direction: 'East',
      arrowDeg: 90,
      offsetLat: 0,
      offsetLng: 0.0024,
      dx: 95,
      dy: 0,
    },
    {
      id: 'south',
      name: 'Southbound',
      direction: 'South',
      arrowDeg: 180,
      offsetLat: -0.0018,
      offsetLng: 0,
      dx: 0,
      dy: 90,
    },
    {
      id: 'west',
      name: 'Westbound',
      direction: 'West',
      arrowDeg: 270,
      offsetLat: 0,
      offsetLng: -0.0024,
      dx: -95,
      dy: 0,
    },
  ];

  const currentBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];

  const handleSendClosure = () => {
    const closedDesc = closureScope === 'both'
      ? `${currentBranch.name} & Opposite (Both directions impassable)`
      : `${currentBranch.name} (Closed to all traffic)`;

    // Broadcast to local hazard database & routing bypass
    addDetailedHazardReport(
      {
        category: 'closure',
        subType: closedDesc,
        direction: closureScope === 'both' ? 'both' : 'current',
        notes: `Waze Road Closure: ${currentBranch.direction} segment blocked. Traffic detour required.`,
      },
      userCoords
    );

    onClosureBroadcasted(`Road Closed: ${roadLabel} (${closedDesc})`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[10001] pointer-events-auto flex flex-col justify-between overflow-hidden animate-in fade-in duration-200">
      {/* Darkened / Dimmed Backdrop darkening inactive surrounding map elements */}
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] pointer-events-none" />

      {/* Radial spotlight around active intersection / vehicle coordinate */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle 180px at 50% 48%, rgba(2, 6, 23, 0.1) 0%, rgba(2, 6, 23, 0.75) 100%)',
        }}
      />

      {/* TOP HEADER / INSTRUCTION BANNER */}
      <div className="relative z-10 w-full max-w-md mx-auto pt-14 px-4">
        <div className="p-3 rounded-2xl bg-[#09111e]/95 border border-red-500/50 shadow-2xl backdrop-blur-md flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-600/30 border border-red-500/60 flex items-center justify-center text-red-400">
              <Ban className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs font-black tracking-wide uppercase text-red-300">
                Interactive Road Closure Mode
              </h3>
              <p className="text-[11px] text-slate-300 font-medium">
                Tap directional arrows on road branches to mark closed directions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CENTER INTERACTIVE ROAD SEGMENT ARROWS OVERLAY (DIRECTLY ON MAP) */}
      <div className="relative z-10 flex-1 flex items-center justify-center pointer-events-none">
        <div className="relative w-72 h-72 flex items-center justify-center pointer-events-auto">
          {/* Center Intersection Node */}
          <div className="w-16 h-16 rounded-full bg-[#0b1322] border-2 border-slate-600 shadow-2xl flex flex-col items-center justify-center select-none z-10">
            <Compass className="w-5 h-5 text-cyan-400 animate-[spin_12s_linear_infinite]" />
            <span className="text-[8px] font-mono font-bold text-slate-300 uppercase mt-0.5">
              Intersection
            </span>
          </div>

          {/* Directional Branches & Arrow Targets */}
          {branches.map((branch) => {
            const isSelected = selectedBranchId === branch.id;
            return (
              <div
                key={branch.id}
                className="absolute flex flex-col items-center justify-center transition-transform duration-200"
                style={{
                  transform: `translate(${branch.dx}px, ${branch.dy}px)`,
                }}
              >
                {/* Branch Target Button */}
                <button
                  onClick={() => setSelectedBranchId(branch.id)}
                  className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer shadow-2xl group ${
                    isSelected
                      ? 'bg-red-600 text-white border-2 border-red-400 ring-4 ring-red-500/30 scale-110 shadow-red-600/50'
                      : 'bg-[#0f172a]/95 text-cyan-300 border-2 border-cyan-400/60 hover:border-cyan-300 hover:scale-105 shadow-cyan-500/20'
                  }`}
                  title={`Mark ${branch.name} segment closed`}
                >
                  {isSelected ? (
                    /* Waze Red No-Entry Overlay Icon */
                    <div className="flex flex-col items-center justify-center">
                      <Ban className="w-6 h-6 text-white stroke-[2.5]" />
                      <span className="text-[7.5px] font-black uppercase tracking-tight text-white leading-none mt-0.5">
                        NO ENTRY
                      </span>
                    </div>
                  ) : (
                    /* Cyan/White Directional Arrow pointing along branch */
                    <div
                      className="flex flex-col items-center justify-center"
                      style={{ transform: `rotate(${branch.arrowDeg}deg)` }}
                    >
                      <ArrowUp className="w-6 h-6 text-white group-hover:text-cyan-300 transition-colors" />
                    </div>
                  )}
                </button>

                {/* Branch Label Badge */}
                <div
                  className={`mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider backdrop-blur-md shadow-md ${
                    isSelected
                      ? 'bg-red-950/90 text-red-200 border border-red-500/60'
                      : 'bg-slate-900/90 text-slate-300 border border-slate-700/80'
                  }`}
                >
                  {branch.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BOTTOM ACTION BAR (WAZE CLOSURE CONFIRMATION) */}
      <div className="relative z-10 w-full max-w-lg mx-auto p-4 pb-6 pointer-events-auto">
        <div className="p-4 rounded-3xl bg-[#09111e]/98 border border-red-500/60 shadow-2xl backdrop-blur-xl text-slate-100 space-y-3.5">
          {/* Segment Details & Active Direction Status */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <h4 className="text-xs font-black uppercase tracking-wide text-red-300">
                  Marked Segment: {currentBranch.name}
                </h4>
              </div>
              <p className="text-sm font-black text-white mt-0.5">{roadLabel}</p>
            </div>
            <div className="flex items-center gap-1 bg-red-950/70 border border-red-800/80 px-2.5 py-1 rounded-xl text-red-300 text-[10px] font-mono font-bold">
              <Ban className="w-3.5 h-3.5" />
              <span>IMPASSABLE</span>
            </div>
          </div>

          {/* Quick Direction Selector Pills */}
          <div className="grid grid-cols-4 gap-1.5">
            {branches.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBranchId(b.id)}
                className={`py-1.5 px-2 rounded-xl text-[10px] font-black uppercase tracking-tight flex items-center justify-center gap-1 transition-all ${
                  selectedBranchId === b.id
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30 border border-red-400'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/70'
                }`}
              >
                <span>{b.direction}</span>
              </button>
            ))}
          </div>

          {/* Scope Toggle: Single Direction vs Both Directions */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
            <span className="text-[11px] text-slate-300 font-semibold">Closure Extent:</span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setClosureScope('single')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors ${
                  closureScope === 'single'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                This Side Only
              </button>
              <button
                onClick={() => setClosureScope('both')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors ${
                  closureScope === 'both'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Both Directions
              </button>
            </div>
          </div>

          {/* Bottom Action Buttons: 'Later' and 'Send' */}
          <div className="flex items-center gap-2.5 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider transition-colors"
            >
              Later
            </button>
            <button
              onClick={handleSendClosure}
              className="flex-[2] py-3 px-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-95 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-600/40 flex items-center justify-center gap-2 border border-red-400/40 transition-all"
            >
              <Send className="w-4 h-4 fill-current" />
              <span>Send Closure</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
