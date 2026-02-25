import React from 'react';
import { Player, TeamLogoMetadata } from '../types';
import { Star, Zap, Trophy, Venus, Mars } from 'lucide-react';
import { motion } from 'motion/react';
import { TeamLogo } from './TeamLogo';
import { PlayerAvatar } from './PlayerAvatar';
import { useGame } from '../store/GameContext';

interface PlayerCardProps {
  player: Player;
  onClick: (player: Player) => void;
  onProposta?: (player: Player) => void;
  variant?: 'full' | 'compact' | 'banner' | 'block';
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, player: Player) => void;
  teamLogo?: TeamLogoMetadata;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, onClick, onProposta, variant = 'full', draggable, onDragStart, teamLogo }) => {
  const { state } = useGame();
  
  const playerTeam = player.contract.teamId ? state.teams[player.contract.teamId] : null;

  const getDistrictStyle = () => {
    switch (player.district) {
      case 'NORTE':
        return {
          bg: 'from-cyan-900/80 to-fuchsia-900/80',
          border: 'border-cyan-400/50',
          text: 'text-cyan-300',
          shadow: 'shadow-[0_0_15px_rgba(34,211,238,0.2)]',
          badge: 'bg-cyan-950 text-cyan-400 border-cyan-500/30'
        };
      case 'SUL':
        return {
          bg: 'from-orange-900/80 to-stone-800/80',
          border: 'border-orange-500/50',
          text: 'text-orange-400',
          shadow: 'shadow-[0_0_15px_rgba(249,115,22,0.2)]',
          badge: 'bg-orange-950 text-orange-400 border-orange-500/30'
        };
      case 'LESTE':
        return {
          bg: 'from-emerald-900/80 to-amber-900/80',
          border: 'border-emerald-500/50',
          text: 'text-emerald-400',
          shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.2)]',
          badge: 'bg-emerald-950 text-emerald-400 border-emerald-500/30'
        };
      case 'OESTE':
        return {
          bg: 'from-purple-950/90 to-black/90',
          border: 'border-purple-500/50',
          text: 'text-purple-400',
          shadow: 'shadow-[0_0_15px_rgba(168,85,247,0.2)]',
          badge: 'bg-purple-950 text-purple-400 border-purple-500/30'
        };
      default:
        return {
          bg: 'from-slate-800/80 to-slate-900/80',
          border: 'border-slate-500/50',
          text: 'text-slate-300',
          shadow: 'shadow-[0_0_10px_rgba(100,116,139,0.2)]',
          badge: 'bg-slate-800 text-slate-400 border-slate-600/30'
        };
    }
  };

  const style = getDistrictStyle();

  if (variant === 'block') {
    return (
      <motion.div
        layoutId={`player-card-${player.id}`}
        onClick={() => onClick(player)}
        draggable={draggable}
        onDragStart={(e: any) => onDragStart && onDragStart(e, player)}
        className={`w-full bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-2 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors shadow-[0_0_10px_rgba(0,0,0,0.3)] ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] ${style.bg} ${style.border} ${style.text} border`}>
            {player.totalRating}
          </div>
        <div className="flex flex-col truncate">
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-white truncate">{player.nickname}</span>
            {player.appearance.gender === 'F' ? (
              <Venus size={8} className="text-pink-400" />
            ) : (
              <Mars size={8} className="text-blue-400" />
            )}
          </div>
          <span className="text-[8px] text-slate-400 uppercase tracking-widest">
            {playerTeam ? playerTeam.name : player.district} • {player.role}
          </span>
        </div>
        </div>
      </motion.div>
    );
  }

  if (variant === 'banner') {
    return (
      <motion.div
        layoutId={`player-card-${player.id}`}
        onClick={() => onClick(player)}
        draggable={draggable}
        onDragStart={(e: any) => onDragStart && onDragStart(e, player)}
        className={`w-full bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-3 flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors shadow-[0_0_15px_rgba(0,0,0,0.2)] group relative overflow-hidden ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
      >
        <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${style.bg} opacity-50 group-hover:opacity-100 transition-opacity`} />
        
        <div className="relative">
          <PlayerAvatar player={player} size="sm" mode="no-boots" className="rounded-xl border border-white/10" />
          <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] ${style.bg} ${style.border} ${style.text} border shadow-lg`}>
            {player.totalRating}
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-black text-white truncate">{player.nickname}</h3>
            {player.appearance.gender === 'F' ? (
              <Venus size={10} className="text-pink-400" />
            ) : (
              <Mars size={10} className="text-blue-400" />
            )}
            <span className={`text-[8px] px-1.5 py-0.5 rounded-lg uppercase tracking-widest font-bold border ${style.badge}`}>
              {playerTeam ? playerTeam.name : `#${player.district}`}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{player.role}</span>
            <div className="flex gap-1">
              {player.badges.slot1 && <Star size={10} className="text-blue-400" />}
              {player.badges.slot2 && <Star size={10} className={player.totalRating < 500 ? 'text-red-400' : 'text-emerald-400'} />}
              {player.badges.slot3 && <Star size={10} className="text-amber-400" />}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (variant === 'compact') {
    return (
      <motion.div 
        layoutId={`player-card-${player.id}`}
        onClick={() => onClick(player)}
        draggable={draggable}
        onDragStart={(e: any) => onDragStart && onDragStart(e, player)}
        className={`relative w-full aspect-[1/1.5] rounded-xl border bg-gradient-to-br ${style.bg} ${style.border} shadow-[0_2px_8px_rgba(0,0,0,0.2)] ${draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} hover:scale-[1.05] transition-transform flex flex-col justify-between p-1.5 overflow-hidden backdrop-blur-md`}
      >
        {/* Background Image Overlay */}
        <div 
          className="absolute inset-0 opacity-50 mix-blend-luminosity"
          style={{ backgroundImage: `url(https://picsum.photos/seed/${player.id}/200/300)`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

        {/* Top Section */}
        <div className="relative z-10 flex justify-between items-start">
          <div className="flex flex-col items-center">
            <span className={`text-lg font-black leading-none drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] ${style.text}`}>{player.totalRating}</span>
            <span className="text-[6px] font-bold uppercase tracking-widest text-white/80 mt-0.5">{player.role}</span>
          </div>
          <div className="text-right flex flex-col items-end gap-1">
            <span className="text-[5px] font-mono text-white/50 bg-black/40 px-1 py-0.5 rounded-lg border border-white/10">#{player.id.replace('p_', '')}</span>
            {teamLogo && (
              <div className="w-4 h-4 rounded bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden">
                <TeamLogo 
                  primaryColor={teamLogo.primary}
                  secondaryColor={teamLogo.secondary}
                  patternId={teamLogo.patternId as any}
                  symbolId={teamLogo.symbolId}
                  size={12}
                />
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="relative z-10 flex flex-col gap-0.5">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <h3 className="text-[8px] font-black leading-tight uppercase tracking-tight text-white drop-shadow-md truncate">{player.nickname}</h3>
              {player.appearance.gender === 'F' ? (
                <Venus size={6} className="text-pink-400" />
              ) : (
                <Mars size={6} className="text-blue-400" />
              )}
            </div>
            <div className={`inline-block px-1 py-0.5 mt-0.5 rounded-lg text-[5px] uppercase tracking-widest font-bold border ${style.badge} opacity-80`}>
              {playerTeam ? playerTeam.name : player.district}
            </div>
          </div>
          
          <div className="flex justify-center gap-0.5 mt-0.5">
            {player.badges.slot1 && <Star size={6} className="text-blue-400 drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]" />}
            {player.badges.slot2 && <Star size={6} className={player.totalRating < 500 ? 'text-red-400' : 'text-emerald-400'} />}
            {player.badges.slot3 && <Star size={6} className="text-amber-400" />}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      layoutId={`player-card-${player.id}`}
      onClick={() => onClick(player)}
      draggable={draggable}
      onDragStart={(e: any) => onDragStart && onDragStart(e, player)}
      className={`relative w-full aspect-[1/1.8] rounded-xl border bg-gradient-to-br ${style.bg} ${style.border} ${style.shadow} ${draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} hover:scale-[1.03] transition-transform overflow-hidden flex flex-col justify-between p-1.5 sm:p-2 backdrop-blur-md`}
    >
      {/* Background Image Overlay */}
      <div className="absolute inset-0 z-0 opacity-100 mix-blend-normal overflow-hidden flex items-center justify-center">
        <PlayerAvatar 
          player={player} 
          size="xl" 
          mode="full" 
          className="w-full h-full object-contain" 
        />
      </div>
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
      
      {/* Top Section: Rating & Position */}
      <div className="relative z-20 flex justify-between items-start">
        <div className="flex flex-col items-center">
          <span className={`text-xl sm:text-2xl font-black leading-none drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] ${style.text}`}>{player.totalRating}</span>
          <div className="flex flex-col items-center">
            <span className="text-[7px] sm:text-[8px] font-bold uppercase tracking-widest text-white/80 mt-0.5">{player.role}</span>
            {player.appearance.gender === 'F' ? (
              <Venus size={10} className="text-pink-400 mt-0.5" />
            ) : (
              <Mars size={10} className="text-blue-400 mt-0.5" />
            )}
          </div>
        </div>
        <div className="text-right flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            {(teamLogo || (playerTeam && playerTeam.logo)) && (
              <div className="w-5 h-5 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden shadow-lg">
                <TeamLogo 
                  primaryColor={teamLogo?.primary || playerTeam?.logo?.primary || '#fff'}
                  secondaryColor={teamLogo?.secondary || playerTeam?.logo?.secondary || '#000'}
                  patternId={(teamLogo?.patternId || playerTeam?.logo?.patternId || 'none') as any}
                  symbolId={teamLogo?.symbolId || playerTeam?.logo?.symbolId || 'Shield'}
                  size={16}
                />
              </div>
            )}
            <span className="text-[6px] sm:text-[7px] font-mono text-white/50 bg-black/40 px-1 py-0.5 rounded-lg border border-white/10">#{player.id.replace('p_', '')}</span>
          </div>
          <div className="flex gap-1">
            <div className={`inline-block px-1.5 py-0.5 mt-0.5 rounded-lg text-[6px] sm:text-[7px] uppercase tracking-widest font-bold border ${style.badge}`}>
              {playerTeam ? playerTeam.name : player.district}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-14 left-0 right-0 z-20 flex flex-col gap-1 px-1.5">
        {/* Name Badge */}
        <div className="bg-black/90 backdrop-blur-md border border-white/20 rounded-lg py-1 px-2 shadow-2xl mx-1.5 relative z-30 flex flex-col items-center">
          <h3 className="text-[9px] sm:text-[11px] font-black leading-tight uppercase tracking-[0.2em] text-white text-center drop-shadow-lg truncate">
            {player.nickname}
          </h3>
        </div>

        {/* Stats Bars */}
        <div className="flex flex-col gap-1.5 px-1 bg-black/60 backdrop-blur-md rounded-xl py-1.5 border border-white/10 mx-0.5 relative z-20">
          {/* Power Bar */}
          <div className="space-y-0.5">
            <div className="flex justify-between items-center px-1">
              <span className="text-[5px] sm:text-[6px] uppercase font-black text-cyan-400 flex items-center gap-0.5">
                <Zap size={5} /> POWER
              </span>
              <span className="text-[6px] font-black text-cyan-400">{player.totalRating}</span>
            </div>
            <div className="h-0.5 bg-black/40 rounded-full overflow-hidden border border-white/5 relative">
              <div 
                className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r ${
                  player.totalRating < 400 ? 'from-red-500 to-orange-500' :
                  player.totalRating < 700 ? 'from-cyan-500 to-blue-500' :
                  'from-emerald-400 to-cyan-400'
                }`}
                style={{ width: `${(player.totalRating / 1000) * 100}%` }}
              />
            </div>
          </div>

          {/* Potential Bar */}
          <div className="space-y-0.5">
            <div className="flex justify-between items-center px-1">
              <span className="text-[5px] sm:text-[6px] uppercase font-black text-amber-400 flex items-center gap-0.5">
                <Trophy size={5} /> POTENTIAL
              </span>
              <span className="text-[6px] font-black text-amber-400">{player.potential}</span>
            </div>
            <div className="h-0.5 bg-black/40 rounded-full overflow-hidden border border-white/5 relative">
              <div 
                className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-amber-500 to-orange-400"
                style={{ width: `${(player.potential / 1000) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {onProposta && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onProposta(player);
            }}
            className="mt-1 w-full bg-emerald-500 hover:bg-emerald-400 text-black text-[8px] font-black py-1.5 rounded-lg transition-all active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.3)] uppercase tracking-widest"
          >
            PROPOSTA
          </button>
        )}
      </div>
    </motion.div>
  );
};
