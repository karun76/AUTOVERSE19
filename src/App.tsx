import { useState, useCallback, useMemo, useEffect } from 'react';
import { ArrowRight, GitCompareArrows, LogIn, LogOut, X } from 'lucide-react';
import { BRANDS, CARS, type CarSpec } from './data/cars';
import { CatalogSection } from './components/CatalogSection';
import { CompareSection } from './components/CompareSection';
import { CarDetailModal } from './components/CarDetailModal';
import { CarImage } from './components/CarImage';
import { EnquirySection } from './components/EnquirySection';
import { SignInModal } from './components/SignInModal';
import { useAuth } from './context/AuthContext';
import {
  deleteGarageFavorite,
  fetchCatalogCars,
  fetchGarageFavorites,
  saveGarageFavorite,
} from './lib/api';

export default function App() {
  const {
    user,
    idToken,
    signingIn,
    authError,
    clearAuthError,
    signIn,
    logout,
    getFreshToken,
  } = useAuth();

  const [cars, setCars] = useState<CarSpec[]>(CARS);
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedFuel, setSelectedFuel] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('default');
  const [showGarageOnly, setShowGarageOnly] = useState<boolean>(false);

  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareNotice, setCompareNotice] = useState<string | null>(null);
  const [detailCar, setDetailCar] = useState<CarSpec | null>(null);

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

  // Load user's saved garage on sign-in
  useEffect(() => {
    if (!user || !idToken) {
      setFavoriteIds([]);
      setShowGarageOnly(false);
      return;
    }

    let active = true;
    fetchGarageFavorites(idToken)
      .then((favIds) => {
        if (!active) return;
        setFavoriteIds(favIds);
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

  const handleToggleFavorite = useCallback(
    async (car: CarSpec) => {
      setActionNotice(null);
      let token: string | null = null;
      if (!user) {
        const signedInUser = await signIn();
        if (!signedInUser) return;
        token = await signedInUser.getIdToken();
      } else {
        token = await getFreshToken();
      }
      if (!token) return;
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
    [user, favoriteIds, getFreshToken, signIn],
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
              Encyclopedia
            </a>
            <a
              href="#compare"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Compare ({compareCars.length}/3)
            </a>
            <a
              href="#brands"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              List
            </a>
            <a
              href="#enquiry"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Enquiry
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
                disabled={signingIn}
                onClick={() => void signIn()}
                className="h-9 px-3 rounded-lg bg-[#12161f] border border-white/12 text-[#d1d5df] hover:text-white hover:border-[#d6b45d]/60 disabled:opacity-60 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <LogIn className="w-3.5 h-3.5 text-[#d6b45d]" aria-hidden="true" />
                <span>{signingIn ? 'Signing in...' : 'Sign In'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => scrollToSection('catalog')}
              className="px-4 py-2 rounded-lg bg-[#d6b45d] text-[#090b10] text-xs font-semibold hover:bg-[#e2c26d] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Browse Cars
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
                  Explore {cars.length.toLocaleString()} iconic production cars, hypercars, and electric flagships across {BRANDS.length - 1} global brands in our list. Compare performance metrics side by side and save your favorite machines to your personal Garage.
                </p>
                <div className="flex flex-wrap items-center gap-3.5 mt-7">
                  <button
                    type="button"
                    onClick={() => scrollToSection('catalog')}
                    className="h-11 px-5 rounded-lg bg-[#d6b45d] text-[#090b10] text-sm font-semibold hover:bg-[#e2c26d] transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <span>Explore Encyclopedia</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToSection('compare')}
                    className="h-11 px-5 rounded-lg bg-[#151a24] border border-white/12 text-white text-sm font-medium hover:border-[#d6b45d]/60 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <GitCompareArrows className="w-4 h-4 text-[#d6b45d]" aria-hidden="true" />
                    <span>Compare Vehicles</span>
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
                  Vehicles in Encyclopedia
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
                  3-Car Matrix
                </div>
                <div className="text-xs text-[#a7adba] mt-0.5">
                  Side-by-Side Spec Comparison
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
        />

        {/* Comparison Matrix */}
        <CompareSection
          compareCars={compareCars}
          notice={compareNotice}
          onRemoveCar={handleRemoveCompare}
          onClearAll={handleClearCompare}
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
      />

      {/* Sign-In Recovery Modal */}
      <SignInModal />

      {/* Footer */}
      <footer className="border-t border-white/8 py-8 bg-[#090b10]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8e95a5]">
          <p>AUTOVERSE © 2026 · Encyclopedia of Cars</p>
          <div className="flex items-center gap-6">
            <a href="#catalog" className="hover:text-white transition-colors">
              Encyclopedia
            </a>
            <a href="#compare" className="hover:text-white transition-colors">
              Compare
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
