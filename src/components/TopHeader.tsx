import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Search,
  Moon,
  Sun,
  Zap,
  X,
  MapPin,
  Home,
  Briefcase,
  Bookmark,
  Plus,
  BookmarkPlus,
  Check,
} from 'lucide-react';
import { SearchResult, searchLocations } from '../services/nominatim';
import { LatLng, SavedLocation } from '../types/navigation';
import {
  getSavedLocations,
  saveDestination,
} from '../services/savedLocations';
import { EditSavedPlacesModal } from './EditSavedPlacesModal';

interface TopHeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  isPremium: boolean;
  onTogglePremium: () => void;
  onOpenSettings: () => void;
  onSelectDestination: (dest: { name: string; address?: string; coords: LatLng }) => void;
  isNavigating: boolean;
  isMotionLocked: boolean;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  darkMode,
  onToggleDarkMode,
  isPremium,
  onTogglePremium,
  onOpenSettings,
  onSelectDestination,
  isNavigating,
  isMotionLocked,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpenSearch, setIsOpenSearch] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Saved locations state
  const [savedPlaces, setSavedPlaces] = useState<SavedLocation[]>(() => getSavedLocations());
  const [isEditSavedModalOpen, setIsEditSavedModalOpen] = useState(false);
  const [savingTarget, setSavingTarget] = useState<SearchResult | null>(null);
  const [customSaveName, setCustomSaveName] = useState('');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Reload saved places on window events
  useEffect(() => {
    const handleUpdate = () => {
      setSavedPlaces(getSavedLocations());
    };
    window.addEventListener('raydr_saved_locations_updated', handleUpdate);
    return () => window.removeEventListener('raydr_saved_locations_updated', handleUpdate);
  }, []);

  // Debounced geocoding search with clean address sanitization
  useEffect(() => {
    if (!isOpenSearch) return;

    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    const handler = setTimeout(async () => {
      const res = await searchLocations(searchQuery);
      setResults(res);
      setIsLoading(false);
    }, 280);

    return () => clearTimeout(handler);
  }, [searchQuery, isOpenSearch]);

  const handleSelectResult = (item: SearchResult) => {
    onSelectDestination({ name: item.name, address: item.address, coords: item.coords });
    setIsOpenSearch(false);
    setSearchQuery('');
  };

  const handleSelectSavedPlace = (place: SavedLocation) => {
    const displayName = place.customLabel || place.name;
    onSelectDestination({ name: displayName, address: place.address, coords: place.coords });
    setIsOpenSearch(false);
    setSearchQuery('');
  };

  const handleSaveAs = (item: SearchResult, type: 'home' | 'work' | 'custom') => {
    if (type === 'custom' && !customSaveName.trim()) {
      saveDestination('custom', item.name, item.address, item.coords, item.name);
    } else {
      saveDestination(type, item.name, item.address, item.coords, customSaveName.trim() || item.name);
    }
    setSavingTarget(null);
    setCustomSaveName('');
    setSaveSuccessMessage(`Saved to ${type === 'custom' ? 'Favorites' : type.toUpperCase()}!`);
    setTimeout(() => setSaveSuccessMessage(null), 2500);
  };

  // If currently navigating in 3D mode, display compact navigation pills
  if (isNavigating) {
    return (
      <header className="absolute top-3 right-3 z-[9999] flex items-center gap-2 pointer-events-auto">
        <button
          onClick={onTogglePremium}
          className={`px-2.5 py-1.5 rounded-full text-xs font-bold tracking-wider flex items-center gap-1 shadow-lg backdrop-blur-md border transition-all ${
            isPremium
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-slate-900/80 text-slate-400 border-slate-700/50'
          }`}
          title="Toggle RAYDR+ Mode"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>{isPremium ? 'PRO ACTIVE' : 'PRO'}</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="w-10 h-10 rounded-full bg-slate-900/90 text-white flex items-center justify-center shadow-xl border border-slate-700/60 active:scale-95 transition-transform"
          aria-label="Open Navigation Settings"
        >
          <Menu className="w-5 h-5 text-slate-200" />
        </button>
      </header>
    );
  }

  const homePlace = savedPlaces.find((p) => p.type === 'home');
  const workPlace = savedPlaces.find((p) => p.type === 'work');
  const customPlaces = savedPlaces.filter((p) => p.type === 'custom');

  return (
    <>
      <header className="absolute top-3 left-3 right-3 z-[9999] flex flex-col pointer-events-none">
        {/* Main Bar */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Hamburger Menu Button */}
          <button
            onClick={onOpenSettings}
            className="w-11 h-11 shrink-0 rounded-2xl bg-[#111927]/95 text-white flex items-center justify-center shadow-xl border border-slate-700/50 hover:bg-slate-800 active:scale-95 transition-all"
            aria-label="Settings and Menu"
          >
            <Menu className="w-5 h-5 text-cyan-400" />
          </button>

          {/* Search Bar Input */}
          <div className="relative flex-1">
            <div
              onClick={() => {
                setIsOpenSearch(true);
                setTimeout(() => searchInputRef.current?.focus(), 100);
              }}
              className="h-11 px-3.5 rounded-2xl bg-[#111927]/95 backdrop-blur-md border border-slate-700/60 shadow-xl flex items-center gap-2.5 cursor-pointer hover:border-cyan-500/50 transition-all text-slate-300 group"
            >
              <Search className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform shrink-0" />
              <span className="text-sm font-medium text-slate-300/90 truncate">
                {searchQuery ? searchQuery : 'Where to in Lake County?'}
              </span>
              <span className="ml-auto text-[10px] font-semibold text-cyan-400/80 bg-cyan-950/70 border border-cyan-800/40 px-1.5 py-0.5 rounded-md">
                IN-65/30
              </span>
            </div>
          </div>

          {/* Premium Toggle Button */}
          <button
            onClick={onTogglePremium}
            className={`h-11 px-3 rounded-2xl flex items-center gap-1.5 text-xs font-bold tracking-wider shadow-xl border transition-all ${
              isPremium
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-amber-500/10'
                : 'bg-[#111927]/95 text-slate-400 border-slate-700/60 hover:text-slate-200'
            }`}
            title="RAYDR+ Radar & Stealth Protection"
          >
            <Zap className={`w-4 h-4 ${isPremium ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} />
            <span className="hidden sm:inline font-mono">{isPremium ? 'RAYDR+' : 'PRO'}</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleDarkMode}
            className="w-11 h-11 shrink-0 rounded-2xl bg-[#111927]/95 text-slate-300 flex items-center justify-center shadow-xl border border-slate-700/60 hover:text-cyan-400 active:scale-95 transition-all"
            aria-label="Toggle Dark / Light Map Theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-indigo-300" />}
          </button>
        </div>

        {/* Geocoding Search Overlay Modal */}
        {isOpenSearch && (
          <div className="fixed inset-0 z-[10000] bg-black/75 backdrop-blur-sm pointer-events-auto flex flex-col p-4 animate-in fade-in duration-200">
            <div className="max-w-lg w-full mx-auto flex flex-col bg-[#111927] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden max-h-[88vh]">
              {/* Search Input Bar */}
              <div className="p-4 border-b border-slate-800 flex items-center gap-3">
                <Search className="w-5 h-5 text-cyan-400 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Lake County destination or address..."
                  className="w-full bg-transparent text-white text-base placeholder-slate-400 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpenSearch(false)}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
              </div>

              {/* Toast Notification */}
              {saveSuccessMessage && (
                <div className="px-4 py-2 bg-emerald-950/80 border-b border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-3.5 h-3.5" />
                  <span>{saveSuccessMessage}</span>
                </div>
              )}

              {/* SAVED DESTINATIONS QUICK-TAP SHORTCUT BADGES */}
              <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider shrink-0">
                  Saved:
                </span>

                {homePlace && (
                  <button
                    onClick={() => handleSelectSavedPlace(homePlace)}
                    className="px-2.5 py-1 rounded-full bg-cyan-950/70 border border-cyan-800/60 text-cyan-300 hover:bg-cyan-900/80 flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Home className="w-3 h-3 text-cyan-400" />
                    <span>Home</span>
                  </button>
                )}

                {workPlace && (
                  <button
                    onClick={() => handleSelectSavedPlace(workPlace)}
                    className="px-2.5 py-1 rounded-full bg-amber-950/70 border border-amber-800/60 text-amber-300 hover:bg-amber-900/80 flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Briefcase className="w-3 h-3 text-amber-400" />
                    <span>Work</span>
                  </button>
                )}

                {customPlaces.map((cp) => (
                  <button
                    key={cp.id}
                    onClick={() => handleSelectSavedPlace(cp)}
                    className="px-2.5 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-700 flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Bookmark className="w-3 h-3 text-emerald-400" />
                    <span>{cp.customLabel || cp.name}</span>
                  </button>
                ))}

                <button
                  onClick={() => setIsEditSavedModalOpen(true)}
                  className="px-2 py-1 rounded-full bg-slate-800 text-slate-400 hover:text-cyan-300 text-[11px] font-semibold border border-slate-700/60 whitespace-nowrap ml-auto"
                >
                  Manage
                </button>
              </div>

              {/* Quick Filter Tag Chips */}
              <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-800/60 flex items-center gap-2 overflow-x-auto text-xs">
                <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider shrink-0">
                  Presets:
                </span>
                <button
                  onClick={() => setSearchQuery('Crown Point Square')}
                  className="px-2 py-0.5 rounded-md bg-slate-800/80 text-cyan-300 border border-slate-700 text-[11px] whitespace-nowrap"
                >
                  Crown Point
                </button>
                <button
                  onClick={() => setSearchQuery('Southlake Mall')}
                  className="px-2 py-0.5 rounded-md bg-slate-800/80 text-cyan-300 border border-slate-700 text-[11px] whitespace-nowrap"
                >
                  US-30
                </button>
                <button
                  onClick={() => setSearchQuery('Schererville Crossroads')}
                  className="px-2 py-0.5 rounded-md bg-slate-800/80 text-cyan-300 border border-slate-700 text-[11px] whitespace-nowrap"
                >
                  Schererville
                </button>
                <button
                  onClick={() => setSearchQuery('Munster')}
                  className="px-2 py-0.5 rounded-md bg-slate-800/80 text-cyan-300 border border-slate-700 text-[11px] whitespace-nowrap"
                >
                  Munster
                </button>
              </div>

              {/* Results List */}
              <div className="overflow-y-auto flex-1 divide-y divide-slate-800/60 p-2">
                {isLoading && (
                  <div className="py-8 flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
                    <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                    <span>Searching sanitized address & Lake County nodes...</span>
                  </div>
                )}

                {!isLoading && searchQuery.trim() && results.length === 0 && (
                  <div className="py-10 text-center text-slate-400 text-sm">
                    No results for this query. Try a nearby Lake County street or city.
                  </div>
                )}

                {!isLoading && !searchQuery.trim() && (
                  <div className="p-4 space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Saved Quick Destinations
                    </span>
                    <div className="space-y-1.5">
                      {savedPlaces.map((sp) => (
                        <div
                          key={sp.id}
                          onClick={() => handleSelectSavedPlace(sp)}
                          className="p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 flex items-center justify-between cursor-pointer group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400 shrink-0">
                              {sp.type === 'home' ? (
                                <Home className="w-4 h-4" />
                              ) : sp.type === 'work' ? (
                                <Briefcase className="w-4 h-4 text-amber-400" />
                              ) : (
                                <Bookmark className="w-4 h-4 text-emerald-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white group-hover:text-cyan-300 truncate">
                                {sp.customLabel || sp.name}
                              </p>
                              <p className="text-xs text-slate-400 truncate">{sp.address}</p>
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-cyan-400 ml-2 shrink-0">
                            Route →
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!isLoading &&
                  results.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl hover:bg-slate-800/80 flex items-start justify-between gap-3 transition-colors group"
                    >
                      {/* Left: Tap to navigate */}
                      <div
                        onClick={() => handleSelectResult(item)}
                        className="flex items-start gap-3 flex-1 min-w-0 cursor-pointer"
                      >
                        <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-800/50 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform shrink-0 mt-0.5">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white text-sm group-hover:text-cyan-300 truncate">
                              {item.name}
                            </span>
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 ml-2 shrink-0">
                              {item.category}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 truncate mt-0.5">{item.address}</p>
                        </div>
                      </div>

                      {/* Right: Save as... button */}
                      <div className="relative shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSavingTarget(savingTarget?.id === item.id ? null : item);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-cyan-950 text-cyan-400 text-xs font-semibold border border-slate-700/80 flex items-center gap-1 transition-all"
                          title="Save this place"
                        >
                          <BookmarkPlus className="w-3.5 h-3.5" />
                          <span>Save as</span>
                        </button>

                        {/* Save As Popup Menu */}
                        {savingTarget?.id === item.id && (
                          <div className="absolute right-0 top-10 z-[10010] w-48 bg-[#121c2e] border border-slate-700 rounded-2xl shadow-2xl p-2 space-y-1 animate-in zoom-in-95 duration-150">
                            <button
                              onClick={() => handleSaveAs(item, 'home')}
                              className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-medium text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                            >
                              <Home className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Save as Home</span>
                            </button>

                            <button
                              onClick={() => handleSaveAs(item, 'work')}
                              className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-medium text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                            >
                              <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                              <span>Save as Work</span>
                            </button>

                            <div className="pt-1 border-t border-slate-800">
                              <input
                                type="text"
                                placeholder="Custom label (e.g. Gym)"
                                value={customSaveName}
                                onChange={(e) => setCustomSaveName(e.target.value)}
                                className="w-full p-1.5 rounded-md bg-slate-800 text-white text-xs border border-slate-700 focus:outline-none mb-1.5"
                              />
                              <button
                                onClick={() => handleSaveAs(item, 'custom')}
                                className="w-full py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                              >
                                Save Custom
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Edit Saved Places Modal */}
      <EditSavedPlacesModal
        isOpen={isEditSavedModalOpen}
        onClose={() => setIsEditSavedModalOpen(false)}
        onSelectPlace={(place) => {
          handleSelectSavedPlace(place);
          setIsEditSavedModalOpen(false);
        }}
      />
    </>
  );
};
