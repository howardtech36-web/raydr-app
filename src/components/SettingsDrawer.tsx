import React, { useState, useEffect } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Shield,
  ShieldAlert,
  Moon,
  Sun,
  Zap,
  Gauge,
  Camera,
  AlertTriangle,
  Radio,
  Lock,
  Bookmark,
  Home,
  Briefcase,
  ChevronRight,
  Info,
  Trash2,
  Clock,
  MapPin,
  Ban,
  Car,
  Flame,
  Split,
  MessageSquare,
} from 'lucide-react';
import { AppSettings, LatLng, HazardReport } from '../types/navigation';
import { speakInstruction } from '../utils/geo';
import { getSavedLocations } from '../services/savedLocations';
import { getUserContributions, deleteUserHazardReport } from '../services/hazardReporting';
import { EditSavedPlacesModal } from './EditSavedPlacesModal';
import { MapLegendModal } from './MapLegendModal';
import { MyContributionsModal } from './MyContributionsModal';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  isMotionLocked: boolean;
  currentSpeedMph: number;
  onSelectDestination?: (dest: { name: string; address?: string; coords: LatLng }) => void;
  onOpenMyContributions?: () => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  isMotionLocked,
  currentSpeedMph,
  onSelectDestination,
  onOpenMyContributions,
}) => {
  const [isSavedPlacesModalOpen, setIsSavedPlacesModalOpen] = useState(false);
  const [initialEditType, setInitialEditType] = useState<'home' | 'work' | 'custom' | null>(null);
  const [isLegendModalOpen, setIsLegendModalOpen] = useState(false);
  const [isContributionsModalOpen, setIsContributionsModalOpen] = useState(false);
  const [userReports, setUserReports] = useState<HazardReport[]>(() => getUserContributions());

  useEffect(() => {
    const handleUpdate = () => {
      setUserReports(getUserContributions());
    };
    window.addEventListener('raydr_hazards_updated', handleUpdate);
    return () => window.removeEventListener('raydr_hazards_updated', handleUpdate);
  }, []);

  if (!isOpen) return null;

  const savedList = getSavedLocations();
  const home = savedList.find((p) => p.type === 'home');
  const work = savedList.find((p) => p.type === 'work');
  const customCount = savedList.filter((p) => p.type === 'custom').length;

  const handleTestVoice = () => {
    speakInstruction('Voice guidance is active. In 500 feet, turn right onto US-30 East.', true);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex pointer-events-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Slide-out Drawer Panel */}
      <div className="relative w-full max-w-sm sm:max-w-md h-full bg-[#0d1422] border-r border-slate-800 flex flex-col shadow-2xl text-slate-100 z-10 overflow-y-auto animate-in slide-in-from-left duration-250">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#111927]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 className="font-bold text-base tracking-wide text-white flex items-center gap-2">
                RAYDR <span>SETTINGS</span>
              </h2>
              <p className="text-[11px] text-cyan-400/80 font-mono">Lake County Radar Network</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* In-Motion Safety Guardrail Banner */}
        {isMotionLocked && (
          <div className="m-4 p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold text-amber-300">Driving Safety Lock Active</p>
              <p className="text-amber-200/80 mt-0.5">
                Vehicle is in motion ({currentSpeedMph} MPH). Deep parameter changes are locked to keep your eyes on the road.
              </p>
            </div>
          </div>
        )}

        <div className="p-4 space-y-5 flex-1">
          {/* Voice Guidance Section */}
          <div className="p-4 rounded-2xl bg-[#111927]/90 border border-slate-800/90 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {settings.voiceGuidance ? (
                  <Volume2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <VolumeX className="w-5 h-5 text-slate-400" />
                )}
                <div>
                  <span className="text-sm font-semibold text-white">Voice Guidance</span>
                  <p className="text-xs text-slate-400">Spoken road maneuvers & radar audio alerts</p>
                </div>
              </div>
              <button
                onClick={() => onUpdateSettings({ voiceGuidance: !settings.voiceGuidance })}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  settings.voiceGuidance ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 left-0.5 ${
                    settings.voiceGuidance ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {settings.voiceGuidance && (
              <button
                onClick={handleTestVoice}
                className="w-full py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-xs text-cyan-300 font-medium flex items-center justify-center gap-2 border border-slate-700/60 transition-colors"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Test Voice Synthesizer</span>
              </button>
            )}
          </div>

          {/* Avoidance Sensitivity Slider */}
          <div
            className={`p-4 rounded-2xl bg-[#111927]/90 border border-slate-800/90 space-y-3 ${
              isMotionLocked ? 'opacity-60 pointer-events-none' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-cyan-400" />
                <div>
                  <span className="text-sm font-semibold text-white">Avoidance Sensitivity</span>
                  <p className="text-xs text-slate-400">Camera & speed trap bypass threshold</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold uppercase text-cyan-400 bg-cyan-950/80 border border-cyan-800/50 px-2 py-0.5 rounded-lg">
                {settings.avoidanceSensitivity}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              {(['low', 'balanced', 'high'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => onUpdateSettings({ avoidanceSensitivity: level })}
                  className={`py-2 rounded-xl text-xs font-bold uppercase transition-all border ${
                    settings.avoidanceSensitivity === level
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                      : 'bg-slate-800/70 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {level === 'high' ? 'High Stealth' : level}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {settings.avoidanceSensitivity === 'high'
                ? 'Strictly detours around all FLOCK ALPR cameras and radar traps via quiet township secondary corridors.'
                : settings.avoidanceSensitivity === 'balanced'
                ? 'Balances travel time while routing away from known highway speed traps.'
                : 'Fastest highway route with minimal detour restrictions.'}
            </p>
          </div>

          {/* Premium Membership Toggle */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1b1c2b] to-[#121422] border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Zap className="w-4 h-4 fill-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-amber-300">RAYDR+ Premium</span>
                    <span className="text-[9px] bg-amber-500 text-black font-extrabold px-1.5 rounded-sm">PRO</span>
                  </div>
                  <p className="text-xs text-slate-400">Live ALPR feeds & stealth routing</p>
                </div>
              </div>
              <button
                onClick={() => onUpdateSettings({ isPremium: !settings.isPremium })}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  settings.isPremium ? 'bg-amber-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 left-0.5 ${
                    settings.isPremium ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="text-[11px] text-slate-300/80 space-y-1.5 pt-1 font-mono">
              <div className="flex items-center gap-2">
                <Camera className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>30 Lake County FLOCK ALPR Nodes Unlocked</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Police Ka / Laser Trap Detection Activated</span>
              </div>
            </div>
          </div>

          {/* Saved Destinations Manager Section */}
          <div className="p-4 rounded-2xl bg-[#111927]/90 border border-slate-800/90 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Bookmark className="w-5 h-5 text-cyan-400" />
                <div>
                  <span className="text-sm font-semibold text-white">Saved Destinations</span>
                  <p className="text-xs text-slate-400">Home, Work & Custom Waypoints</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/80 border border-cyan-800/50 px-2 py-0.5 rounded-lg">
                {savedList.length} Places
              </span>
            </div>

            <div className="space-y-1.5 pt-1 text-xs text-slate-300 font-mono">
              {/* Home Row - Clickable & Editable */}
              <div
                onClick={() => {
                  setInitialEditType('home');
                  setIsSavedPlacesModalOpen(true);
                }}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-cyan-500/50 cursor-pointer transition-all group"
                title="Click to edit Home address"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                    <Home className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-white block group-hover:text-cyan-300">Home</span>
                    <span className="text-[11px] text-slate-400 block truncate">
                      {home ? home.address : 'Not Set - Tap to add'}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold text-cyan-400 bg-cyan-950/70 border border-cyan-800/50 px-2 py-0.5 rounded-md shrink-0">
                  Edit
                </span>
              </div>

              {/* Work Row - Clickable & Editable */}
              <div
                onClick={() => {
                  setInitialEditType('work');
                  setIsSavedPlacesModalOpen(true);
                }}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-amber-500/50 cursor-pointer transition-all group"
                title="Click to edit Work address"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Briefcase className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-white block group-hover:text-amber-300">Work</span>
                    <span className="text-[11px] text-slate-400 block truncate">
                      {work ? work.address : 'Not Set - Tap to add'}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-950/70 border border-amber-800/50 px-2 py-0.5 rounded-md shrink-0">
                  Edit
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setInitialEditType(null);
                setIsSavedPlacesModalOpen(true);
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-600/50 hover:to-blue-600/50 text-cyan-300 text-xs font-bold flex items-center justify-center gap-2 border border-cyan-500/40 transition-all"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Edit Saved Places ({customCount} Custom)</span>
              <ChevronRight className="w-3.5 h-3.5 ml-auto" />
            </button>
          </div>

          {/* DEDICATED "MY CONTRIBUTIONS" MODAL ENTRY */}
          <div className="p-4 rounded-2xl bg-[#111927]/90 border border-slate-800/90 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  My Active Reports & Hazards
                </span>
                <span className="text-[11px] text-slate-400">
                  Manage or delete your community reports
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/80 border border-amber-800/50 px-2 py-0.5 rounded-lg">
                {userReports.length} {userReports.length === 1 ? 'Report' : 'Reports'}
              </span>
            </div>

            <button
              onClick={() => {
                if (onOpenMyContributions) {
                  onOpenMyContributions();
                } else {
                  setIsContributionsModalOpen(true);
                }
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600/30 to-cyan-600/30 hover:from-blue-600/50 hover:to-cyan-600/50 text-cyan-300 text-xs font-bold flex items-center justify-center gap-2 border border-cyan-500/40 transition-all shadow-md group"
            >
              <ShieldAlert className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>Open Reports & Hazards Manager ({userReports.length})</span>
              <ChevronRight className="w-3.5 h-3.5 ml-auto text-cyan-400" />
            </button>
          </div>

          {/* Display & Map Layers */}
          <div className="p-4 rounded-2xl bg-[#111927]/90 border border-slate-800/90 space-y-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Map Appearance</span>

            {/* Dark Mode */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2.5">
                {settings.darkMode ? <Moon className="w-4 h-4 text-cyan-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
                <span className="text-xs font-medium text-slate-200">Dark Mode OSM Base</span>
              </div>
              <button
                onClick={() => onUpdateSettings({ darkMode: !settings.darkMode })}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  settings.darkMode ? 'bg-cyan-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-0.5 left-0.5 ${
                    settings.darkMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Speed Units */}
            <div className="flex items-center justify-between py-1 border-t border-slate-800/70 pt-2">
              <div className="flex items-center gap-2.5">
                <Gauge className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-medium text-slate-200">Speedometer Units</span>
              </div>
              <div className="flex rounded-lg overflow-hidden border border-slate-700 text-xs">
                <button
                  onClick={() => onUpdateSettings({ speedUnits: 'mph' })}
                  className={`px-2 py-1 font-bold ${
                    settings.speedUnits === 'mph' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  MPH
                </button>
                <button
                  onClick={() => onUpdateSettings({ speedUnits: 'kmh' })}
                  className={`px-2 py-1 font-bold ${
                    settings.speedUnits === 'kmh' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  KM/H
                </button>
              </div>
            </div>
          </div>

          {/* Map Legend / Icon Key Section */}
          <div className="p-4 rounded-2xl bg-[#111927]/90 border border-slate-800/90 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Info className="w-5 h-5 text-cyan-400" />
                <div>
                  <span className="text-sm font-semibold text-white">Icon Key & Legend</span>
                  <p className="text-xs text-slate-400">Map symbols, cameras & traps guide</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsLegendModalOpen(true)}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-cyan-300 text-xs font-bold flex items-center justify-center gap-2 border border-slate-700/80 transition-all"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Open Map Icon Key & Definitions</span>
              <ChevronRight className="w-3.5 h-3.5 ml-auto" />
            </button>
          </div>

          {/* Lake County Network Telemetry Info */}
          <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800 text-xs space-y-1.5 font-mono text-slate-400">
            <div className="flex justify-between">
              <span>Lake County Active Hazards:</span>
              <span className="text-amber-400 font-bold">40 Reported</span>
            </div>
            <div className="flex justify-between">
              <span>ALPR Highway Intersections:</span>
              <span className="text-cyan-400 font-bold">30 Monitored</span>
            </div>
            <div className="flex justify-between">
              <span>OSRM Road Routing Engine:</span>
              <span className="text-emerald-400 font-bold">Online (100% Snap)</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#111927] text-center">
          <p className="text-[11px] text-slate-500 font-mono">
            RAYDR v1.4 Mobile • Lake County Edition
          </p>
        </div>
      </div>

      {/* Edit Saved Places Modal */}
      <EditSavedPlacesModal
        isOpen={isSavedPlacesModalOpen}
        initialEditingType={initialEditType}
        onClose={() => {
          setIsSavedPlacesModalOpen(false);
          setInitialEditType(null);
        }}
        onSelectPlace={(place) => {
          if (onSelectDestination) {
            onSelectDestination({
              name: place.customLabel || place.name,
              address: place.address,
              coords: place.coords,
            });
            setIsSavedPlacesModalOpen(false);
            setInitialEditType(null);
            onClose();
          }
        }}
      />

      {/* Map Legend & Icon Key Modal */}
      <MapLegendModal
        isOpen={isLegendModalOpen}
        onClose={() => setIsLegendModalOpen(false)}
      />

      {/* My Active Reports & Hazards Dedicated Modal */}
      <MyContributionsModal
        isOpen={isContributionsModalOpen}
        onClose={() => setIsContributionsModalOpen(false)}
      />
    </div>
  );
};
