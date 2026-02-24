import React from 'react';
import { Player, District } from '../types';
import { X, Shield, TrendingUp, Zap, Lock, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { useGame } from '../store/GameContext';
import { calculateTeamPower } from '../engine/gameLogic';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface PlayerModalProps {
  player: Player;
  onClose: () => void;
}

export const PlayerModal: React.FC<PlayerModalProps> = ({ player, onClose }) => {
  const { state } = useGame();
  
  const getTheme = (district: District) => {
    switch (district) {
      case 'NORTE': return { 
        main: 'text-cyan-400', 
        border: 'border-cyan-400', 
        bg: 'bg-cyan-950/30', 
        glow: 'shadow-[0_0_20px_rgba(34,211,238,0.3)]',
        gradient: 'from-cyan-900/50 to-slate-900'
      };
      case 'SUL': return { 
        main: 'text-orange-500', 
        border: 'border-orange-500', 
        bg: 'bg-orange-950/30', 
        glow: 'shadow-[0_0_20px_rgba(249,115,22,0.3)]',
        gradient: 'from-orange-900/50 to-stone-900'
      };
      case 'LESTE': return { 
        main: 'text-emerald-500', 
        border: 'border-emerald-500', 
        bg: 'bg-emerald-950/30', 
        glow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]',
        gradient: 'from-emerald-900/50 to-slate-900'
      };
      case 'OESTE': return { 
        main: 'text-purple-500', 
        border: 'border-purple-500', 
        bg: 'bg-purple-950/30', 
        glow: 'shadow-[0_0_20px_rgba(168,85,247,0.3)]',
        gradient: 'from-purple-900/50 to-slate-900'
      };
      default: return { 
        main: 'text-cyan-400', 
        border: 'border-cyan-400', 
        bg: 'bg-cyan-950/30', 
        glow: 'shadow-[0_0_20px_rgba(34,211,238,0.3)]',
        gradient: 'from-cyan-900/50 to-slate-900'
      };
    }
  };

  const theme = getTheme(player.district);
  
  const lastRatings = player.history.lastMatchRatings || [];
  const currentForm = lastRatings.length > 0 
    ? (lastRatings.reduce((a, b) => a + b, 0) / lastRatings.length).toFixed(1)
    : 'N/A';

  const graphWidth = 200;
  const graphHeight = 60;
  const graphPoints = lastRatings.map((rating, index) => {
    const x = (index / (lastRatings.length - 1 || 1)) * graphWidth;
    const y = graphHeight - ((rating / 10) * graphHeight);
    return `${x},${y}`;
  }).join(' ');

  const radarData = [
    { stat: 'FOR', value: player.pentagon.FOR },
    { stat: 'AGI', value: player.pentagon.AGI },
    { stat: 'INT', value: player.pentagon.INT },
    { stat: 'TAT', value: player.pentagon.TAT },
    { stat: 'TEC', value: player.pentagon.TEC },
  ];

  const traitList = [player.badges.slot1, player.badges.slot2, player.badges.slot3].filter(Boolean);

  // Buy Logic
  const { setState } = useGame();
  const userManager = state.userManagerId ? state.managers[state.userManagerId] : null;
  const userTeam = userManager?.career.currentTeamId ? state.teams[userManager.career.currentTeamId] : null;
  const isMyPlayer = userTeam?.squad.includes(player.id);
  
  const handleProposal = () => {
    if (!userTeam || isMyPlayer || player.satisfaction >= 80) return;
    
    const currentPower = calculateTeamPower(userTeam, state.players);
    const powerCap = 11000;
    const pointsLeft = powerCap - currentPower;
    
    if (pointsLeft < player.totalRating) {
      alert(`Budget insuficiente! Você precisa de ${player.totalRating} pts, mas tem apenas ${pointsLeft} pts.`);
      return;
    }

    // Process Transfer
    setState(prev => {
      const next = { ...prev };
      
      // Add to user team
      next.teams[userTeam.id] = {
        ...next.teams[userTeam.id],
        squad: [...next.teams[userTeam.id].squad, player.id]
      };

      // Remove from old team if exists
      if (player.contract.teamId) {
        const oldTeamId = player.contract.teamId;
        next.teams[oldTeamId] = {
          ...next.teams[oldTeamId],
          squad: next.teams[oldTeamId].squad.filter(id => id !== player.id)
        };
      }

      // Update player contract
      next.players[player.id] = {
        ...next.players[player.id],
        contract: {
          ...next.players[player.id].contract,
          teamId: userTeam.id
        }
      };

      // Notification
      const newNotif = {
        id: `transf_${Date.now()}`,
        type: 'transfer' as const,
        title: 'Transferência Concluída',
        message: `${player.nickname} assinou com o ${userTeam.name}!`,
        date: new Date().toISOString(),
        read: false
      };
      next.notifications = [newNotif, ...next.notifications];

      return next;
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/90 backdrop-blur-md">
      <motion.div 
        layoutId={`player-card-${player.id}`}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`relative w-full max-w-md bg-slate-950/70 backdrop-blur-2xl rounded-xl border ${theme.border} shadow-[0_0_30px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col`}
      >
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-1.5 bg-black/60 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>

        <div className={`relative h-40 bg-gradient-to-b ${theme.gradient} flex items-end p-4`}>
           <div className="absolute inset-0 opacity-30" 
                style={{ backgroundImage: `url(https://picsum.photos/seed/${player.id}/800/400)`, backgroundSize: 'cover' }} 
           />
           <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
           
           <div className="relative z-10 flex items-end gap-3 w-full">
             <div className={`w-20 h-20 rounded-xl border ${theme.border} bg-black/50 shadow-lg overflow-hidden flex-shrink-0`}>
                <img src={`https://picsum.photos/seed/${player.id}/200/200`} className="w-full h-full object-cover" />
             </div>
             
             <div className="flex-1 mb-1">
               <div className="flex items-center gap-2 mb-1">
                 <Shield size={14} className={theme.main} />
                 <span className={`text-[10px] font-semibold tracking-[0.2em] uppercase ${theme.main}`}>{player.district} CLAN</span>
               </div>
               <h2 className="text-2xl font-semibold text-white leading-none uppercase tracking-tight drop-shadow-lg">{player.nickname}</h2>
               <p className="text-xs text-slate-400 font-medium tracking-wide">{player.name}</p>
             </div>
           </div>
        </div>

        <div className="p-4 space-y-4">
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black/50 border border-white/10 rounded-xl p-3 relative overflow-hidden">
              <div className={`absolute top-0 right-0 p-2 opacity-20 ${theme.main}`}>
                <Zap size={18} />
              </div>
              <p className="text-[9px] text-slate-400 uppercase tracking-[0.25em] font-semibold mb-1">Rating Atual</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-semibold ${theme.main} drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]`}>
                  {player.totalRating}
                </span>
                <span className="text-[10px] font-semibold text-emerald-400 flex items-center">
                  <TrendingUp size={10} className="mr-0.5" /> +45
                </span>
              </div>
            </div>

            <div className="bg-black/50 border border-white/10 rounded-xl p-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-20 text-slate-500">
                <Lock size={18} />
              </div>
              <p className="text-[9px] text-slate-400 uppercase tracking-[0.25em] font-semibold mb-1">Potencial</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-slate-200 opacity-80">
                  {player.potential || 999}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black/50 border border-white/10 rounded-xl p-3">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="text-[9px] text-slate-400 uppercase tracking-[0.25em] font-semibold">Fase Atual</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-xl font-semibold ${Number(currentForm) >= 7.0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {currentForm}
                    </span>
                    <Activity size={14} className="text-slate-500" />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-slate-500 uppercase tracking-[0.25em] font-semibold">Últimos</p>
                  <div className="flex gap-1 mt-1">
                    {lastRatings.map((r, i) => (
                      <div key={i} className={`w-1 h-5 rounded-full ${r >= 7.5 ? 'bg-emerald-500' : r >= 6.0 ? 'bg-amber-500' : 'bg-red-500'}`} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative h-14 w-full bg-black/30 rounded-lg border border-white/5 overflow-hidden">
                 <svg width="100%" height="100%" viewBox={`0 0 ${graphWidth} ${graphHeight}`} preserveAspectRatio="none">
                   <polyline 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      points={graphPoints} 
                      className={`${theme.main} drop-shadow-[0_0_6px_rgba(255,255,255,0.5)]`}
                   />
                 </svg>
                 <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
                   <div className="border-b border-white w-full h-1/4"></div>
                   <div className="border-b border-white w-full h-1/4"></div>
                   <div className="border-b border-white w-full h-1/4"></div>
                 </div>
              </div>
            </div>

            <div className="bg-black/50 border border-white/10 rounded-xl p-3">
              <p className="text-[9px] text-slate-400 uppercase tracking-[0.25em] font-semibold mb-2">Mapa de Teia</p>
              <div className="h-36 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="80%">
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis dataKey="stat" tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 500 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar dataKey="value" stroke="rgba(34,211,238,0.9)" fill="rgba(34,211,238,0.2)" strokeWidth={1.5} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black/50 border border-white/10 rounded-xl p-3">
              <p className="text-[9px] text-slate-400 uppercase tracking-[0.25em] font-semibold mb-2">Traços</p>
              <div className="flex flex-wrap gap-2">
                {traitList.length === 0 && (
                  <span className="text-[10px] text-slate-500">Sem traços</span>
                )}
                {traitList.map((trait, index) => (
                  <span key={`${trait}-${index}`} className={`text-[10px] font-semibold uppercase tracking-[0.18em] px-2 py-1 rounded-full border ${theme.border} ${theme.main} bg-black/40`}>
                    {trait}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-black/50 border border-white/10 rounded-xl p-3">
              <div className="flex justify-between text-[9px] uppercase font-semibold tracking-[0.25em] text-slate-400">
                <span>Satisfação</span>
                <span className={player.satisfaction > 80 ? 'text-emerald-400' : 'text-red-400'}>{player.satisfaction}%</span>
              </div>
              <div className="h-2 mt-2 bg-black/60 rounded-full overflow-hidden border border-white/10">
                <div 
                  className={`h-full transition-all duration-500 ${player.satisfaction > 80 ? 'bg-emerald-500' : player.satisfaction > 50 ? 'bg-amber-500' : 'bg-red-500'}`} 
                  style={{ width: `${player.satisfaction}%` }}
                />
              </div>
            </div>
          </div>

          {!isMyPlayer && (
             <button 
               onClick={handleProposal}
               className={`w-full py-3 rounded-xl font-semibold uppercase tracking-[0.3em] text-[11px] transition-all shadow-lg hover:scale-[1.01] active:scale-[0.99] ${
                 player.satisfaction < 80
                   ? `bg-white text-black hover:bg-slate-200 ${theme.glow}` 
                   : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
               }`}
               disabled={player.satisfaction >= 80}
             >
               {player.satisfaction >= 80 ? 'Contrato Estável' : `Propor Troca (${player.totalRating} pts)`}
             </button>
          )}

        </div>
      </motion.div>
    </div>
  );
};
