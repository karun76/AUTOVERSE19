import { useState, useCallback, useMemo, useEffect } from 'react';
import { ArrowRight, Box, LogIn, LogOut, X } from 'lucide-react';
import { BRANDS, CARS, type CarSpec } from './data/cars';
import { CatalogSection } from './components/CatalogSection';
import { CompareSection } from './components/CompareSection';
import { Studio3D } from './components/Studio3D';
import { CarDetailModal } from './components/CarDetailModal';
import { CarImage } from './components/CarImage';
import { EnquirySection } from './components/EnquirySection';
import { useAuth } from './context/AuthContext';
import {
  createStudioBuild,
  deleteGarageFavorite,
  fetchCatalogCars,
  fetchGarageFavorites,
  fetchStudioBuilds,
  removeStudioBuild,
  saveGarageFavorite,
  type SavedStudioBuild,
} from './lib/api';
import type { FinishType, WheelStyle } from './three/CarModelBuilder';

export default function App() {
  const { user, idToken, authError, clearAuthError, signIn, logout, getFreshToken } =
    useAuth();

  const [cars, setCars] = useState<CarSpec[]>(CARS);
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedFuel, setSelectedFuel] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('default');
  const [showGarageOnly, setShowGarageOnly] = useState<boolean>(false);

  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [savedBuilds, setSavedBuilds] = useState<SavedStudioBuild[]>([]);
  const [savingBuild, setSavingBuild] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareNotice, setCompareNotice] = useState<string | null>(null);
  const [detailCar, setDetailCar] = useState<CarSpec | null>(null);
  const [studioCar, setStudioCar] = useState<CarSpec>(
    () => CARS.find((c) => c.model === '911 GT3 RS') ?? CARS[0],
  );

  // Load catalog from backend API (keeps instant initial render)
  useEffect(() => {
    let active = true;
    fetchCatalogCars()
      .then((serverCars) => {
        if (active && serverCars.length > 0) {
          setCars(serverCars);
        }
      })
      .catch(() => {
        // Fallback silently to bundled catalog
      });
    return () => {
      active = false;
    };
  }, []);

  // Load user's saved garage & studio builds on sign-in
  useEffect(() => {
    if (!user || !idToken) {
      setFavoriteIds([]);
      setSavedBuilds([]);
      setShowGarageOnly(false);
      return;
    }

    let active = true;
    Promise.all([fetchGarageFavorites(idToken), fetchStudioBuilds(idToken)])
      .then(([favIds, builds]) => {
        if (!active) return;
        setFavoriteIds(favIds);
        setSavedBuilds(builds);
      })
      .catch((err) => {
        if (!active) return;
        setActionNotice(
          err instanceof Error
            ? err.message
            : 'Unable to sync your saved garage right now.',
        );
      });

    return () => {
      active = false;
    };
  }, [user, idToken]);

  const compareCars = useMemo(
    () =>
      compareIds
        .map((id) => cars.find((c) => c.id === id))
        .filter((c): c is CarSpec => Boolean(c)),
    [compareIds, cars],
  );

  const scrollToSection = useCallback((sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const handleToggleCompare = useCallback(
    (car: CarSpec) => {
      setCompareIds((prev) => {
        if (prev.includes(car.id)) {
          setCompareNotice(null);
          return prev.filter((id) => id !== car.id);
        }
        if (prev.length >= 3) {
          setCompareNotice(
            'Comparison is limited to 3 vehicles. Remove a vehicle below to add another.',
          );
          scrollToSection('compare');
          return prev;
        }
        setCompareNotice(null);
        return [...prev, car.id];
      });
    },
    [scrollToSection],
  );

  const handleRemoveCompare = useCallback((id: string) => {
    setCompareIds((prev) => prev.filter((item) => item !== id));
    setCompareNotice(null);
  }, []);

  const handleClearCompare = useCallback(() => {
    setCompareIds([]);
    setCompareNotice(null);
  }, []);

  const handleOpenInStudio = useCallback(
    (car: CarSpec) => {
      setStudioCar(car);
      scrollToSection('studio');
    },
    [scrollToSection],
  );

  const handleToggleFavorite = useCallback(
    async (car: CarSpec) => {
      setActionNotice(null);
      let token = await getFreshToken();
      if (!token) {
        const signedInUser = await signIn();
        if (!signedInUser) return;
        token = await signedInUser.getIdToken();
      }
      const currentlySaved = favoriteIds.includes(car.id);
      try {
        const updated = currentlySaved
          ? await deleteGarageFavorite(token, car.id)
          : await saveGarageFavorite(token, car.id);
        setFavoriteIds(updated);
      } catch (err) {
        setActionNotice(
          err instanceof Error
            ? err.message
            : 'Unable to update your saved garage.',
        );
      }
    },
    [favoriteIds, getFreshToken, signIn],
  );

  const handleSaveBuild = useCallback(
    async (payload: {
      carId: string;
      buildName: string;
      paintColor: string;
      finish: FinishType;
      wheelStyle: WheelStyle;
      rideHeight: number;
    }): Promise<boolean> => {
      setActionNotice(null);
      let token = await getFreshToken();
      if (!token) {
        const signedInUser = await signIn();
        if (!signedInUser) return false;
        token = await signedInUser.getIdToken();
      }
      setSavingBuild(true);
      try {
        const build = await createStudioBuild(token, payload);
        setSavedBuilds((prev) => [build, ...prev]);
        return true;
      } catch (err) {
        setActionNotice(
          err instanceof Error ? err.message : 'Unable to save studio build.',
        );
        return false;
      } finally {
        setSavingBuild(false);
      }
    },
    [getFreshToken, signIn],
  );

  const handleDeleteBuild = useCallback(
    async (buildId: number) => {
      setActionNotice(null);
      const token = await getFreshToken();
      if (!token) return;
      try {
        await removeStudioBuild(token, buildId);
        setSavedBuilds((prev) => prev.filter((b) => b.id !== buildId));
      } catch (err) {
        setActionNotice(
          err instanceof Error ? err.message : 'Unable to delete studio build.',
        );
      }
    },
    [getFreshToken],
  );

  const featuredHeroCar = useMemo(
    () => cars.find((c) => c.model === 'Revuelto') ?? cars[0],
    [cars],
  );

  const bannerMessage = authError || actionNotice;

  return (
    <div className="min-h-screen bg-[#090b10] text-[#f4f5f7] flex flex-col">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 bg-[#090b10]/95 border-b border-white/8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line brand wordmark */}
          <a
            href="#top"
            className="font-display text-lg font-bold tracking-[0.2em] text-[#d6b45d] whitespace-nowrap shrink-0"
          >
            AUTOVERSE
          </a>

          {/* Zone 2: Clean text navigation links */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-[#b5bbc8]"
          >
            <a
              href="#catalog"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Catalog
            </a>
            <a
              href="#compare"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Compare ({compareCars.length}/3)
            </a>
            <a
              href="#studio"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              3D Studio
            </a>
            <a
              href="#brands"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Marques
            </a>
          </nav>

          {/* Zone 3: Account + Single primary action */}
          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-xs text-[#d1d5df] max-w-[140px] truncate">
                  {user.displayName || user.email}
                </span>
                <button
                  type="button"
                  onClick={() => void logout()}
                  title="Sign out"
                  aria-label="Sign out"
                  className="h-9 px-2.5 rounded-lg bg-[#12161f] border border-white/12 text-[#d1d5df] hover:text-white hover:border-white/25 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => void signIn()}
                className="h-9 px-3 rounded-lg bg-[#12161f] border border-white/12 text-[#d1d5df] hover:text-white hover:border-[#d6b45d]/60 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <LogIn className="w-3.5 h-3.5 text-[#d6b45d]" aria-hidden="true" />
                <span>Sign In</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => scrollToSection('studio')}
              className="px-4 py-2 rounded-lg bg-[#d6b45d] text-[#090b10] text-xs font-semibold hover:bg-[#e2c26d] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Enter 3D Studio
            </button>
          </div>
        </div>
      </header>

      {bannerMessage && (
        <div className="bg-[#1b1610] border-b border-[#d6b45d]/40">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4 text-xs text-[#f4dfb0]">
            <span>{bannerMessage}</span>
            <button
              type="button"
              onClick={() => {
                clearAuthError();
                setActionNotice(null);
              }}
              aria-label="Dismiss notice"
              className="p-1 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <main id="top" className="flex-1">
        {/* Hero Section */}
        <section className="py-12 lg:py-16 bg-gradient-to-b from-[#0e131d] to-[#090b10]">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
              <div className="lg:col-span-7 flex flex-col justify-center">
                <p className="text-xs font-medium tracking-[0.18em] text-[#d6b45d] mb-3">
                  The World of Automobiles
                </p>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.08] [text-wrap:balance] max-w-2xl">
                  Discover Your Dream Machine.
                </h1>
                <p className="text-base text-[#b5bbc8] leading-relaxed max-w-xl mt-5">
                  Explore {cars.length.toLocaleString()} iconic production cars, hypercars, and electric flagships across {BRANDS.length - 1} global marques. Compare performance metrics side by side and configure paint, stance, and wheel finishes in real-time 3D.
                </p>
                <div className="flex flex-wrap items-center gap-3.5 mt-7">
                  <button
                    type="button"
                    onClick={() => scrollToSection('catalog')}
                    className="h-11 px-5 rounded-lg bg-[#d6b45d] text-[#090b10] text-sm font-semibold hover:bg-[#e2c26d] transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <span>Explore Catalog</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToSection('studio')}
                    className="h-11 px-5 rounded-lg bg-[#151a24] border border-white/12 text-white text-sm font-medium hover:border-[#d6b45d]/60 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <Box className="w-4 h-4 text-[#d6b45d]" aria-hidden="true" />
                    <span>Enter 3D Studio</span>
                  </button>
                </div>
              </div>

              {/* Hero Showcase Feature Card */}
              <div className="lg:col-span-5 bg-[#12161f] border border-white/10 rounded-xl p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#d6b45d] font-medium">
                    Featured Spotlight
                  </span>
                  <span className="text-[#a7adba] font-mono-tabular">
                    {featuredHeroCar.brand} · {featuredHeroCar.year}
                  </span>
                </div>

                <div className="aspect-video w-full overflow-hidden rounded-lg border border-white/8 bg-[#0b0f17] my-4">
                  <CarImage car={featuredHeroCar} />
                </div>

                <div>
                  <div className="flex items-baseline justify-between gap-2 mb-3">
                    <h2 className="text-xl font-semibold text-white">
                      {featuredHeroCar.brand} {featuredHeroCar.model}
                    </h2>
                    <span className="text-xs font-mono-tabular text-[#d6b45d]">
                      {featuredHeroCar.hp} HP
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/8 text-xs">
                    <div>
                      <span className="block text-[#808797]">Powertrain</span>
                      <span className="text-white font-medium">
                        {featuredHeroCar.engine}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[#808797]">0–100 km/h</span>
                      <span className="text-white font-mono-tabular font-medium">
                        {featuredHeroCar.acc}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[#808797]">Top Speed</span>
                      <span className="text-white font-mono-tabular font-medium">
                        {featuredHeroCar.top} km/h
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Full-Width 4-Column Summary Strip below Hero */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-10 pt-8 border-t border-white/8">
              <div>
                <div className="text-2xl font-semibold text-white font-mono-tabular">
                  {cars.length.toLocaleString()}
                </div>
                <div className="text-xs text-[#a7adba] mt-0.5">
                  Cataloged Vehicles
                </div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-white font-mono-tabular">
                  {BRANDS.length - 1}
                </div>
                <div className="text-xs text-[#a7adba] mt-0.5">
                  Global Manufacturers
                </div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-white font-mono-tabular">
                  1,800 HP
                </div>
                <div className="text-xs text-[#a7adba] mt-0.5">
                  Peak Output Tracked
                </div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-[#d6b45d] font-mono-tabular">
                  Real-Time 3D
                </div>
                <div className="text-xs text-[#a7adba] mt-0.5">
                  Interactive Showroom & Audio
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Catalog */}
        <CatalogSection
          cars={cars}
          selectedBrand={selectedBrand}
          onSelectBrand={setSelectedBrand}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedFuel={selectedFuel}
          onFuelChange={setSelectedFuel}
          sortBy={sortBy}
          onSortChange={setSortBy}
          showGarageOnly={showGarageOnly}
          onToggleGarageOnly={setShowGarageOnly}
          favoriteIds={favoriteIds}
          onToggleFavorite={(car) => void handleToggleFavorite(car)}
          compareIds={compareIds}
          onToggleCompare={handleToggleCompare}
          onOpenDetails={setDetailCar}
          onOpenInStudio={handleOpenInStudio}
        />

        {/* Comparison Matrix */}
        <CompareSection
          compareCars={compareCars}
          notice={compareNotice}
          onRemoveCar={handleRemoveCompare}
          onClearAll={handleClearCompare}
          onOpenInStudio={handleOpenInStudio}
        />

        {/* 3D Customization Studio */}
        <Studio3D
          cars={cars}
          selectedCar={studioCar}
          onSelectCar={setStudioCar}
          savedBuilds={savedBuilds}
          savingBuild={savingBuild}
          onSaveBuild={handleSaveBuild}
          onDeleteBuild={handleDeleteBuild}
        />

        {/* Contact & Enquiry Form */}
        <EnquirySection />
      </main>

      {/* Detail Modal */}
      <CarDetailModal
        car={detailCar}
        isCompared={detailCar ? compareIds.includes(detailCar.id) : false}
        isFavorite={detailCar ? favoriteIds.includes(detailCar.id) : false}
        onClose={() => setDetailCar(null)}
        onToggleCompare={handleToggleCompare}
        onToggleFavorite={(car) => void handleToggleFavorite(car)}
        onOpenInStudio={handleOpenInStudio}
      />

      {/* Footer */}
      <footer className="border-t border-white/8 py-8 bg-[#090b10]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8e95a5]">
          <p>AUTOVERSE © 2026 · Interactive Automobile Explorer</p>
          <div className="flex items-center gap-6">
            <a href="#catalog" className="hover:text-white transition-colors">
              Catalog
            </a>
            <a href="#compare" className="hover:text-white transition-colors">
              Compare
            </a>
            <a href="#studio" className="hover:text-white transition-colors">
              3D Studio
            </a>
            <a href="#enquiry" className="hover:text-white transition-colors">
              Enquiry
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
