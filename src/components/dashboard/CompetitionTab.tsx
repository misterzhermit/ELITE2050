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
import * as LucideIcons from 'lucide-react';
const { Home, Trophy, ShoppingCart, Database, User, Clock, Newspaper, Wallet, TrendingUp, AlertCircle, Award, Calendar, Users, Activity, Sliders, Flame, Target, Zap, FastForward, Globe, MessageSquare, AlertTriangle, TrendingDown, Briefcase, Star, Search, Crown, ChevronRight, Lock, ChevronDown, Eye, Shield, Brain, X, Save } = LucideIcons;


export const CompetitionTab = (props: any) => {
  const { state, setState } = useGame();
  const dashData = useDashboardData();
  const { userTeam, upcomingMatches } = dashData;
  const { handleMockVod, setSelectedMatchReport } = useMatchSimulation(userTeam?.id || null);
  const { handleUpdateTactics } = useTactics(userTeam?.id || null);
  const { handleSetFocus, handleStartCardLab, handleChemistryBoost } = useTraining(userTeam?.id || null);
  const { handleAdvanceDay } = useGameDay();
  const calendarEvents: any[] = []; // TODO: derive from match schedule

  const nextMatch = upcomingMatches[0];
  if (!nextMatch) return (
    <div className="h-64 flex flex-col items-center justify-center text-slate-500 gap-4">
      <Calendar size={48} className="opacity-20" />
      <span className="text-xs font-black uppercase tracking-widest italic">Nenhuma partida agendada</span>
    </div>
  );

  const homeTeam = state.teams[nextMatch.homeId];
  const awayTeam = state.teams[nextMatch.awayId];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-6xl mx-auto pb-12">
      {/* Main Highlight Match - Compact Redesign */}
      <div className="relative overflow-hidden rounded-3xl bg-black/40 backdrop-blur-3xl border border-white/10 p-6 shadow-2xl group hover:border-cyan-500/30 transition-all">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 opacity-50" />

        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                <Trophy size={16} className="text-cyan-400" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white uppercase tracking-tight italic">
                  {nextMatch.type} <span className="text-slate-500 text-sm not-italic font-bold">• Rodada {nextMatch.id.split('_')[1]}</span>
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
              <Clock size={12} className="text-cyan-400" />
              <span className="text-xs font-bold text-white tabular-nums">{nextMatch.time}</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            {/* Home Team */}
            <div className="flex items-center gap-4 flex-1 justify-end group/home">
              <span className={`text-lg font-black uppercase tracking-tight ${nextMatch.homeId === userTeam?.id ? 'text-cyan-400' : 'text-white'}`}>
                {nextMatch.home}
              </span>
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-lg relative overflow-hidden group-hover/home:border-cyan-500/50 transition-colors">
                {homeTeam?.logo ? (
                  <TeamLogo
                    primaryColor={homeTeam.logo.primary}
                    secondaryColor={homeTeam.logo.secondary}
                    patternId={homeTeam.logo.patternId as any}
                    symbolId={homeTeam.logo.symbolId}
                    size={40}
                  />
                ) : (
                  <TeamLogo
                    primaryColor={homeTeam?.colors.primary || '#fff'}
                    secondaryColor={homeTeam?.colors.secondary || '#333'}
                    patternId="none"
                    symbolId="Shield"
                    size={32}
                  />
                )}
              </div>
            </div>

            {/* VS */}
            <div className="flex flex-col items-center px-4">
              <span className="text-2xl font-black text-white/10 italic">VS</span>
            </div>

            {/* Away Team */}
            <div className="flex items-center gap-4 flex-1 group/away">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-lg relative overflow-hidden group-hover/away:border-purple-500/50 transition-colors">
                {awayTeam?.logo ? (
                  <TeamLogo
                    primaryColor={awayTeam.logo.primary}
                    secondaryColor={awayTeam.logo.secondary}
                    patternId={awayTeam.logo.patternId as any}
                    symbolId={awayTeam.logo.symbolId}
                    size={40}
                  />
                ) : (
                  <TeamLogo
                    primaryColor={awayTeam?.colors.primary || '#fff'}
                    secondaryColor={awayTeam?.colors.secondary || '#333'}
                    patternId="none"
                    symbolId="Shield"
                    size={32}
                  />
                )}
              </div>
              <span className={`text-lg font-black uppercase tracking-tight ${nextMatch.awayId === userTeam?.id ? 'text-purple-400' : 'text-white'}`}>
                {nextMatch.away}
              </span>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <button className="w-full max-w-xs py-2 bg-white/5 hover:bg-cyan-500 hover:text-black border border-white/10 text-xs font-black uppercase tracking-[0.2em] rounded-xl transition-all">
              Gerenciar Escalação
            </button>
          </div>
        </div>
      </div>

      {/* Timeline Events Redesign */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
            <Calendar size={16} className="text-cyan-400" />
            Cronograma & Notícias
          </h3>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Temporada 2050</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {calendarEvents.map((event: any) => {
            if (event.type === 'match') {
              const homeTeam = state.teams[event.data.homeId];
              const awayTeam = state.teams[event.data.awayId];
              const isPlayed = event.status === 'played';
              const isHomeUser = event.data.homeId === userTeam?.id;
              const isAwayUser = event.data.awayId === userTeam?.id;

              return (
                <div
                  key={event.id}
                  className={`group relative overflow-hidden rounded-lg border transition-all duration-300 ${isPlayed
                    ? 'bg-slate-900/40 border-slate-500/10 opacity-60 hover:opacity-100'
                    : 'bg-gradient-to-r from-cyan-950/20 to-black/40 border-cyan-500/20 hover:border-cyan-400/50 hover:shadow-[0_0_10px_rgba(34,211,238,0.1)]'
                    }`}
                >
                  {/* Hover Effect */}
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="p-2 flex items-center justify-between gap-2 relative z-10 h-10">
                    {/* Date & Time */}
                    <div className="flex flex-col items-center justify-center min-w-[2.5rem] pr-2 border-r border-white/5 h-full">
                      <span className="text-[9px] font-black text-white/50 uppercase leading-none mb-0.5">
                        {event.date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')}
                      </span>
                      <span className={`text-[9px] font-bold ${isPlayed ? 'text-slate-500' : 'text-cyan-400'} leading-none`}>
                        {isPlayed ? 'FIM' : event.data.time}
                      </span>
                    </div>

                    {/* Teams & Score */}
                    <div className="flex-1 flex items-center justify-between gap-1.5 min-w-0">
                      {/* Home */}
                      <div className="flex items-center gap-1.5 flex-1 justify-end min-w-0">
                        <span className={`text-[9px] font-bold uppercase truncate text-right ${isHomeUser ? 'text-cyan-400' : 'text-slate-400'}`}>
                          {homeTeam?.name || event.data.home}
                        </span>
                        <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                          {homeTeam?.logo ? (
                            <TeamLogo
                              primaryColor={homeTeam.logo.primary}
                              secondaryColor={homeTeam.logo.secondary}
                              patternId={homeTeam.logo.patternId as any}
                              symbolId={homeTeam.logo.symbolId}
                              size={20}
                            />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-slate-700" />
                          )}
                        </div>
                      </div>

                      {/* VS/Score */}
                      <div className="flex items-center justify-center min-w-[1.5rem]">
                        {isPlayed ? (
                          <span className="text-[10px] font-black text-white tracking-widest bg-white/5 px-1 rounded border border-white/5">
                            {event.data.homeScore}-{event.data.awayScore}
                          </span>
                        ) : (
                          <span className="text-[8px] font-black text-white/10 italic">VS</span>
                        )}
                      </div>

                      {/* Away */}
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                          {awayTeam?.logo ? (
                            <TeamLogo
                              primaryColor={awayTeam.logo.primary}
                              secondaryColor={awayTeam.logo.secondary}
                              patternId={awayTeam.logo.patternId as any}
                              symbolId={awayTeam.logo.symbolId}
                              size={20}
                            />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-slate-700" />
                          )}
                        </div>
                        <span className={`text-[9px] font-bold uppercase truncate ${isAwayUser ? 'text-cyan-400' : 'text-slate-400'}`}>
                          {awayTeam?.name || event.data.away}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // News Item (Simplified)
            return (
              <div
                key={event.id}
                className="group relative overflow-hidden rounded-xl border border-purple-500/20 bg-purple-900/10 p-3 flex items-center gap-3 hover:border-purple-500/50 transition-all"
              >
                <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                  <Newspaper size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-purple-400 transition-colors">
                    {event.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 truncate">
                    {event.subtitle}
                  </p>
                </div>
                <div className="text-[9px] font-bold text-slate-500 uppercase">
                  {event.date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
