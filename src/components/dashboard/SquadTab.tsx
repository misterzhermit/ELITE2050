import React, { useState } from 'react';
import { useGame } from '../../store/GameContext';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useMatchSimulation } from '../../hooks/useMatchSimulation';
import { useTransfers } from '../../hooks/useTransfers';
import { useTactics } from '../../hooks/useTactics';
import { useGameDay } from '../../hooks/useGameDay';
import { useTraining } from '../../hooks/useTraining';
import { PlayerCard } from '../PlayerCard';
import { PlayerModal } from '../PlayerModal';
import { TeamLogo } from '../TeamLogo';
import { LineupBuilder } from '../LineupBuilder';
import { LiveReport, PostGameReport } from '../MatchReports';
import { getMatchStatus } from '../../utils/matchUtils';
import { Player } from '../../types';
import * as LucideIcons from 'lucide-react';
const { Home, Trophy, ShoppingCart, Database, User, Clock, Newspaper, TrendingUp, AlertCircle, Award, Calendar, Users, Activity, Sliders, Flame, Target, Zap, FastForward, Globe, MessageSquare, AlertTriangle, TrendingDown, Briefcase, Star, Search, Crown, ChevronRight, Lock, ChevronDown, Eye, Shield, Brain, X, Save } = LucideIcons;


export const SquadTab = (props: any) => {
  const { state, setState, addToast } = useGame();
  const dashData = useDashboardData();
  const { userTeam, upcomingMatches } = dashData;
  const { handleMockReport, setSelectedMatchReport } = useMatchSimulation(userTeam?.id || null);
  const { handleUpdateTactics } = useTactics(userTeam?.id || null);
  const { handleSetFocus, handleStartCardLab, handleChemistryBoost } = useTraining(userTeam?.id || null);
  const { handleAdvanceDay } = useGameDay();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const isLocked = React.useMemo(() => {
    if (!upcomingMatches || upcomingMatches.length === 0) return false;
    const nextMatch = upcomingMatches[0];
    const status = getMatchStatus(nextMatch, state.world.currentDate);
    return status === 'LOCKED' || status === 'PLAYING';
  }, [upcomingMatches, state.world.currentDate]);

  const handlePlayerClick = (player: Player) => {
    if (isLocked) {
      addToast('Escalação travada: O jogo começará em breve!', 'error');
      return;
    }
    setSelectedPlayer(player);
  };

  if (!userTeam) {
    return (
      <div className="text-center py-20 text-slate-500 font-medium bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-xl">
        Você ainda não assumiu um clube.
      </div>
    );
  }

  const playersByPosition: Record<string, Player[]> = {
    'GOL': [],
    'ZAG': [],
    'MEI': [],
    'ATA': []
  };

  if (userTeam.squad) {
    userTeam.squad.forEach(playerId => {
      const player = state.players[playerId];
      if (player) {
        // Fallback for old 'DEF' roles if they still exist in state
        const role = (player.role as string) === 'DEF' ? 'ZAG' : player.role;
        playersByPosition[role]?.push(player);
      }
    });
  }

  return (
    <div className="space-y-4 sm:space-y-8 animate-in fade-in duration-500 pb-10 px-2 sm:px-0">
      {isLocked && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4">
          <div className="bg-amber-500/20 p-1.5 sm:p-2 rounded-lg">
            <Lock className="text-amber-500" size={window.innerWidth < 640 ? 18 : 24} />
          </div>
          <div>
            <h3 className="text-amber-500 font-bold uppercase tracking-wider text-[10px] sm:text-sm">Escalação Travada</h3>
            <p className="text-amber-500/70 text-[9px] sm:text-xs">
              As alterações estão bloqueadas durante a preparação para o jogo.
            </p>
          </div>
        </div>
      )}

      {(Object.keys(playersByPosition) as (keyof typeof playersByPosition)[]).map(pos => {
        const players = playersByPosition[pos];
        if (players.length === 0) return null;

        return (
          <div key={pos} className="space-y-3 sm:space-y-6">
            <div className="flex items-center gap-3 sm:gap-4 px-1 sm:px-2">
              <div className={`w-1 sm:w-1.5 h-4 sm:h-6 rounded-full shadow-[0_0_10px_rgba(var(--color-glow),0.5)] ${pos === 'GOL' ? 'bg-amber-500 shadow-amber-500/50' :
                  pos === 'ZAG' ? 'bg-cyan-500 shadow-cyan-500/50' :
                    pos === 'MEI' ? 'bg-fuchsia-500 shadow-fuchsia-500/50' : 'bg-red-500 shadow-red-500/50'
                }`} />
              <div className="flex flex-col">
                <h3 className="text-[9px] sm:text-xs font-black text-white uppercase tracking-[0.2em] sm:tracking-[0.3em] neon-text-white">{
                  pos === 'GOL' ? 'Goleiros' :
                    pos === 'ZAG' ? 'Zagueiros' :
                      pos === 'MEI' ? 'Meio-Campistas' : 'Atacantes'
                }</h3>
                <span className="text-[7px] sm:text-[8px] font-bold text-white/20 uppercase tracking-widest mt-0.5">
                  {players.length} Atletas Disponíveis
                </span>
              </div>
            </div>

            <div className="flex overflow-x-auto gap-3 sm:gap-6 px-1 sm:px-2 pb-6 sm:pb-8 snap-x snap-mandatory no-scrollbar scroll-smooth">
              {players.map(player => (
                <div key={player.id} className="w-[140px] sm:w-[180px] shrink-0 snap-start">
                  <PlayerCard
                    player={player}
                    onClick={() => handlePlayerClick(player)}
                    variant="full"
                    teamLogo={userTeam.logo}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {selectedPlayer && (
        <PlayerModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}
