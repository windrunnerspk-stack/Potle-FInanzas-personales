import React from 'react';

interface AuraLogoProps {
  size?: number;
  className?: string;
  variant?: 'full' | 'icon' | 'badge';
  withGlow?: boolean;
}

export const AuraLogo: React.FC<AuraLogoProps> = ({
  size = 40,
  className = '',
  variant = 'icon',
  withGlow = true,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Outer ambient glow */}
      {withGlow && (
        <div
          className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-emerald-500/30 via-teal-400/20 to-cyan-500/30 blur-md pointer-events-none -z-10 transform scale-110"
        />
      )}

      <svg
        viewBox="0 0 512 512"
        width={size}
        height={size}
        className="w-full h-full drop-shadow-sm select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="auraBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0c1220" />
            <stop offset="50%" stop-color="#070a13" />
            <stop offset="100%" stop-color="#03050a" />
          </linearGradient>

          <radialGradient id="auraRadialGlow" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stop-color="#10b981" stop-opacity="0.35" />
            <stop offset="50%" stop-color="#06b6d4" stop-opacity="0.15" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0" />
          </radialGradient>

          <linearGradient id="auraRimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#34d399" stop-opacity="0.8" />
            <stop offset="50%" stop-color="#06b6d4" stop-opacity="0.4" />
            <stop offset="100%" stop-color="#10b981" stop-opacity="0.15" />
          </linearGradient>

          <linearGradient id="auraLeftStem" x1="0%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stop-color="#047857" />
            <stop offset="45%" stop-color="#10b981" />
            <stop offset="100%" stop-color="#34d399" />
          </linearGradient>

          <linearGradient id="auraRightStem" x1="50%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#38bdf8" />
            <stop offset="55%" stop-color="#06b6d4" />
            <stop offset="100%" stop-color="#0f766e" />
          </linearGradient>

          <linearGradient id="auraChevronGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#10b981" />
            <stop offset="50%" stop-color="#6ee7b7" />
            <stop offset="100%" stop-color="#a7f3d0" />
          </linearGradient>

          <filter id="auraGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Base Squircle / Rounded Frame */}
        {variant !== 'badge' && (
          <>
            <rect
              x="16"
              y="16"
              width="480"
              height="480"
              rx="112"
              ry="112"
              fill="url(#auraBgGrad)"
            />
            <rect
              x="16"
              y="16"
              width="480"
              height="480"
              rx="112"
              ry="112"
              fill="url(#auraRadialGlow)"
            />
            <rect
              x="16"
              y="16"
              width="480"
              height="480"
              rx="112"
              ry="112"
              fill="none"
              stroke="url(#auraRimGrad)"
              strokeWidth="4"
            />
          </>
        )}

        {/* Halo Orbital Ring */}
        <circle
          cx="256"
          cy="275"
          r="145"
          fill="none"
          stroke="#10b981"
          strokeOpacity="0.14"
          strokeWidth="28"
        />
        <circle
          cx="256"
          cy="275"
          r="145"
          fill="none"
          stroke="#06b6d4"
          strokeOpacity="0.25"
          strokeWidth="3.5"
          strokeDasharray="16 12"
        />

        {/* Monogram A with financial upward arrow */}
        <g filter="url(#auraGlowFilter)">
          {/* Left Stem */}
          <path
            d="M 256 102 L 138 376 C 134 385 140 396 150 396 L 194 396 C 201 396 207 392 210 385 L 256 270 L 256 102 Z"
            fill="url(#auraLeftStem)"
          />

          {/* Right Stem */}
          <path
            d="M 256 102 L 256 270 L 302 385 C 305 392 311 396 318 396 L 362 396 C 372 396 378 385 374 376 L 256 102 Z"
            fill="url(#auraRightStem)"
          />

          {/* Chevron Crossbar (Upward Trend / Growth) */}
          <path
            d="M 188 332 L 256 264 L 324 332 L 298 348 L 256 306 L 214 348 Z"
            fill="url(#auraChevronGrad)"
          />

          {/* Apex Diamond Spark (Prosperity) */}
          <path
            d="M 256 80 L 264 100 L 284 108 L 264 116 L 256 136 L 248 116 L 228 108 L 248 100 Z"
            fill="#ffffff"
          />
        </g>

        {/* Apex Spark Dot */}
        <circle cx="256" cy="108" r="4.5" fill="#6ee7b7" />
      </svg>
    </div>
  );
};
