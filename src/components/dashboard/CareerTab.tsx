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
const { Home, Trophy, ShoppingCart, Database, User, Clock, Newspaper, Wallet, TrendingUp, AlertCircle, Award, Calendar, Users, Activity, Sliders, Flame, Target, Zap, FastForward, Globe, MessageSquare, AlertTriangle, TrendingDown, Briefcase, Star, Search, Crown, ChevronRight, Lock, ChevronDown, Eye, Shield, Brain, X, Save, Play } = LucideIcons;


export const CareerTab = (props: any) => {
  const { setState, addToast, togglePause, setTimeSpeed } = useGameDispatch();
  const { state, isPaused, timeSpeed } = useGameState();
  const dashData = useDashboardData();
  const { userTeam, upcomingMatches } = dashData;
  const { handleStartVod, handleMockVod, selectedMatchReport, setSelectedMatchReport, isWatchingVod, setIsWatchingVod, vodSecond, setVodSecond } = useMatchSimulation(userTeam?.id || null);
  const { handleUpdateTactics } = useTactics(userTeam?.id || null);
  const { handleSetFocus, handleStartCardLab, handleChemistryBoost } = useTraining(userTeam?.id || null);
  const { handleAdvanceDay } = useGameDay();
  const [isCareerModalOpen, setIsCareerModalOpen] = useState(false);
  const [gmRandomPlayer, setGmRandomPlayer] = useState<Player | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const handleSimulateGameReport = (mode: 'live' | 'finished') => {
    handleMockVod(mode, "MANCHETE GM: Escândalo em Neo-City! Time mockado vence de goleada histórica!");
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

      if (matchStatus === 'PLAYING' || (isWatchingVod && vodSecond < 360)) {
        return (
          <div className="max-w-2xl mx-auto py-8">
            <LiveReport
              match={selectedMatchReport}
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              players={state.players}
              currentSecond={vodSecond}
            />
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => {
                  setSelectedMatchReport(null);
                  setIsWatchingVod(false);
                  setVodSecond(0);
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
                setVodSecond(0);
              }}
            />
            <button
              onClick={handleStartVod}
              className="mt-6 w-full py-4 bg-cyan-500 rounded-2xl text-[10px] font-black text-black uppercase tracking-[0.3em] hover:bg-cyan-400 transition-all flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(6,182,212,0.3)]"
            >
              <Play size={16} fill="black" /> ASSISTIR REPLAY DO VOD
            </button>
          </div>
        );
      }
    }
  }

  return (
    <div className="space-y-3 animate-in fade-in duration-500 max-w-2xl mx-auto py-2">
      {/* Current Team Modal / Find Team Section */}
      <div className="px-1">
        {userTeam ? (
          <div
            onClick={() => setIsCareerModalOpen(true)}
            className="bg-gradient-to-r from-cyan-900/40 to-blue-900/40 backdrop-blur-md border border-cyan-500/30 rounded-xl p-3 flex items-center justify-between group hover:border-cyan-400 cursor-pointer transition-all shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/30 rounded-lg flex items-center justify-center overflow-hidden">
                {userTeam.logo ? (
                  <TeamLogo
                    primaryColor={userTeam.logo.primary}
                    secondaryColor={userTeam.logo.secondary}
                    patternId={userTeam.logo.patternId as any}
                    symbolId={userTeam.logo.symbolId}
                    size={24}
                  />
                ) : (
                  <div className="w-6 h-6 flex items-center justify-center">
                    <TeamLogo
                      primaryColor="#22d3ee"
                      secondaryColor="#0891b2"
                      patternId="none"
                      symbolId="Shield"
                      size={20}
                    />
                  </div>
                )}
              </div>
              <div>
                <span className="text-[8px] text-cyan-400 font-black uppercase tracking-widest">Contrato Ativo</span>
                <h3 className="text-sm font-black text-white uppercase tracking-tight leading-none mt-0.5">{userTeam.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[7px] text-slate-400 font-bold uppercase">{userTeam.squad.length} Atletas</span>
                  <div className="w-1 h-1 rounded-full bg-slate-600" />
                  <span className="text-[7px] text-emerald-400 font-bold uppercase">Série A</span>
                </div>
              </div>
            </div>
            <div className="bg-cyan-500/10 group-hover:bg-cyan-500/20 border border-cyan-500/30 px-3 py-1.5 rounded-lg text-[8px] font-black text-cyan-400 uppercase tracking-widest transition-all">
              Ver Detalhes
            </div>
          </div>
        ) : (
          <div
            onClick={() => setIsCareerModalOpen(true)}
            className="bg-black/40 backdrop-blur-md border border-amber-500/30 rounded-xl p-4 text-center group hover:border-amber-400 cursor-pointer transition-all shadow-lg"
          >
            <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto mb-2">
              <Search size={18} className="text-amber-400" />
            </div>
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Sem Clube</h3>
            <p className="text-[9px] text-slate-400 font-medium mt-1 mb-3">Sua carreira está pausada. Procure um novo desafio.</p>
            <div className="inline-block bg-amber-500/10 group-hover:bg-amber-500/20 border border-amber-500/30 px-4 py-2 rounded-lg text-[9px] font-black text-amber-400 uppercase tracking-widest transition-all">
              Procurar Time
            </div>
          </div>
        )}
      </div>

      {/* Main Stats - Compact Grid */}
      <div className="grid grid-cols-4 gap-2 px-1">
        <div className="bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-lg p-1.5 flex flex-col justify-between h-14 shadow-[0_0_10px_rgba(34,211,238,0.05)] group hover:border-cyan-400 transition-all">
          <div className="flex items-start justify-between">
            <span className="text-[7px] text-cyan-400 font-black uppercase tracking-widest">Nível</span>
            <Award size={10} className="text-cyan-400" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-sm font-black text-white leading-none">42</span>
            <span className="text-[6px] text-slate-500 font-bold uppercase">TOP 5%</span>
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-md border border-purple-500/30 rounded-lg p-1.5 flex flex-col justify-between h-14 shadow-[0_0_10px_rgba(168,85,247,0.05)] group hover:border-purple-400 transition-all">
          <div className="flex items-start justify-between">
            <span className="text-[7px] text-purple-400 font-black uppercase tracking-widest">Reputação</span>
            <Star size={10} className="text-purple-400" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-sm font-black text-white leading-none">GLB</span>
            <span className="text-[6px] text-slate-500 font-bold uppercase">Rank S</span>
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-md border border-emerald-500/30 rounded-lg p-1.5 flex flex-col justify-between h-14 shadow-[0_0_10px_rgba(16,185,129,0.05)] group hover:border-emerald-400 transition-all">
          <div className="flex items-start justify-between">
            <span className="text-[7px] text-emerald-400 font-black uppercase tracking-widest">Vitórias</span>
            <Trophy size={10} className="text-emerald-400" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-sm font-black text-white leading-none">128</span>
            <span className="text-[6px] text-slate-500 font-bold uppercase">82% WR</span>
          </div>
        </div>

        <div className="glass-card border-white/10 rounded-2xl p-2.5 flex flex-col justify-between h-16 shadow-inner group hover:neon-border-cyan transition-all">
          <div className="flex items-start justify-between">
            <span className="text-[8px] text-cyan-400 font-black uppercase tracking-widest">Títulos</span>
            <Crown size={12} className="text-cyan-400" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-lg font-black text-white leading-none neon-text-white italic">07</span>
            <span className="text-[7px] text-white/30 font-black uppercase">ELITE</span>
          </div>
        </div>
      </div>

      {/* Financial / Points Variation Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 px-1">
        {/* Team Points Evolution */}
        <div className="md:col-span-2 glass-card border-white/10 rounded-2xl p-4 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] flex items-center gap-2">
              <TrendingUp size={14} className="text-cyan-400" />
              Variação do Time (pts)
            </h3>
            <span className="text-[9px] text-emerald-400 font-black bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 italic">+12% TEMP.</span>
          </div>

          <div className="h-32 flex items-end justify-between gap-1 px-1 relative border-l border-b border-white/10">
            {/* Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
              <div className="h-px bg-white/20 w-full border-dashed" />
              <div className="h-px bg-white/20 w-full border-dashed" />
              <div className="h-px bg-white/20 w-full border-dashed" />
            </div>

            {/* Mock Chart Bars */}
            {[30, 45, 40, 55, 60, 50, 65, 75, 70, 85, 90, 80].map((h, i) => (
              <div key={i} className="w-full bg-white/5 rounded-t-lg relative group z-10 overflow-hidden">
                <div
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-600 to-cyan-400 group-hover:from-white group-hover:to-white transition-all rounded-t-lg shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                  style={{ height: `${h}%` }}
                />
                {/* Tooltip */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 glass-card border-cyan-500/30 px-2 py-1 rounded-lg text-[8px] text-cyan-400 font-black opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                  {h} PTS
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 px-1">
            <span className="text-[8px] text-white/20 font-black uppercase">R1</span>
            <span className="text-[8px] text-white/20 font-black uppercase">R12</span>
          </div>
        </div>

        {/* Top Player Variations */}
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-lg p-3 shadow-[0_0_15px_rgba(0,0,0,0.2)] flex flex-col gap-2">
          <h3 className="text-[8px] font-semibold text-slate-300 uppercase tracking-widest flex items-center gap-1.5 mb-0.5">
            <Zap size={10} className="text-purple-400" />
            Variação Jogadores
          </h3>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between bg-white/5 p-1.5 rounded-md border border-white/5 group hover:bg-white/10 transition-colors cursor-pointer">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 bg-cyan-500/10 rounded-lg border border-cyan-500/20 flex items-center justify-center text-[7px] font-semibold text-cyan-400">ATA</div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-semibold text-white group-hover:text-cyan-300 transition-colors">K. Nexus</span>
                  <span className="text-[6px] text-slate-500">Cyber United</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-mono font-semibold text-emerald-400">+45</span>
                <span className="text-[6px] text-emerald-500/50 font-mono">RATING</span>
              </div>
            </div>

            <div className="flex items-center justify-between bg-white/5 p-1.5 rounded-md border border-white/5 group hover:bg-white/10 transition-colors cursor-pointer">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 bg-purple-500/10 rounded-lg border border-purple-500/20 flex items-center justify-center text-[7px] font-semibold text-purple-400">MEI</div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-semibold text-white group-hover:text-purple-300 transition-colors">J. Storm</span>
                  <span className="text-[6px] text-slate-500">Neo Tokyo</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-mono font-semibold text-emerald-400">+32</span>
                <span className="text-[6px] text-emerald-500/50 font-mono">RATING</span>
              </div>
            </div>

            <div className="flex items-center justify-between bg-white/5 p-1.5 rounded-md border border-white/5 group hover:bg-white/10 transition-colors cursor-pointer">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 bg-red-500/10 rounded-lg border border-red-500/20 flex items-center justify-center text-[7px] font-semibold text-red-400">DEF</div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-semibold text-white group-hover:text-red-300 transition-colors">M. Steel</span>
                  <span className="text-[6px] text-slate-500">Iron Bastion</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-mono font-semibold text-red-400">-15</span>
                <span className="text-[6px] text-red-500/50 font-mono">RATING</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GM Panel */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-red-500/30 rounded-lg p-3 shadow-[0_0_15px_rgba(239,68,68,0.1)] flex flex-col gap-2 relative overflow-hidden mt-4 mx-1">
        <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/5 rounded-full blur-2xl -mr-10 -mt-10" />
        <h3 className="text-[8px] font-black text-red-400 uppercase tracking-[0.2em] flex items-center gap-1.5 mb-1 relative z-10">
          <Database size={10} className="drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]" />
          Painel do GM <span className="text-[6px] opacity-50 font-normal ml-1">(MODO DEV)</span>
        </h3>

        <div className="grid grid-cols-2 gap-2 relative z-10">
          <div className="flex flex-col gap-2">
            <button
              onClick={handleOpenRandomPlayer}
              className="flex items-center gap-2 bg-black/40 border border-white/5 hover:border-red-500/50 p-2 rounded-md transition-all group"
            >
              <div className="w-6 h-6 rounded bg-red-500/10 flex items-center justify-center text-red-400 group-hover:bg-red-500/20 transition-colors">
                <User size={12} />
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="text-[8px] font-bold text-white uppercase tracking-tighter">Testar Skins</span>
                <span className="text-[6px] text-slate-500 uppercase">Gerar Novo Mini Card</span>
              </div>
            </button>

            <div className="flex flex-col gap-1.5 p-2 bg-black/40 border border-white/5 rounded-md">
              <span className="text-[7px] font-black text-slate-500 uppercase px-1">MOCK VOD</span>
              {/* World Clock Control */}
              <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem] space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl border transition-all ${isPaused ? 'bg-amber-500/10 border-amber-500/30' : 'bg-cyan-500/10 border-cyan-500/30'}`}>
                      <Clock size={20} className={isPaused ? 'text-amber-500' : 'text-cyan-400 animate-pulse'} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-widest">Relógio Global</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">{isPaused ? 'Simulação Pausada' : 'Simulação Ativa'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-white tabular-nums tracking-tighter italic">
                      {new Date(state.world.currentDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">
                      Dia {Math.floor((new Date(state.world.currentDate).getTime() - new Date('2050-01-01').getTime()) / (1000 * 60 * 60 * 24)) + 1}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={togglePause}
                    className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${isPaused ? 'bg-cyan-500 text-black hover:bg-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                  >
                    {isPaused ? <Play size={14} fill="currentColor" /> : <Clock size={14} />}
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleSimulateGameReport('live')}
                  className="flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 p-2 rounded-md transition-all group"
                >
                  <Activity size={12} className="text-red-400" />
                  <span className="text-[8px] font-bold text-white uppercase tracking-tighter">AO VIVO</span>
                </button>
                <button
                  onClick={() => handleSimulateGameReport('finished')}
                  className="flex items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 p-2 rounded-md transition-all group"
                >
                  <Award size={12} className="text-emerald-400" />
                  <span className="text-[8px] font-bold text-white uppercase tracking-tighter">FINAL</span>
                </button>
              </div>
            </div>

            <button
              onClick={handleAdvanceDay}
              className="flex items-center gap-2 bg-black/40 border border-white/5 hover:border-red-500/50 p-2 rounded-md transition-all group"
            >
              <div className="w-6 h-6 rounded bg-red-500/10 flex items-center justify-center text-red-400 group-hover:bg-red-500/20 transition-colors">
                <FastForward size={12} />
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="text-[8px] font-bold text-white uppercase tracking-tighter">Avançar Dia</span>
                <span className="text-[6px] text-slate-500 uppercase">Testar Calendário</span>
              </div>
            </button>
          </div>

          {/* Mini Card Display Area */}
          <div className="bg-black/60 rounded-xl border border-white/10 flex items-center justify-center p-6 relative min-h-[340px] shadow-inner overflow-hidden">
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
      </div>
    </div>
  );
}
