import React from 'react';
import { Player, District } from '../types';
import { X, TrendingUp, Zap, Lock, Activity, Shield } from 'lucide-react';
import { motion } from 'motion/react';
import { TeamLogo } from './TeamLogo';
import { PlayerAvatar } from './PlayerAvatar';
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
  const { setState, saveGame } = useGame();
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  
  const userManager = state.userManagerId ? state.managers[state.userManagerId] : null;
  const userTeam = userManager?.career.currentTeamId ? state.teams[userManager.career.currentTeamId] : null;
  const isMyPlayer = userTeam?.squad.includes(player.id);
  
  const handleProposal = async () => {
    if (!userTeam || isMyPlayer || player.satisfaction >= 80) return;
    
    const currentPower = calculateTeamPower(userTeam, state.players);
    const powerCap = userTeam.powerCap ?? (userTeam.league === 'Cyan' ? 12000 : (userTeam.league === 'Orange' || userTeam.league === 'Purple') ? 10000 : 8000);
    const pointsLeft = powerCap - currentPower;
    
    if (pointsLeft < player.totalRating) {
      return; // UI already handles visual feedback or button state
    }

    setIsProcessing(true);

    // Simulate some "negotiation" delay for feel
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Process Transfer
    const newState = { ...state };
    
    // Add to user team
    newState.teams[userTeam.id] = {
      ...newState.teams[userTeam.id],
      squad: [...newState.teams[userTeam.id].squad, player.id]
    };

    // Remove from old team if exists
    if (player.contract.teamId) {
      const oldTeamId = player.contract.teamId;
      newState.teams[oldTeamId] = {
        ...newState.teams[oldTeamId],
        squad: newState.teams[oldTeamId].squad.filter(id => id !== player.id)
      };
    }

    // Update player contract
    newState.players[player.id] = {
      ...newState.players[player.id],
      contract: {
        ...newState.players[player.id].contract,
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
    newState.notifications = [newNotif, ...newState.notifications];

    setState(newState);
    await saveGame(newState);
    
    setShowSuccess(true);
    setIsProcessing(false);
    
    // Close after showing success
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const handleSellPlayer = async () => {
    if (!userTeam || !isMyPlayer) return;
    
    if (userTeam.squad.length <= 11) {
      alert('Você não pode vender jogadores se tiver 11 ou menos no elenco!');
      return;
    }

    if (window.confirm(`Deseja dispensar ${player.nickname}? O teto de score de ${userTeam.powerCap} pts será mantido.`)) {
      setIsProcessing(true);
      await new Promise(resolve => setTimeout(resolve, 800));

      const newState = { ...state };
      
      // Remove from user team
      newState.teams[userTeam.id] = {
        ...newState.teams[userTeam.id],
        squad: newState.teams[userTeam.id].squad.filter(id => id !== player.id)
      };

      // Update player contract to free agent
      newState.players[player.id] = {
        ...newState.players[player.id],
        contract: {
          ...newState.players[player.id].contract,
          teamId: ''
        }
      };

      // Notification
      const newNotif = {
        id: `sell_${Date.now()}`,
        type: 'transfer' as const,
        title: 'Atleta Dispensado',
        message: `${player.nickname} deixou o ${userTeam.name}.`,
        date: new Date().toISOString(),
        read: false
      };
      newState.notifications = [newNotif, ...newState.notifications];

      setState(newState);
      await saveGame(newState);
      
      setIsProcessing(false);
      onClose();
    }
  };

  const playerWithBoot2 = {
    ...player,
    appearance: {
      ...player.appearance,
      bootId: 2
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/90 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div 
        layoutId={`player-card-${player.id}`}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md bg-slate-950/70 backdrop-blur-2xl rounded-xl border ${theme.border} shadow-[0_0_30px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col`}
      >
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-1.5 bg-black/60 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>

        <div className={`relative h-48 sm:h-56 bg-gradient-to-b ${theme.gradient} flex items-end p-3 sm:p-4 overflow-hidden`}>
           <div className="absolute inset-0 opacity-20" 
                style={{ filter: 'blur(2px)' }} 
           >
             <PlayerAvatar player={playerWithBoot2} size="xl" mode="full" className="w-full h-full object-cover translate-y-8" />
           </div>
           <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
           
           <div className="relative z-10 flex items-end gap-3 sm:gap-4 w-full">
             <div className={`w-20 h-20 sm:w-28 sm:h-28 rounded-xl sm:rounded-2xl border ${theme.border} bg-black/60 shadow-2xl overflow-hidden flex-shrink-0 group relative`}>
                <PlayerAvatar player={playerWithBoot2} size="lg" mode="full" className="w-full h-full object-contain translate-y-2 group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
             </div>
             
             <div className="flex-1 mb-1">
               <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                 {player.contract.teamId && state.teams[player.contract.teamId]?.logo ? (
                   <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 overflow-hidden flex items-center justify-center">
                     <TeamLogo 
                       primaryColor={state.teams[player.contract.teamId].logo!.primary}
                       secondaryColor={state.teams[player.contract.teamId].logo!.secondary}
                       patternId={state.teams[player.contract.teamId].logo!.patternId as any}
                       symbolId={state.teams[player.contract.teamId].logo!.symbolId}
                       size={window.innerWidth < 640 ? 12 : 14}
                     />
                   </div>
                 ) : (
                   <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 overflow-hidden flex items-center justify-center">
                     <TeamLogo 
                       primaryColor={theme.main.includes('cyan') ? '#22d3ee' : theme.main.includes('orange') ? '#f97316' : theme.main.includes('emerald') ? '#10b981' : '#a855f7'}
                       secondaryColor={theme.main.includes('cyan') ? '#0891b2' : theme.main.includes('orange') ? '#c2410c' : theme.main.includes('emerald') ? '#059669' : '#7e22ce'}
                       patternId="none"
                       symbolId="Shield"
                       size={window.innerWidth < 640 ? 12 : 14}
                     />
                   </div>
                 )}
                 <span className={`text-[8px] sm:text-[10px] font-semibold tracking-[0.2em] uppercase ${theme.main}`}>{player.district} CLAN</span>
               </div>
               <h2 className="text-xl sm:text-2xl font-semibold text-white leading-none uppercase tracking-tight drop-shadow-lg flex items-center gap-2 sm:gap-3">
                 {player.nickname}
                 <span className="text-[8px] sm:text-[10px] font-bold text-cyan-400 uppercase tracking-widest bg-cyan-900/50 px-1.5 sm:px-2 py-0.5 rounded-lg border border-cyan-500/50">
                  {player.role === 'GOL' ? 'GOL' : player.role === 'ZAG' ? 'ZAG' : player.role === 'MEI' ? 'MEI' : 'ATA'}
                </span>
               </h2>
               <p className="text-[10px] sm:text-xs text-slate-400 font-medium tracking-wide">{player.name}</p>
             </div>
           </div>
        </div>

        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="bg-black/50 border border-white/10 rounded-xl p-2.5 sm:p-3 relative overflow-hidden">
              <div className={`absolute top-0 right-0 p-2 opacity-20 ${theme.main}`}>
                <Zap size={16} sm:size={18} />
              </div>
              <p className="text-[8px] sm:text-[9px] text-slate-400 uppercase tracking-[0.25em] font-semibold mb-1">Rating Atual</p>
              <div className="flex items-baseline gap-1.5 sm:gap-2">
                <span className={`text-2xl sm:text-3xl font-semibold ${theme.main} drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]`}>
                  {player.totalRating}
                </span>
                <span className="text-[9px] sm:text-[10px] font-semibold text-emerald-400 flex items-center">
                  <TrendingUp size={9} className="mr-0.5 sm:size-[10px]" /> +45
                </span>
              </div>
            </div>

            <div className="bg-black/50 border border-white/10 rounded-xl p-2.5 sm:p-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-20 text-slate-500">
                <Lock size={16} sm:size={18} />
              </div>
              <p className="text-[8px] sm:text-[9px] text-slate-400 uppercase tracking-[0.25em] font-semibold mb-1">Potencial</p>
              <div className="flex items-baseline gap-1.5 sm:gap-2">
                <span className="text-2xl sm:text-3xl font-semibold text-slate-200 opacity-80">
                  {player.potential || 999}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="bg-black/50 border border-white/10 rounded-xl p-2.5 sm:p-3">
              <div className="flex justify-between items-center mb-2 sm:mb-3">
                <div>
                  <p className="text-[8px] sm:text-[9px] text-slate-400 uppercase tracking-[0.25em] font-semibold">Fase Atual</p>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className={`text-lg sm:text-xl font-semibold ${Number(currentForm) >= 7.0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {currentForm}
                    </span>
                    <Activity size={12} className="text-slate-500 sm:size-[14px]" />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[8px] sm:text-[9px] text-slate-500 uppercase tracking-[0.25em] font-semibold">Últimos</p>
                  <div className="flex gap-0.5 sm:gap-1 mt-1">
                    {lastRatings.map((r, i) => (
                      <div key={i} className={`w-0.5 sm:w-1 h-4 sm:h-5 rounded-full ${r >= 7.5 ? 'bg-emerald-500' : r >= 6.0 ? 'bg-amber-500' : 'bg-red-500'}`} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative h-12 sm:h-14 w-full bg-black/30 rounded-lg border border-white/5 overflow-hidden">
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

            <div className="bg-black/50 border border-white/10 rounded-xl p-2.5 sm:p-3">
              <p className="text-[8px] sm:text-[9px] text-slate-400 uppercase tracking-[0.25em] font-semibold mb-1.5 sm:mb-2">Mapa de Teia</p>
              <div className="h-28 sm:h-36 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="80%">
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis dataKey="stat" tick={{ fill: '#94a3b8', fontSize: 8, fontWeight: 500 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar dataKey="value" stroke="rgba(34,211,238,0.9)" fill="rgba(34,211,238,0.2)" strokeWidth={1.5} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="bg-black/50 border border-white/10 rounded-xl p-2.5 sm:p-3">
              <p className="text-[8px] sm:text-[9px] text-slate-400 uppercase tracking-[0.25em] font-semibold mb-1.5 sm:mb-2">Traços</p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {traitList.length === 0 && (
                  <span className="text-[9px] sm:text-[10px] text-slate-500">Sem traços</span>
                )}
                {traitList.map((trait, index) => (
                  <span key={`${trait}-${index}`} className={`text-[8px] sm:text-[10px] font-semibold uppercase tracking-[0.18em] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full border ${theme.border} ${theme.main} bg-black/40`}>
                    {trait}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-black/50 border border-white/10 rounded-xl p-2.5 sm:p-3">
              <div className="flex justify-between text-[8px] sm:text-[9px] uppercase font-semibold tracking-[0.25em] text-slate-400">
                <span>Satisfação</span>
                <span className={player.satisfaction > 80 ? 'text-emerald-400' : 'text-red-400'}>{player.satisfaction}%</span>
              </div>
              <div className="h-1.5 sm:h-2 mt-2 bg-black/60 rounded-full overflow-hidden border border-white/10">
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
               className={`w-full py-3 sm:py-4 rounded-xl font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-[10px] sm:text-[11px] transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group/btn ${
                 showSuccess 
                   ? 'bg-emerald-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.5)]'
                   : isProcessing
                   ? 'bg-slate-700 text-slate-400 cursor-wait'
                   : player.satisfaction < 80
                   ? `bg-white text-black hover:bg-cyan-50 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(34,211,238,0.3)]` 
                   : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
               }`}
               disabled={player.satisfaction >= 80 || isProcessing || showSuccess}
             >
               <div className="relative z-10 flex items-center justify-center gap-2 sm:gap-3">
                 {showSuccess ? (
                   <>
                     <Activity size={12} className="animate-bounce sm:size-[14px]" />
                     CONTRATADO COM SUCESSO!
                   </>
                 ) : isProcessing ? (
                   <>
                     <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                     NEGOCIANDO...
                   </>
                 ) : player.satisfaction >= 80 ? (
                   <>
                     <Lock size={12} className="opacity-50 sm:size-[14px]" />
                     CONTRATO ESTÁVEL
                   </>
                 ) : (
                   <>
                     <Zap size={12} className="animate-pulse sm:size-[14px]" />
                     FAZER PROPOSTA ({player.totalRating} PTS)
                   </>
                 )}
               </div>
               {!isProcessing && !showSuccess && player.satisfaction < 80 && (
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
               )}
             </button>
          )}
          
          {isMyPlayer && (
             <div className="flex flex-col gap-2 sm:gap-3">
               <div className="w-full py-3 sm:py-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-2 sm:gap-3">
                 <Shield size={14} className="text-cyan-400 sm:size-[16px]" />
                 <span className="text-[10px] sm:text-[11px] font-black text-white/40 uppercase tracking-[0.2em] sm:tracking-[0.3em]">Atleta do seu Elenco</span>
               </div>
               
               <button 
                 onClick={handleSellPlayer}
                 className="w-full py-3 sm:py-4 rounded-xl font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-[10px] sm:text-[11px] bg-red-950/40 text-red-400 border border-red-500/30 hover:bg-red-900/40 hover:border-red-400 transition-all"
               >
                 Dispensar Atleta
               </button>
             </div>
          )}
          
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes shimmer {
              100% { transform: translateX(100%); }
            }
          `}} />

        </div>
      </motion.div>
    </div>
  );
};
