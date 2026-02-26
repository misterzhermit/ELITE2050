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
import { getLiveMatchSecond, getMatchStatus } from '../../utils/matchUtils';
import { calculateTeamPower } from '../../engine/gameLogic';
import { Team, Player, Match } from '../../types';
import * as LucideIcons from 'lucide-react';
const { Home, Trophy, History, Play, ShoppingCart, Database, User, Clock, Newspaper, Wallet, TrendingUp, AlertCircle, Award, Calendar, Users, Activity, Sliders, Flame, Target, Zap, FastForward, Globe, MessageSquare, AlertTriangle, TrendingDown, Briefcase, Star, Search, Crown, ChevronRight, Lock, ChevronDown, Eye, Shield, Brain, X, Save } = LucideIcons;

export const HomeTab = () => {
  const { state, setState } = useGame();
  const dashData = useDashboardData();
  const { userTeam, upcomingMatches, totalPoints, powerCap, pointsLeft } = dashData;
  const { handleStartVod, handleMockVod, selectedMatchReport, setSelectedMatchReport, isWatchingVod, setIsWatchingVod, vodSecond, setVodSecond } = useMatchSimulation(userTeam?.id || null);
  const { handleUpdateTactics } = useTactics(userTeam?.id || null);
  const { handleSetFocus, handleStartCardLab, handleChemistryBoost } = useTraining(userTeam?.id || null);
  const { handleAdvanceDay } = useGameDay();
  const { handleMakeProposal } = useTransfers(userTeam?.id || null, totalPoints, powerCap);

  // Get next match info
  const nextMatch = upcomingMatches[0];

  // Better next match logic
  const nextMatchData = (() => {
    if (!userTeam || !state.world?.leagues) return null;
    const leagues = Object.values(state.world.leagues) as any[];
    const userLeague = leagues.find(l => l.standings.some(s => s.teamId === userTeam.id));
    if (!userLeague) return null;
    const match = userLeague.matches.find(m => (m.homeTeamId === userTeam.id || m.awayTeamId === userTeam.id) && m.status !== 'FINISHED');
    if (!match) return null;

    const opponentId = match.homeTeamId === userTeam.id ? match.awayTeamId : match.homeTeamId;
    const opponent = state.teams[opponentId];
    const opponentPower = opponent ? calculateTeamPower(opponent, state.players) : 0;
    const userPower = calculateTeamPower(userTeam, state.players);
    const status = getMatchStatus(match, state.world.currentDate);

    return {
      match,
      opponent,
      opponentPower,
      userPower,
      isHome: match.homeTeamId === userTeam.id,
      status
    };
  })();

  const lastHeadline = state.lastHeadline || {
    title: "Mercado Aquecido",
    message: "Novas promessas surgem nos distritos periféricos de Neo-City."
  };

  // Remote redundant mock logic and duplicate state calls


  if (selectedMatchReport) {
    const homeTeam = state.teams[selectedMatchReport.homeTeamId];
    const awayTeam = state.teams[selectedMatchReport.awayTeamId];

    if (homeTeam && awayTeam) {
      const matchStatus = selectedMatchReport.status;

      if (matchStatus === 'PLAYING' || isWatchingVod) {
        return (
          <div className="max-w-2xl mx-auto py-8">
            <LiveReport
              match={selectedMatchReport}
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              players={state.players}
              currentSecond={isWatchingVod ? vodSecond : getLiveMatchSecond(selectedMatchReport, state.world.currentDate)}
            />
            <div className="flex gap-4 mt-6">
              {isWatchingVod && (
                <button
                  onClick={() => setVodSecond(0)}
                  className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white/40 uppercase tracking-[0.3em] hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                >
                  <History size={14} /> REINICIAR VOD
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedMatchReport(null);
                  setIsWatchingVod(false);
                  setVodSecond(0);
                }}
                className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white/40 uppercase tracking-[0.3em] hover:bg-white/10 transition-colors"
              >
                VOLTAR AO DASHBOARD
              </button>
            </div>
          </div>
        );
      } else if (matchStatus === 'FINISHED' || (selectedMatchReport.played && !isWatchingVod)) {
        return (
          <div className="max-w-2xl mx-auto py-8 animate-in zoom-in-95 duration-500">
            <PostGameReport
              match={selectedMatchReport}
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              players={state.players}
              onClose={() => {
                setSelectedMatchReport(null);
                setVodSecond(0);
              }}
            />
            <button
              onClick={handleStartVod}
              className="mt-6 w-full py-4 bg-cyan-500 rounded-2xl text-[10px] font-black text-black uppercase tracking-[0.3em] hover:bg-cyan-400 transition-all flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(6,182,212,0.3)]"
            >
              <Play size={16} fill="black" /> ASSISTIR VOD COMPLETO (6 MINUTOS)
            </button>
          </div>
        );
      }
    }
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto pb-8">

      {/* TOP ROW: Premium Status Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* CARD 1: PRÓXIMO CONFRONTO */}
        <div className="relative group overflow-hidden rounded-[2.5rem] glass-card border-white/10 p-6 lg:p-8 transition-all hover:neon-border-cyan hover:scale-[1.01] duration-500 shadow-2xl">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/10 blur-[100px] group-hover:bg-cyan-500/20 transition-all duration-700" />

          <div className="relative z-10 flex flex-col h-full justify-between gap-8">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`flex h-2 w-2 rounded-full ${nextMatchData?.status === 'PLAYING' ? 'bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-cyan-500'}`} />
                  <span className={`text-[8px] sm:text-[10px] font-black uppercase tracking-[0.4em] ${nextMatchData?.status === 'PLAYING' ? 'text-red-500' : 'text-cyan-400'}`}>
                    {nextMatchData?.status === 'PLAYING' ? 'AO VIVO' : 'Match Engine'}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tighter uppercase italic neon-text-white">
                  {nextMatchData?.status === 'PLAYING' ? 'PARTIDA EM' : 'PRÓXIMO'} <span className="text-cyan-400">CONFRONTO</span>
                </h3>
              </div>
              <div className="p-2 sm:p-3 glass-card rounded-xl sm:rounded-2xl border-white/10 bg-white/5">
                <Target size={18} className="text-cyan-400" />
              </div>
            </div>

            {nextMatchData ? (
              <div className="relative flex flex-col items-center py-6">
                {/* VS Central Badge */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                  <div className="relative">
                    <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full animate-pulse" />
                    <div className="relative w-14 h-14 rounded-full bg-slate-950 border-2 border-white/10 flex items-center justify-center shadow-2xl group-hover:neon-border-cyan transition-all">
                      <span className="text-md font-black text-white italic tracking-tighter neon-text-white">VS</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full gap-4 sm:gap-8">
                  {/* Home Team */}
                  <div className="flex flex-col items-center gap-2 flex-1 group/team">
                    <div className="relative">
                      <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-[2.5rem] glass-card bg-white/5 border-white/10 flex items-center justify-center shadow-2xl transition-transform duration-500 relative overflow-hidden group-hover/team:neon-border-cyan">
                        {userTeam?.logo ? (
                          <TeamLogo
                            primaryColor={userTeam.logo.primary}
                            secondaryColor={userTeam.logo.secondary}
                            patternId={userTeam.logo.patternId as any}
                            symbolId={userTeam.logo.symbolId}
                            size={40}
                          />
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center">
                            <TeamLogo
                              primaryColor={userTeam?.colors.primary || '#fff'}
                              secondaryColor={userTeam?.colors.secondary || '#333'}
                              patternId="none"
                              symbolId="Shield"
                              size={32}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] sm:text-xs font-black text-white uppercase tracking-tight block truncate w-20 sm:w-32">{userTeam?.name}</span>
                      <span className="text-[8px] font-bold text-cyan-400 opacity-80 uppercase">{(nextMatchData.userPower / 100).toFixed(1)}k</span>
                    </div>
                  </div>

                  {/* VS Central Badge */}
                  <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-slate-950 border border-white/10 flex items-center justify-center shadow-2xl relative z-20">
                    <span className="text-[10px] sm:text-xs font-black text-white italic tracking-tighter">VS</span>
                  </div>

                  {/* Away Team */}
                  <div className="flex flex-col items-center gap-2 flex-1 group/team">
                    <div className="relative">
                      <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-[2.5rem] glass-card bg-white/5 border-white/10 flex items-center justify-center shadow-2xl transition-transform duration-500 relative overflow-hidden group-hover/team:neon-border-cyan">
                        {nextMatchData.opponent?.logo ? (
                          <TeamLogo
                            primaryColor={nextMatchData.opponent.logo.primary}
                            secondaryColor={nextMatchData.opponent.logo.secondary}
                            patternId={nextMatchData.opponent.logo.patternId as any}
                            symbolId={nextMatchData.opponent.logo.symbolId}
                            size={40}
                          />
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center">
                            <TeamLogo
                              primaryColor={nextMatchData.opponent?.colors.primary || '#fff'}
                              secondaryColor={nextMatchData.opponent?.colors.secondary || '#333'}
                              patternId="none"
                              symbolId="Shield"
                              size={32}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] sm:text-xs font-black text-white uppercase tracking-tight block truncate w-20 sm:w-32">{nextMatchData.opponent?.name}</span>
                      <span className="text-[8px] font-bold text-white/30 uppercase">{(nextMatchData.opponentPower / 100).toFixed(1)}k</span>
                    </div>
                  </div>
                </div>

                {/* Match Info Badge */}
                <div className="mt-8 flex items-center gap-6 px-6 py-3 glass-card rounded-2xl border-white/10 shadow-inner">
                  <div className="flex items-center gap-2">
                    {nextMatchData.status === 'LOCKED' ? <Lock size={14} className="text-yellow-500" /> : <Clock size={14} className="text-cyan-400" />}
                    <span className={`text-xs font-black tabular-nums tracking-widest ${nextMatchData.status === 'LOCKED' ? 'text-yellow-500' : 'text-white'}`}>
                      {nextMatchData.status === 'LOCKED' ? 'LOCK' : nextMatchData.match.time}
                    </span>
                  </div>
                  <div className="w-[1px] h-4 bg-white/10" />
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-cyan-400" />
                    <span className="text-xs font-black text-white uppercase tracking-widest">HOJE</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-slate-500 gap-4">
                <div className="p-6 glass-card rounded-full border-white/5 opacity-30">
                  <Activity size={32} />
                </div>
                <span className="text-xs font-black uppercase tracking-[0.4em] italic opacity-40">Aguardando Calendário</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-6 border-t border-white/10">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-0.5">Expectativa</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-cyan-400 tabular-nums uppercase italic neon-text-cyan">
                    {nextMatchData ? (nextMatchData.userPower > nextMatchData.opponentPower ? 'Favorito' : 'Desafiante') : '---'}
                  </span>
                </div>
              </div>
              {nextMatchData && (
                <div className="flex gap-3">
                  <button
                    onClick={handleMockVod}
                    className="p-4 glass-card text-white/30 hover:text-cyan-400 hover:neon-border-cyan border-white/5 rounded-2xl transition-all flex items-center justify-center group"
                    title="Testar VOD com dados simulados"
                  >
                    <Activity size={16} className="group-hover:animate-pulse" />
                  </button>
                  <button
                    disabled={nextMatchData.status === 'SCHEDULED'}
                    onClick={() => setSelectedMatchReport(nextMatchData.match)}
                    className={`px-8 py-4 font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl transition-all shadow-[0_15px_35px_rgba(0,0,0,0.5)] active:scale-95 flex items-center gap-3 ${nextMatchData.status === 'PLAYING'
                      ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20'
                      : nextMatchData.status === 'LOCKED' || nextMatchData.status === 'FINISHED' || (nextMatchData.match && nextMatchData.match.played)
                        ? 'bg-white text-black hover:bg-cyan-400 transition-colors'
                        : 'bg-white/5 text-white/10 cursor-not-allowed border-white/5'
                      }`}
                  >
                    {nextMatchData.status === 'PLAYING' ? <Eye size={16} fill="currentColor" /> : <Zap size={16} fill="currentColor" />}
                    {nextMatchData.status === 'PLAYING' ? 'ASSISTIR' : nextMatchData.status === 'LOCKED' ? 'PRÉVIA' : nextMatchData.status === 'FINISHED' || nextMatchData.match.played ? 'VER VOD' : 'AGUARDANDO'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CARD 2: RESUMO FINANCEIRO / RATING */}
        <div className="relative group overflow-hidden rounded-[2.5rem] glass-card border-white/10 p-6 transition-all hover:neon-border-magenta shadow-xl">
          <div className="relative z-10 flex flex-col h-full justify-between gap-6">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black text-rose-400 uppercase tracking-[0.4em]">Financeiro</span>
                <h3 className="text-xl font-black text-white tracking-tighter uppercase italic neon-text-white">Tesouraria</h3>
              </div>
              <div className="p-2 glass-card rounded-xl border-white/10 bg-white/5">
                <Wallet size={18} className="text-rose-400" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white tabular-nums tracking-tightest neon-text-white italic">
                {totalPoints.toLocaleString()}
              </span>
              <span className="text-[10px] font-black text-rose-500 uppercase italic">PTS</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[8px] font-black uppercase tracking-widest">
                <span className="text-white/40">Evolução</span>
                <span className="text-white">{(pointsLeft / 100).toFixed(1)}k / {(powerCap / 100).toFixed(1)}k</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full bg-rose-500 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.4)] transition-all duration-1000"
                  style={{ width: `${Math.min(100, (pointsLeft / powerCap) * 100)}%` }}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleAdvanceDay()}
                className="flex-1 py-3 bg-white text-black font-black text-[9px] uppercase tracking-[0.3em] flex items-center justify-center gap-2 rounded-xl active:scale-95 transition-all shadow-lg"
              >
                <FastForward size={12} fill="currentColor" />
                AVANÇAR DIA
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CARD 3: MANCHETE (Última Notícia) */}
      <div className="relative group overflow-hidden rounded-[2rem] glass-card border-white/10 p-6 transition-all hover:neon-border-magenta shadow-2xl">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/10 blur-[100px] group-hover:bg-purple-500/20 transition-all duration-700" />

        <div className="relative z-10 flex flex-col h-full justify-between gap-6">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] mb-1">Feed Global</span>
              <h3 className="text-xl font-black text-white tracking-tighter uppercase italic neon-text-white">Manchete</h3>
            </div>
            <div className="p-2 glass-card rounded-xl border-white/10 bg-white/5">
              <Newspaper size={18} className="text-purple-400" />
            </div>
          </div>

          <div className="flex flex-col gap-3 py-2">
            <div className="px-3 py-1 glass-card bg-purple-500/20 border-purple-500/30 rounded-full self-start">
              <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest italic">Urgente</span>
            </div>
            <h4 className="text-lg font-black text-white leading-tight tracking-tight line-clamp-2 group-hover:text-purple-300 transition-colors neon-text-white">
              {lastHeadline.title}
            </h4>
            <p className="text-xs text-white/40 font-bold leading-relaxed line-clamp-2">
              {lastHeadline.message}
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse shadow-[0_0_5px_rgba(168,85,247,0.8)]" />
              <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Feed Atualizado</span>
            </div>
            <ChevronRight size={16} className="text-purple-500 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: Agenda and Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Agenda de Jogos */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em] flex items-center gap-3">
              <div className="w-4 h-[1px] bg-cyan-500/50" />
              Calendário Oficial
            </h3>
            <button className="text-[8px] text-white/30 hover:text-cyan-400 font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 group">
              Histórico <ChevronRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {upcomingMatches.slice(0, 4).map((m, i) => (
              <div key={i} className="group relative glass-card border-white/5 rounded-2xl p-4 hover:neon-border-cyan transition-all cursor-pointer overflow-hidden">
                <div className="absolute top-0 right-0 w-12 h-12 bg-cyan-500/5 blur-xl group-hover:bg-cyan-500/10 transition-all" />

                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[8px] text-cyan-400 font-black uppercase tracking-widest italic">{m.date.split('-').reverse().slice(0, 2).join('/')}</span>
                    <span className="text-[8px] text-white font-black tabular-nums">{m.time}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-white/60 font-black truncate uppercase tracking-tighter">{m.home}</span>
                      <span className="text-[10px] text-white font-black tabular-nums">0</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-white/60 font-black truncate uppercase tracking-tighter">{m.away}</span>
                      <span className="text-[10px] text-white font-black tabular-nums">0</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Logs de Sistema / Atividades */}
        <div className="space-y-4">
          <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em] flex items-center gap-3 px-2">
            <div className="w-4 h-[1px] bg-purple-500/50" />
            Sistema Log
          </h3>
          <div className="glass-card border-white/5 rounded-2xl overflow-hidden shadow-xl">
            <div className="divide-y divide-white/5">
              {[
                { label: 'Otimização Tática', time: 'AGORA', status: 'cyan', icon: Zap },
                { label: 'Mercado Aberto', time: '12m', status: 'emerald', icon: ShoppingCart },
                { label: 'Scout Norte', time: '45m', status: 'purple', icon: Search },
                { label: 'Sincronização', time: '2h', status: 'slate', icon: Database },
              ].map((n, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition-all cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg glass-card border-white/5 bg-white/5 group-hover:neon-border-${n.status}`}>
                      <n.icon size={12} className={`text-${n.status}-500 group-hover:scale-110 transition-transform`} />
                    </div>
                    <span className="text-[10px] text-white/40 group-hover:text-white transition-colors font-black uppercase tracking-tight">{n.label}</span>
                  </div>
                  <span className="text-[8px] text-white/20 font-black tabular-nums group-hover:text-white/40 transition-colors">{n.time}</span>
                </div>
              ))}
            </div>
            <div className="p-3 bg-white/[0.02] border-t border-white/5 flex items-center justify-center">
              <button className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] hover:text-white transition-colors">Acessar Console Completo</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
