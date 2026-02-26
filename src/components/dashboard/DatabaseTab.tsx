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


export const DatabaseTab = (props: any) => {
  const { state, setState } = useGame();
  const dashData = useDashboardData();
  const { userTeam, upcomingMatches } = dashData;
  const { handleMockVod, setSelectedMatchReport } = useMatchSimulation(userTeam?.id || null);
  const { handleUpdateTactics } = useTactics(userTeam?.id || null);
  const { handleSetFocus, handleStartCardLab, handleChemistryBoost } = useTraining(userTeam?.id || null);
  const { handleAdvanceDay } = useGameDay();
  const players = Object.values(state.players);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const sortedPlayers = [...players].sort((a, b) => b.totalRating - a.totalRating);
  const limboPlayer = sortedPlayers[sortedPlayers.length - 1];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900/40 backdrop-blur-xl border border-red-500/30 rounded-xl p-6 relative overflow-hidden shadow-[0_0_20px_rgba(239,68,68,0.1)] hover:border-red-400/50 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/20 rounded-full blur-3xl" />
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="text-red-400" />
            <h3 className="text-lg font-bold text-white">O Limbo (Rank #1000)</h3>
          </div>
          {limboPlayer && (
            <div className="flex items-center gap-4 bg-black/40 p-3 rounded-xl border border-red-500/20 backdrop-blur-md">
              <div className="w-12 h-12 rounded-xl bg-red-950/50 flex items-center justify-center font-black text-red-500 text-xl border border-red-900/50">
                {limboPlayer.totalRating}
              </div>
              <div>
                <div className="font-bold text-white">{limboPlayer.name}</div>
                <div className="text-[10px] text-red-400 uppercase tracking-widest font-bold mt-1">Risco de exclusão</div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-amber-500/30 rounded-xl p-6 shadow-[0_0_20px_rgba(245,158,11,0.1)] hover:border-amber-400/50 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <Star className="text-amber-400" />
            <h3 className="text-lg font-bold text-white">Hall da Fama (Rank S)</h3>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
            {sortedPlayers.filter(p => p.totalRating >= 850).slice(0, 5).map(p => (
              <div key={p.id} className="flex-shrink-0 cursor-pointer hover:scale-105 transition-transform" onClick={() => setSelectedPlayer(p)}>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 p-0.5 mb-2 mx-auto shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                  <img src={`https://picsum.photos/seed/${p.id}/100/100`} alt={p.name} className="w-full h-full rounded-full object-cover border-2 border-slate-900" referrerPolicy="no-referrer" />
                </div>
                <div className="text-center text-[10px] font-bold text-white uppercase tracking-tight truncate w-16">{p.nickname}</div>
                <div className="text-center text-[10px] text-amber-400 font-black">{p.totalRating}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.3)]">
        <div className="p-4 border-b border-white/10 bg-black/20">
          <h3 className="font-bold text-white">Top 1000 Global</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-black/40 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
              <tr>
                <th className="px-6 py-4">Rank</th>
                <th className="px-6 py-4">Jogador</th>
                <th className="px-6 py-4">Pos</th>
                <th className="px-6 py-4">Rating</th>
                <th className="px-6 py-4 text-right">Clube</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedPlayers.slice(0, 50).map((player, idx) => (
                <tr key={player.id} onClick={() => setSelectedPlayer(player)} className="hover:bg-white/5 cursor-pointer transition-colors">
                  <td className="px-6 py-3 font-mono text-cyan-500/70">#{idx + 1}</td>
                  <td className="px-6 py-3 font-bold text-white flex items-center gap-3">
                    <img src={`https://picsum.photos/seed/${player.id}/40/40`} className="w-8 h-8 rounded-full object-cover bg-slate-800 border border-white/10" referrerPolicy="no-referrer" />
                    {player.name}
                  </td>
                  <td className="px-6 py-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest">{player.position}</td>
                  <td className="px-6 py-3 font-black text-amber-400 drop-shadow-md">{player.totalRating}</td>
                  <td className="px-6 py-3 text-right text-slate-400">{player.contract.teamId ? state.teams[player.contract.teamId]?.name : 'Free Agent'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
