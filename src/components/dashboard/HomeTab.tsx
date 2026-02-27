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
import { MATCH_REAL_TIME_SECONDS } from '../../constants/gameConstants';
import { Team, Player, Match } from '../../types';
import * as LucideIcons from 'lucide-react';
const { Home, Trophy, History, Play, ShoppingCart, Database, User, Clock, Newspaper, TrendingUp, AlertCircle, Award, Calendar, Users, Activity, Sliders, Flame, Target, Zap, FastForward, Globe, MessageSquare, AlertTriangle, TrendingDown, Briefcase, Star, Search, Crown, ChevronRight, Lock, ChevronDown, Eye, Shield, Brain, X, Save } = LucideIcons;

export const HomeTab = () => {
  const { state, setState, isSyncing } = useGame();
  const dashData = useDashboardData();
  const { userTeam, upcomingMatches, pastMatches, totalPoints, powerCap, pointsLeft } = dashData;
  const daysPassed = React.useMemo(() => {
    const start = state.world.seasonStartReal ? new Date(state.world.seasonStartReal) : new Date('2050-01-01T08:00:00Z');
    const current = new Date(state.world.currentDate);
    return Math.floor((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }, [state.world.currentDate, state.world.seasonStartReal]);
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
  const { handleMakeProposal } = useTransfers(userTeam?.id || null, totalPoints, powerCap);

  const [timeLeft, setTimeLeft] = useState<string>('');

  // Determine Headline based on last match
  const lastMatch = pastMatches?.[0];
  const headlineData = React.useMemo(() => {
    if (lastMatch) {
      const isHome = lastMatch.homeId === userTeam?.id;
      const userScore = isHome ? lastMatch.homeScore : lastMatch.awayScore;
      const oppScore = isHome ? lastMatch.awayScore : lastMatch.homeScore;
      const opponentName = isHome ? lastMatch.away : lastMatch.home;
      
      const isWin = userScore > oppScore;
      const isDraw = userScore === oppScore;
      
      return {
        type: 'match',
        title: isWin ? "Vitória Espetacular!" : isDraw ? "Empate Tático" : "Derrota Amarga",
        message: `O ${userTeam?.name} ${isWin ? 'dominou' : isDraw ? 'empatou com' : 'tropeçou contra'} o ${opponentName} no placar de ${lastMatch.homeScore}-${lastMatch.awayScore}.`,
        match: lastMatch
      };
    }
    return {
      type: 'news',
      title: state.lastHeadline?.title || "Mercado Aquecido",
      message: state.lastHeadline?.message || "Novas promessas surgem nos distritos periféricos de Neo-City."
    };
  }, [lastMatch, state.lastHeadline, userTeam]);

  // Calendar events for news feed
  const newsFeed = React.useMemo(() => {
    const feed: any[] = [];
    
    if (pastMatches) {
      pastMatches.slice(0, 5).forEach(m => {
        const isWin = (m.homeId === userTeam?.id && m.homeScore > m.awayScore) || 
                      (m.awayId === userTeam?.id && m.awayScore > m.homeScore);
        const isDraw = m.homeScore === m.awayScore;
        const opponent = m.homeId === userTeam?.id ? m.away : m.home;

        let subtitle = '';
        if (isWin) {
          subtitle = `O ${userTeam?.name} deu um show de bola e bateu o ${opponent}.`;
        } else if (isDraw) {
          subtitle = `Jogo duro! ${userTeam?.name} e ${opponent} ficaram no empate.`;
        } else {
          subtitle = `Dia difícil para o ${userTeam?.name}, que acabou superado pelo ${opponent}.`;
        }

        feed.push({
          id: `match_${m.id}`,
          type: 'match',
          title: isWin ? 'Vitória' : isDraw ? 'Empate' : 'Derrota',
          subtitle: subtitle,
          score: `${m.homeScore}-${m.awayScore}`,
          match: m,
          date: m.date
        });
      });
    }

    return feed;
  }, [pastMatches, userTeam]);

  // Better next match logic
  const nextMatchData = (() => {
    if (!userTeam || !state.world?.leagues) return null;
    const leagues = Object.values(state.world.leagues) as any[];
    const userLeague = leagues.find(l => l.standings.some(s => s.teamId === userTeam.id));
    if (!userLeague) return null;

    const userMatches = userLeague.matches.filter(m => (m.homeTeamId === userTeam.id || m.awayTeamId === userTeam.id));
    
    // 1. Find a match that is currently PLAYING
    let match = userMatches.find(m => {
      // Force correct date for check
      const seasonStart = state.world.seasonStartReal ? new Date(state.world.seasonStartReal) : new Date('2050-01-01T08:00:00Z');
      const d = new Date(seasonStart);
      d.setDate(d.getDate() + (m.round * 2));
      const correctDate = d.toISOString().split('T')[0];
      const mCopy = { ...m, date: correctDate };
      return getMatchStatus(mCopy, state.world.currentDate) === 'PLAYING';
    });
    
    // 2. If none, find a match that is LOCKED or SCHEDULED (the next one)
    if (!match) {
      match = userMatches.find(m => {
        const seasonStart = state.world.seasonStartReal ? new Date(state.world.seasonStartReal) : new Date('2050-01-01T08:00:00Z');
        const d = new Date(seasonStart);
        d.setDate(d.getDate() + (m.round * 2));
        const correctDate = d.toISOString().split('T')[0];
        const mCopy = { ...m, date: correctDate };
        const status = getMatchStatus(mCopy, state.world.currentDate);
        return status === 'LOCKED' || status === 'SCHEDULED';
      });
    }
    
    // 3. If still none, check if there was a match today that is already FINISHED
    if (!match) {
      const todayStr = state.world.currentDate.split('T')[0];
      match = userMatches.find(m => {
        // Check date logic
        const seasonStart = state.world.seasonStartReal ? new Date(state.world.seasonStartReal) : new Date('2050-01-01T08:00:00Z');
        const d = new Date(seasonStart);
        d.setDate(d.getDate() + (match.round * 2));
        const correctDate = d.toISOString().split('T')[0];
        
        // Match finished if played OR if time passed logically
        const mCopy = { ...m, date: correctDate };
        const status = getMatchStatus(mCopy, state.world.currentDate);
        
        return (m.played || status === 'FINISHED') && correctDate === todayStr;
      });
    }

    // 4. Fallback to any future match if none of the above
    if (!match) {
      match = userMatches.find(m => !m.played);
    }

    if (!match) return null;

    // Apply correct date to the found match object for display
    const seasonStart = state.world.seasonStartReal ? new Date(state.world.seasonStartReal) : new Date('2050-01-01T08:00:00Z');
    const d = new Date(seasonStart);
    d.setDate(d.getDate() + (match.round));
    const correctDate = d.toISOString().split('T')[0];
    const matchWithDate = { ...match, date: correctDate };

    const opponentId = match.homeTeamId === userTeam.id ? match.awayTeamId : match.homeTeamId;
    const opponent = state.teams[opponentId];
    const opponentPower = opponent ? calculateTeamPower(opponent, state.players) : 0;
    const userPower = calculateTeamPower(userTeam, state.players);
    const status = getMatchStatus(matchWithDate, state.world.currentDate);

    return {
      match: matchWithDate,
      opponent,
      opponentPower,
      userPower,
      isHome: match.homeTeamId === userTeam.id,
      status
    };
  })();

  React.useEffect(() => {
    if (!nextMatchData?.match) return;

    const timer = setInterval(() => {
      const matchDate = new Date(`${nextMatchData.match.date}T${nextMatchData.match.time}`);
      const now = new Date(state.world.currentDate);
      const diff = matchDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('AGORA');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`${days}D • ${hours}H`);
      } else {
        setTimeLeft(`${hours}H • ${minutes}M`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [nextMatchData?.match, state.world.currentDate]);

  // Remove lastHeadline usage since we now use headlineData
  // const lastHeadline = state.lastHeadline || ...

  // Remote redundant mock logic and duplicate state calls
  const isLobby = state.world.status === 'LOBBY';

  const handleStartSeason = () => {
    if (!state.isCreator) {
      alert('Apenas o criador pode iniciar a temporada!');
      return;
    }

    const nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay.setHours(0, 0, 0, 0);

    setState(prev => ({
      ...prev,
      world: {
        ...prev.world,
        status: 'ACTIVE',
        seasonStartReal: nextDay.toISOString(),
        currentDate: new Date().toISOString()
      }
    }));
  };

  if (selectedMatchReport) {
    const homeTeam = state.teams[selectedMatchReport.homeTeamId];
    const awayTeam = state.teams[selectedMatchReport.awayTeamId];

    if (homeTeam && awayTeam) {
      const matchStatus = selectedMatchReport.status;

      if (matchStatus === 'PLAYING' || isWatchingReport) {
        return (
          <div className="max-w-2xl mx-auto py-8">
            <LiveReport
              match={selectedMatchReport}
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              players={state.players}
              currentSecond={isWatchingReport ? reportSecond : getLiveMatchSecond(selectedMatchReport, state.world.currentDate)}
            />
            <div className="flex gap-4 mt-6">
              {isWatchingReport && (
                <button
                  onClick={() => setReportSecond(0)}
                  className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white/40 uppercase tracking-[0.3em] hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                >
                  <History size={14} /> REINICIAR RELATÓRIO
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedMatchReport(null);
                  setIsWatchingReport(false);
                  setReportSecond(0);
                }}
                className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white/40 uppercase tracking-[0.3em] hover:bg-white/10 transition-colors"
              >
                VOLTAR AO DASHBOARD
              </button>
            </div>
          </div>
        );
      } else if (matchStatus === 'FINISHED' || (selectedMatchReport.played && !isWatchingReport)) {
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
              onClick={handleStartReport}
              className="mt-6 w-full py-4 bg-cyan-500 rounded-2xl text-[10px] font-black text-black uppercase tracking-[0.3em] hover:bg-cyan-400 transition-all flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(6,182,212,0.3)]"
            >
              <Play size={16} fill="black" /> REVER RELATÓRIO COMPLETO
            </button>
          </div>
        );
      }
    }
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto pb-8 px-2 sm:px-0">
      {/* Lobby Hero Section */}
      {isLobby && (
        <div className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] border border-cyan-500/20 bg-black/40 backdrop-blur-xl p-6 sm:p-8 mb-2">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[100px] -mr-32 -mt-32" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl sm:text-4xl font-black italic text-white mb-2 sm:mb-3 tracking-tight">
                PREPARAÇÃO <span className="text-cyan-400">FINAL</span>
              </h2>
              <p className="text-white/60 text-sm sm:text-lg max-w-xl leading-relaxed">
                A temporada 2050 ainda não começou. Ajuste seu elenco, defina suas táticas e prepare seus atletas no Centro de Treinamento antes da estreia.
              </p>
            </div>
            <button
              onClick={handleStartSeason}
              className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-cyan-500 text-black font-black italic rounded-2xl hover:bg-cyan-400 transition-all shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:scale-105 active:scale-95 uppercase tracking-widest text-sm sm:text-lg"
            >
              Iniciar Temporada
            </button>
          </div>
        </div>
      )}

      {/* SYNC INDICATOR */}
      {isSyncing && (
        <div className="fixed top-16 right-4 sm:top-24 sm:right-8 z-50 flex items-center gap-2 px-3 py-1.5 bg-black/80 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl animate-in fade-in zoom-in slide-in-from-right-4 duration-500">
          <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          <span className="text-[8px] font-black text-white/60 uppercase tracking-[0.2em]">Salvando no Supabase...</span>
        </div>
      )}

      {/* TOP ROW: Premium Status Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* CARD 1: PRÓXIMO CONFRONTO - FUTURISTIC REDESIGN */}
        <div className="relative group overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] bg-black/10 backdrop-blur-3xl border border-cyan-400/20 p-4 sm:p-8 transition-all duration-700 hover:border-cyan-400/40 shadow-[0_0_50px_rgba(34,211,238,0.1)] min-h-[160px] sm:min-h-[220px] flex flex-col justify-center">
          {/* Neon Glow Effects */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-cyan-500/10 blur-[80px] -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-fuchsia-500/10 blur-[80px] translate-x-1/2 translate-y-1/2" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex-1 space-y-4 text-center sm:text-left">
              <div className="space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400 italic">
                    PRÓXIMO JOGO
                  </span>
                  {nextMatchData?.status === 'PLAYING' && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded-full">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">AO VIVO</span>
                    </div>
                  )}
                </div>
                
                <div className="text-4xl sm:text-6xl font-black text-white tracking-tighter italic">
                  {nextMatchData?.status === 'PLAYING' ? (
                    <div className="flex items-center gap-4">
                      <span>{nextMatchData.match.homeScore}</span>
                      <span className="text-white/20">-</span>
                      <span>{nextMatchData.match.awayScore}</span>
                    </div>
                  ) : (
                    timeLeft || '00:00'
                  )}
                </div>
              </div>

              {nextMatchData ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-white/80 font-black text-xs sm:text-base uppercase tracking-tight italic">
                    <span className={nextMatchData.isHome ? 'text-cyan-400' : ''}>{userTeam?.name}</span>
                    <span className="text-white/20">VS</span>
                    <span className={!nextMatchData.isHome ? 'text-cyan-400' : ''}>{nextMatchData.opponent?.name}</span>
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">
                    {new Date(`${nextMatchData.match.date}T${nextMatchData.match.time}`).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).replace('.', '').toUpperCase()} • {nextMatchData.match.time}
                  </p>
                </div>
              ) : (
                <div className="text-[10px] text-white/20 italic font-black uppercase tracking-widest">
                  Aguardando Calendário...
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="relative group/team-1">
                <div className="absolute inset-0 bg-cyan-500/10 blur-xl rounded-full opacity-0 group-hover/team-1:opacity-100 transition-opacity" />
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md group-hover:border-cyan-500/40 transition-all">
                  {userTeam?.logo && (
                    <TeamLogo
                      primaryColor={userTeam.logo.primary}
                      secondaryColor={userTeam.logo.secondary}
                      patternId={userTeam.logo.patternId as any}
                      symbolId={userTeam.logo.symbolId}
                      size={window.innerWidth < 640 ? 32 : 40}
                    />
                  )}
                </div>
              </div>
              <div className="relative group/team-2">
                <div className="absolute inset-0 bg-purple-500/10 blur-xl rounded-full opacity-0 group-hover/team-2:opacity-100 transition-opacity" />
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md group-hover:border-purple-500/40 transition-all">
                  {nextMatchData?.opponent?.logo && (
                    <TeamLogo
                      primaryColor={nextMatchData.opponent.logo.primary}
                      secondaryColor={nextMatchData.opponent.logo.secondary}
                      patternId={nextMatchData.opponent.logo.patternId as any}
                      symbolId={nextMatchData.opponent.logo.symbolId}
                      size={window.innerWidth < 640 ? 32 : 40}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: SCORE BALANCE / TETO DE PODER */}
        <div className="relative group overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] glass-card-neon p-4 sm:p-8 transition-all hover:scale-[1.02] duration-500 shadow-2xl min-h-[160px] sm:min-h-[220px] flex flex-col justify-between">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-fuchsia-500/10 blur-[100px] group-hover:bg-fuchsia-500/20 transition-all duration-700" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-500/10 blur-[100px] group-hover:bg-cyan-500/20 transition-all duration-700" />

          <div className="relative z-10 flex flex-col h-full justify-between gap-6">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-fuchsia-400 neon-text-magenta">
                  BALANÇO DE SCORE
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${pointsLeft < 0 ? 'text-red-500' : 'text-emerald-400'}`}>
                    {pointsLeft < 0 ? 'LIMITE EXCEDIDO' : 'DENTRO DO TETO'}
                  </span>
                </div>
              </div>
              <div className="p-2 glass-card rounded-xl border-white/10 bg-white/5 shadow-inner">
                <Target size={16} className="text-fuchsia-400" />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1 sm:gap-2">
                <div className="text-2xl sm:text-4xl font-black text-white tracking-tighter italic neon-text-white">
                  {totalPoints}<span className="text-lg sm:text-xl opacity-40 ml-1">/ {powerCap}</span>
                </div>
                <span className="text-[9px] sm:text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  Score Total do Elenco
                </span>
              </div>

              <div className="flex-1 max-w-[120px]">
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 shadow-inner p-[1px]">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      pointsLeft < 0 ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]' : 
                      pointsLeft < 500 ? 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.6)]' : 
                      'bg-gradient-to-r from-cyan-500 to-fuchsia-500 shadow-[0_0_15px_rgba(34,211,238,0.6)]'
                    }`}
                    style={{ width: `${Math.min((totalPoints / powerCap) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* News & History Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
        {/* Left: Main Headline */}
        <div className="lg:col-span-2">
          <div
            onClick={() => headlineData.type === 'match' && headlineData.match ? setSelectedMatchReport(headlineData.match) : null}
            className={`relative group overflow-hidden rounded-xl glass-card border-white/10 p-3 sm:p-4 transition-all hover:neon-border-magenta shadow-xl ${headlineData.type === 'match' ? 'cursor-pointer' : ''}`}
          >
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-magenta-500/10 blur-[80px] -mr-24 -mt-24 group-hover:bg-magenta-500/20 transition-all" />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="px-2 py-0.5 rounded-full bg-magenta-500/20 border border-magenta-500/30">
                  <span className="text-[8px] font-black text-magenta-400 uppercase tracking-widest">
                    {headlineData.type === 'match' ? 'Último Resultado' : 'Feed Global'}
                  </span>
                </div>
                <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                  {headlineData.type === 'match' ? <Trophy size={14} className="text-purple-400" /> : <Newspaper size="14" className="text-purple-400" />}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-0.5 h-4 bg-magenta-500" />
                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em]">
                    {headlineData.type === 'match' ? 'Resumo da Rodada' : 'Urgente'}
                  </span>
                </div>
                <h2 className="text-xl sm:text-3xl font-black text-white uppercase tracking-tighter italic leading-none group-hover:text-magenta-400 transition-colors">
                  {headlineData.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 max-w-xl font-medium leading-tight">
                  {headlineData.message}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-1.5">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-6 h-6 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[8px] font-bold text-white">
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">
                    {headlineData.type === 'match' ? 'Clique para ver Relatório' : 'Feed Atualizado'}
                  </span>
                </div>
                <ChevronRight size={18} className="text-magenta-500 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Recent History / VOD Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.1em] flex items-center gap-1.5">
              <History size={12} className="text-magenta-400" />
              Histórico
            </h3>
            <button className="text-[9px] font-bold text-slate-500 uppercase hover:text-white transition-colors">Ver Todos</button>
          </div>

          <div className="space-y-2">
            {newsFeed.length > 0 ? newsFeed.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedMatchReport(item.match)}
                className="group relative overflow-hidden rounded-lg glass-card border-white/5 p-2.5 cursor-pointer hover:border-magenta-500/30 hover:bg-white/5 transition-all"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${item.title === 'Vitória' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : item.title === 'Empate' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                      {item.title === 'Vitória' ? <Trophy size={14} /> : item.title === 'Empate' ? <Zap size={14} /> : <AlertCircle size={14} />}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[10px] font-black text-white uppercase truncate leading-tight">{item.title} <span className="text-slate-500 ml-1">{item.score}</span></h4>
                      <p className="text-[9px] text-slate-500 font-bold truncate">{item.subtitle}</p>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-magenta-500/20 transition-all">
                      <Play size={10} className="text-white group-hover:text-magenta-400" />
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="rounded-xl border border-dashed border-white/10 p-6 flex flex-col items-center justify-center text-center gap-2 opacity-50">
                <Calendar size={20} className="text-slate-600" />
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-tight">Nenhuma partida<br />disputada ainda</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: Agenda and Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
        {/* Agenda de Jogos */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
              <div className="w-3 h-[1px] bg-cyan-500/50" />
              Calendário
            </h3>
            <button className="text-[8px] text-white/30 hover:text-cyan-400 font-black uppercase tracking-[0.1em] transition-all flex items-center gap-1.5 group">
              Histórico <ChevronRight size={8} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {upcomingMatches.slice(0, 4).map((m, i) => {
              const homeTeam = state.teams[m.homeTeamId];
              const awayTeam = state.teams[m.awayTeamId];
              return (
                <div key={i} className="group relative glass-card border-white/5 rounded-xl p-3 hover:neon-border-cyan transition-all cursor-pointer overflow-hidden">
                  <div className="absolute top-0 right-0 w-8 h-8 bg-cyan-500/5 blur-lg group-hover:bg-cyan-500/10 transition-all" />

                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[7px] text-cyan-400 font-black uppercase tracking-widest italic">{m.date.split('-').reverse().slice(0, 2).join('/')}</span>
                      <span className="text-[7px] text-white font-black tabular-nums">{m.time}</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {homeTeam?.logo && (
                            <div className="shrink-0">
                              <TeamLogo
                                primaryColor={homeTeam.logo.primary}
                                secondaryColor={homeTeam.logo.secondary}
                                patternId={homeTeam.logo.patternId as any}
                                symbolId={homeTeam.logo.symbolId}
                                size={10}
                              />
                            </div>
                          )}
                          <span className="text-[9px] text-white/60 font-black truncate uppercase tracking-tighter">{m.home}</span>
                        </div>
                        <span className="text-[9px] text-white font-black tabular-nums">0</span>
                      </div>
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {awayTeam?.logo && (
                            <div className="shrink-0">
                              <TeamLogo
                                primaryColor={awayTeam.logo.primary}
                                secondaryColor={awayTeam.logo.secondary}
                                patternId={awayTeam.logo.patternId as any}
                                symbolId={awayTeam.logo.symbolId}
                                size={10}
                              />
                            </div>
                          )}
                          <span className="text-[9px] text-white/60 font-black truncate uppercase tracking-tighter">{m.away}</span>
                        </div>
                        <span className="text-[9px] text-white font-black tabular-nums">0</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Logs de Sistema / Atividades */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2 px-1">
            <div className="w-3 h-[1px] bg-purple-500/50" />
            Sistema
          </h3>
          <div className="glass-card border-white/5 rounded-xl overflow-hidden shadow-lg">
            <div className="divide-y divide-white/5">
              {[
                { label: 'Otimização Tática', time: 'AGORA', status: 'cyan', icon: Zap },
                { label: 'Mercado Aberto', time: '12m', status: 'emerald', icon: ShoppingCart },
                { label: 'Scout Norte', time: '45m', status: 'purple', icon: Search },
                { label: 'Sincronização', time: '2h', status: 'slate', icon: Database },
              ].map((n, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 hover:bg-white/[0.03] transition-all cursor-pointer group">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1 rounded-lg glass-card border-white/5 bg-white/5 group-hover:neon-border-${n.status}`}>
                      <n.icon size={10} className={`text-${n.status}-500 group-hover:scale-110 transition-transform`} />
                    </div>
                    <span className="text-[9px] text-white/40 group-hover:text-white transition-colors font-black uppercase tracking-tight">{n.label}</span>
                  </div>
                  <span className="text-[7px] text-white/20 font-black tabular-nums group-hover:text-white/40 transition-colors">{n.time}</span>
                </div>
              ))}
            </div>
            <div className="p-2 bg-white/[0.02] border-t border-white/5 flex items-center justify-center">
              <button className="text-[7px] font-black text-white/20 uppercase tracking-[0.2em] hover:text-white transition-colors">Ver Console</button>
            </div>
          </div>
        </div>
      </div>
      {/* Match Report Modal */}
      {selectedMatchReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="relative w-full max-w-2xl">
            <button
              onClick={() => setSelectedMatchReport(null)}
              className="absolute -top-12 right-0 z-50 p-2 bg-white/10 hover:bg-red-500 rounded-full text-white transition-colors backdrop-blur-md border border-white/10"
            >
              <X size={24} />
            </button>
            <PostGameReport
              match={selectedMatchReport}
              homeTeam={state.teams[selectedMatchReport.homeTeamId || selectedMatchReport.homeId]}
              awayTeam={state.teams[selectedMatchReport.awayTeamId || selectedMatchReport.awayId]}
              players={state.players}
              onClose={() => setSelectedMatchReport(null)}
            />
          </div>
        </div>
      )}

      {/* Match Report Overlay */}
      {isWatchingReport && selectedMatchReport && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center animate-in zoom-in duration-500">
          <div className="w-full max-w-4xl h-full max-h-[80vh] relative p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-sm font-black text-cyan-400 uppercase tracking-[0.4em] italic">Narração da Partida</h2>
            </div>
            <button
              onClick={() => {
                setIsWatchingReport(false);
                setReportSecond(0);
              }}
              className="absolute -top-12 right-4 z-[70] p-2 bg-white/10 hover:bg-red-500 rounded-full text-white transition-colors border border-white/10"
            >
              <X size={24} />
            </button>

            <LiveReport
              match={selectedMatchReport}
              homeTeam={state.teams[selectedMatchReport.homeTeamId || selectedMatchReport.homeId]}
              awayTeam={state.teams[selectedMatchReport.awayTeamId || selectedMatchReport.awayId]}
              players={state.players}
              currentSecond={reportSecond}
            />

            {/* Report Controls */}
            <div className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 sm:gap-6 px-4 sm:px-8 py-2 sm:py-4 bg-black/80 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl">
              <button className="text-white/40 hover:text-white transition-colors">
                <FastForward size={window.innerWidth < 640 ? 18 : 24} className="rotate-180" />
              </button>
              <button
                onClick={() => setReportSecond(prev => Math.max(0, prev - 10))}
                className="text-white/60 hover:text-white transition-colors flex flex-col items-center gap-1"
              >
                <Clock size={window.innerWidth < 640 ? 16 : 20} />
                <span className="text-[7px] sm:text-[8px] font-black">-10s</span>
              </button>

              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-cyan-500 flex items-center justify-center text-black shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                <Play size={window.innerWidth < 640 ? 20 : 24} fill="currentColor" />
              </div>

              <button
                onClick={() => setReportSecond(prev => Math.min(MATCH_REAL_TIME_SECONDS, prev + 10))}
                className="text-white/60 hover:text-white transition-colors flex flex-col items-center gap-1"
              >
                <Clock size={window.innerWidth < 640 ? 16 : 20} />
                <span className="text-[7px] sm:text-[8px] font-black">+10s</span>
              </button>
              <button className="text-white/40 hover:text-white transition-colors">
                <FastForward size={window.innerWidth < 640 ? 18 : 24} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
