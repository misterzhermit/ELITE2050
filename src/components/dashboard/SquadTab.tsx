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
const { Home, Trophy, ShoppingCart, Database, User, Clock, Newspaper, Wallet, TrendingUp, AlertCircle, Award, Calendar, Users, Activity, Sliders, Flame, Target, Zap, FastForward, Globe, MessageSquare, AlertTriangle, TrendingDown, Briefcase, Star, Search, Crown, ChevronRight, Lock, ChevronDown, Eye, Shield, Brain, X, Save } = LucideIcons;


export const SquadTab = (props: any) => {
  const { state, setState } = useGame();
  const dashData = useDashboardData();
  const { userTeam, upcomingMatches } = dashData;
  const { handleMockVod, setSelectedMatchReport } = useMatchSimulation(userTeam?.id || null);
  const { handleUpdateTactics } = useTactics(userTeam?.id || null);
  const { handleSetFocus, handleStartCardLab, handleChemistryBoost } = useTraining(userTeam?.id || null);
  const { handleAdvanceDay } = useGameDay();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  if (!userTeam) {
    return (
      <div className="text-center py-20 text-slate-500 font-medium bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-xl">
        Você ainda não assumiu um clube.
      </div>
    );
  }

  const playersByPosition: Record<string, Player[]> = {
    'GOL': [],
    'DEF': [],
    'MEI': [],
    'ATA': []
  };

  userTeam.squad.forEach(playerId => {
    const player = state.players[playerId];
    if (player) {
      playersByPosition[player.role]?.push(player);
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {(Object.keys(playersByPosition) as (keyof typeof playersByPosition)[]).map(pos => {
        const players = playersByPosition[pos];
        if (players.length === 0) return null;

        return (
          <div key={pos} className="space-y-3">
            <div className="flex items-center gap-3 px-1">
              <div className={`w-1 h-4 rounded-full ${pos === 'GOL' ? 'bg-amber-500' :
                pos === 'DEF' ? 'bg-blue-500' :
                  pos === 'MEI' ? 'bg-purple-500' : 'bg-red-500'
                }`} />
              <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">{
                pos === 'GOL' ? 'Goleiros' :
                  pos === 'DEF' ? 'Defensores' :
                    pos === 'MEI' ? 'Meio-Campistas' : 'Atacantes'
              }</h3>
              <span className="text-[10px] font-bold text-slate-600">{players.length}</span>
            </div>

            <div className="flex overflow-x-auto gap-4 px-1 pb-4 snap-x snap-mandatory no-scrollbar">
              {players.map(player => (
                <div key={player.id} className="w-[160px] sm:w-[180px] shrink-0 snap-start">
                  <PlayerCard
                    player={player}
                    onClick={setSelectedPlayer}
                    variant="full"
                    teamLogo={userTeam.logo}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
