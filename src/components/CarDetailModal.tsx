import React, { useEffect } from 'react';
import { X, Box, Check, Plus, Bookmark } from 'lucide-react';
import type { CarSpec } from '../data/cars';
import { CarImage } from './CarImage';

interface CarDetailModalProps {
  car: CarSpec | null;
  isCompared: boolean;
  isFavorite: boolean;
  onClose: () => void;
  onToggleCompare: (car: CarSpec) => void;
  onToggleFavorite: (car: CarSpec) => void;
  onOpenInStudio: (car: CarSpec) => void;
}

export const CarDetailModal: React.FC<CarDetailModalProps> = ({
  car,
  isCompared,
  isFavorite,
  onClose,
  onToggleCompare,
  onToggleFavorite,
  onOpenInStudio,
}) => {
  useEffect(() => {
    if (!car) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [car, onClose]);

  if (!car) return null;

  const specRows: Array<[string, string]> = [
    ['Model Year', String(car.year)],
    ['Category', car.type],
    ['Powertrain', car.engine],
    ['Fuel Type', car.fuel],
    ['Horsepower', `${car.hp} HP`],
    ['Peak Torque', `${car.torque} Nm`],
    ['Top Speed', `${car.top} km/h`],
    ['0–100 km/h', car.acc],
    ['Estimated Price', car.price],
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-car-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#12161f] border border-white/12 rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top studio showcase header */}
        <div className="relative bg-gradient-to-b from-[#1a2230] to-[#12161f] px-6 pt-6 pb-4 border-b border-white/8">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close specifications modal"
            className="absolute top-4 right-4 p-2 rounded-lg text-[#a7adba] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="aspect-video w-full overflow-hidden rounded-lg border border-white/8 bg-[#0b0f17] mb-4">
            <CarImage car={car} />
          </div>

          <div className="text-xs font-medium text-[#d6b45d] mb-1">
            {car.brand} · {car.year} · {car.type}
          </div>
          <h2
            id="modal-car-title"
            className="text-2xl font-semibold text-white tracking-tight"
          >
            {car.brand} {car.model}
          </h2>
          <p className="text-sm text-[#a7adba] leading-relaxed mt-2">
            {car.description}
          </p>
        </div>

        {/* Spec Table */}
        <div className="p-6">
          <table className="w-full border-collapse text-sm">
            <tbody className="divide-y divide-white/8">
              {specRows.map(([label, value]) => (
                <tr key={label}>
                  <td className="py-3 text-[#8e95a5] font-medium">{label}</td>
                  <td className="py-3 text-right text-white font-mono-tabular">
                    {value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-5 border-t border-white/8">
            <button
              type="button"
              onClick={() => {
                onOpenInStudio(car);
                onClose();
              }}
              className="flex-1 h-11 px-4 rounded-lg bg-[#d6b45d] text-[#090b10] text-xs font-semibold hover:bg-[#e2c26d] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Box className="w-4 h-4" aria-hidden="true" />
              <span>Customize in 3D Studio</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleFavorite(car)}
              className={`h-11 px-4 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
                isFavorite
                  ? 'bg-[#d6b45d]/15 border-[#d6b45d] text-[#d6b45d]'
                  : 'bg-[#1a202c] border-white/10 text-white hover:border-white/25'
              }`}
            >
              <Bookmark
                className="w-4 h-4"
                fill={isFavorite ? 'currentColor' : 'none'}
                aria-hidden="true"
              />
              <span>{isFavorite ? 'In Garage' : 'Save to Garage'}</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleCompare(car)}
              className={`h-11 px-4 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
                isCompared
                  ? 'bg-[#d6b45d]/15 border-[#d6b45d] text-[#d6b45d]'
                  : 'bg-[#1a202c] border-white/10 text-white hover:border-white/25'
              }`}
            >
              {isCompared ? (
                <>
                  <Check className="w-4 h-4" aria-hidden="true" />
                  <span>Comparing</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span>Compare</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
