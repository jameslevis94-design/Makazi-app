import React, { useState, useMemo } from 'react';
import { House } from '../types';
import HouseCard from './HouseCard';
import { Search, SlidersHorizontal, Sparkles, X, Compass, DollarSign, Bed, Bath, Star } from 'lucide-react';

interface SearchViewProps {
  houses: House[];
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onBook: (house: House) => void;
  onView: (house: House) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onBoost?: (house: House) => void;
  onViewOwnerProfile?: (ownerName: string) => void;
}

const CATEGORIES = [
  { id: 'all', label: 'All Categories', keyword: '' },
  { id: 'fremu', label: 'Fremu za biashara', keyword: 'fremu' },
  { id: 'self', label: 'Self room', keyword: 'self' },
  { id: 'chumba', label: 'Chumba kimoja', keyword: 'chumba' },
  { id: 'lodge', label: 'Logde room', keyword: 'lodge' },
  { id: 'kiwanja', label: 'Kiwanja and NHF', keyword: 'kiwanja' },
];

export default function SearchView({
  houses,
  searchQuery,
  onSearchQueryChange,
  onBook,
  onView,
  favorites,
  onToggleFavorite,
  onBoost,
  onViewOwnerProfile,
}: SearchViewProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [maxPrice, setMaxPrice] = useState<number>(5000000);
  const [minBeds, setMinBeds] = useState<number>(0);
  const [minBaths, setMinBaths] = useState<number>(0);
  const [ratingFilter, setRatingFilter] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);

  // Filter listings based on interactive criteria (location, house, or fremu)
  const filteredHouses = useMemo(() => {
    return houses.filter((house) => {
      // 1. Text Search Input matches location, house type, or fremu (commercial space)
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const matchesLocation = house.location.toLowerCase().includes(query);
        const matchesTitle = house.title.toLowerCase().includes(query);
        const matchesDesc = house.description.toLowerCase().includes(query);
        const matchesFeatures = house.features.some((f) => f.toLowerCase().includes(query));
        
        // Swahili and high-efficacy matching for "fremu" synonyms or specific terms
        let matchesFremu = false;
        if (query.includes('fremu') || query.includes('frame') || query.includes('shutter') || query.includes('duka')) {
          matchesFremu = 
            house.title.toLowerCase().includes('fremu') || 
            house.title.toLowerCase().includes('frame') || 
            house.description.toLowerCase().includes('fremu') ||
            house.description.toLowerCase().includes('frame') ||
            house.features.some(f => f.toLowerCase().includes('fremu') || f.toLowerCase().includes('frame'));
        }
        
        if (!(matchesLocation || matchesTitle || matchesDesc || matchesFeatures || matchesFremu)) {
          return false;
        }
      }

      // 2. Category badge
      const activeCat = CATEGORIES.find((c) => c.id === selectedCategory);
      if (activeCat && activeCat.keyword) {
        const hasKeyword = 
          house.features.some((f) => f.toLowerCase().includes(activeCat.keyword)) ||
          house.description.toLowerCase().includes(activeCat.keyword) ||
          house.title.toLowerCase().includes(activeCat.keyword);
        if (!hasKeyword) return false;
      }

      // 3. Price Filter
      if (house.amount > maxPrice) {
        return false;
      }

      // 4. Beds count
      if (minBeds > 0 && house.beds < minBeds) {
        return false;
      }

      // 5. Baths count
      if (minBaths > 0 && house.baths < minBaths) {
        return false;
      }

      // 6. Rating Filter
      if (ratingFilter > 0 && house.rating < ratingFilter) {
        return false;
      }

      return true;
    });
  }, [houses, searchQuery, selectedCategory, maxPrice, minBeds, minBaths, ratingFilter]);

  const resetFilters = () => {
    onSearchQueryChange('');
    setSelectedCategory('all');
    setMaxPrice(5000000);
    setMinBeds(0);
    setMinBaths(0);
    setRatingFilter(0);
  };

  return (
    <div className="space-y-6" id="search-view-container">
      {/* Search Header Hero area */}
      <div className="relative rounded-[32px] overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/70 p-6 sm:p-10 border border-white/10 shadow-2xl backdrop-blur-3xl">
        <div className="absolute top-0 right-0 w-[240px] h-[240px] bg-indigo-500/10 rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute bottom-[-20px] left-[-20px] w-[200px] h-[200px] bg-teal-500/10 rounded-full blur-[50px] pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest leading-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Appwrite Cloud Sync Active</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest leading-none">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Makazi Database Search Engine</span>
            </div>
          </div>
          <h1 className="font-sans font-black text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight leading-none uppercase italic">
            Search Sanctuaries & Fremu
          </h1>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Query our live database for residential <span className="text-white font-semibold">houses</span>, premium <span className="text-indigo-400 font-semibold font-mono">locations</span> (e.g., Kariakoo, Sinza, Malibu), or commercial rental <span className="text-amber-400 font-semibold">frames (fremu ya biashara)</span>.
          </p>

          {/* Prompt-like big search bar */}
          <div className="relative w-full max-w-2xl bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center p-1.5 transition-all focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
            <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
            <input
              type="text"
              placeholder="Search location, house type, or fremu (e.g. Kariakoo, Malibu, chalet, frame)..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="w-full bg-transparent border-0 outline-none text-xs sm:text-sm text-white px-3 py-2.5 focus:ring-0 focus:outline-none placeholder-slate-450"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchQueryChange('')}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors mr-1"
                id="search-input-clear-btn"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
                showFilters || maxPrice < 10000 || minBeds > 0 || minBaths > 0 || ratingFilter > 0
                  ? 'bg-indigo-650 text-white'
                  : 'bg-white/10 text-slate-300 hover:bg-white/15'
              }`}
              id="toggle-filters-btn"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Drawer Filters (if active) */}
      {showFilters && (
        <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-6" id="advanced-filters-panel">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
              <span>Advanced Scope Tuning</span>
            </h3>
            <button
              onClick={resetFilters}
              className="text-[10px] uppercase tracking-widest font-black text-rose-450 hover:text-rose-400 cursor-pointer"
            >
              Reset All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Price Filter range */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-bold block flex justify-between">
                <span>Max Rent</span>
                <span className="text-indigo-400 font-mono">TSh {maxPrice.toLocaleString()}/mo</span>
              </label>
              <input
                type="range"
                min="100000"
                max="5000000"
                step="50000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>TSh 100,000</span>
                <span>TSh 5,000,000</span>
              </div>
            </div>

            {/* Bedrooms count */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-bold block">Minimum Beds</label>
              <div className="flex gap-2">
                {[0, 1, 2, 3, 4].map((beds) => (
                  <button
                    key={beds}
                    onClick={() => setMinBeds(beds)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                      minBeds === beds
                        ? 'bg-indigo-650 border-indigo-500 text-white'
                        : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {beds === 0 ? 'Any' : `${beds}+`}
                  </button>
                ))}
              </div>
            </div>

            {/* Bathrooms count */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-bold block">Minimum Baths</label>
              <div className="flex gap-2">
                {[0, 1, 2, 3].map((baths) => (
                  <button
                    key={baths}
                    onClick={() => setMinBaths(baths)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                      minBaths === baths
                        ? 'bg-indigo-650 border-indigo-500 text-white'
                        : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {baths === 0 ? 'Any' : `${baths}+`}
                  </button>
                ))}
              </div>
            </div>

            {/* Star Rating filter */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-bold block">Minimum Rating</label>
              <div className="flex gap-2">
                {[0, 4.0, 4.5, 4.8].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setRatingFilter(rating)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border flex items-center justify-center gap-1 ${
                      ratingFilter === rating
                        ? 'bg-indigo-650 border-indigo-500 text-white'
                        : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {rating === 0 ? 'Any' : (
                      <>
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span>{rating}+</span>
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category quick selectors */}
      <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none scroll-smooth">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              id={`search-cat-filter-${cat.id}`}
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 py-2.5 px-5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                isActive
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/25'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Grid of properties / Listings results */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs text-slate-400 font-mono uppercase tracking-widest">
            Search Results ({filteredHouses.length})
          </h2>
        </div>

        {filteredHouses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" id="search-grid-layout">
            {filteredHouses.map((house) => (
              <HouseCard
                key={house.id}
                house={house}
                onBook={onBook}
                onView={onView}
                isFavorite={favorites.includes(house.id)}
                onToggleFavorite={onToggleFavorite}
                onBoost={onBoost}
                onViewOwnerProfile={onViewOwnerProfile}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-900/40 border border-slate-800 rounded-[32px] p-8 max-w-md mx-auto" id="search-empty-results">
            <div className="p-4 bg-white/5 border border-white/10 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Search className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="font-sans font-bold text-lg text-white">No Properties Found</h3>
            <p className="text-xs text-slate-400 mt-2">
              We couldn't find any listings matching your search terms. Try loosening your price threshold or bedrooms criteria.
            </p>
            <button
              onClick={resetFilters}
              className="mt-6 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95 cursor-pointer uppercase tracking-wider"
              id="search-reset-all-btn"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
