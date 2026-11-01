import React from 'react';

interface MakaziLogoProps {
  className?: string;
  iconSize?: number;
  showText?: boolean;
  textColor?: string;
  taglineColor?: string;
  vertical?: boolean;
}

export default function MakaziLogo({
  className = '',
  iconSize = 42,
  showText = true,
  textColor = 'text-white',
  taglineColor = 'text-teal-400',
  vertical = false,
}: MakaziLogoProps) {
  return (
    <div className={`flex ${vertical ? 'flex-col items-center text-center' : 'items-center'} gap-3 ${className}`} id="makazi-logo-root">
      {/* Exquisite SVG matching the logo's house + organic growing tree merging concept perfectly */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-[0_4px_12px_rgba(13,148,136,0.35)]"
      >
        <defs>
          <linearGradient id="makazi-teal-cyan" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="50%" stopColor="#0d9488" />
            <stop offset="100%" stopColor="#2dd4bf" />
          </linearGradient>
          <linearGradient id="makazi-green" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2dd4bf" />
            <stop offset="100%" stopColor="#0f766e" />
          </linearGradient>
        </defs>

        {/* Outer leafy organic accents / Tree Crown */}
        {/* Top middle leaf */}
        <path
          d="M60 12 C64 22 56 28 60 38 C56 28 48 22 60 12 Z"
          fill="url(#makazi-teal-cyan)"
          opacity="0.95"
        />
        {/* Left upper leaf */}
        <path
          d="M45 22 C52 30 45 40 38 42 C40 32 38 24 45 22 Z"
          fill="url(#makazi-teal-cyan)"
          opacity="0.85"
        />
        {/* Right upper leaf */}
        <path
          d="M75 22 C68 30 75 40 82 42 C80 32 82 24 75 22 Z"
          fill="url(#makazi-teal-cyan)"
          opacity="0.85"
        />
        {/* Left side leaf */}
        <path
          d="M30 38 C38 42 35 55 26 58 C26 48 22 42 30 38 Z"
          fill="url(#makazi-green)"
          opacity="0.9"
        />
        {/* Right side leaf */}
        <path
          d="M90 38 C82 42 85 55 94 58 C94 48 98 42 90 38 Z"
          fill="url(#makazi-green)"
          opacity="0.9"
        />

        {/* Center tree branching curves that form house-like structure */}
        {/* Left house outline / curved branch */}
        <path
          d="M60 52 C52 52 40 62 30 74 C26 79 28 83 34 83 C42 83 50 76 56 68 L56 94 C56 98 64 98 64 94 L64 68 C70 76 78 83 86 83 C92 83 94 79 90 74 C80 62 68 52 60 52 Z"
          fill="url(#makazi-teal-cyan)"
        />

        {/* Elegant outer roof frames mimicking the logo's structure */}
        {/* Outer Left House frame with vertical wall */}
        <path
          d="M26 74 L45 58 C47 56 50 58 50 61 L50 86 C50 89 42 92 36 92 L24 92 C22 92 21 90 22 88 L26 74 Z"
          stroke="url(#makazi-green)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.8"
        />

        {/* Outer Right House frame with vertical wall */}
        <path
          d="M94 74 L75 58 C73 56 70 58 70 61 L70 86 C70 89 78 92 84 92 L96 92 C98 92 99 90 98 88 L94 74 Z"
          stroke="url(#makazi-green)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.8"
        />

        {/* Inner tree trunk core / ground line curve */}
        <path
          d="M20 95 C45 90 75 90 100 95"
          stroke="url(#makazi-teal-cyan)"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Floating leaf accents in center */}
        <path
          d="M60 44 C62 48 58 54 60 58 C58 54 54 48 60 44 Z"
          fill="url(#makazi-teal-cyan)"
        />
      </svg>

      {showText && (
        <div className={`flex flex-col ${vertical ? 'items-center' : 'items-start'}`}>
          <span className={`font-sans font-black tracking-[0.08em] ${textColor} text-xl leading-none`}>
            MAKAZI
          </span>
          <span className={`text-[9px] font-black uppercase tracking-[0.22em] ${taglineColor} mt-1 whitespace-nowrap`}>
            HOMES • COMMUNITIES • LIFE
          </span>
        </div>
      )}
    </div>
  );
}
