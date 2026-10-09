import React, { useState } from 'react';
import {
  Shield,
  Car,
  AlertTriangle,
  Ban,
  Split,
  MessageSquare,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  ArrowUpDown,
  Send,
  Flame,
  Check,
  Compass,
  CornerDownRight,
  Navigation,
} from 'lucide-react';
import { LatLng } from '../types/navigation';
import {
  addDetailedHazardReport,
  MainCategory,
  ReportSubmissionPayload,
} from '../services/hazardReporting';

interface ReportHazardSheetProps {
  isOpen: boolean;
  onClose: () => void;
  userCoords: LatLng;
  onReportSubmitted: (title: string) => void;
  onClosureSegmentSelected?: (segmentDirection: string) => void;
  onRequestOnMapClosure?: () => void;
}

interface CategoryConfig {
  id: MainCategory;
  label: string;
  subLabel: string;
  icon: React.ReactNode;
  colorClass: string;
  borderClass: string;
  bgLightClass: string;
  subOptions?: string[];
}

interface NearbyRoadSegment {
  id: string;
  roadName: string;
  direction: string;
  headingText: string;
  arrowDeg: number;
}

export const ReportHazardSheet: React.FC<ReportHazardSheetProps> = ({
  isOpen,
  onClose,
  userCoords,
  onReportSubmitted,
  onClosureSegmentSelected,
  onRequestOnMapClosure,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<MainCategory | null>(null);
  const [selectedSubType, setSelectedSubType] = useState<string>('');
  const [selectedDirection, setSelectedDirection] = useState<'current' | 'opposite' | 'both'>('current');
  const [mapIssueComment, setMapIssueComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [selectedClosureSegment, setSelectedClosureSegment] = useState<string>('Current Path (Forward)');

  if (!isOpen) return null;

  // Nearby simulated drivable road segments around user coords for Waze-style directional selection
  const nearbySegments: NearbyRoadSegment[] = [
    {
      id: 'fwd-seg',
      roadName: 'Current Road Ahead',
      direction: 'Forward / In-Bound',
      headingText: 'Northbound',
      arrowDeg: 0,
    },
    {
      id: 'opp-seg',
      roadName: 'Opposite Side',
      direction: 'Opposite / Out-Bound',
      headingText: 'Southbound',
      arrowDeg: 180,
    },
    {
      id: 'right-seg',
      roadName: 'Right Intersecting Street',
      direction: 'Cross Street (East)',
      headingText: 'Eastbound Turn',
      arrowDeg: 90,
    },
    {
      id: 'both-seg',
      roadName: 'Both Road Directions',
      direction: 'Full Roadway Cut',
      headingText: 'Closed All Ways',
      arrowDeg: 45,
    },
  ];

  const categories: CategoryConfig[] = [
    {
      id: 'traffic',
      label: 'Traffic',
      subLabel: 'Slowdowns & jams',
      icon: <Car className="w-6 h-6 text-amber-400" />,
      colorClass: 'text-amber-400',
      borderClass: 'border-amber-500/40 hover:border-amber-400',
      bgLightClass: 'bg-amber-500/15',
      subOptions: ['Traffic', 'Heavy', 'Standstill'],
    },
    {
      id: 'police',
      label: 'Police',
      subLabel: 'Traps & radar',
      icon: <Shield className="w-6 h-6 text-blue-400" />,
      colorClass: 'text-blue-400',
      borderClass: 'border-blue-500/40 hover:border-blue-400',
      bgLightClass: 'bg-blue-500/15',
      subOptions: ['Police', 'Mobile camera', 'Hidden', 'Other side'],
    },
    {
      id: 'crash',
      label: 'Crash',
      subLabel: 'Collision & wreck',
      icon: <Flame className="w-6 h-6 text-rose-400" />,
      colorClass: 'text-rose-400',
      borderClass: 'border-rose-500/40 hover:border-rose-400',
      bgLightClass: 'bg-rose-500/15',
      subOptions: ['Crash', 'Pile-up', 'Other side'],
    },
    {
      id: 'hazard',
      label: 'Hazard',
      subLabel: 'Road danger & debris',
      icon: <AlertTriangle className="w-6 h-6 text-yellow-400" />,
      colorClass: 'text-yellow-400',
      borderClass: 'border-yellow-500/40 hover:border-yellow-400',
      bgLightClass: 'bg-yellow-500/15',
      subOptions: [
        'Hazard',
        'Construction',
        'Car on shoulder',
        'Broken traffic light',
        'Pothole',
        'Object',
      ],
    },
    {
      id: 'blocked_lane',
      label: 'Blocked Lane',
      subLabel: 'Obstructed passage',
      icon: <Split className="w-6 h-6 text-orange-400" />,
      colorClass: 'text-orange-400',
      borderClass: 'border-orange-500/40 hover:border-orange-400',
      bgLightClass: 'bg-orange-500/15',
      subOptions: ['Blocked lane', 'Left lane', 'Right lane', 'Center lane'],
    },
    {
      id: 'closure',
      label: 'Closure',
      subLabel: 'Blocked street or ramp',
      icon: <Ban className="w-6 h-6 text-red-400" />,
      colorClass: 'text-red-400',
      borderClass: 'border-red-500/40 hover:border-red-400',
      bgLightClass: 'bg-red-500/15',
      subOptions: ['Forward segment', 'Opposite segment', 'Intersection segment', 'Both directions'],
    },
    {
      id: 'map_issue',
      label: 'Map Issue',
      subLabel: 'Geometry or sign errors',
      icon: <MessageSquare className="w-6 h-6 text-teal-400" />,
      colorClass: 'text-teal-400',
      borderClass: 'border-teal-500/40 hover:border-teal-400',
      bgLightClass: 'bg-teal-500/15',
    },
  ];

  const handleCategorySelect = (cat: CategoryConfig) => {
    if (cat.id === 'closure' && onRequestOnMapClosure) {
      handleResetAndClose();
      onRequestOnMapClosure();
      return;
    }
    setSelectedCategory(cat.id);
    if (cat.id === 'closure') {
      setSelectedSubType('Closure');
      setSelectedClosureSegment('Current Road Ahead');
    } else if (cat.subOptions && cat.subOptions.length > 0) {
      setSelectedSubType(cat.subOptions[0]);
    } else {
      setSelectedSubType(cat.label);
    }
  };

  const handleBackToMain = () => {
    setSelectedCategory(null);
    setSelectedSubType('');
    setMapIssueComment('');
  };

  const handleSelectClosureSegment = (seg: NearbyRoadSegment) => {
    setSelectedClosureSegment(seg.roadName);
    setSelectedSubType(`Closed: ${seg.direction}`);
    if (onClosureSegmentSelected) {
      onClosureSegmentSelected(seg.direction);
    }
  };

  const handleSubmit = (overrideSubType?: string) => {
    if (!selectedCategory) return;
    setIsSubmitting(true);

    const sub = overrideSubType || selectedSubType;
    const payload: ReportSubmissionPayload = {
      category: selectedCategory,
      subType: sub || (selectedCategory === 'closure' ? selectedClosureSegment : 'Report'),
      direction: selectedDirection,
      notes: selectedCategory === 'map_issue'
        ? mapIssueComment
        : selectedCategory === 'closure'
        ? `Segment closed: ${selectedClosureSegment}`
        : undefined,
    };

    addDetailedHazardReport(payload, userCoords);
    onReportSubmitted(`${selectedCategory.toUpperCase()}: ${sub}`);
    setIsSubmitting(false);
    handleResetAndClose();
  };

  const handleResetAndClose = () => {
    setSelectedCategory(null);
    setSelectedSubType('');
    setMapIssueComment('');
    onClose();
  };

  const activeCatConfig = categories.find((c) => c.id === selectedCategory);

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col justify-end pointer-events-auto animate-in fade-in duration-150">
      {/* Semi-transparent backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleResetAndClose}
      />

      {/* Main Bottom Sheet Container */}
      <div className="relative w-full max-w-lg mx-auto bg-[#0d1522]/98 border-t border-slate-700/80 rounded-t-[32px] p-5 pb-8 shadow-2xl text-slate-100 z-10 animate-in slide-in-from-bottom duration-200">
        {/* Grab Handle */}
        <div className="w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto mb-4" />

        {/* STAGE 1: MAIN 7 CATEGORIES ("What do you see?") */}
        {!selectedCategory ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-black text-white tracking-wide">
                  What do you see?
                </h3>
                <p className="text-xs text-slate-400">
                  Select a road event to alert other drivers in real-time
                </p>
              </div>
              <button
                onClick={handleResetAndClose}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center active:scale-95 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 7 Main Waze Category Tiles */}
            <div className="grid grid-cols-2 gap-2.5 max-h-[62vh] overflow-y-auto pr-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat)}
                  className={`p-3.5 rounded-2xl bg-slate-900/70 border ${cat.borderClass} active:scale-[0.98] transition-all flex items-center gap-3 text-left group shadow-lg`}
                >
                  <div
                    className={`w-11 h-11 rounded-xl ${cat.bgLightClass} border border-slate-700/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}
                  >
                    {cat.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-bold text-white block truncate leading-snug">
                      {cat.label}
                    </span>
                    <span className="text-[11px] text-slate-400 block truncate">
                      {cat.subLabel}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 shrink-0" />
                </button>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>GPS: {userCoords.lat.toFixed(4)}, {userCoords.lng.toFixed(4)}</span>
              <button
                onClick={handleResetAndClose}
                className="font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* STAGE 2: SUB-CATEGORY DRILL-DOWN & CONFIRMATION */
          /* ============================================================== */
          <div>
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handleBackToMain}
                className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 py-1"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <h3 className="text-base font-black text-white tracking-wide flex items-center gap-2">
                {activeCatConfig?.icon}
                <span>{activeCatConfig?.label}</span>
              </h3>
              <button
                onClick={handleResetAndClose}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Sub-Option Selection Pills / Cards */}
            {selectedCategory === 'map_issue' ? (
              /* Map Issue Comment Box */
              <div className="space-y-3 mb-4">
                <label className="text-xs font-bold text-slate-300">
                  Describe the map issue or road change:
                </label>
                <textarea
                  value={mapIssueComment}
                  onChange={(e) => setMapIssueComment(e.target.value)}
                  placeholder="e.g. Street is now one-way, new roundabout opened, missing turn lane..."
                  rows={3}
                  className="w-full rounded-2xl bg-slate-900 border border-slate-700 p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
            ) : selectedCategory === 'closure' ? (
              /* Waze-Style Interactive Road Closure Segment & Direction Selector */
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-200 font-bold flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-red-400" />
                    <span>Tap road segment arrow to mark closure:</span>
                  </p>
                  <span className="text-[10px] font-mono text-red-300 bg-red-950/60 px-2 py-0.5 rounded border border-red-800/60 font-bold uppercase">
                    NO ENTRY ZONE
                  </span>
                </div>

                {/* Interactive directional segment targets */}
                <div className="grid grid-cols-2 gap-2">
                  {nearbySegments.map((seg) => {
                    const isSelected = selectedClosureSegment === seg.roadName;
                    return (
                      <button
                        key={seg.id}
                        onClick={() => handleSelectClosureSegment(seg)}
                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all group ${
                          isSelected
                            ? 'bg-red-950/70 border-red-500 ring-1 ring-red-400 shadow-lg shadow-red-600/25'
                            : 'bg-slate-900/60 border-slate-700/80 hover:border-slate-500 hover:bg-slate-900/90'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-2">
                          {/* Stylized Directional Arrow Button matching Waze Closure Overlay */}
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform ${
                              isSelected
                                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                                : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700'
                            }`}
                            style={{ transform: `rotate(${seg.arrowDeg}deg)` }}
                          >
                            <Navigation className="w-4 h-4 fill-current" />
                          </div>
                          {isSelected && (
                            <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-ping" />
                          )}
                        </div>

                        <div>
                          <span className="text-xs font-black text-white block leading-snug">
                            {seg.roadName}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400 block mt-0.5">
                            {seg.direction} • {seg.headingText}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Candy-Stripe Closure Confirmation Banner */}
                <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/40 flex items-center gap-2 text-[11px] text-red-200">
                  <Ban className="w-4 h-4 text-red-400 shrink-0" />
                  <span>
                    Selected: <strong className="text-white">{selectedClosureSegment}</strong> marked impassable with red striped barricade pin.
                  </span>
                </div>
              </div>
            ) : (
              /* Standard Sub-Option Tiles (Police, Traffic, Crash, Hazard, Blocked Lane) */
              <div className="space-y-3 mb-4">
                <p className="text-xs text-slate-300 font-semibold">
                  Select specific type:
                </p>
                <div className="grid grid-cols-2 gap-2 max-h-[46vh] overflow-y-auto pr-1">
                  {activeCatConfig?.subOptions?.map((sub) => {
                    const isSelected = selectedSubType === sub;
                    return (
                      <button
                        key={sub}
                        onClick={() => setSelectedSubType(sub)}
                        className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-lg shadow-cyan-500/10'
                            : 'bg-slate-900/60 border-slate-700/80 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        <span className="text-xs font-bold leading-snug">{sub}</span>
                        {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>

                {/* Road Direction Pills (if applicable to Police, Crash, or Hazard) */}
                {(selectedCategory === 'police' ||
                  selectedCategory === 'crash' ||
                  selectedCategory === 'hazard') && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-[11px] text-slate-400 font-semibold block mb-1.5">
                      Direction:
                    </span>
                    <div className="flex gap-2">
                      {[
                        { id: 'current', label: 'My side' },
                        { id: 'opposite', label: 'Other side' },
                        { id: 'both', label: 'Both sides' },
                      ].map((dir) => (
                        <button
                          key={dir.id}
                          onClick={() => setSelectedDirection(dir.id as any)}
                          className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold border transition-colors ${
                            selectedDirection === dir.id
                              ? 'bg-slate-700 border-cyan-400 text-cyan-300'
                              : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {dir.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Actions: Cancel & Waze-Style Report Button */}
            <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={handleResetAndClose}
                className="flex-1 py-3 px-4 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-sm font-bold active:scale-98 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSubmit()}
                disabled={isSubmitting || (selectedCategory === 'map_issue' && !mapIssueComment.trim())}
                className="flex-[2] py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-black shadow-lg shadow-cyan-500/25 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {selectedCategory === 'map_issue' ? (
                  <>
                    <Send className="w-4 h-4" /> Send Report
                  </>
                ) : selectedCategory === 'closure' ? (
                  <>
                    <Ban className="w-4 h-4" /> Report Road Closure
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Report {selectedSubType || activeCatConfig?.label}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
