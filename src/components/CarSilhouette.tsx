import React from 'react';
import type { BodyArchetype } from '../data/cars';

interface CarSilhouetteProps {
  archetype: BodyArchetype;
  color: string;
  className?: string;
}

export const CarSilhouette: React.FC<CarSilhouetteProps> = ({
  archetype,
  color,
  className = '',
}) => {
  const isSuv = archetype === 'suv';
  const isHyper = archetype === 'hypercar' || archetype === 'supercar';
  const isSedan = archetype === 'sedan';
  const isMuscle = archetype === 'muscle';

  // Wheel center X coordinates and radius
  const frontWheelX = isSuv ? 226 : 230;
  const rearWheelX = isSuv ? 76 : 74;
  const wheelY = isSuv ? 112 : 114;
  const wheelR = isSuv ? 24 : 21;

  // Body outer silhouette path
  let bodyPath =
    'M 32 108 L 36 86 L 62 80 L 106 54 L 178 52 L 222 76 L 266 86 L 274 102 L 268 112 L 254 112 A 24 24 0 0 0 206 112 L 98 112 A 24 24 0 0 0 50 112 L 34 112 Z';
  let cabinPath = 'M 98 80 L 118 58 L 174 57 L 210 78 Z';
  let wingPath = '';

  if (isHyper) {
    bodyPath =
      'M 26 110 L 30 92 L 54 84 L 96 58 L 166 56 L 226 78 L 274 92 L 278 106 L 268 112 L 253 112 A 23 23 0 0 0 207 112 L 97 112 A 23 23 0 0 0 51 112 L 30 112 Z';
    cabinPath = 'M 102 80 L 122 61 L 170 60 L 208 79 Z';
    wingPath = 'M 28 84 L 44 84 L 40 72 L 22 72 Z';
  } else if (isSuv) {
    bodyPath =
      'M 34 108 L 36 70 L 52 50 L 172 48 L 214 72 L 266 78 L 272 102 L 266 110 L 252 110 A 26 26 0 0 0 200 110 L 102 110 A 26 26 0 0 0 50 110 L 36 110 Z';
    cabinPath = 'M 54 74 L 64 55 L 168 54 L 204 74 Z';
  } else if (isSedan) {
    bodyPath =
      'M 30 108 L 34 84 L 62 78 L 100 54 L 182 54 L 222 78 L 268 86 L 274 104 L 268 112 L 253 112 A 23 23 0 0 0 207 112 L 97 112 A 23 23 0 0 0 51 112 L 32 112 Z';
    cabinPath = 'M 86 78 L 108 58 L 178 58 L 210 78 Z';
  } else if (isMuscle) {
    bodyPath =
      'M 30 108 L 34 82 L 58 78 L 94 56 L 172 56 L 212 78 L 268 82 L 274 104 L 268 112 L 253 112 A 23 23 0 0 0 207 112 L 97 112 A 23 23 0 0 0 51 112 L 32 112 Z';
    cabinPath = 'M 90 79 L 110 60 L 168 60 L 198 79 Z';
    wingPath = 'M 32 82 L 46 82 L 42 75 L 28 76 Z';
  }

  const gradId = `car-grad-${archetype}-${color.replace('#', '')}`;
  const floorId = `floor-grad-${archetype}-${color.replace('#', '')}`;

  return (
    <svg
      viewBox="0 0 304 152"
      className={`w-full h-full select-none ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.95" />
          <stop offset="55%" stopColor={color} stopOpacity="0.72" />
          <stop offset="100%" stopColor="#0f141d" stopOpacity="0.95" />
        </linearGradient>
        <radialGradient id={floorId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#d6b45d" stopOpacity="0.16" />
          <stop offset="65%" stopColor="#1e2636" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#090b10" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Studio floor reflection */}
      <ellipse cx="152" cy="134" rx="128" ry="12" fill={`url(#${floorId})`} />
      <line x1="22" y1="134" x2="282" y2="134" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

      {/* Rear wing if applicable */}
      {wingPath && (
        <path
          d={wingPath}
          fill="#1b2230"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth="1"
        />
      )}

      {/* Main body shell */}
      <path
        d={bodyPath}
        fill={`url(#${gradId})`}
        stroke="rgba(255,255,255,0.26)"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />

      {/* Shoulder character line */}
      <path
        d={
          isSuv
            ? 'M 42 82 L 258 84'
            : 'M 44 88 Q 152 80 260 90'
        }
        fill="none"
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="1"
      />

      {/* Greenhouse / Glass canopy */}
      <path
        d={cabinPath}
        fill="#0d131d"
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* B-Pillar divider */}
      <line
        x1={isSuv ? 124 : 148}
        y1={isSuv ? 54 : 58}
        x2={isSuv ? 124 : 144}
        y2={isSuv ? 74 : 79}
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="2"
      />

      {/* Headlight DRL */}
      <path
        d={isSuv ? 'M 258 84 L 270 86 L 266 91 L 256 89 Z' : 'M 252 89 L 270 93 L 264 97 L 250 93 Z'}
        fill="#f8fafc"
        opacity="0.9"
      />

      {/* Taillight bar */}
      <rect
        x="31"
        y={isSuv ? 76 : 86}
        width="10"
        height="4"
        rx="1.5"
        fill="#ef4444"
        opacity="0.9"
      />

      {/* Lower carbon splitter / sill */}
      <line
        x1="96"
        y1="112"
        x2="206"
        y2="112"
        stroke="rgba(214,180,93,0.45)"
        strokeWidth="1.5"
      />

      {/* Rear & Front Alloy Wheels */}
      {[rearWheelX, frontWheelX].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={wheelY} r={wheelR} fill="#0c0f15" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
          <circle cx={cx} cy={wheelY} r={wheelR * 0.68} fill="#181e29" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" />
          <circle cx={cx} cy={wheelY} r={wheelR * 0.22} fill="#d6b45d" />
          {/* 5-spoke lines */}
          {[0, 72, 144, 216, 288].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            const x2 = cx + Math.cos(rad) * (wheelR * 0.62);
            const y2 = wheelY + Math.sin(rad) * (wheelR * 0.62);
            return (
              <line
                key={deg}
                x1={cx}
                y1={wheelY}
                x2={x2}
                y2={y2}
                stroke="rgba(226,232,240,0.55)"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            );
          })}
        </g>
      ))}
    </svg>
  );
};
