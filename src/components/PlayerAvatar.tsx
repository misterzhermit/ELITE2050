import React from 'react';
import { Player, District } from '../types';

interface PlayerAvatarProps {
  player: Player;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  mode?: 'full' | 'head' | 'no-boots';
  className?: string;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ 
  player, 
  size = 'md', 
  mode = 'full',
  className = ''
}) => {
  const { appearance, district } = player;
  
  // Mapeamento de cores de uniforme por distrito
  const getUniformSuffix = (d: District) => {
    switch (d) {
      case 'NORTE': return 'cyan';
      case 'SUL': return 'orange';
      case 'LESTE': return 'green';
      case 'OESTE': return 'purple';
      default: return 'cyan';
    }
  };

  const sizes = {
    xs: 'w-8 h-8',
    sm: 'w-12 h-12',
    md: 'w-24 h-24',
    lg: 'w-48 h-48',
    xl: 'w-64 h-64'
  };

  const uniformSuffix = getUniformSuffix(district);
  const genderKey = appearance.gender === 'M' ? 'm' : 'f';

  // Assets paths - usando a pasta 'assetas' conforme solicitado
  const assetsBase = '/assetas/avatars';
  const bodyPath = `${assetsBase}/bodies/body_${genderKey}_${appearance.bodyId}.png`;
  const hairPath = `${assetsBase}/hair/hair_${appearance.hairId}.png`;
  const uniformPath = `${assetsBase}/uniforms/uniform_${uniformSuffix}.png`;
  
  // Fallback para chuteiras
  const bootId = 1; // FORÇANDO BOOT 1 PARA TESTE GLOBAL
  const bootPath = `${assetsBase}/boots/boot_1.png`;

  // Estilo para o modo 'head' (rosto)
  const headStyle: React.CSSProperties = mode === 'head' ? {
    objectFit: 'cover',
    objectPosition: 'center 1%', // Foca no rosto
    transform: 'scale(2.5)', // Dá zoom no rosto
    transformOrigin: 'center 5%',
  } : {};

  return (
    <div className={`relative overflow-hidden rounded-xl ${sizes[size]} ${className} bg-slate-900/20`}>
      {/* Camada 1: Corpo */}
      <img 
        src={bodyPath} 
        alt="Body" 
        className="absolute inset-0 w-full h-full object-contain z-10"
        style={headStyle}
      />
      
      {/* Camada 2: Uniforme */}
      <img 
        src={uniformPath} 
        alt="Uniform" 
        className="absolute inset-0 w-full h-full object-contain z-20"
        style={headStyle}
      />

      {/* Camada 3: Cabelo (apenas se hairId for 1, pois só existe esse por enquanto) */}
      {appearance.hairId === 1 && (
        <img 
          src={hairPath} 
          alt="Hair" 
          className="absolute inset-0 w-full h-full object-contain z-30"
          style={headStyle}
        />
      )}

      {/* Camada 4: Chuteiras */}
      {mode === 'full' && (
        <img 
          src={bootPath} 
          alt="Boots" 
          style={{
            position: 'absolute',
            bottom: '5%',
            left: '45%',
            width: '59%',
            height: 'auto',
            transform: 'translateX(-50%)',
            objectFit: 'contain',
            zIndex: 100,
            pointerEvents: 'none'
          }}
        />
      )}
    </div>
  );
};
