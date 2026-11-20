import React from 'react';
import { X, Trash2 } from 'lucide-react';
import type { CarSpec } from '../data/cars';
import { CarImage } from './CarImage';

interface CompareSectionProps {
  compareCars: CarSpec[];
  notice: string | null;
  onRemoveCar: (id: string) => void;
  onClearAll: () => void;
}

export const CompareSection: React.FC<CompareSectionProps> = ({
  compareCars,
  notice,
  onRemoveCar,
  onClearAll,
}) => {
  const maxHp = Math.max(...compareCars.map((c) => c.hp), 1);
  const maxTorque = Math.max(...compareCars.map((c) => c.torque), 1);
  const maxTop = Math.max(...compareCars.map((c) => c.top), 1);

  return (
    <section id="compare" className="py-14 border-t border-white/8">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-medium tracking-wider text-[#d6b45d] mb-2">
              Performance Matrix
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              Compare Vehicles
            </h2>
            <p className="text-sm text-[#a7adba] mt-1">
              Select Compare on any vehicle card to evaluate up to three machines side by side.
            </p>
          </div>

          {compareCars.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="px-4 py-2 rounded-lg bg-[#181d28] border border-white/10 text-xs font-medium text-[#d1d5df] hover:text-white hover:border-white/25 transition-colors flex items-center gap-2 self-start sm:self-auto cursor-pointer whitespace-nowrap shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Clear Comparison</span>
            </button>
          )}
        </div>

        {notice && (
          <div
            role="status"
            className="mb-5 px-4 py-3 rounded-lg bg-[#1a202c] border border-[#d6b45d]/40 text-sm text-[#f3dfb0]"
          >
            {notice}
          </div>
        )}

        <div className="bg-[#12161f] border border-white/8 rounded-xl overflow-hidden">
          {compareCars.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm text-[#a7adba]">
                No vehicles selected yet. Choose up to 3 vehicles from the Encyclopedia of Cars above to compare horsepower, torque, top speed, and powertrain specifications.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[640px]">
                <thead>
                  <tr className="border-b border-white/10 bg-[#151a25]">
                    <th className="py-4 px-5 text-xs font-medium text-[#8e95a5] w-48">
                      Specification
                    </th>
                    {compareCars.map((car) => (
                      <th key={car.id} className="py-4 px-5 align-top">
                        <div className="aspect-video w-40 rounded-lg overflow-hidden border border-white/10 bg-[#0b0f17] mb-3">
                          <CarImage car={car} />
                        </div>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-xs text-[#d6b45d] font-medium">
                              {car.brand} · {car.year}
                            </div>
                            <div className="text-base font-semibold text-white mt-0.5">
                              {car.model}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => onRemoveCar(car.id)}
                            aria-label={`Remove ${car.brand} ${car.model} from comparison`}
                            className="p-1.5 rounded-md text-[#8e95a5] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8 text-sm">
                  <tr>
                    <td className="py-3.5 px-5 text-[#a7adba]">Category</td>
                    {compareCars.map((car) => (
                      <td key={car.id} className="py-3.5 px-5 text-white">
                        {car.type}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="py-3.5 px-5 text-[#a7adba]">Horsepower</td>
                    {compareCars.map((car) => (
                      <td key={car.id} className="py-3.5 px-5">
                        <div className="font-mono-tabular font-medium text-white mb-1.5">
                          {car.hp} HP
                        </div>
                        <div className="h-1.5 w-full max-w-[160px] bg-white/8 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#d6b45d] rounded-full"
                            style={{ width: `${Math.round((car.hp / maxHp) * 100)}%` }}
                          />
                        </div>
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="py-3.5 px-5 text-[#a7adba]">Peak Torque</td>
                    {compareCars.map((car) => (
                      <td key={car.id} className="py-3.5 px-5">
                        <div className="font-mono-tabular font-medium text-white mb-1.5">
                          {car.torque} Nm
                        </div>
                        <div className="h-1.5 w-full max-w-[160px] bg-white/8 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#d6b45d]/80 rounded-full"
                            style={{
                              width: `${Math.round((car.torque / maxTorque) * 100)}%`,
                            }}
                          />
                        </div>
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="py-3.5 px-5 text-[#a7adba]">Top Speed</td>
                    {compareCars.map((car) => (
                      <td key={car.id} className="py-3.5 px-5">
                        <div className="font-mono-tabular font-medium text-white mb-1.5">
                          {car.top} km/h
                        </div>
                        <div className="h-1.5 w-full max-w-[160px] bg-white/8 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-white/60 rounded-full"
                            style={{ width: `${Math.round((car.top / maxTop) * 100)}%` }}
                          />
                        </div>
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="py-3.5 px-5 text-[#a7adba]">0–100 km/h</td>
                    {compareCars.map((car) => (
                      <td
                        key={car.id}
                        className="py-3.5 px-5 font-mono-tabular text-white"
                      >
                        {car.acc}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="py-3.5 px-5 text-[#a7adba]">Engine</td>
                    {compareCars.map((car) => (
                      <td key={car.id} className="py-3.5 px-5 text-white">
                        {car.engine}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="py-3.5 px-5 text-[#a7adba]">Fuel</td>
                    {compareCars.map((car) => (
                      <td key={car.id} className="py-3.5 px-5 text-white">
                        {car.fuel}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="py-3.5 px-5 text-[#a7adba]">Estimated Price</td>
                    {compareCars.map((car) => (
                      <td
                        key={car.id}
                        className="py-3.5 px-5 font-mono-tabular text-[#d6b45d]"
                      >
                        {car.price}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
