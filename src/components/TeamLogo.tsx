import React from 'react';
import * as Icons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export type LogoPattern = 
  | 'none' 
  | 'stripes-v' 
  | 'stripes-h' 
  | 'diagonal' 
  | 'half-v' 
  | 'half-h' 
  | 'cross' 
  | 'circle' 
  | 'checkered' 
  | 'waves' 
  | 'diamond'
  | 'sunburst';

export interface TeamLogoProps {
  primaryColor: string;
  secondaryColor: string;
  patternId: LogoPattern;
  symbolId: string; // Lucide icon name
  secondarySymbolId?: string; // Optional second icon
  size?: number;
  className?: string;
  showCircle?: boolean;
}

export const TeamLogo: React.FC<TeamLogoProps> = ({
  primaryColor,
  secondaryColor,
  patternId,
  symbolId,
  secondarySymbolId,
  size = 40,
  className = "",
  showCircle = true
}) => {
  // Get the icon components from lucide-react
  const SymbolIcon = (Icons as any)[symbolId] as LucideIcon || Icons.Shield;
  const SecondarySymbolIcon = secondarySymbolId ? (Icons as any)[secondarySymbolId] as LucideIcon : null;

  // Generate a unique ID for gradients and filters
  const id = React.useId().replace(/:/g, '');

  const renderPattern = React.useCallback(() => {
    switch (patternId) {
      case 'stripes-v':
        return (
          <>
            <rect x="20" y="0" width="15" height="100" fill={secondaryColor} fillOpacity="0.8" />
            <rect x="50" y="0" width="15" height="100" fill={secondaryColor} fillOpacity="0.8" />
            <rect x="80" y="0" width="15" height="100" fill={secondaryColor} fillOpacity="0.8" />
          </>
        );
      case 'stripes-h':
        return (
          <>
            <rect x="0" y="20" width="100" height="15" fill={secondaryColor} fillOpacity="0.8" />
            <rect x="0" y="50" width="100" height="15" fill={secondaryColor} fillOpacity="0.8" />
            <rect x="0" y="80" width="100" height="15" fill={secondaryColor} fillOpacity="0.8" />
          </>
        );
      case 'diagonal':
        return (
          <path d="M-10,10 L10,-10 L110,90 L90,110 Z M-10,50 L50,-10 L150,90 L90,150 Z" fill={secondaryColor} fillOpacity="0.8" />
        );
      case 'half-v':
        return <rect x="50" y="0" width="50" height="100" fill={secondaryColor} fillOpacity="0.8" />;
      case 'half-h':
        return <rect x="0" y="50" width="100" height="50" fill={secondaryColor} fillOpacity="0.8" />;
      case 'cross':
        return (
          <>
            <rect x="42" y="0" width="16" height="100" fill={secondaryColor} fillOpacity="0.8" />
            <rect x="0" y="42" width="100" height="16" fill={secondaryColor} fillOpacity="0.8" />
          </>
        );
      case 'circle':
        return <circle cx="50" cy="50" r="35" fill={secondaryColor} fillOpacity="0.8" />;
      case 'checkered':
        return (
          <>
            <rect x="0" y="0" width="50" height="50" fill={secondaryColor} fillOpacity="0.8" />
            <rect x="50" y="50" width="50" height="50" fill={secondaryColor} fillOpacity="0.8" />
          </>
        );
      case 'waves':
        return (
          <path d="M0,20 Q25,0 50,20 T100,20 V40 Q75,60 50,40 T0,40 Z M0,60 Q25,40 50,60 T100,60 V80 Q75,100 50,80 T0,80 Z" fill={secondaryColor} fillOpacity="0.8" />
        );
      case 'diamond':
        return <path d="M50,10 L90,50 L50,90 L10,50 Z" fill={secondaryColor} fillOpacity="0.8" />;
      case 'sunburst':
        return (
          <g fill={secondaryColor} fillOpacity="0.6">
            {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
              <rect key={angle} x="48" y="0" width="4" height="50" transform={`rotate(${angle} 50 50)`} />
            ))}
          </g>
        );
      default:
        return null;
    }
  }, [patternId, secondaryColor]);

  return (
    <div 
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full drop-shadow-[0_4px_10px_rgba(0,0,0,0.4)]"
      >
        <defs>
          <linearGradient id={`grad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primaryColor} />
            <stop offset="50%" stopColor={primaryColor} />
            <stop offset="100%" stopColor={primaryColor} filter="brightness(0.8)" />
          </linearGradient>
          
          <linearGradient id={`shine-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.4" />
            <stop offset="50%" stopColor="white" stopOpacity="0" />
            <stop offset="100%" stopColor="black" stopOpacity="0.2" />
          </linearGradient>

          <clipPath id={`clip-${id}`}>
            <path d="M10,10 L90,10 L90,60 C90,85 50,95 50,95 C50,95 10,85 10,60 L10,10 Z" />
          </clipPath>

          <filter id={`bevel-${id}`}>
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
            <feOffset in="blur" dx="1" dy="1" result="offsetBlur" />
            <feSpecularLighting in="blur" surfaceScale="5" specularConstant="0.75" specularExponent="20" lightingColor="#ffffff" result="specOut">
              <fePointLight x="-5000" y="-10000" z="20000" />
            </feSpecularLighting>
            <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut" />
            <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
          </filter>
        </defs>

        {/* Shield Shadow/Glow */}
        <path 
          d="M10,10 L90,10 L90,60 C90,85 50,95 50,95 C50,95 10,85 10,60 L10,10 Z" 
          fill="black"
          fillOpacity="0.2"
          transform="translate(0, 2)"
        />

        {/* Outer Border (Silver/Gold look) */}
        <path 
          d="M8,8 L92,8 L92,62 C92,88 50,98 50,98 C50,98 8,88 8,62 L8,8 Z" 
          fill="#cbd5e1"
          stroke="#94a3b8"
          strokeWidth="0.5"
        />

        {/* Main Shield Body */}
        <path 
          d="M10,10 L90,10 L90,60 C90,85 50,95 50,95 C50,95 10,85 10,60 L10,10 Z" 
          fill={`url(#grad-${id})`}
          stroke="white"
          strokeWidth="1.5"
        />

        {/* Pattern inside Shield */}
        <g clipPath={`url(#clip-${id})`}>
          {renderPattern()}
          {/* Glossy Overlay */}
          <path 
            d="M10,10 L90,10 L90,40 Q50,50 10,40 Z" 
            fill="white" 
            fillOpacity="0.1" 
          />
        </g>

        {/* Inner Bevel/Border for depth */}
        <path 
          d="M14,14 L86,14 L86,58 C86,78 50,88 50,88 C50,88 14,78 14,58 L14,14 Z" 
          fill="none"
          stroke="black"
          strokeOpacity="0.15"
          strokeWidth="2"
        />
        <path 
          d="M14,14 L86,14 L86,58 C86,78 50,88 50,88 C50,88 14,78 14,58 L14,14 Z" 
          fill="none"
          stroke="white"
          strokeOpacity="0.2"
          strokeWidth="1"
        />

        {/* Central Circle for Symbol */}
        {showCircle && (
          <g>
            <circle 
              cx="50" 
              cy="48" 
              r="29" 
              fill="black" 
              fillOpacity="0.3" 
            />
            <circle 
              cx="50" 
              cy="45" 
              r="28" 
              fill="rgba(0,0,0,0.4)" 
              stroke="white" 
              strokeWidth="1.5"
              strokeOpacity="0.6"
              filter={`url(#bevel-${id})`}
            />
          </g>
        )}
      </svg>

      {/* Central Symbol(s) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ paddingTop: showCircle ? '5%' : '0' }}>
        {!SecondarySymbolIcon ? (
          <SymbolIcon 
            size={size * (showCircle ? 0.35 : 0.45)} 
            className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" 
            strokeWidth={2.5}
          />
        ) : (
          <div className="flex gap-0.5">
            <SymbolIcon 
              size={size * 0.28} 
              className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" 
              strokeWidth={2.5}
            />
            <SecondarySymbolIcon 
              size={size * 0.28} 
              className="text-slate-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" 
              strokeWidth={2.5}
            />
          </div>
        )}
      </div>
    </div>
  );
};
