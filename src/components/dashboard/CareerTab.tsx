import React, { useState } from 'react';
import { useGame, useGameState, useGameDispatch } from '../../store/GameContext';
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
const { Home, Trophy, ShoppingCart, Database, User, Clock, Newspaper, TrendingUp, AlertCircle, Award, Calendar, Users, Activity, Sliders, Flame, Target, Zap, FastForward, Globe, MessageSquare, AlertTriangle, TrendingDown, Briefcase, Star, Search, Crown, ChevronRight, Lock, ChevronDown, Eye, Shield, Brain, X, Save, Play } = LucideIcons;


export const CareerTab = (props: any) => {
  const { setState, addToast, togglePause, setTimeSpeed } = useGameDispatch();
  const { state, isPaused, timeSpeed } = useGameState();
  const dashData = useDashboardData();
  const { userTeam, upcomingMatches } = dashData;
  const { 
    handleStartReport, 
    handleMockReport, 
    selectedMatchReport, 
    setSelectedMatchReport, 
    isWatchingReport, 
    setIsWatchingReport, 
    reportSecond, 
    setReportSecond 
  } = useMatchSimulation(userTeam?.id || null);
  const { handleUpdateTactics } = useTactics(userTeam?.id || null);
  const { handleSetFocus, handleStartCardLab, handleChemistryBoost } = useTraining(userTeam?.id || null);
  const { handleAdvanceDay } = useGameDay();
  const [isCareerModalOpen, setIsCareerModalOpen] = useState(false);
  const [gmRandomPlayer, setGmRandomPlayer] = useState<Player | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const handleSimulateGameReport = (mode: 'live' | 'finished') => {
    handleMockReport(mode, "MANCHETE GM: Escândalo em Neo-City! Time mockado vence de goleada histórica!");
  };

  const handleOpenRandomPlayer = () => {
    // Generate a random player from the state for preview
    const playerIds = Object.keys(state.players);
    if (playerIds.length > 0) {
      const randomId = playerIds[Math.floor(Math.random() * playerIds.length)];
      setGmRandomPlayer(state.players[randomId]);
    }
  };

  console.log('Dashboard: Renderizando aba Carreira...');

  if (selectedMatchReport) {
    const homeTeam = state.teams[selectedMatchReport.homeTeamId];
    const awayTeam = state.teams[selectedMatchReport.awayTeamId];

    if (homeTeam && awayTeam) {
      const matchStatus = selectedMatchReport.status;

      if (matchStatus === 'PLAYING' || (isWatchingReport && reportSecond < 360)) {
        return (
          <div className="max-w-2xl mx-auto py-8">
            <LiveReport
              match={selectedMatchReport}
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              players={state.players}
              currentSecond={reportSecond}
            />
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => {
                  setSelectedMatchReport(null);
                  setIsWatchingReport(false);
                  setReportSecond(0);
                }}
                className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white/40 uppercase tracking-[0.3em] hover:bg-white/10 transition-colors"
              >
                VOLTAR AO GM PANEL
              </button>
            </div>
          </div>
        );
      } else {
        return (
          <div className="max-w-2xl mx-auto py-8 animate-in zoom-in-95 duration-500">
            <PostGameReport
              match={selectedMatchReport}
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              players={state.players}
              onClose={() => {
                setSelectedMatchReport(null);
                setReportSecond(0);
              }}
            />
            <button
              onClick={() => {
                setSelectedMatchReport(null);
                setReportSecond(0);
              }}
              className="mt-6 w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white/40 uppercase tracking-[0.3em] hover:bg-white/10 transition-colors"
            >
              FECHAR RELATÓRIO
            </button>
          </div>
        );
      }
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 sm:pb-0">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left Column - Team Context */}
        <div className="lg:col-span-8 space-y-4 sm:space-y-6">
          {/* User Team Card */}
          <div className="glass-card-neon border-cyan-500/30 p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-cyan-500/10 transition-colors duration-700" />
            
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 relative z-10">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full animate-pulse" />
                <div className="w-20 h-20 sm:w-28 sm:h-28 glass-card rounded-2xl sm:rounded-[2rem] flex items-center justify-center border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                  {userTeam ? (
                    <TeamLogo 
                      primaryColor={userTeam.logo?.primary || '#fff'} 
                      secondaryColor={userTeam.logo?.secondary || '#000'}
                      patternId={userTeam.logo?.patternId as any}
                      symbolId={userTeam.logo?.symbolId}
                      size={window.innerWidth < 640 ? 48 : 64}
                    />
                  ) : (
                    <Users size={window.innerWidth < 640 ? 32 : 48} className="text-cyan-400/50" />
                  )}
                </div>
              </div>

              <div className="text-center sm:text-left flex-1">
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                  <h2 className="text-2xl sm:text-4xl font-black text-white uppercase italic tracking-tight neon-text-cyan truncate max-w-[250px] sm:max-w-none">
                    {userTeam?.name || 'SEM CLUBE'}
                  </h2>
                  <div className="bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full flex items-center gap-2">
                    <Trophy size={10} className="text-cyan-400" />
                    <span className="text-[8px] sm:text-[10px] font-black text-cyan-400 uppercase tracking-widest">
                      LIGA {userTeam?.district || 'DESCONHECIDA'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap justify-center sm:justify-start gap-4 sm:gap-6 mt-3">
                  <div className="flex flex-col">
                    <span className="text-[7px] sm:text-[9px] text-cyan-400/50 font-black uppercase tracking-widest">Reputação</span>
                    <div className="flex items-center gap-1">
                      <Star size={10} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-xs sm:text-lg font-mono font-black text-white">4.8</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tactics & Training Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="glass-card border-white/5 p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] group hover:border-purple-500/30 transition-all duration-500">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 glass-card rounded-xl flex items-center justify-center text-purple-400 border border-purple-500/30">
                    <Target size={window.innerWidth < 640 ? 16 : 20} />
                  </div>
                  <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-widest">Foco Tático</h3>
                </div>
                <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                  <Sliders size={14} className="text-white/20" />
                </button>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div className="bg-white/5 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[8px] sm:text-[10px] text-purple-400/70 font-black uppercase tracking-widest">Mentalidade</span>
                    <span className="text-[9px] sm:text-[11px] text-white font-black uppercase italic">Ultra-Ofensiva</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full w-[85%] bg-gradient-to-r from-purple-500 to-fuchsia-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card border-white/5 p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] group hover:border-emerald-500/30 transition-all duration-500">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 glass-card rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                    <Flame size={window.innerWidth < 640 ? 16 : 20} />
                  </div>
                  <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-widest">Card Lab</h3>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 rounded-full">
                  <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[7px] sm:text-[8px] font-black text-emerald-400 uppercase tracking-widest">Ativo</span>
                </div>
              </div>
              <div className="bg-emerald-500/5 border border-emerald-500/20 p-3 sm:p-4 rounded-xl sm:rounded-2xl flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-[9px] sm:text-[11px] text-white/70 font-medium mb-2 leading-relaxed">Próxima evolução disponível em:</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg sm:text-2xl font-mono font-black text-emerald-400">02</span>
                    <span className="text-[8px] sm:text-[10px] text-emerald-500/50 font-black uppercase">dias</span>
                  </div>
                </div>
                <button className="w-10 h-10 sm:w-12 sm:h-12 glass-card rounded-xl flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20 transition-all group">
                  <Zap size={window.innerWidth < 640 ? 16 : 20} className="group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Side Panels */}
        <div className="lg:col-span-4 space-y-4 sm:space-y-6">
          {/* Calendar Mini View */}
          <div className="glass-card border-white/5 p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] bg-gradient-to-br from-white/[0.02] to-transparent">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 glass-card rounded-xl flex items-center justify-center text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                  <Calendar size={window.innerWidth < 640 ? 16 : 20} />
                </div>
                <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-widest">Calendário</h3>
              </div>
              <span className="text-[8px] sm:text-[10px] font-black text-cyan-400/50 uppercase tracking-[0.2em]">Janeiro 2050</span>
            </div>

            <div className="space-y-2 sm:space-y-3">
              {upcomingMatches.length > 0 ? (
                upcomingMatches.slice(0, 2).map((match, idx) => {
                  const opponent = state.teams[match.homeTeamId === userTeam?.id ? match.awayTeamId : match.homeTeamId];
                  return (
                    <div key={match.id} className="flex items-center justify-between bg-white/5 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5 group hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 glass-card rounded-lg flex items-center justify-center border border-white/10">
                          {opponent ? (
                            <TeamLogo 
                              primaryColor={opponent.logo?.primary || '#fff'} 
                              secondaryColor={opponent.logo?.secondary || '#000'}
                              patternId={opponent.logo?.patternId as any}
                              symbolId={opponent.logo?.symbolId}
                              size={window.innerWidth < 640 ? 20 : 24}
                            />
                          ) : <Users size={16} className="text-white/20" />}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] sm:text-[11px] font-black text-white uppercase truncate max-w-[80px] sm:max-w-none">
                            {opponent?.name || 'DESCONHECIDO'}
                          </span>
                          <span className="text-[7px] sm:text-[9px] text-cyan-400/50 font-black uppercase tracking-widest">
                            {new Date(match.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[7px] sm:text-[9px] text-white/20 font-black uppercase tracking-widest mb-1">
                          {match.homeTeamId === userTeam?.id ? 'CASA' : 'FORA'}
                        </span>
                        <div className="px-2 py-0.5 bg-white/5 rounded border border-white/10">
                          <span className="text-[8px] sm:text-[10px] font-mono text-white/60">VS</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center border-2 border-dashed border-white/5 rounded-2xl">
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Sem jogos agendados</span>
                </div>
              )}
            </div>
          </div>

          {/* GM Panel */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-red-500/30 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-[0_0_15px_rgba(239,68,68,0.1)] flex flex-col gap-2 sm:gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl -mr-12 -mt-12" />
            <h3 className="text-[9px] sm:text-[11px] font-black text-red-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-1 relative z-10">
              <Database size={window.innerWidth < 640 ? 12 : 16} className="drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]" />
              GM Panel <span className="text-[7px] opacity-50 font-normal ml-1">(DEV)</span>
            </h3>

            <div className="grid grid-cols-2 gap-2 sm:gap-4 relative z-10">
              <button
                onClick={handleOpenRandomPlayer}
                className="flex items-center gap-2 sm:gap-3 bg-black/40 border border-white/5 hover:border-red-500/50 p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all group"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 group-hover:bg-red-500/20 transition-colors">
                  <User size={window.innerWidth < 640 ? 16 : 20} />
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="text-[9px] sm:text-[11px] font-black text-white uppercase tracking-tighter">Skins</span>
                  <span className="text-[7px] sm:text-[9px] text-slate-500 uppercase font-bold">Mini Card</span>
                </div>
              </button>

              <button
                onClick={() => handleSimulateGameReport('live')}
                className="flex items-center gap-2 sm:gap-3 bg-black/40 border border-white/5 hover:border-red-500/50 p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all group"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 group-hover:bg-red-500/20 transition-colors">
                  <Activity size={window.innerWidth < 640 ? 16 : 20} />
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="text-[9px] sm:text-[11px] font-black text-white uppercase tracking-tighter">Mock</span>
                  <span className="text-[7px] sm:text-[9px] text-slate-500 uppercase font-bold">Relatório</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* World Clock Control */}
        <div className="p-3 sm:p-6 bg-white/5 border border-white/10 rounded-2xl sm:rounded-[2rem] space-y-3 sm:space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl border transition-all ${isPaused ? 'bg-amber-500/10 border-amber-500/30' : 'bg-cyan-500/10 border-cyan-500/30'}`}>
                <Clock size={window.innerWidth < 640 ? 16 : 20} className={isPaused ? 'text-amber-500' : 'text-cyan-400 animate-pulse'} />
              </div>
              <div>
                <h4 className="text-[10px] sm:text-xs font-black text-white uppercase tracking-widest">Relógio Global</h4>
                <p className="text-[8px] sm:text-[10px] text-slate-500 font-bold uppercase">{isPaused ? 'Simulação Pausada' : 'Simulação Ativa'}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg sm:text-xl font-black text-white tabular-nums tracking-tighter italic">
                {new Date(state.world.currentDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-[8px] sm:text-[9px] font-black text-cyan-400 uppercase tracking-widest">
                Dia {Math.floor((new Date(state.world.currentDate).getTime() - new Date('2050-01-01').getTime()) / (1000 * 60 * 60 * 24)) + 1}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <button
              onClick={togglePause}
              className={`py-3 sm:py-4 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${isPaused ? 'bg-cyan-500 text-black hover:bg-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
            >
              {isPaused ? <Play size={12} fill="currentColor" /> : <Clock size={12} />}
              {isPaused ? 'RETOMAR' : 'PAUSAR'}
            </button>
            <div className="flex bg-white/5 rounded-2xl p-1 gap-1">
              {[1, 60, 1440].map((s) => (
                <button
                  key={s}
                  onClick={() => setTimeSpeed(s)}
                  className={`flex-1 py-3 rounded-xl text-[8px] font-black tracking-tighter transition-all ${timeSpeed === s ? 'bg-white/10 text-white' : 'text-white/20 hover:text-white/40'}`}
                >
                  {s === 1 ? '1m' : s === 60 ? '1h' : '1d'}/s
                </button>
              ))}
            </div>
          </div>
          
          <button
            onClick={handleAdvanceDay}
            className="w-full flex items-center justify-center gap-2 bg-black/40 border border-white/5 hover:border-red-500/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all group"
          >
            <FastForward size={14} className="text-red-400" />
            <span className="text-[9px] sm:text-[10px] font-black text-white uppercase tracking-widest">Avançar Dia</span>
          </button>
        </div>

        {/* Mini Card Display Area */}
        <div className="bg-black/60 rounded-2xl border border-white/10 flex items-center justify-center p-6 relative min-h-[300px] shadow-inner overflow-hidden">
          {/* Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-t from-red-500/5 to-transparent pointer-events-none" />

          {gmRandomPlayer ? (
            <div className="w-[180px] sm:w-[200px] transform hover:scale-105 transition-transform duration-500 relative z-10 group">
              <div className="absolute -inset-4 bg-red-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <PlayerCard
                player={gmRandomPlayer}
                variant="full"
                onClick={() => setSelectedPlayer(gmRandomPlayer)}
              />
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-red-600 text-[7px] font-black text-white px-3 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(220,38,38,0.5)] z-20 border border-white/20 whitespace-nowrap">
                Skin Preview Mode
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 opacity-20 text-slate-500">
              <User size={32} />
              <span className="text-[8px] uppercase font-bold">Aguardando...</span>
            </div>
          )}
        </div>
      </div>

      {/* Evolução / Pontos de Poder Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3 px-0">
        <div className="md:col-span-2 glass-card border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-2xl">
          <div className="flex items-center justify-between mb-3 sm:mb-5">
            <h3 className="text-[9px] sm:text-[11px] font-black text-white/60 uppercase tracking-[0.2em] flex items-center gap-2 sm:gap-3">
              <TrendingUp size={window.innerWidth < 640 ? 12 : 16} className="text-cyan-400" />
              Evolução (pts)
            </h3>
            <span className="text-[8px] sm:text-[10px] text-emerald-400 font-black bg-emerald-500/10 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg border border-emerald-500/20 italic">+12%</span>
          </div>

          <div className="h-24 sm:h-40 flex items-end justify-between gap-1 sm:gap-1.5 px-1 relative border-l border-b border-white/10">
            {/* Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
              <div className="h-px bg-white/20 w-full border-dashed" />
              <div className="h-px bg-white/20 w-full border-dashed" />
              <div className="h-px bg-white/20 w-full border-dashed" />
            </div>

            {/* Mock Chart Bars */}
            {[30, 45, 40, 55, 60, 50, 65, 75, 70, 85, 90, 80].map((h, i) => (
              <div key={i} className="w-full bg-white/5 rounded-t-[2px] sm:rounded-t-xl relative group z-10 overflow-hidden">
                <div
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-600 to-cyan-400 group-hover:from-white group-hover:to-white transition-all rounded-t-[2px] sm:rounded-t-xl shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                  style={{ height: `${h}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1.5 sm:mt-3 px-1">
            <span className="text-[7px] sm:text-[9px] text-white/20 font-black uppercase tracking-widest">R1</span>
            <span className="text-[7px] sm:text-[9px] text-white/20 font-black uppercase tracking-widest">R12</span>
          </div>
        </div>

        {/* Top Player Variations */}
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-[0_0_15px_rgba(0,0,0,0.2)] flex flex-col gap-2 sm:gap-4">
          <h3 className="text-[9px] sm:text-[11px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2 mb-0.5">
            <Zap size={window.innerWidth < 640 ? 12 : 16} className="text-purple-400" />
            Variação Atletas
          </h3>

          <div className="flex flex-col gap-2 sm:gap-3">
            {[
              { pos: 'ATA', name: 'K. Nexus', val: '+45', color: 'cyan', up: true },
              { pos: 'MEI', name: 'J. Storm', val: '+32', color: 'purple', up: true },
              { pos: 'DEF', name: 'M. Steel', val: '-15', color: 'red', up: false }
            ].map((p, i) => (
              <div key={i} className="flex items-center justify-between bg-white/5 p-2 sm:p-3 rounded-lg sm:rounded-xl border border-white/5 group hover:bg-white/10 transition-colors cursor-pointer">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 bg-${p.color}-500/10 rounded sm:rounded-lg border border-${p.color}-500/20 flex items-center justify-center text-[8px] sm:text-[10px] font-black text-${p.color}-400`}>
                    {p.pos}
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-[9px] sm:text-[12px] font-black text-white group-hover:text-${p.color}-300 transition-colors truncate max-w-[80px] sm:max-w-none`}>
                      {p.name}
                    </span>
                  </div>
                </div>
                <span className={`text-[9px] sm:text-[12px] font-mono font-black ${p.up ? 'text-emerald-400' : 'text-red-400'}`}>
                  {p.val}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
