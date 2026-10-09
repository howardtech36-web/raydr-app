import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Home,
  Briefcase,
  Bookmark,
  Trash2,
  Edit2,
  Plus,
  MapPin,
  Check,
  RotateCcw,
  Search,
  Navigation,
} from 'lucide-react';
import { SavedLocation, LatLng } from '../types/navigation';
import {
  getSavedLocations,
  updateSavedDestination,
  deleteSavedDestination,
  resetSavedDestinations,
  saveDestination,
} from '../services/savedLocations';
import { searchLocations, SearchResult } from '../services/nominatim';

interface EditSavedPlacesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlace?: (place: SavedLocation) => void;
  initialEditingType?: 'home' | 'work' | 'custom' | null;
}

export const EditSavedPlacesModal: React.FC<EditSavedPlacesModalProps> = ({
  isOpen,
  onClose,
  onSelectPlace,
  initialEditingType = null,
}) => {
  const [locations, setLocations] = useState<SavedLocation[]>(() => getSavedLocations());

  // Active editing or adding state
  const [editingItem, setEditingItem] = useState<{
    id?: string;
    type: 'home' | 'work' | 'custom';
    customLabel: string;
    name: string;
    address: string;
    coords: LatLng;
  } | null>(null);

  // Address search inside edit modal
  const [addressSearchQuery, setAddressSearchQuery] = useState('');
  const [addressSearchResults, setAddressSearchResults] = useState<SearchResult[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);

  // Debounced address search
  useEffect(() => {
    if (!addressSearchQuery.trim() || addressSearchQuery.length < 3) {
      setAddressSearchResults([]);
      return;
    }

    setIsSearchingAddress(true);
    const handler = setTimeout(async () => {
      const results = await searchLocations(addressSearchQuery);
      setAddressSearchResults(results);
      setIsSearchingAddress(false);
    }, 280);

    return () => clearTimeout(handler);
  }, [addressSearchQuery]);

  // When opened with an initial type (e.g. user tapped "Home" or "Work" in settings)
  useEffect(() => {
    if (!isOpen) {
      setEditingItem(null);
      setAddressSearchQuery('');
      setAddressSearchResults([]);
      return;
    }

    const current = getSavedLocations();
    setLocations(current);

    if (initialEditingType === 'home' || initialEditingType === 'work') {
      const existing = current.find((p) => p.type === initialEditingType);
      if (existing) {
        setEditingItem({
          id: existing.id,
          type: existing.type,
          customLabel: existing.customLabel || existing.name,
          name: existing.name,
          address: existing.address,
          coords: existing.coords,
        });
      } else {
        setEditingItem({
          type: initialEditingType,
          customLabel: initialEditingType === 'home' ? 'Home' : 'Work',
          name: initialEditingType === 'home' ? 'Home' : 'Work',
          address: '',
          coords: { lat: 41.455, lng: -87.35 },
        });
      }
      setAddressSearchQuery('');
    }
  }, [isOpen, initialEditingType]);

  if (!isOpen) return null;

  const refreshList = () => {
    setLocations(getSavedLocations());
  };

  const handleStartEdit = (item: SavedLocation) => {
    setEditingItem({
      id: item.id,
      type: item.type,
      customLabel: item.customLabel || item.name,
      name: item.name,
      address: item.address,
      coords: item.coords,
    });
    setAddressSearchQuery('');
    setAddressSearchResults([]);
  };

  const handleStartAddNew = () => {
    setEditingItem({
      type: 'custom',
      customLabel: '',
      name: '',
      address: '',
      coords: { lat: 41.455, lng: -87.35 },
    });
    setAddressSearchQuery('');
    setAddressSearchResults([]);
  };

  const handleSelectAddressSuggestion = (suggestion: SearchResult) => {
    if (!editingItem) return;
    setEditingItem({
      ...editingItem,
      name: editingItem.type === 'home' ? 'Home' : editingItem.type === 'work' ? 'Work' : suggestion.name,
      customLabel: editingItem.type === 'custom' && !editingItem.customLabel ? suggestion.name : editingItem.customLabel,
      address: suggestion.address || suggestion.name,
      coords: suggestion.coords,
    });
    setAddressSearchQuery('');
    setAddressSearchResults([]);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (!editingItem.address.trim()) return;

    const label = editingItem.type === 'custom' ? (editingItem.customLabel.trim() || 'Custom Place') : (editingItem.type === 'home' ? 'Home' : 'Work');

    saveDestination(
      editingItem.type,
      label,
      editingItem.address.trim(),
      editingItem.coords,
      label
    );

    setEditingItem(null);
    setAddressSearchQuery('');
    setAddressSearchResults([]);
    refreshList();
  };

  const handleDelete = (id: string) => {
    deleteSavedDestination(id);
    refreshList();
  };

  const handleReset = () => {
    resetSavedDestinations();
    refreshList();
  };

  return (
    <div className="fixed inset-0 z-[10002] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 pointer-events-auto">
      <div className="bg-[#0f1726] border border-slate-700/80 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden max-h-[90vh] text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#121c2e]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Saved Destinations</h3>
              <p className="text-xs text-slate-400">Manage Home, Work & Custom Places</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <button
            onClick={handleStartAddNew}
            className="px-3 py-1.5 rounded-xl bg-cyan-600/90 hover:bg-cyan-500 text-white font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Place</span>
          </button>

          <button
            onClick={handleReset}
            className="text-slate-400 hover:text-slate-200 flex items-center gap-1 text-[11px] font-mono transition-colors"
            title="Reset to defaults"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Defaults</span>
          </button>
        </div>

        {/* Active Edit / Add Section with Live Address Search */}
        {editingItem && (
          <form
            onSubmit={handleSave}
            className="p-4 bg-slate-900/95 border-b border-slate-800 space-y-3 animate-in slide-in-from-top-3 duration-150"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                {editingItem.id ? `Edit ${editingItem.customLabel || editingItem.type.toUpperCase()}` : `Add New ${editingItem.type.toUpperCase()}`}
              </span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {editingItem.type}
              </span>
            </div>

            {/* Destination Type Selector */}
            <div className="grid grid-cols-3 gap-2">
              {(['home', 'work', 'custom'] as const).map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() =>
                    setEditingItem({
                      ...editingItem,
                      type: t,
                      customLabel: t === 'home' ? 'Home' : t === 'work' ? 'Work' : editingItem.customLabel,
                      name: t === 'home' ? 'Home' : t === 'work' ? 'Work' : editingItem.name,
                    })
                  }
                  className={`py-1.5 rounded-xl text-xs font-bold capitalize border transition-all ${
                    editingItem.type === t
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-sm'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Custom Label (for custom type) */}
            {editingItem.type === 'custom' && (
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Place Name / Label</label>
                <input
                  type="text"
                  placeholder="e.g. Gym, Doctor, Kids School, Cabin"
                  value={editingItem.customLabel}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      customLabel: e.target.value,
                      name: e.target.value,
                    })
                  }
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>
            )}

            {/* Live Nominatim Address Search Bar */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 block">Search & Select Address</label>
              <div className="relative">
                <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Type street, landmark, or Lake County city..."
                  value={addressSearchQuery}
                  onChange={(e) => setAddressSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                />
                {isSearchingAddress && (
                  <div className="absolute right-3 top-3 w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                )}
              </div>

              {/* Suggestions Dropdown */}
              {addressSearchResults.length > 0 && (
                <div className="max-h-40 overflow-y-auto bg-slate-800/95 border border-slate-700 rounded-xl divide-y divide-slate-750 shadow-xl mt-1">
                  {addressSearchResults.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      onClick={() => handleSelectAddressSuggestion(suggestion)}
                      className="p-2.5 hover:bg-slate-700 cursor-pointer text-xs transition-colors"
                    >
                      <p className="font-semibold text-white truncate">{suggestion.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{suggestion.address}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Current Chosen Physical Address */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Physical Address</label>
              <input
                type="text"
                placeholder="Selected address"
                value={editingItem.address}
                onChange={(e) => setEditingItem({ ...editingItem, address: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                required
              />
            </div>

            {/* Coordinates Display */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400">
              <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-750 truncate">
                Lat: {editingItem.coords.lat.toFixed(5)}
              </div>
              <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-750 truncate">
                Lng: {editingItem.coords.lng.toFixed(5)}
              </div>
            </div>

            {/* Form Action Buttons */}
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-bold text-white text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-600/20"
              >
                <Check className="w-4 h-4" />
                <span>Save Destination</span>
              </button>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs hover:text-white"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Saved Destinations List */}
        <div className="overflow-y-auto flex-1 divide-y divide-slate-800/80 p-3 space-y-2">
          {locations.map((item) => {
            const displayName = item.customLabel || item.name;

            return (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/80 flex items-start gap-3 transition-colors group"
              >
                {/* Type Icon */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    item.type === 'home'
                      ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                      : item.type === 'work'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  }`}
                >
                  {item.type === 'home' ? (
                    <Home className="w-5 h-5" />
                  ) : item.type === 'work' ? (
                    <Briefcase className="w-5 h-5" />
                  ) : (
                    <Bookmark className="w-5 h-5" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm truncate group-hover:text-cyan-300">
                      {displayName}
                    </span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0 ml-2">
                      {item.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{item.address}</p>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 mt-2.5">
                    {onSelectPlace && (
                      <button
                        onClick={() => {
                          onSelectPlace(item);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/40 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Navigation className="w-3 h-3 fill-cyan-300" />
                        <span>Route</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleStartEdit(item)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1 border border-slate-700"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit Address</span>
                    </button>

                    {item.type === 'custom' && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-400 ml-auto transition-colors"
                        title="Delete custom place"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
