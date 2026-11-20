import React, { useEffect, useState } from 'react';
import type { CarSpec } from '../data/cars';
import { CarSilhouette } from './CarSilhouette';

interface CarImageProps {
  car: CarSpec;
  className?: string;
}

export const CarImage: React.FC<CarImageProps> = ({ car, className = '' }) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [car.image, car.id]);

  if (failed || !car.image) {
    return (
      <div className={`w-full h-full flex items-center justify-center p-4 ${className}`}>
        <CarSilhouette archetype={car.archetype} color={car.defaultColor} />
      </div>
    );
  }

  return (
    <img
      src={car.image}
      alt={`${car.year} ${car.brand} ${car.model} three-quarter studio view`}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setFailed(true)}
      className={`w-full h-full object-cover object-center ${className}`}
    />
  );
};
