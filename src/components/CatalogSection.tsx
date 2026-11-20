import React, { useMemo } from 'react';
import { Search, Box, ArrowUpDown, Check, Plus, Bookmark } from 'lucide-react';
import { BRANDS, CATEGORY_OPTIONS, type CarSpec } from '../data/cars';
import { CarImage } from './CarImage';

interface CatalogSectionProps {
  cars: CarSpec[];
  selectedBrand: string;
  onSelectBrand: (brand: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  selectedFuel: string;
  onFuelChange: (fuel: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  showGarageOnly: boolean;
  onToggleGarageOnly: (next: boolean) => void;
  favoriteIds: string[];
  onToggleFavorite: (car: CarSpec) => void;
  compareIds: string[];
  onToggleCompare: (car: CarSpec) => void;
  onOpenDetails: (car: CarSpec) => void;
  onOpenInStudio: (car: CarSpec) => void;
}

export const CatalogSection: React.FC<CatalogSectionProps> = ({
  cars,
  selectedBrand,
  onSelectBrand,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedFuel,
  onFuelChange,
  sortBy,
  onSortChange,
  showGarageOnly,
  onToggleGarageOnly,
  favoriteIds,
  onToggleFavorite,
  compareIds,
  onToggleCompare,
  onOpenDetails,
  onOpenInStudio,
}) => {
  const filteredCars = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const list = cars.filter((car) => {
      const matchGarage = !showGarageOnly || favoriteIds.includes(car.id);
      const matchBrand = selectedBrand === 'All' || car.brand === selectedBrand;
      const matchCategory =
        selectedCategory === 'All' ||
        car.type.toLowerCase().includes(selectedCategory.toLowerCase());
      const matchFuel =
        selectedFuel === 'All' ||
        car.fuel.toLowerCase().includes(selectedFuel.toLowerCase());
      const matchSearch =
        !query ||
        `${car.brand} ${car.model} ${car.type} ${car.engine} ${car.fuel}`
          .toLowerCase()
          .includes(query);
      return matchGarage && matchBrand && matchCategory && matchFuel && matchSearch;
    });

    if (sortBy === 'name') {
      return [...list].sort((a, b) =>
        `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`),
      );
    }
    if (sortBy === 'power') {
      return [...list].sort((a, b) => b.hp - a.hp);
    }
    if (sortBy === 'speed') {
      return [...list].sort((a, b) => b.top - a.top);
    }
    return list;
  }, [
    cars,
    showGarageOnly,
    favoriteIds,
    selectedBrand,
    selectedCategory,
    selectedFuel,
    searchQuery,
    sortBy,
  ]);

  return (
    <section id="catalog" className="py-14 border-t border-white/8">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-medium tracking-wider text-[#d6b45d] mb-2">
              Global Vehicle Directory
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              Global Car Catalog
            </h2>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => onToggleGarageOnly(!showGarageOnly)}
              className={`h-9 px-3.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                showGarageOnly
                  ? 'bg-[#d6b45d] text-[#090b10] border-[#d6b45d]'
                  : 'bg-[#12161f] text-[#d1d5df] border-white/10 hover:border-[#d6b45d]/60'
              }`}
            >
              <Bookmark
                className="w-3.5 h-3.5"
                fill={showGarageOnly ? 'currentColor' : 'none'}
                aria-hidden="true"
              />
              <span>Saved Garage ({favoriteIds.length})</span>
            </button>
            <p className="text-sm text-[#a7adba] font-mono-tabular">
              Showing {filteredCars.length} of {cars.length} vehicles
            </p>
          </div>
        </div>

        {/* Brand Filter Strip */}
        <div
          id="brands"
          className="flex items-center gap-2 overflow-x-auto pb-3 mb-5 scrollbar-none"
          role="tablist"
          aria-label="Filter vehicles by brand"
        >
          {BRANDS.map((brand) => {
            const active = selectedBrand === brand;
            return (
              <button
                key={brand}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onSelectBrand(brand)}
                className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6b45d] ${
                  active
                    ? 'bg-[#d6b45d] text-[#090b10] border-[#d6b45d]'
                    : 'bg-[#12161f] text-[#d1d5df] border-white/10 hover:border-[#d6b45d]/60 hover:text-white'
                }`}
              >
                {brand}
              </button>
            );
          })}
        </div>

        {/* Search & Filter Toolbar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-8">
          <div className="md:col-span-5 relative">
            <Search
              className="w-4 h-4 text-[#8c93a3] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="search"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search brand, model, engine, or category..."
              aria-label="Search vehicles"
              className="w-full h-11 pl-10 pr-4 bg-[#12161f] border border-white/10 rounded-lg text-sm text-white placeholder:text-[#7f8798] focus:outline-none focus:border-[#d6b45d]"
            />
          </div>

          <div className="md:col-span-3">
            <select
              id="typeFilter"
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              aria-label="Filter by vehicle category"
              className="w-full h-11 px-3.5 bg-[#12161f] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#d6b45d] cursor-pointer"
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All categories' : cat}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={selectedFuel}
              onChange={(e) => onFuelChange(e.target.value)}
              aria-label="Filter by powertrain fuel"
              className="w-full h-11 px-3.5 bg-[#12161f] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#d6b45d] cursor-pointer"
            >
              <option value="All">All powertrains</option>
              <option value="Petrol">Petrol</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Electric">Electric</option>
              <option value="Diesel">Diesel</option>
            </select>
          </div>

          <div className="md:col-span-2 relative">
            <ArrowUpDown
              className="w-3.5 h-3.5 text-[#8c93a3] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              aria-label="Sort vehicles"
              className="w-full h-11 pl-9 pr-3 bg-[#12161f] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#d6b45d] cursor-pointer"
            >
              <option value="default">Default order</option>
              <option value="name">Name A–Z</option>
              <option value="power">Highest HP</option>
              <option value="speed">Top speed</option>
            </select>
          </div>
        </div>

        {/* Vehicle Cards Grid */}
        {filteredCars.length === 0 ? (
          <div className="bg-[#12161f] border border-white/10 rounded-xl p-12 text-center">
            <p className="text-base font-medium text-white mb-2">
              No vehicles match your current filters
            </p>
            <p className="text-sm text-[#a7adba] mb-5">
              Try clearing the search query or switching back to all brands and categories.
            </p>
            <button
              type="button"
              onClick={() => {
                onToggleGarageOnly(false);
                onSelectBrand('All');
                onSearchChange('');
                onCategoryChange('All');
                onFuelChange('All');
              }}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#d6b45d] text-[#090b10] hover:bg-[#e2c26d] transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCars.map((car) => {
              const isCompared = compareIds.includes(car.id);
              const isFavorite = favoriteIds.includes(car.id);
              return (
                <article
                  key={car.id}
                  className="group bg-[#12161f] border border-white/8 rounded-xl overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5 hover:border-[#d6b45d]/50"
                >
                  {/* Studio Vehicle Visual */}
                  <div className="relative aspect-video w-full overflow-hidden bg-[#0e1219] border-b border-white/6">
                    <CarImage
                      car={car}
                      className="transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(car)}
                      title={
                        isFavorite
                          ? `Remove ${car.brand} ${car.model} from Garage`
                          : `Save ${car.brand} ${car.model} to Garage`
                      }
                      aria-label={
                        isFavorite ? 'Remove from saved garage' : 'Save to garage'
                      }
                      className={`absolute top-3 left-3 p-1.5 rounded-md border transition-colors cursor-pointer ${
                        isFavorite
                          ? 'bg-[#d6b45d] border-[#d6b45d] text-[#090b10]'
                          : 'bg-[#090b10]/85 border-white/10 text-[#d1d5df] hover:text-[#d6b45d] hover:border-[#d6b45d]/50'
                      }`}
                    >
                      <Bookmark
                        className="w-3.5 h-3.5"
                        fill={isFavorite ? 'currentColor' : 'none'}
                        aria-hidden="true"
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenInStudio(car)}
                      title={`Load ${car.brand} ${car.model} in 3D Studio`}
                      className="absolute top-3 right-3 px-2.5 py-1.5 rounded-md bg-[#090b10]/85 border border-white/10 text-[11px] font-medium text-[#d1d5df] hover:text-[#d6b45d] hover:border-[#d6b45d]/50 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <Box className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>3D View</span>
                    </button>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col">
                    {/* Clean unboxed metadata */}
                    <div className="flex items-center gap-2 text-xs text-[#d6b45d] font-medium mb-1.5">
                      <span>{car.brand}</span>
                      <span aria-hidden="true" className="text-white/30">
                        ·
                      </span>
                      <span className="text-[#a7adba] font-mono-tabular">
                        {car.year}
                      </span>
                      <span aria-hidden="true" className="text-white/30">
                        ·
                      </span>
                      <span className="text-[#a7adba]">{car.type}</span>
                    </div>

                    <h3 className="text-lg font-semibold text-white tracking-tight mb-2">
                      {car.model}
                    </h3>

                    <p className="text-sm text-[#a7adba] leading-relaxed line-clamp-2 mb-4 flex-1">
                      {car.description}
                    </p>

                    {/* Tabular Spec Row */}
                    <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-white/8 mb-4 text-xs">
                      <div>
                        <span className="block text-[#808797] mb-0.5">Power</span>
                        <span className="font-mono-tabular font-medium text-white">
                          {car.hp} HP
                        </span>
                      </div>
                      <div>
                        <span className="block text-[#808797] mb-0.5">0–100</span>
                        <span className="font-mono-tabular font-medium text-white">
                          {car.acc}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[#808797] mb-0.5">Top Speed</span>
                        <span className="font-mono-tabular font-medium text-white">
                          {car.top} km/h
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => onOpenDetails(car)}
                        className="flex-1 h-10 px-4 rounded-lg bg-[#d6b45d] text-[#090b10] text-xs font-semibold hover:bg-[#e2c26d] transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Details
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleCompare(car)}
                        className={`flex-1 h-10 px-4 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                          isCompared
                            ? 'bg-[#d6b45d]/15 border-[#d6b45d] text-[#d6b45d]'
                            : 'bg-[#1a202c] border-white/10 text-white hover:border-white/25'
                        }`}
                      >
                        {isCompared ? (
                          <>
                            <Check className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Comparing</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Compare</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
