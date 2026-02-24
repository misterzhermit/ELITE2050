import React from 'react';
import * as Icons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export type LogoPattern = 'none' | 'stripes-v' | 'stripes-h' | 'diagonal' | 'half-v' | 'half-h' | 'cross' | 'circle';

export interface TeamLogoProps {
  primaryColor: string;
  secondaryColor: string;
  patternId: LogoPattern;
  symbolId: string; // Lucide icon name
  size?: number;
  className?: string;
}

export const TeamLogo: React.FC<TeamLogoProps> = ({
  primaryColor,
  secondaryColor,
  patternId,
  symbolId,
  size = 40,
  className = ""
}) => {
  // Get the icon component from lucide-react
  const SymbolIcon = (Icons as any)[symbolId] as LucideIcon || Icons.Shield;

  const renderPattern = () => {
    switch (patternId) {
      case 'stripes-v':
        return (
          <>
            <rect x="20" y="0" width="20" height="100" fill={secondaryColor} />
            <rect x="60" y="0" width="20" height="100" fill={secondaryColor} />
          </>
        );
      case 'stripes-h':
        return (
          <>
            <rect x="0" y="20" width="100" height="20" fill={secondaryColor} />
            <rect x="0" y="60" width="100" height="20" fill={secondaryColor} />
          </>
        );
      case 'diagonal':
        return (
          <path d="M-10,10 L10,-10 L110,90 L90,110 Z" fill={secondaryColor} />
        );
      case 'half-v':
        return <rect x="50" y="0" width="50" height="100" fill={secondaryColor} />;
      case 'half-h':
        return <rect x="0" y="50" width="100" height="50" fill={secondaryColor} />;
      case 'cross':
        return (
          <>
            <rect x="40" y="0" width="20" height="100" fill={secondaryColor} />
            <rect x="0" y="40" width="100" height="20" fill={secondaryColor} />
          </>
        );
      case 'circle':
        return <circle cx="50" cy="50" r="30" fill={secondaryColor} />;
      default:
        return null;
    }
  };

  return (
    <div 
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]"
      >
        <defs>
          <clipPath id="shieldClip">
            <path d="M10,10 L90,10 L90,60 C90,85 50,95 50,95 C50,95 10,85 10,60 L10,10 Z" />
          </clipPath>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Shield Base */}
        <path 
          d="M10,10 L90,10 L90,60 C90,85 50,95 50,95 C50,95 10,85 10,60 L10,10 Z" 
          fill={primaryColor}
          stroke="white"
          strokeWidth="2"
        />

        {/* Pattern inside Shield */}
        <g clipPath="url(#shieldClip)">
          {renderPattern()}
        </g>

        {/* Inner border for depth */}
        <path 
          d="M15,15 L85,15 L85,58 C85,78 50,88 50,88 C50,88 15,78 15,58 L15,15 Z" 
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1"
        />
      </svg>

      {/* Central Symbol */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <SymbolIcon 
          size={size * 0.4} 
          className="text-white drop-shadow-[0_0_5px_rgba(0,0,0,0.8)]" 
          strokeWidth={2.5}
        />
      </div>
    </div>
  );
};
