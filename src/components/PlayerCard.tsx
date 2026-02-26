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

const PlayerCardComponent: React.FC<PlayerCardProps> = ({ player, onClick, onProposta, variant = 'full', draggable, onDragStart, teamLogo }) => {
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
      className={`relative w-full aspect-[1/1.6] rounded-2xl border ${style.border} ${style.shadow} overflow-hidden group 
        ${draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} 
        hover:scale-[1.02] transition-all duration-500 bg-[#0a0a10]/80 backdrop-blur-xl`}
    >
      {/* Holographic Shine Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700 bg-gradient-to-tr from-transparent via-white to-transparent -translate-x-full group-hover:translate-x-full" />

      {/* Background Avatar with Glass Overlay */}
      <div className="absolute inset-0 z-0">
        <PlayerAvatar
          player={player}
          size="xl"
          mode="full"
          className="w-full h-full object-cover object-top opacity-80 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a10] via-[#0a0a10]/40 to-transparent" />
      </div>

      {/* Top Bar: Rating & Badges */}
      <div className="absolute top-3 left-3 right-3 z-20 flex justify-between items-start">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className={`absolute inset-0 blur-md opacity-50 ${style.bg}`} />
            <span className={`relative text-2xl font-black italic tracking-tighter drop-shadow-2xl ${style.text}`}>
              {player.totalRating}
            </span>
          </div>
          <span className="text-[7px] font-black uppercase tracking-[0.2em] text-white/60 -mt-1">{player.role}</span>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <div className="flex gap-1">
            {player.badges.slot1 && <div className="w-5 h-5 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center backdrop-blur-md shadow-lg"><Star size={10} className="text-cyan-400" /></div>}
            {player.badges.slot2 && <div className="w-5 h-5 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center backdrop-blur-md shadow-lg"><Star size={10} className="text-fuchsia-400" /></div>}
          </div>
          {(teamLogo || (playerTeam && playerTeam.logo)) && (
            <div className="w-6 h-6 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-1 backdrop-blur-md">
              <TeamLogo
                primaryColor={teamLogo?.primary || playerTeam?.logo?.primary || '#fff'}
                secondaryColor={teamLogo?.secondary || playerTeam?.logo?.secondary || '#000'}
                patternId={(teamLogo?.patternId || playerTeam?.logo?.patternId || 'none') as any}
                symbolId={teamLogo?.symbolId || playerTeam?.logo?.symbolId || 'Shield'}
                size={16}
              />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Info Section */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-3 space-y-2">
        {/* Name Area */}
        <div className="relative">
          <div className="absolute -top-6 left-0 right-0 h-8 bg-gradient-to-t from-[#0a0a10] to-transparent" />
          <h3 className="text-base font-black italic uppercase tracking-tight text-white leading-none mb-1 drop-shadow-lg truncate">
            {player.nickname}
          </h3>
          <div className="flex items-center gap-2">
            <span className={`text-[8px] font-black uppercase tracking-widest ${style.text} px-2 py-0.5 rounded-full bg-white/5 border ${style.border}`}>
              {playerTeam ? playerTeam.name : player.district}
            </span>
            {player.appearance.gender === 'F' ? (
              <Venus size={10} className="text-pink-400 opacity-70" />
            ) : (
              <Mars size={10} className="text-blue-400 opacity-70" />
            )}
          </div>
        </div>

        {/* Minimalist Stats */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[7px] font-black uppercase tracking-widest text-white/40 px-1">
              <span>Power</span>
              <span className="text-white">{player.totalRating}</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div
                className={`h-full rounded-full ${style.bg} transition-all duration-1000`}
                style={{ width: `${(player.totalRating / 1000) * 100}%` }}
              />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[7px] font-black uppercase tracking-widest text-white/40 px-1">
              <span>Pot</span>
              <span className="text-white">{player.potential}</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-1000 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
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
            className="w-full h-8 bg-white text-black text-[9px] font-black rounded-lg transition-all active:scale-95 uppercase tracking-widest hover:bg-cyan-400 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            Contratar
          </button>
        )}
      </div>
    </motion.div>
  );
};

export const PlayerCard = React.memo(PlayerCardComponent);
