import React, { useState, useEffect } from 'react';
import { useGame } from '../store/GameContext';
import { PlayerCard } from './PlayerCard';
import { PlayerModal } from './PlayerModal';
import { LineupBuilder } from './LineupBuilder';
import { calculateTeamPower, applySafetyNet } from '../engine/gameLogic';
import { 
  Home, Trophy, ShoppingCart, Database, User, 
  Clock, Newspaper, Wallet, TrendingUp, AlertCircle, Award,
  Calendar, Users, Activity, Sliders, Flame, Target, Zap,
  Globe, MessageSquare, AlertTriangle, TrendingDown, Briefcase, Star, Search, Crown, ChevronRight
} from 'lucide-react';
import { Player, Team, League, LeagueTeamStats } from '../types';
import { NewGameFlow } from './NewGameFlow';
import { TeamLogo } from './TeamLogo';

type Tab = 'home' | 'team' | 'calendar' | 'world' | 'career';
type TeamSubTab = 'squad' | 'tactics' | 'lineup' | 'training' | 'locker_room';

export const Dashboard: React.FC = () => {
  const { state, setState, isSyncing, isOnline } = useGame();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [activeTeamTab, setActiveTeamTab] = useState<TeamSubTab>('squad');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isCareerModalOpen, setIsCareerModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeLeague, setActiveLeague] = useState('norte');
  const [activeCompetition, setActiveCompetition] = useState<'league' | 'elite' | 'district'>('league');

  // Market Filters
  const [marketSearch, setMarketSearch] = useState('');
  const [marketDistrict, setMarketDistrict] = useState<string>('all');
  const [marketPointsMin, setMarketPointsMin] = useState(0);
  const [marketPotentialMin, setMarketPotentialMin] = useState(0);
  const [marketPosition, setMarketPosition] = useState<string>('all');

  // Get user team
  const userManager = state.userManagerId ? state.managers[state.userManagerId] : null;
  const userTeam = userManager?.career.currentTeamId ? state.teams[userManager.career.currentTeamId] : null;
  const baseDate = new Date(state.world.currentDate || '2050-01-01T08:00:00Z');
  const seasonStartReal = state.world.seasonStartReal ? new Date(state.world.seasonStartReal) : null;
  const gameDate = seasonStartReal
    ? new Date(baseDate.getTime() + (currentTime.getTime() - seasonStartReal.getTime()))
    : baseDate;
  const totalPoints = userTeam ? calculateTeamPower(userTeam, state.players) : 0;
  const powerCap = 11000;
  const pointsLeft = Math.max(0, powerCap - totalPoints);
  const seasonDays = 40;
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysPassed = seasonStartReal
    ? Math.min(seasonDays, Math.max(0, Math.floor((currentTime.getTime() - seasonStartReal.getTime()) / msPerDay)))
    : 0;
  const seasonProgress = Math.round((daysPassed / seasonDays) * 100);
  
  const upcomingMatches = React.useMemo(() => {
    if (!userTeam || !state.world?.leagues) return [];

    const leagues = Object.values(state.world.leagues) as League[];
    const userLeague = leagues.find(l => l.standings.some(s => s.teamId === userTeam.id));
    
    if (!userLeague || !userLeague.matches) return [];

    const currentRound = state.world.currentRound;
    
    // Filter matches for user team
    const matches = userLeague.matches
      .filter(m => (m.homeTeamId === userTeam.id || m.awayTeamId === userTeam.id) && m.round >= currentRound)
      .sort((a, b) => a.round - b.round)
      .slice(0, 10);

    return matches.map(m => {
       const homeTeam = state.teams[m.homeTeamId];
       const awayTeam = state.teams[m.awayTeamId];
       const matchDate = new Date(state.world.currentDate);
       matchDate.setDate(matchDate.getDate() + (m.round - currentRound) * 2);

       // Horários pré-definidos baseados no ID da partida para consistência
       const hours = [16, 18, 19, 21];
       const matchHour = hours[parseInt(m.id.split('_')[1]) % hours.length] || 16;

       return {
         id: m.id,
         date: matchDate.toISOString().split('T')[0],
         time: `${matchHour}:00`,
         home: homeTeam?.name || 'Unknown',
         away: awayTeam?.name || 'Unknown',
         homeId: m.homeTeamId,
         awayId: m.awayTeamId,
         homeLogo: homeTeam?.logo,
         awayLogo: awayTeam?.logo,
         homeScore: m.homeScore,
         awayScore: m.awayScore,
         type: 'League'
       };
    });
  }, [userTeam, state.world.leagues, state.world.currentRound, state.teams, state.world.currentDate]);

  // Computed League Data
  const leaguesData = React.useMemo(() => {
    if (!state.world?.leagues) return {};
    
    const processLeague = (league: League) => {
      // Sort standings
      const sortedStandings = [...league.standings].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        const gdA = a.goalsFor - a.goalsAgainst;
        const gdB = b.goalsFor - b.goalsAgainst;
        return gdB - gdA;
      });

      // Format standings for UI
      const formattedStandings = sortedStandings.map((stats, index) => ({
        position: index + 1,
        team: state.teams[stats.teamId]?.name || 'Unknown',
        logo: state.teams[stats.teamId]?.logo,
        played: stats.played,
        points: stats.points,
        gd: stats.goalsFor - stats.goalsAgainst,
        id: stats.teamId
      }));

      // Get scorers
      const leaguePlayers: { name: string; team: string; goals: number; rank: number }[] = [];
      league.standings.forEach(teamStats => {
        const team = state.teams[teamStats.teamId];
        if (team) {
          team.squad.forEach(playerId => {
            const player = state.players[playerId];
            if (player && player.history.goals > 0) {
              leaguePlayers.push({
                name: player.name,
                team: team.name,
                goals: player.history.goals,
                rank: 0
              });
            }
          });
        }
      });

      // Sort and rank scorers
      const sortedScorers = leaguePlayers
        .sort((a, b) => b.goals - a.goals)
        .slice(0, 10)
        .map((p, i) => ({ ...p, rank: i + 1 }));

      return {
        name: league.name,
        standings: formattedStandings,
        scorers: sortedScorers
      };
    };

    return {
      norte: processLeague(state.world.leagues.norte),
      sul: processLeague(state.world.leagues.sul),
      leste: processLeague(state.world.leagues.leste),
      oeste: processLeague(state.world.leagues.oeste),
    };
  }, [state.world, state.teams, state.players]);

  const players: Player[] = Object.values(state.players);
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!userTeam) return;
    const total = calculateTeamPower(userTeam, state.players);
    const neededCredit = Math.max(0, 6000 - total);
    if (userTeam.squad.length >= 15 && neededCredit === 0) return;
    if (userTeam.squad.length >= 15 && userTeam.finances.emergencyCredit === neededCredit) return;
    setState(prev => {
      const next = { ...prev, teams: { ...prev.teams }, players: { ...prev.players }, notifications: [...prev.notifications] };
      applySafetyNet(next, userTeam.id);
      return next;
    });
  }, [userTeam?.id, userTeam?.squad.length, state.players]);

  const renderHome = () => {
    // Get last notification for Headline card
    const lastHeadline = state.notifications.length > 0 
      ? state.notifications[state.notifications.length - 1] 
      : { title: 'Temporada Iniciada', message: 'Bem-vindo à Elite 2050. O mercado está aquecido e os motores rugem.' };

    // Get next match info
    const nextMatch = upcomingMatches[0];
    const opponentId = nextMatch ? (nextMatch.home === userTeam?.name ? upcomingMatches[0].id : upcomingMatches[0].id) : null; // This is a bit complex, let's simplify
    
    // Better next match logic
    const nextMatchData = (() => {
      if (!userTeam || !state.world?.leagues) return null;
      const leagues = Object.values(state.world.leagues) as League[];
      const userLeague = leagues.find(l => l.standings.some(s => s.teamId === userTeam.id));
      if (!userLeague) return null;
      const match = userLeague.matches.find(m => (m.homeTeamId === userTeam.id || m.awayTeamId === userTeam.id) && !m.played);
      if (!match) return null;
      
      const opponentId = match.homeTeamId === userTeam.id ? match.awayTeamId : match.homeTeamId;
      const opponent = state.teams[opponentId];
      const opponentPower = opponent ? calculateTeamPower(opponent, state.players) : 0;
      const userPower = calculateTeamPower(userTeam, state.players);
      
      return {
        match,
        opponent,
        opponentPower,
        userPower,
        isHome: match.homeTeamId === userTeam.id
      };
    })();

    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto pb-8">
        
        {/* TOP ROW: Premium Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* CARD 1: PRÓXIMO JOGO (Premium Design) */}
          <div className="relative group overflow-hidden rounded-[2rem] border border-white/5 bg-black/40 backdrop-blur-2xl p-6 transition-all hover:border-cyan-500/30 shadow-2xl">
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 blur-[100px] group-hover:bg-cyan-500/20 transition-all duration-700" />
            
            <div className="relative z-10 flex flex-col h-full justify-between gap-6">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-1">Próxima Rodada</span>
                  <h3 className="text-xl font-black text-white tracking-tighter uppercase italic">Confronto Direto</h3>
                </div>
                <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                  <Target size={18} className="text-cyan-400 animate-pulse" />
                </div>
              </div>

              {nextMatchData ? (
                <div className="flex flex-col gap-4 py-2">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col items-center gap-2 flex-1">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500 relative overflow-hidden">
                        {userTeam?.logo ? (
                          <TeamLogo 
                            primaryColor={userTeam.logo.primary}
                            secondaryColor={userTeam.logo.secondary}
                            patternId={userTeam.logo.patternId as any}
                            symbolId={userTeam.logo.symbolId}
                            size={44}
                          />
                        ) : (
                          <div className="w-11 h-11 flex items-center justify-center">
                            <TeamLogo 
                              primaryColor={userTeam?.colors.primary || '#fff'}
                              secondaryColor={userTeam?.colors.secondary || '#333'}
                              patternId="none"
                              symbolId="Shield"
                              size={32}
                            />
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-black rounded-full border border-white/10 flex items-center justify-center z-10">
                           <span className="text-[8px] font-bold text-white">H</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-white uppercase truncate w-full text-center tracking-tight">{userTeam?.name}</span>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
                         <span className="text-[10px] font-black text-cyan-400 tabular-nums">{upcomingMatches[0]?.time}</span>
                      </div>
                      <span className="text-xs font-black text-cyan-500/50 italic tracking-widest">VS</span>
                      <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
                    </div>

                    <div className="flex flex-col items-center gap-2 flex-1">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500 relative overflow-hidden">
                        {nextMatchData.opponent?.logo ? (
                          <TeamLogo 
                            primaryColor={nextMatchData.opponent.logo.primary}
                            secondaryColor={nextMatchData.opponent.logo.secondary}
                            patternId={nextMatchData.opponent.logo.patternId as any}
                            symbolId={nextMatchData.opponent.logo.symbolId}
                            size={44}
                          />
                        ) : (
                          <div className="w-11 h-11 flex items-center justify-center">
                            <TeamLogo 
                              primaryColor={nextMatchData.opponent?.colors.primary || '#fff'}
                              secondaryColor={nextMatchData.opponent?.colors.secondary || '#333'}
                              patternId="none"
                              symbolId="Shield"
                              size={32}
                            />
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-black rounded-full border border-white/10 flex items-center justify-center z-10">
                           <span className="text-[8px] font-bold text-white">A</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-white uppercase truncate w-full text-center tracking-tight">{nextMatchData.opponent?.name}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-20 flex items-center justify-center text-slate-500 text-xs font-bold uppercase tracking-widest italic">
                  Nenhum jogo agendado
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Rating Previsto</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-black text-white tabular-nums">
                      {nextMatchData ? (nextMatchData.userPower / 100).toFixed(1) : '0.0'}
                    </span>
                    <span className="text-[10px] font-black text-cyan-500 italic">pts</span>
                  </div>
                </div>
                <button className="px-5 py-2.5 bg-cyan-500 text-black font-black text-[10px] uppercase tracking-widest rounded-full hover:bg-white transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-cyan-500/50 active:scale-95">
                  AO VIVO
                </button>
              </div>
            </div>
          </div>

          {/* CARD 2: RESUMO FINANCEIRO / RATING */}
          <div className="relative group overflow-hidden rounded-[2rem] border border-white/5 bg-black/40 backdrop-blur-2xl p-6 transition-all hover:border-emerald-500/30 shadow-2xl">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 blur-[100px] group-hover:bg-emerald-500/20 transition-all duration-700" />
            
            <div className="relative z-10 flex flex-col h-full justify-between gap-6">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-1">Status Franquia</span>
                  <h3 className="text-xl font-black text-white tracking-tighter uppercase italic">Tesouraria</h3>
                </div>
                <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  <Wallet size={18} className="text-emerald-400" />
                </div>
              </div>

              <div className="space-y-4 py-2">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Budget Disponível</span>
                    <span className="text-3xl font-black text-white tabular-nums tracking-tighter">
                      {pointsLeft.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black text-emerald-400 flex items-center gap-1">
                      <TrendingUp size={10} /> +120
                    </span>
                    <span className="text-[7px] font-bold text-slate-600 uppercase">Per Tick</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                    <span className="text-slate-500">Valor de Mercado</span>
                    <span className="text-white">{(totalPoints / 100).toFixed(1)}k / 110k</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000"
                      style={{ width: `${Math.min(100, (totalPoints / powerCap) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                <div className="flex-1 h-8 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center gap-2 group/btn hover:bg-emerald-500/10 transition-colors cursor-pointer">
                  <ShoppingCart size={12} className="text-emerald-500 group-hover/btn:scale-110 transition-transform" />
                  <span className="text-[9px] font-black text-white uppercase tracking-widest">Mercado</span>
                </div>
                <div className="flex-1 h-8 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center gap-2 group/btn hover:bg-emerald-500/10 transition-colors cursor-pointer">
                  <Briefcase size={12} className="text-emerald-500 group-hover/btn:scale-110 transition-transform" />
                  <span className="text-[9px] font-black text-white uppercase tracking-widest">Contratos</span>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 3: MANCHETE (Última Notícia) */}
          <div className="relative group overflow-hidden rounded-[2rem] border border-white/5 bg-black/40 backdrop-blur-2xl p-6 transition-all hover:border-purple-500/30 shadow-2xl">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/10 blur-[100px] group-hover:bg-purple-500/20 transition-all duration-700" />
            
            <div className="relative z-10 flex flex-col h-full justify-between gap-6">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] mb-1">Feed Global</span>
                  <h3 className="text-xl font-black text-white tracking-tighter uppercase italic">Manchete</h3>
                </div>
                <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
                  <Newspaper size={18} className="text-purple-400" />
                </div>
              </div>

              <div className="flex flex-col gap-3 py-2">
                <div className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full self-start">
                  <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest italic">Urgente</span>
                </div>
                <h4 className="text-lg font-black text-white leading-tight tracking-tight line-clamp-2 group-hover:text-purple-300 transition-colors">
                  {lastHeadline.title}
                </h4>
                <p className="text-xs text-slate-500 font-bold leading-relaxed line-clamp-2">
                  {lastHeadline.message}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse shadow-[0_0_5px_rgba(168,85,247,0.8)]" />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Feed Atualizado</span>
                </div>
                <ChevronRight size={16} className="text-purple-500 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

        </div>

        {/* BOTTOM SECTION: Agenda and Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
           {/* Agenda de Jogos */}
           <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between px-2">
                 <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em] flex items-center gap-3">
                    <div className="w-4 h-[1px] bg-cyan-500/50" />
                    Calendário Oficial
                 </h3>
                 <button className="text-[8px] text-slate-500 hover:text-cyan-400 font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 group">
                    Histórico <ChevronRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                 </button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                 {upcomingMatches.slice(0, 4).map((m, i) => (
                   <div key={i} className="group relative bg-black/40 border border-white/5 rounded-2xl p-4 hover:border-cyan-500/30 transition-all cursor-pointer overflow-hidden">
                      <div className="absolute top-0 right-0 w-12 h-12 bg-cyan-500/5 blur-xl group-hover:bg-cyan-500/10 transition-all" />
                      
                      <div className="relative z-10">
                        <div className="flex justify-between items-center mb-3">
                           <span className="text-[8px] text-cyan-500/50 font-black uppercase tracking-widest italic">{m.date.split('-').reverse().slice(0,2).join('/')}</span>
                           <span className="text-[8px] text-white font-black tabular-nums">{m.time}</span>
                        </div>
                        
                        <div className="space-y-2">
                           <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] text-slate-300 font-black truncate uppercase">{m.home}</span>
                              <span className="text-[10px] text-white font-black tabular-nums">0</span>
                           </div>
                           <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] text-slate-300 font-black truncate uppercase">{m.away}</span>
                              <span className="text-[10px] text-white font-black tabular-nums">0</span>
                           </div>
                        </div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           {/* Logs de Sistema / Atividades */}
           <div className="space-y-3">
              <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em] flex items-center gap-3 px-2">
                 <div className="w-4 h-[1px] bg-purple-500/50" />
                 Sistema Log
              </h3>
              <div className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl">
                 <div className="divide-y divide-white/5">
                   {[
                     { label: 'Otimização Tática', time: 'AGORA', status: 'cyan', icon: Zap },
                     { label: 'Mercado Aberto', time: '12m', status: 'emerald', icon: ShoppingCart },
                     { label: 'Scout Norte', time: '45m', status: 'purple', icon: Search },
                     { label: 'Sincronização', time: '2h', status: 'slate', icon: Database },
                   ].map((n, i) => (
                     <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition-all cursor-pointer group">
                        <div className="flex items-center gap-3">
                           <div className={`p-1.5 rounded-lg bg-black/40 border border-white/5 group-hover:border-${n.status}-500/30 transition-colors`}>
                              <n.icon size={12} className={`text-${n.status}-500 group-hover:scale-110 transition-transform`} />
                           </div>
                           <span className="text-[10px] text-slate-400 group-hover:text-white transition-colors font-black uppercase tracking-tight">{n.label}</span>
                        </div>
                        <span className="text-[8px] text-slate-600 font-black tabular-nums group-hover:text-slate-400 transition-colors">{n.time}</span>
                     </div>
                   ))}
                 </div>
                 <div className="p-3 bg-white/[0.02] border-t border-white/5 flex items-center justify-center">
                    <button className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] hover:text-white transition-colors">Acessar Console Completo</button>
                 </div>
              </div>
           </div>
        </div>
      </div>
    );
  };

  const [squadViewMode, setSquadViewMode] = useState<'grid' | 'list'>('list');

  const handleDragStart = (e: React.DragEvent, player: Player) => {
    e.dataTransfer.setData('playerId', player.id);
  };

  const renderSquad = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      {userTeam ? (
        <>
          <div className="flex justify-end mb-4">
            <div className="flex bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-xl p-1 shadow-[0_0_10px_rgba(34,211,238,0.1)]">
              <button 
                onClick={() => setSquadViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${squadViewMode === 'grid' ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)]' : 'text-slate-500 hover:text-cyan-400/50'}`}
              >
                <Database size={16} />
              </button>
              <button 
                onClick={() => setSquadViewMode('list')}
                className={`p-2 rounded-lg transition-all ${squadViewMode === 'list' ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)]' : 'text-slate-500 hover:text-cyan-400/50'}`}
              >
                <Sliders size={16} />
              </button>
            </div>
          </div>
          
          {squadViewMode === 'grid' ? (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
              {userTeam.squad.map(playerId => {
                const player = state.players[playerId];
                return player ? <PlayerCard key={player.id} player={player} onClick={setSelectedPlayer} /> : null;
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {userTeam.squad.map((playerId, index) => {
                const player = state.players[playerId];
                if (!player) return null;
                return (
                  <PlayerCard 
                    key={player.id} 
                    player={player} 
                    onClick={setSelectedPlayer} 
                    variant="banner" 
                  />
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 text-slate-500 font-medium bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-xl">
          Você ainda não assumiu um clube.
        </div>
      )}
    </div>
  );

  const renderLineup = () => (
    <div className="h-full">
      {userTeam ? (
        <LineupBuilder 
          team={userTeam} 
          allPlayers={state.players} 
          onPlayerSelect={setSelectedPlayer} 
        />
      ) : (
        <div className="text-center py-20 text-slate-500 font-medium bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-xl w-full">
          Você ainda não assumiu um clube.
        </div>
      )}
    </div>
  );

  const renderTactics = () => (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-md mx-auto">
      {/* BASE TÁTICA */}
      <div className="bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-xl p-5 shadow-[0_0_20px_rgba(34,211,238,0.15)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-cyan-500/10 to-transparent pointer-events-none" />
        <h3 className="text-center text-cyan-300 font-black tracking-widest uppercase mb-4 text-sm drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
          Base Tática <span className="text-cyan-500/70 font-medium">(Regulamento)</span>
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          <button className="col-span-2 bg-black/40 border border-cyan-500/30 rounded-xl p-3 flex flex-col items-center justify-center hover:bg-cyan-900/40 transition-colors shadow-[0_0_10px_rgba(34,211,238,0.1)] hover:border-cyan-400">
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest mb-1 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">Estilo de Jogo:</span>
            <span className="text-white font-bold drop-shadow-md">Contra-Ataque</span>
          </button>
          <button className="bg-black/40 border border-cyan-500/30 rounded-xl p-3 flex flex-col items-center justify-center hover:bg-cyan-900/40 transition-colors shadow-[0_0_10px_rgba(34,211,238,0.1)] hover:border-cyan-400">
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest mb-1 text-center drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">Mentalidade / Bola:</span>
            <span className="text-white font-bold text-sm text-center drop-shadow-md">Pressão Média</span>
          </button>
          <button className="bg-black/40 border border-cyan-500/30 rounded-xl p-3 flex flex-col items-center justify-center hover:bg-cyan-900/40 transition-colors shadow-[0_0_10px_rgba(34,211,238,0.1)] hover:border-cyan-400">
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest mb-1 text-center drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">Modo de Criação:</span>
            <span className="text-white font-bold text-sm text-center drop-shadow-md">Pelos Pontos</span>
          </button>
        </div>
      </div>

      {/* DIRETRIZES TÁTICAS */}
      <div className="bg-black/40 backdrop-blur-md border border-indigo-500/30 rounded-xl p-5 shadow-[0_0_20px_rgba(99,102,241,0.15)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />
        <h3 className="text-center text-indigo-300 font-black tracking-widest uppercase mb-4 text-sm drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]">
          Diretrizes de Jogo <span className="text-indigo-500/70 font-medium">(Modificadores)</span>
        </h3>
        
        <div className="space-y-4">
          <button className="w-full bg-black/40 border border-indigo-500/30 rounded-xl p-3 flex flex-col items-center justify-center hover:bg-indigo-900/40 transition-colors shadow-[0_0_10px_rgba(99,102,241,0.1)] hover:border-indigo-400">
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1 drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]">Foco Ofensivo:</span>
            <span className="text-white font-bold flex items-center gap-2 drop-shadow-md">Armador Principal <span className="text-indigo-500">▼</span></span>
          </button>

          <div className="bg-black/40 border border-indigo-500/30 rounded-xl p-4 shadow-[0_0_10px_rgba(99,102,241,0.1)]">
            <div className="flex justify-between items-end mb-2">
              <div className="flex flex-col">
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]">Gestão de Sobrecarga</span>
                <span className="text-xs text-slate-400">(Stamina)</span>
              </div>
              <div className="flex flex-col items-end">
                <Clock size={14} className="text-indigo-400 mb-1 drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]" />
                <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest text-right drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]">Despertar Tardio<br/><span className="text-slate-400 font-normal">(Final Épico)</span></span>
              </div>
            </div>
            <div className="relative h-2 bg-black/50 border border-white/5 rounded-full mt-4">
              <div className="absolute top-0 left-0 h-full w-3/4 bg-gradient-to-r from-indigo-600 to-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
              <div className="absolute top-1/2 left-3/4 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Flame size={16} className="text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
              <span className="text-[10px] text-orange-400 font-bold uppercase tracking-widest drop-shadow-[0_0_5px_rgba(249,115,22,0.5)]">Blitzkrieg <span className="text-slate-400 font-normal">(Início Explosivo)</span></span>
            </div>
          </div>

          <button className="w-full bg-black/40 border border-indigo-500/30 rounded-xl p-3 flex flex-col items-center justify-center hover:bg-indigo-900/40 transition-colors shadow-[0_0_10px_rgba(99,102,241,0.1)] hover:border-indigo-400">
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1 drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]">Diretriz de Caça:</span>
            <span className="text-white font-bold drop-shadow-md">Caça ao Meio</span>
          </button>
        </div>
      </div>

      {/* GATILHOS DE PODER */}
      <div className="bg-black/40 backdrop-blur-md border border-fuchsia-500/30 rounded-xl p-5 shadow-[0_0_20px_rgba(217,70,239,0.15)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-fuchsia-500/10 to-transparent pointer-events-none" />
        <h3 className="text-center text-fuchsia-300 font-black tracking-widest uppercase mb-4 text-sm drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]">
          Gatilhos de Poder <span className="text-fuchsia-500/70 font-medium">(Ki Risco)</span>
        </h3>
        
        <div className="flex justify-between items-center gap-4">
          <div className="flex-1 bg-black/40 border border-fuchsia-500/30 rounded-xl p-3 flex items-center justify-between shadow-[0_0_10px_rgba(217,70,239,0.1)]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-4 bg-red-500 rounded-full relative shadow-[0_0_10px_rgba(239,68,68,0.8)] border border-red-400">
                <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-[0_0_5px_rgba(255,255,255,0.8)]" />
                <span className="absolute -left-6 top-0 text-[8px] font-bold text-red-400 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]">ON</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-fuchsia-400 font-bold uppercase tracking-widest drop-shadow-[0_0_5px_rgba(217,70,239,0.5)]">Fúria Cega</span>
              <span className="text-[9px] text-slate-400">(Carrinhos Letais)</span>
            </div>
          </div>

          <div className="flex-1 bg-black/40 border border-fuchsia-500/30 rounded-xl p-3 flex items-center justify-between shadow-[0_0_10px_rgba(217,70,239,0.1)] opacity-60">
            <div className="flex flex-col items-start">
              <span className="text-[10px] text-fuchsia-400 font-bold uppercase tracking-widest drop-shadow-[0_0_5px_rgba(217,70,239,0.5)]">Última Dança</span>
              <span className="text-[9px] text-slate-400">(Kamikaze)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-4 bg-slate-800 border border-slate-600 rounded-full relative">
                <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-slate-500 rounded-full" />
                <span className="absolute -right-8 top-0 text-[8px] font-bold text-slate-500">OFF</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTraining = () => (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-md mx-auto">
      <header className="mb-8">
        <h2 className="text-4xl font-black text-white tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] flex items-center gap-3">
          <TrendingUp className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" /> Treinamento
        </h2>
      </header>
      <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.1)]">
        Área de evolução de atributos e cura de traços/badges em breve.
      </div>
    </div>
  );

  const renderLockerRoom = () => (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-md mx-auto">
      {/* Termômetros de Clima */}
      <div className="bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-xl p-5 shadow-[0_0_20px_rgba(34,211,238,0.15)] space-y-4">
        <div>
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1">
            <span className="text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">Autoridade do Manager</span>
            <span className="text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">85%</span>
          </div>
          <div className="h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
            <div className="h-full bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)]" style={{ width: '85%' }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1">
            <span className="text-emerald-400">União do Elenco</span>
            <span className="text-emerald-400">60%</span>
          </div>
          <div className="h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
            <div className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 rounded-full opacity-80" style={{ width: '60%' }} />
          </div>
        </div>
      </div>

      {/* O Dilema Ativo */}
      <div className="bg-black/40 backdrop-blur-md border border-amber-500/50 rounded-xl p-6 shadow-[0_0_20px_rgba(245,158,11,0.15)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none" />
        
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="text-amber-400 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]" size={20} />
          <h3 className="text-amber-400 font-black tracking-widest uppercase text-sm drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">
            Crise Iminente
          </h3>
        </div>

        <p className="text-white text-sm font-medium leading-relaxed mb-6 drop-shadow-md">
          "O atacante titular está exigindo a faixa de capitão e ameaça rachar o vestiário antes do clássico."
        </p>

        <div className="space-y-3">
          <button className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-wider py-3 px-4 rounded-xl transition-colors shadow-[0_0_15px_rgba(245,158,11,0.4)] text-xs">
            Multar o Jogador (-10% União)
          </button>
          <button className="w-full bg-black/40 border border-amber-500/50 hover:border-amber-400 text-amber-400 font-bold uppercase tracking-wider py-3 px-4 rounded-xl transition-colors text-xs shadow-[0_0_10px_rgba(245,158,11,0.1)]">
            Ceder a Faixa (-20% Autoridade)
          </button>
          <button className="w-full bg-black/40 border border-white/10 hover:border-white/30 text-slate-400 font-medium py-2 px-4 rounded-xl transition-colors text-xs flex items-center justify-center gap-2 mt-2">
            <AlertTriangle size={12} className="text-red-400 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]" /> Ignorar (Risco Alto)
          </button>
        </div>
      </div>

      {/* Feed de Tensão */}
      <div className="bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-xl p-5 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
        <h3 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-4 flex items-center gap-2 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
          <MessageSquare size={12} /> Rádio Peão
        </h3>
        <div className="space-y-3 max-h-40 overflow-y-auto hide-scrollbar pr-2">
          <div className="bg-black/60 border border-cyan-500/20 rounded-xl rounded-tl-none p-3 text-xs text-slate-300 shadow-[0_0_10px_rgba(34,211,238,0.05)]">
            <span className="text-cyan-400 font-bold drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">@Sora_B:</span> "Sora Belinsky foi vista discutindo com a zaga após o treino."
          </div>
          <div className="bg-black/60 border border-purple-500/20 rounded-xl rounded-tr-none p-3 text-xs text-slate-300 ml-8 shadow-[0_0_10px_rgba(168,85,247,0.05)]">
            <span className="text-purple-400 font-bold drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]">@Zaga_Leste:</span> "A culpa não foi nossa se o meio campo não marca!"
          </div>
          <div className="bg-black/60 border border-emerald-500/20 rounded-xl rounded-tl-none p-3 text-xs text-slate-300 shadow-[0_0_10px_rgba(16,185,129,0.05)]">
            <span className="text-emerald-400 font-bold drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]">@Diretoria:</span> "Estamos de olho na situação."
          </div>
        </div>
      </div>
    </div>
  );

  const renderTeam = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex overflow-x-auto slim-scrollbar gap-3 pb-4 mb-2">
        {(['squad', 'tactics', 'lineup', 'training', 'locker_room'] as TeamSubTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTeamTab(tab)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all backdrop-blur-md ${
              activeTeamTab === tab 
                ? 'bg-cyan-900/30 text-white border border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]' 
                : 'bg-black/40 text-slate-400 border border-cyan-400/30 hover:border-cyan-400/60'
            }`}
          >
            {tab === 'squad' && 'Elenco'}
            {tab === 'tactics' && 'Tática'}
            {tab === 'lineup' && 'Escalação'}
            {tab === 'training' && 'Treinamento'}
            {tab === 'locker_room' && 'Vestiário'}
          </button>
        ))}
      </div>

      {activeTeamTab === 'squad' && renderSquad()}
      {activeTeamTab === 'tactics' && renderTactics()}
      {activeTeamTab === 'lineup' && renderLineup()}
      {activeTeamTab === 'training' && renderTraining()}
      {activeTeamTab === 'locker_room' && renderLockerRoom()}
    </div>
  );

  const renderCompetition = () => {
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
      <div className="space-y-8 animate-in fade-in duration-700 max-w-5xl mx-auto pb-12">
        {/* Main Highlight Match */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-black/40 backdrop-blur-3xl border border-white/5 p-8 shadow-2xl group">
          {/* Dynamic Background Glow */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-500/10 blur-[120px] animate-pulse" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-500/10 blur-[120px] animate-pulse" />
          
          <div className="relative z-10 flex flex-col gap-8">
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em] mb-1">Próximo Grande Desafio</span>
                <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Rodada {nextMatch.id.split('_')[1]} • {nextMatch.type}</h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl flex flex-col items-center">
                  <span className="text-[10px] font-black text-white tabular-nums">{nextMatch.time}</span>
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Kick-off</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 py-8 border-y border-white/5 my-4">
              {/* Home Team */}
              <div className="flex items-center gap-6 flex-1 justify-end group/home">
                <div className="flex flex-col items-end text-right">
                  <span className={`text-2xl font-black uppercase tracking-tight group-hover/home:text-cyan-300 transition-colors ${nextMatch.homeId === userTeam?.id ? 'text-cyan-400' : 'text-white'}`}>
                    {nextMatch.home}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Mandante</span>
                </div>
                <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center shadow-2xl group-hover/home:scale-110 transition-transform duration-700 relative overflow-hidden group-hover/home:border-cyan-500/50">
                  {homeTeam?.logo ? (
                    <TeamLogo 
                      primaryColor={homeTeam.logo.primary}
                      secondaryColor={homeTeam.logo.secondary}
                      patternId={homeTeam.logo.patternId as any}
                      symbolId={homeTeam.logo.symbolId}
                      size={64}
                    />
                  ) : (
                    <div className="w-20 h-20 flex items-center justify-center">
                      <TeamLogo 
                        primaryColor={homeTeam?.colors.primary || '#fff'}
                        secondaryColor={homeTeam?.colors.secondary || '#333'}
                        patternId="none"
                        symbolId="Shield"
                        size={48}
                      />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
                </div>
              </div>

              {/* VS Section */}
              <div className="flex flex-col items-center gap-3 shrink-0">
                <div className="text-6xl font-black text-white/5 italic tracking-tighter select-none drop-shadow-[0_0_20px_rgba(255,255,255,0.05)]">VS</div>
                <div className="px-4 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full backdrop-blur-md">
                  <span className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.2em] animate-pulse">Live Soon</span>
                </div>
              </div>

              {/* Away Team */}
              <div className="flex items-center gap-6 flex-1 group/away">
                <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center shadow-2xl group-hover/away:scale-110 transition-transform duration-700 relative overflow-hidden group-hover/away:border-purple-500/50">
                  {awayTeam?.logo ? (
                    <TeamLogo 
                      primaryColor={awayTeam.logo.primary}
                      secondaryColor={awayTeam.logo.secondary}
                      patternId={awayTeam.logo.patternId as any}
                      symbolId={awayTeam.logo.symbolId}
                      size={64}
                    />
                  ) : (
                    <div className="w-20 h-20 flex items-center justify-center">
                      <TeamLogo 
                        primaryColor={awayTeam?.colors.primary || '#fff'}
                        secondaryColor={awayTeam?.colors.secondary || '#333'}
                        patternId="none"
                        symbolId="Shield"
                        size={48}
                      />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className={`text-2xl font-black uppercase tracking-tight group-hover/away:text-purple-300 transition-colors ${nextMatch.awayId === userTeam?.id ? 'text-purple-400' : 'text-white'}`}>
                    {nextMatch.away}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Visitante</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-white/5">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Local</span>
                  <span className="text-xs font-bold text-white uppercase italic">Neo-Stadium Alpha</span>
                </div>
                <div className="w-[1px] h-8 bg-white/5" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Clima</span>
                  <span className="text-xs font-bold text-cyan-400 uppercase italic">Céu Limpo • 22°C</span>
                </div>
              </div>
              <button className="px-8 py-3 bg-white text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-cyan-400 transition-all shadow-xl hover:scale-105 active:scale-95">
                GERENCIAR ESCALAÇÃO
              </button>
            </div>
          </div>
        </div>

        {/* Upcoming Matches List - Redesigned to Horizontal Strips */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
              <Calendar size={16} className="text-cyan-400" />
              Calendário de Jogos
            </h3>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Temporada 2050</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {upcomingMatches.slice(1).map((match) => {
              const hTeam = state.teams[match.homeId];
              const aTeam = state.teams[match.awayId];
              
              return (
                <div 
                  key={match.id} 
                  className="group relative bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-4 hover:bg-white/[0.05] hover:border-cyan-500/30 transition-all flex items-center justify-between gap-6 overflow-hidden shadow-lg"
                >
                  {/* Status Indicator */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${match.type === 'League' ? 'bg-cyan-500/50' : 'bg-purple-500/50'}`} />
                  
                  {/* Time & Competition */}
                  <div className="flex flex-col items-center justify-center min-w-[100px] py-2 border-r border-white/5 pr-6">
                    <span className="text-base font-black text-white tabular-nums tracking-tighter group-hover:text-cyan-400 transition-colors">{match.time}</span>
                    <div className="px-2 py-0.5 bg-white/5 rounded-md border border-white/5 mt-1">
                       <span className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em]">{match.type}</span>
                    </div>
                  </div>

                  {/* Teams Row */}
                  <div className="flex-1 flex items-center justify-between px-4">
                    {/* Home */}
                    <div className="flex items-center gap-4 flex-1 justify-end group/h">
                      <span className={`text-sm font-black uppercase tracking-tight truncate text-right group-hover/h:text-cyan-300 transition-colors ${match.homeId === userTeam?.id ? 'text-cyan-400' : 'text-white'}`}>
                        {match.home}
                      </span>
                      <div className="w-14 h-14 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-center shrink-0 shadow-2xl group-hover/h:scale-110 transition-transform duration-500 relative overflow-hidden group-hover/h:border-cyan-500/30">
                        {hTeam?.logo ? (
                          <TeamLogo 
                            primaryColor={hTeam.logo.primary}
                            secondaryColor={hTeam.logo.secondary}
                            patternId={hTeam.logo.patternId as any}
                            symbolId={hTeam.logo.symbolId}
                            size={40}
                          />
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center">
                            <TeamLogo 
                              primaryColor={hTeam?.colors.primary || '#fff'}
                              secondaryColor={hTeam?.colors.secondary || '#333'}
                              patternId="none"
                              symbolId="Shield"
                              size={28}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* VS */}
                    <div className="mx-8">
                      <span className="text-xl font-black text-white/5 italic tracking-tighter">VS</span>
                    </div>

                    {/* Away */}
                    <div className="flex items-center gap-4 flex-1 justify-start group/a">
                      <div className="w-14 h-14 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-center shrink-0 shadow-2xl group-hover/a:scale-110 transition-transform duration-500 relative overflow-hidden group-hover/a:border-purple-500/30">
                        {aTeam?.logo ? (
                          <TeamLogo 
                            primaryColor={aTeam.logo.primary}
                            secondaryColor={aTeam.logo.secondary}
                            patternId={aTeam.logo.patternId as any}
                            symbolId={aTeam.logo.symbolId}
                            size={40}
                          />
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center">
                            <TeamLogo 
                              primaryColor={aTeam?.colors.primary || '#fff'}
                              secondaryColor={aTeam?.colors.secondary || '#333'}
                              patternId="none"
                              symbolId="Shield"
                              size={28}
                            />
                          </div>
                        )}
                      </div>
                      <span className={`text-sm font-black uppercase tracking-tight truncate group-hover/a:text-purple-300 transition-colors ${match.awayId === userTeam?.id ? 'text-purple-400' : 'text-white'}`}>
                        {match.away}
                      </span>
                    </div>
                  </div>

                  {/* Round & Date */}
                  <div className="flex flex-col items-end min-w-[120px] pl-6 border-l border-white/5">
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Rodada {match.id.split('_')[1]}</span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                      {new Date(match.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')}
                    </span>
                    <button className="mt-2 text-[8px] font-black text-cyan-400 hover:text-white transition-colors uppercase tracking-[0.2em] flex items-center gap-1 group/btn">
                      PREPARAR <ChevronRight size={10} className="group-hover/btn:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const [activeWorldTab, setActiveWorldTab] = useState<'market' | 'ranking' | 'teams' | 'news' | 'leagues'>('news');
  const [activeLeagueTab, setActiveLeagueTab] = useState<'standings' | 'scorers'>('standings');
  const [selectedTeamView, setSelectedTeamView] = useState<string | null>(null);
  const [worldTeamSubTab, setWorldTeamSubTab] = useState<'squad' | 'tactics'>('squad');

  const renderWorld = () => {
    if (selectedTeamView) {
      const team = state.teams[selectedTeamView];
      if (!team) return null;
      return (
        <div className="space-y-6 animate-in fade-in duration-500">
          <header className="flex items-center gap-6 mb-8">
            <button 
              onClick={() => setSelectedTeamView(null)}
              className="w-12 h-12 bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-full flex items-center justify-center hover:bg-cyan-900/40 hover:border-cyan-400 transition-all shadow-[0_0_15px_rgba(34,211,238,0.2)] group"
            >
              <span className="text-xl text-cyan-400 group-hover:-translate-x-1 transition-transform">←</span>
            </button>
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center shadow-2xl relative overflow-hidden">
                {team.logo ? (
                  <TeamLogo 
                    primaryColor={team.logo.primary}
                    secondaryColor={team.logo.secondary}
                    patternId={team.logo.patternId as any}
                    symbolId={team.logo.symbolId}
                    size={64}
                  />
                ) : (
                  <div className="w-16 h-16 flex items-center justify-center">
                    <TeamLogo 
                      primaryColor={team.colors.primary || '#fff'}
                      secondaryColor={team.colors.secondary || '#333'}
                      patternId="none"
                      symbolId="Shield"
                      size={40}
                    />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
              </div>
              <div>
                <h2 className="text-4xl font-black text-white tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] uppercase italic">{team.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-cyan-400 font-bold tracking-widest text-[10px] uppercase">Clube Profissional</span>
                  <span className="w-1 h-1 rounded-full bg-slate-700" />
                  <span className="text-slate-400 font-bold tracking-widest text-[10px] uppercase">{team.district}</span>
                </div>
              </div>
            </div>
          </header>

          <div className="flex gap-3 mb-8 border-b border-cyan-500/20 pb-4">
            <button 
              onClick={() => setWorldTeamSubTab('squad')}
              className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all whitespace-nowrap backdrop-blur-md ${worldTeamSubTab === 'squad' ? 'bg-cyan-900/30 text-white border border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 'bg-black/40 text-slate-400 border border-cyan-400/30 hover:border-cyan-400/60'}`}
            >
              Elenco
            </button>
            <button 
              onClick={() => setWorldTeamSubTab('tactics')}
              className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all whitespace-nowrap backdrop-blur-md ${worldTeamSubTab === 'tactics' ? 'bg-cyan-900/30 text-white border border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 'bg-black/40 text-slate-400 border border-cyan-400/30 hover:border-cyan-400/60'}`}
            >
              Espionar Tática
            </button>
          </div>

          {worldTeamSubTab === 'squad' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-widest mb-4 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">Elenco Principal</h3>
              {(team.squad || []).map((playerId, index) => {
                const player = state.players[playerId];
                if (!player) return null;
                return (
                  <div 
                    key={player.id} 
                    onClick={() => setSelectedPlayer(player)}
                    className="relative group cursor-pointer"
                  >
                    {/* Card Container */}
                    <div className="relative flex items-center justify-between bg-black/40 backdrop-blur-md border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.1)] hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] rounded-xl p-3 transition-all duration-300 overflow-hidden">
                      {/* Left Accent Line */}
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-cyan-500/50 group-hover:bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                      
                      <div className="flex items-center gap-4 pl-3">
                      {/* Team Logo Overlay (NEW) */}
                      <div className="absolute right-0 top-0 bottom-0 w-32 opacity-[0.03] pointer-events-none group-hover:opacity-[0.08] transition-opacity">
                        {team.logo && (
                          <div className="scale-[2.5] translate-x-8 translate-y-4">
                            <TeamLogo 
                              primaryColor={team.logo.primary}
                              secondaryColor={team.logo.secondary}
                              patternId={team.logo.patternId as any}
                              symbolId={team.logo.symbolId}
                              size={64}
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* Rating Box */}
                        <div className="relative w-12 h-12 rounded-xl border border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)] flex items-center justify-center bg-cyan-950/40">
                          <span className="font-black text-xl text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
                            {player.totalRating}
                          </span>
                        </div>

                        {/* Player Info */}
                        <div className="flex flex-col">
                          <div className="font-black text-white text-base tracking-tight drop-shadow-md">{player.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest bg-cyan-900/50 px-2 py-0.5 rounded-lg border border-cyan-500/50 shadow-[0_0_5px_rgba(34,211,238,0.2)]">
                              {player.position}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Side - Value & Badges */}
                      <div className="flex flex-col items-end gap-2 pr-2">
                        <div className="text-sm font-black text-emerald-400 tracking-wider drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                          ${(player.contract.marketValue / 1000000).toFixed(1)}M
                        </div>
                        <div className="flex gap-1.5">
                          {player.badges.slot1 && <div className="w-5 h-5 rounded-lg bg-black/50 border border-cyan-500/50 flex items-center justify-center shadow-[0_0_5px_rgba(34,211,238,0.2)]" title={player.badges.slot1}><Star size={10} className="text-cyan-400" /></div>}
                          {player.badges.slot2 && <div className="w-5 h-5 rounded-lg bg-black/50 border border-cyan-500/50 flex items-center justify-center shadow-[0_0_5px_rgba(34,211,238,0.2)]" title={player.badges.slot2}><Star size={10} className="text-cyan-400" /></div>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {worldTeamSubTab === 'tactics' && (
            <div className="bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-xl p-6 mb-6 shadow-[0_0_20px_rgba(34,211,238,0.15)]">
              <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-widest mb-4 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">Formação e Estilo</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-xl p-4 flex flex-col items-center justify-center aspect-[3/4] relative overflow-hidden shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  <div className="absolute inset-0 bg-emerald-900/20" />
                  <div className="absolute inset-0 border-2 border-emerald-500/30 m-4 rounded-lg shadow-[inset_0_0_10px_rgba(16,185,129,0.2)]" />
                  <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-emerald-500/30" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-2 border-emerald-500/30" />
                  
                  <div className="relative z-10 text-center">
                    <div className="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] mb-2">{team.tactics.preferredFormation}</div>
                    <div className="text-xs text-emerald-400 font-bold uppercase tracking-widest drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]">Formação Padrão</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-black/40 border border-cyan-500/30 rounded-xl p-4 shadow-[0_0_10px_rgba(34,211,238,0.1)]">
                    <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest mb-1 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">Estilo de Jogo</div>
                    <div className="text-xl font-bold text-white drop-shadow-md">{team.tactics.playStyle}</div>
                  </div>
                  
                  <div className="bg-black/40 border border-cyan-500/30 rounded-xl p-4 shadow-[0_0_10px_rgba(34,211,238,0.1)]">
                    <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest mb-3 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">Tendências</div>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-300">Agressividade</span>
                          <span className="text-fuchsia-400 font-bold drop-shadow-[0_0_5px_rgba(217,70,239,0.5)]">Alta</span>
                        </div>
                        <div className="h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
                          <div className="h-full bg-fuchsia-500 w-[80%] shadow-[0_0_10px_rgba(217,70,239,0.8)]" />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-300">Posse de Bola</span>
                          <span className="text-cyan-400 font-bold drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">Média</span>
                        </div>
                        <div className="h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
                          <div className="h-full bg-cyan-500 w-[50%] shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4 animate-in fade-in duration-500">
        
        <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar pb-2">
          <button 
            onClick={() => setActiveWorldTab('news')}
            className={`p-2 rounded-xl flex items-center justify-center transition-all whitespace-nowrap backdrop-blur-md ${activeWorldTab === 'news' ? 'bg-purple-900/30 text-white border border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-black/40 text-slate-400 border border-purple-500/30 hover:border-purple-500/60'}`}
            title="Notícias"
          >
            <Newspaper size={16} />
          </button>
          <button 
            onClick={() => setActiveWorldTab('leagues')}
            className={`p-2 rounded-xl flex items-center justify-center transition-all whitespace-nowrap backdrop-blur-md ${activeWorldTab === 'leagues' ? 'bg-emerald-900/30 text-white border border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-black/40 text-slate-400 border border-emerald-500/30 hover:border-emerald-500/60'}`}
            title="Ligas"
          >
            <Trophy size={16} />
          </button>
          <button 
            onClick={() => setActiveWorldTab('market')}
            className={`p-2 rounded-xl flex items-center justify-center transition-all whitespace-nowrap backdrop-blur-md ${activeWorldTab === 'market' ? 'bg-orange-900/30 text-white border border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'bg-black/40 text-slate-400 border border-orange-500/30 hover:border-orange-500/60'}`}
            title="Mercado"
          >
            <ShoppingCart size={16} />
          </button>
          <button 
            onClick={() => setActiveWorldTab('ranking')}
            className={`p-2 rounded-xl flex items-center justify-center transition-all whitespace-nowrap backdrop-blur-md ${activeWorldTab === 'ranking' ? 'bg-cyan-900/30 text-white border border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 'bg-black/40 text-slate-400 border border-cyan-400/30 hover:border-cyan-400/60'}`}
            title="Ranking"
          >
            <Award size={16} />
          </button>
          <button 
            onClick={() => setActiveWorldTab('teams')}
            className={`p-2 rounded-xl flex items-center justify-center transition-all whitespace-nowrap backdrop-blur-md ${activeWorldTab === 'teams' ? 'bg-purple-900/30 text-white border border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-black/40 text-slate-400 border border-purple-500/30 hover:border-purple-500/60'}`}
            title="Clubes"
          >
            <Users size={16} />
          </button>
        </div>

        {activeWorldTab === 'news' && (
          <div className="space-y-4">
            {state.notifications?.length > 0 ? (
              state.notifications.map(notification => (
                <div key={notification.id} className={`bg-slate-900/60 backdrop-blur-xl border rounded-xl p-4 flex gap-4 ${!notification.read ? 'border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.1)]' : 'border-white/10'}`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    notification.type === 'transfer' ? 'bg-emerald-500/20 text-emerald-400' :
                    notification.type === 'match' ? 'bg-fuchsia-500/20 text-fuchsia-400' :
                    notification.type === 'crisis' ? 'bg-red-500/20 text-red-400' :
                    'bg-cyan-500/20 text-cyan-400'
                  }`}>
                    {notification.type === 'transfer' ? (
                      notification.message.includes('assinou com o') ? (() => {
                        const teamName = notification.message.split('assinou com o')[1].replace('!', '').trim();
                        const team = Object.values(state.teams).find(t => t.name === teamName);
                        return team?.logo ? (
                          <TeamLogo 
                            primaryColor={team.logo.primary}
                            secondaryColor={team.logo.secondary}
                            patternId={team.logo.patternId as any}
                            symbolId={team.logo.symbolId}
                            size={24}
                          />
                        ) : <Wallet size={24} />;
                      })() : <Wallet size={24} />
                    ) :
                     notification.type === 'match' ? (
                       notification.message.includes('vs') ? (() => {
                         const matchParts = notification.message.split('vs');
                         const teamName = matchParts[0].trim();
                         const team = Object.values(state.teams).find(t => t.name === teamName);
                         return team?.logo ? (
                           <TeamLogo 
                             primaryColor={team.logo.primary}
                             secondaryColor={team.logo.secondary}
                             patternId={team.logo.patternId as any}
                             symbolId={team.logo.symbolId}
                             size={24}
                           />
                         ) : (
                           <div className="w-6 h-6 flex items-center justify-center">
                             <TeamLogo 
                               primaryColor="#334155"
                               secondaryColor="#1e293b"
                               patternId="none"
                               symbolId="Shield"
                               size={24}
                             />
                           </div>
                         );
                       })() : (
                         <div className="w-6 h-6 flex items-center justify-center">
                           <TeamLogo 
                             primaryColor="#334155"
                             secondaryColor="#1e293b"
                             patternId="none"
                             symbolId="Shield"
                             size={24}
                           />
                         </div>
                       )
                     ) :
                     notification.type === 'crisis' ? <AlertTriangle size={24} /> :
                     <Newspaper size={24} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-white">{notification.title}</h3>
                      {!notification.read && <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.8)]" />}
                    </div>
                    <div className="text-sm text-slate-400 mb-2">
                      {notification.message.includes('|') ? (
                        <div className="flex flex-col gap-1 mt-1">
                          {notification.message.split('|').map((line, i) => (
                            <span key={i} className="block bg-black/20 px-2 py-1 rounded-lg text-xs border border-white/5">
                              {line.trim()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        notification.message
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                      {new Date(notification.date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-500 font-medium">Nenhuma notícia no momento.</div>
            )}
          </div>
        )}
        
        {activeWorldTab === 'leagues' && (() => {
          const activeLeagueData = leaguesData[activeLeague as keyof typeof leaguesData];
          if (!activeLeagueData) return <div className="text-center text-slate-500 p-10">Dados da liga indisponíveis.</div>;

          return (
            <div className="space-y-4">
              {/* Seção de Copas com destaque horizontal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                <div
                  onClick={() => setActiveCompetition('elite')}
                  className={`relative overflow-hidden backdrop-blur-md border rounded-xl p-3 flex items-center gap-4 cursor-pointer transition-all hover:scale-[1.01] shadow-[0_0_20px_rgba(217,70,239,0.1)] group ${activeCompetition === 'elite' ? 'border-fuchsia-500 bg-fuchsia-900/20 ring-1 ring-fuchsia-400 shadow-[0_0_25px_rgba(217,70,239,0.3)]' : 'border-fuchsia-500/20 bg-black/40 hover:border-fuchsia-500/40'}`}
                >
                  <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-20 transition-opacity">
                     <Flame size={48} className="text-fuchsia-500" />
                  </div>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border shrink-0 transition-colors ${activeCompetition === 'elite' ? 'bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-400 shadow-[0_0_10px_rgba(217,70,239,0.4)]' : 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-400/60'}`}>
                    <Flame size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-xs font-bold uppercase tracking-widest ${activeCompetition === 'elite' ? 'text-fuchsia-400' : 'text-fuchsia-400/80'}`}>Copa Elite</h4>
                    <p className="text-[9px] text-slate-400 font-medium truncate mt-0.5">Torneio continental • 32 Clubes</p>
                  </div>
                  <div className="text-right shrink-0">
                     <div className="text-[10px] font-bold text-white uppercase tabular-nums">R16</div>
                     <div className="text-[7px] text-fuchsia-400 font-mono uppercase tracking-tighter">Em curso</div>
                  </div>
                </div>

                <div
                  onClick={() => setActiveCompetition('district')}
                  className={`relative overflow-hidden backdrop-blur-md border rounded-xl p-3 flex items-center gap-4 cursor-pointer transition-all hover:scale-[1.01] shadow-[0_0_20px_rgba(34,211,238,0.1)] group ${activeCompetition === 'district' ? 'border-cyan-500 bg-cyan-900/20 ring-1 ring-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.3)]' : 'border-cyan-500/20 bg-black/40 hover:border-cyan-500/40'}`}
                >
                  <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-20 transition-opacity">
                     <Globe size={48} className="text-cyan-500" />
                  </div>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border shrink-0 transition-colors ${activeCompetition === 'district' ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.4)]' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400/60'}`}>
                    <Globe size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-xs font-bold uppercase tracking-widest ${activeCompetition === 'district' ? 'text-cyan-400' : 'text-cyan-400/80'}`}>Copa Distritos</h4>
                    <p className="text-[9px] text-slate-400 font-medium truncate mt-0.5">Seleções Regionais • Top 16</p>
                  </div>
                  <div className="text-right shrink-0">
                     <div className="text-[10px] font-bold text-white uppercase tabular-nums">Final</div>
                     <div className="text-[7px] text-cyan-400 font-mono uppercase tracking-tighter">Próximo Mês</div>
                  </div>
                </div>
              </div>

              {/* Seletor de Ligas Horizontal Compacto */}
              <div className="flex overflow-x-auto gap-2 pb-3 slim-scrollbar px-1">
                {(Object.keys(leaguesData) as Array<keyof typeof leaguesData>).map((leagueKey) => {
                  const league = leaguesData[leagueKey];
                  if (!league) return null;
                  const isActive = activeLeague === leagueKey && activeCompetition === 'league';

                  const getClasses = () => {
                    switch(leagueKey) {
                      case 'norte':
                        return {
                          container: isActive ? 'border-cyan-500 bg-cyan-900/30 ring-1 ring-cyan-400' : 'border-white/5 hover:border-cyan-500/30 bg-black/40',
                          icon: isActive ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' : 'bg-white/5 text-slate-500 border-white/10 group-hover:text-cyan-400',
                          text: isActive ? 'text-cyan-400' : 'text-slate-400'
                        };
                      case 'sul':
                        return {
                          container: isActive ? 'border-orange-500 bg-orange-900/30 ring-1 ring-orange-400' : 'border-white/5 hover:border-orange-500/30 bg-black/40',
                          icon: isActive ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' : 'bg-white/5 text-slate-500 border-white/10 group-hover:text-orange-400',
                          text: isActive ? 'text-orange-400' : 'text-slate-400'
                        };
                      case 'leste':
                        return {
                          container: isActive ? 'border-emerald-500 bg-emerald-900/30 ring-1 ring-emerald-400' : 'border-white/5 hover:border-emerald-500/30 bg-black/40',
                          icon: isActive ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-white/5 text-slate-500 border-white/10 group-hover:text-emerald-400',
                          text: isActive ? 'text-emerald-400' : 'text-slate-400'
                        };
                      case 'oeste':
                        return {
                          container: isActive ? 'border-purple-500 bg-purple-900/30 ring-1 ring-purple-400' : 'border-white/5 hover:border-purple-500/30 bg-black/40',
                          icon: isActive ? 'bg-purple-500/20 text-purple-400 border-purple-500/50' : 'bg-white/5 text-slate-500 border-white/10 group-hover:text-purple-400',
                          text: isActive ? 'text-purple-400' : 'text-slate-400'
                        };
                      default:
                         return {
                          container: isActive ? 'border-white bg-white/10' : 'border-white/5 bg-black/40',
                          icon: isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-500',
                          text: isActive ? 'text-white' : 'text-slate-400'
                        };
                    }
                  };

                  const styles = getClasses();

                  return (
                    <div
                      key={leagueKey}
                      onClick={() => {
                        setActiveLeague(leagueKey);
                        setActiveCompetition('league');
                      }}
                      className={`flex-shrink-0 min-w-[110px] backdrop-blur-md border rounded-xl p-2 cursor-pointer transition-all group flex flex-col items-center gap-1.5 ${styles.container}`}
                    >
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${styles.icon}`}>
                         <Trophy size={12} />
                      </div>
                      <div className="text-center">
                        <span className={`text-[8px] font-bold uppercase tracking-widest block ${styles.text}`}>{league.name}</span>
                        <span className="text-[6px] text-slate-500 font-mono mt-0.5 block">{(league.teams?.length || 0)} TIMES</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {activeCompetition === 'league' && (
                <>
                  <div className="flex items-center justify-between px-1">
                    <div className="flex gap-2 bg-black/40 p-0.5 rounded-lg w-fit border border-white/10">
                      <button 
                        onClick={() => setActiveLeagueTab('standings')}
                        className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${activeLeagueTab === 'standings' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-white'}`}
                      >
                        Classificação
                      </button>
                      <button 
                        onClick={() => setActiveLeagueTab('scorers')}
                        className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${activeLeagueTab === 'scorers' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-white'}`}
                      >
                        Artilheiros
                      </button>
                    </div>
                    <div className="text-cyan-400 font-black uppercase tracking-widest text-[10px] drop-shadow-[0_0_5px_rgba(34,211,238,0.5)] bg-cyan-950/30 px-2 py-1 rounded-lg border border-cyan-500/20">
                      {activeLeagueData?.name || 'Liga'}
                    </div>
                  </div>

                  {activeLeagueTab === 'standings' ? (
                    <div className="bg-black/40 backdrop-blur-md border border-emerald-500/30 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-emerald-900/20 text-[9px] uppercase tracking-widest text-emerald-400 font-bold border-b border-emerald-500/20">
                          <tr>
                            <th className="px-3 py-2 text-center w-10">#</th>
                            <th className="px-3 py-2 w-full">Clube</th>
                            <th className="px-3 py-2 text-center">J</th>
                            <th className="px-3 py-2 text-center">SG</th>
                            <th className="px-3 py-2 text-center">Pts</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-emerald-500/10">
                          {activeLeagueData?.standings?.map((row) => (
                            <tr key={row.position} className={`hover:bg-emerald-500/5 transition-colors ${row.team === (userTeam?.name || 'Seu Time') ? 'bg-emerald-500/10' : ''}`}>
                              <td className="px-3 py-2 font-mono text-emerald-500/50 text-center text-[10px]">{row.position}</td>
                              <td className="px-3 py-2 font-bold text-white flex items-center gap-2">
                                <div className="w-5 h-5 flex items-center justify-center shrink-0 overflow-hidden">
                                  {row.logo ? (
                                    <TeamLogo 
                                      primaryColor={row.logo.primary}
                                      secondaryColor={row.logo.secondary}
                                      patternId={row.logo.patternId as any}
                                      symbolId={row.logo.symbolId}
                                      size={18}
                                    />
                                  ) : (
                                    <div className="w-3 h-3 flex items-center justify-center">
                                      <TeamLogo 
                                        primaryColor={row.team === (userTeam?.name || 'Seu Time') ? '#10b981' : '#334155'}
                                        secondaryColor={row.team === (userTeam?.name || 'Seu Time') ? '#065f46' : '#1e293b'}
                                        patternId="none"
                                        symbolId="Shield"
                                        size={12}
                                      />
                                    </div>
                                  )}
                                </div>
                                <span className="truncate max-w-[120px] sm:max-w-none">{row.team}</span>
                              </td>
                              <td className="px-3 py-2 text-center text-slate-400 text-[10px]">{row.played}</td>
                              <td className="px-3 py-2 text-center text-slate-400 text-[10px]">{row.gd}</td>
                              <td className="px-3 py-2 text-center font-black text-emerald-400">{row.points}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="bg-black/40 backdrop-blur-md border border-amber-500/30 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-amber-900/20 text-[9px] uppercase tracking-widest text-amber-400 font-bold border-b border-amber-500/20">
                          <tr>
                            <th className="px-3 py-2 text-center w-10">#</th>
                            <th className="px-3 py-2 w-full">Jogador</th>
                            <th className="px-3 py-2 text-right">Gols</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-500/10">
                          {activeLeagueData?.scorers?.map((scorer) => (
                            <tr key={scorer.rank} className="hover:bg-amber-500/5 transition-colors">
                              <td className="px-3 py-2 font-mono text-amber-500/50 text-center text-[10px]">{scorer.rank}</td>
                              <td className="px-3 py-2">
                                <div className="font-bold text-white text-[11px]">{scorer.name}</div>
                                <div className="text-[9px] text-slate-500">{scorer.team}</div>
                              </td>
                              <td className="px-3 py-2 text-right font-black text-amber-400">{scorer.goals}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {activeCompetition === 'elite' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                     <h3 className="text-xl font-black text-fuchsia-400 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(217,70,239,0.5)]">
                       {state.world.eliteCup.winnerId ? 'Campeão Definido!' : 
                        state.world.eliteCup.round === 0 ? 'Não Iniciada' : 
                        `Fase Atual: ${state.world.eliteCup.round === 1 ? 'Oitavas' : state.world.eliteCup.round === 2 ? 'Quartas' : state.world.eliteCup.round === 3 ? 'Semi' : 'Final'}`}
                     </h3>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-x-auto pb-4">
                    {/* Round 1 */}
                    <div className="space-y-2 min-w-[200px]">
                      <h4 className="text-xs font-bold text-fuchsia-400 uppercase tracking-widest mb-2 border-b border-fuchsia-500/30 pb-1">Oitavas</h4>
                      {state.world.eliteCup.bracket.round1.map((match) => {
                        const hTeam = state.teams[match.homeTeamId];
                        const aTeam = state.teams[match.awayTeamId];
                        return (
                          <div key={match.id} className="bg-black/40 border border-fuchsia-500/20 rounded-xl p-2 text-xs">
                            <div className={`flex justify-between items-center mb-1 ${match.homeScore > match.awayScore ? 'text-fuchsia-300 font-bold' : 'text-slate-400'}`}>
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 shrink-0">
                                  {hTeam?.logo && (
                                    <TeamLogo 
                                      primaryColor={hTeam.logo.primary}
                                      secondaryColor={hTeam.logo.secondary}
                                      patternId={hTeam.logo.patternId as any}
                                      symbolId={hTeam.logo.symbolId}
                                      size={16}
                                    />
                                  )}
                                </div>
                                <span className="truncate w-24">{hTeam?.name}</span>
                              </div>
                              <span>{match.played ? match.homeScore : '-'}</span>
                            </div>
                            <div className={`flex justify-between items-center ${match.awayScore > match.homeScore ? 'text-fuchsia-300 font-bold' : 'text-slate-400'}`}>
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 shrink-0">
                                  {aTeam?.logo && (
                                    <TeamLogo 
                                      primaryColor={aTeam.logo.primary}
                                      secondaryColor={aTeam.logo.secondary}
                                      patternId={aTeam.logo.patternId as any}
                                      symbolId={aTeam.logo.symbolId}
                                      size={16}
                                    />
                                  )}
                                </div>
                                <span className="truncate w-24">{aTeam?.name}</span>
                              </div>
                              <span>{match.played ? match.awayScore : '-'}</span>
                            </div>
                          </div>
                        );
                      })}
                      {state.world.eliteCup.bracket.round1.length === 0 && <div className="text-slate-500 text-[10px] italic">A definir</div>}
                    </div>

                    {/* Quarters */}
                    <div className="space-y-2 min-w-[200px]">
                      <h4 className="text-xs font-bold text-fuchsia-400 uppercase tracking-widest mb-2 border-b border-fuchsia-500/30 pb-1">Quartas</h4>
                      {state.world.eliteCup.bracket.quarters.map((match) => {
                        const hTeam = state.teams[match.homeTeamId];
                        const aTeam = state.teams[match.awayTeamId];
                        return (
                          <div key={match.id} className="bg-black/40 border border-fuchsia-500/20 rounded-xl p-2 text-xs">
                             <div className={`flex justify-between items-center mb-1 ${match.homeScore > match.awayScore ? 'text-fuchsia-300 font-bold' : 'text-slate-400'}`}>
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 shrink-0">
                                  {hTeam?.logo && (
                                    <TeamLogo 
                                      primaryColor={hTeam.logo.primary}
                                      secondaryColor={hTeam.logo.secondary}
                                      patternId={hTeam.logo.patternId as any}
                                      symbolId={hTeam.logo.symbolId}
                                      size={16}
                                    />
                                  )}
                                </div>
                                <span className="truncate w-24">{hTeam?.name}</span>
                              </div>
                              <span>{match.played ? match.homeScore : '-'}</span>
                            </div>
                            <div className={`flex justify-between items-center ${match.awayScore > match.homeScore ? 'text-fuchsia-300 font-bold' : 'text-slate-400'}`}>
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 shrink-0">
                                  {aTeam?.logo && (
                                    <TeamLogo 
                                      primaryColor={aTeam.logo.primary}
                                      secondaryColor={aTeam.logo.secondary}
                                      patternId={aTeam.logo.patternId as any}
                                      symbolId={aTeam.logo.symbolId}
                                      size={16}
                                    />
                                  )}
                                </div>
                                <span className="truncate w-24">{aTeam?.name}</span>
                              </div>
                              <span>{match.played ? match.awayScore : '-'}</span>
                            </div>
                          </div>
                        );
                      })}
                      {state.world.eliteCup.bracket.quarters.length === 0 && <div className="text-slate-500 text-[10px] italic">A definir</div>}
                    </div>

                    {/* Semis */}
                    <div className="space-y-2 min-w-[200px]">
                      <h4 className="text-xs font-bold text-fuchsia-400 uppercase tracking-widest mb-2 border-b border-fuchsia-500/30 pb-1">Semifinal</h4>
                      {state.world.eliteCup.bracket.semis.map((match) => {
                        const hTeam = state.teams[match.homeTeamId];
                        const aTeam = state.teams[match.awayTeamId];
                        return (
                          <div key={match.id} className="bg-black/40 border border-fuchsia-500/20 rounded-xl p-2 text-xs">
                             <div className={`flex justify-between items-center mb-1 ${match.homeScore > match.awayScore ? 'text-fuchsia-300 font-bold' : 'text-slate-400'}`}>
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 shrink-0">
                                  {hTeam?.logo && (
                                    <TeamLogo 
                                      primaryColor={hTeam.logo.primary}
                                      secondaryColor={hTeam.logo.secondary}
                                      patternId={hTeam.logo.patternId as any}
                                      symbolId={hTeam.logo.symbolId}
                                      size={16}
                                    />
                                  )}
                                </div>
                                <span className="truncate w-24">{hTeam?.name}</span>
                              </div>
                              <span>{match.played ? match.homeScore : '-'}</span>
                            </div>
                            <div className={`flex justify-between items-center ${match.awayScore > match.homeScore ? 'text-fuchsia-300 font-bold' : 'text-slate-400'}`}>
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 shrink-0">
                                  {aTeam?.logo && (
                                    <TeamLogo 
                                      primaryColor={aTeam.logo.primary}
                                      secondaryColor={aTeam.logo.secondary}
                                      patternId={aTeam.logo.patternId as any}
                                      symbolId={aTeam.logo.symbolId}
                                      size={16}
                                    />
                                  )}
                                </div>
                                <span className="truncate w-24">{aTeam?.name}</span>
                              </div>
                              <span>{match.played ? match.awayScore : '-'}</span>
                            </div>
                          </div>
                        );
                      })}
                      {state.world.eliteCup.bracket.semis.length === 0 && <div className="text-slate-500 text-[10px] italic">A definir</div>}
                    </div>

                    {/* Final */}
                    <div className="space-y-2 min-w-[200px]">
                      <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-2 border-b border-yellow-500/30 pb-1">Final</h4>
                      {state.world.eliteCup.bracket.final ? (() => {
                        const hTeam = state.teams[state.world.eliteCup.bracket.final.homeTeamId];
                        const aTeam = state.teams[state.world.eliteCup.bracket.final.awayTeamId];
                        return (
                          <div className="bg-gradient-to-br from-fuchsia-900/40 to-black border border-yellow-500/50 rounded-xl p-3 text-sm shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                             <div className={`flex justify-between items-center mb-2 ${state.world.eliteCup.bracket.final.homeScore > state.world.eliteCup.bracket.final.awayScore ? 'text-yellow-400 font-bold' : 'text-white'}`}>
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 shrink-0">
                                  {hTeam?.logo && (
                                    <TeamLogo 
                                      primaryColor={hTeam.logo.primary}
                                      secondaryColor={hTeam.logo.secondary}
                                      patternId={hTeam.logo.patternId as any}
                                      symbolId={hTeam.logo.symbolId}
                                      size={20}
                                    />
                                  )}
                                </div>
                                <span className="truncate w-28">{hTeam?.name}</span>
                              </div>
                              <span>{state.world.eliteCup.bracket.final.played ? state.world.eliteCup.bracket.final.homeScore : '-'}</span>
                            </div>
                            <div className={`flex justify-between items-center ${state.world.eliteCup.bracket.final.awayScore > state.world.eliteCup.bracket.final.homeScore ? 'text-yellow-400 font-bold' : 'text-white'}`}>
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 shrink-0">
                                  {aTeam?.logo && (
                                    <TeamLogo 
                                      primaryColor={aTeam.logo.primary}
                                      secondaryColor={aTeam.logo.secondary}
                                      patternId={aTeam.logo.patternId as any}
                                      symbolId={aTeam.logo.symbolId}
                                      size={20}
                                    />
                                  )}
                                </div>
                                <span className="truncate w-28">{aTeam?.name}</span>
                              </div>
                              <span>{state.world.eliteCup.bracket.final.played ? state.world.eliteCup.bracket.final.awayScore : '-'}</span>
                            </div>
                          </div>
                        );
                      })() : (
                        <div className="text-slate-500 text-[10px] italic">A definir</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeCompetition === 'district' && (
                <div className="space-y-6">
                   <div className="flex items-center justify-between">
                     <h3 className="text-xl font-black text-cyan-400 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                       {state.world.districtCup.winnerId ? 'Campeão Definido!' : 
                        state.world.districtCup.round === 0 ? 'Não Iniciada' : 
                        state.world.districtCup.round <= 3 ? 'Fase de Grupos' : 'Final'}
                     </h3>
                  </div>

                  {state.world.districtCup.round >= 1 && (
                    <div className="bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(34,211,238,0.15)]">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-cyan-900/20 text-[10px] uppercase tracking-widest text-cyan-400 font-bold border-b border-cyan-500/20">
                          <tr>
                            <th className="px-6 py-4">Pos</th>
                            <th className="px-6 py-4 w-full">Seleção</th>
                            <th className="px-4 py-4 text-center">J</th>
                            <th className="px-4 py-4 text-center">V</th>
                            <th className="px-4 py-4 text-center">E</th>
                            <th className="px-4 py-4 text-center">D</th>
                            <th className="px-4 py-4 text-center">SG</th>
                            <th className="px-6 py-4 text-center">Pts</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-cyan-500/10">
                          {state.world.districtCup.standings
                            .sort((a, b) => b.points !== a.points ? b.points - a.points : (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst))
                            .map((row, index) => {
                            const team = state.teams[row.teamId];
                            return (
                              <tr key={row.teamId} className="hover:bg-cyan-500/5 transition-colors">
                                <td className="px-6 py-4 font-mono text-cyan-500/50">#{index + 1}</td>
                                <td className="px-6 py-4 font-bold text-white flex items-center gap-3">
                                  <div className="w-5 h-5 shrink-0">
                                    {team?.logo ? (
                                      <TeamLogo 
                                        primaryColor={team.logo.primary}
                                        secondaryColor={team.logo.secondary}
                                        patternId={team.logo.patternId as any}
                                        symbolId={team.logo.symbolId}
                                        size={18}
                                      />
                                    ) : (
                                      <Globe size={16} className="text-cyan-600" />
                                    )}
                                  </div>
                                  {team?.name || row.teamId}
                                </td>
                                <td className="px-4 py-4 text-center text-slate-400">{row.played}</td>
                                <td className="px-4 py-4 text-center text-slate-500">{row.won}</td>
                                <td className="px-4 py-4 text-center text-slate-500">{row.drawn}</td>
                                <td className="px-4 py-4 text-center text-slate-500">{row.lost}</td>
                                <td className="px-4 py-4 text-center text-slate-400">{row.goalsFor - row.goalsAgainst}</td>
                                <td className="px-6 py-4 text-center font-black text-cyan-400">{row.points}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {(state.world.districtCup.final || state.world.districtCup.winnerId) && (
                     <div className="flex flex-col items-center py-10 gap-6">
                        <h4 className="text-lg font-black text-yellow-400 uppercase tracking-widest border-b border-yellow-500/30 pb-2">Grande Final</h4>
                        {state.world.districtCup.final && (() => {
                           const match = state.world.districtCup.final;
                           const home = state.teams[match.homeTeamId];
                           const away = state.teams[match.awayTeamId];
                           const winnerId = state.world.districtCup.winnerId;
                           
                           return (
                             <div className="flex items-center gap-8 bg-black/60 border border-yellow-500/30 p-8 rounded-xl shadow-[0_0_30px_rgba(234,179,8,0.15)]">
                                <div className={`flex flex-col items-center gap-2 ${winnerId === home.id ? 'scale-110 transition-transform' : 'opacity-80'}`}>
                                   <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 ${winnerId === home.id ? 'border-yellow-400 bg-yellow-400/20' : 'border-slate-700 bg-slate-800'}`}>
                                      <Globe size={40} className={winnerId === home.id ? 'text-yellow-400' : 'text-slate-500'} />
                                   </div>
                                   <span className={`font-black text-lg ${winnerId === home.id ? 'text-yellow-400' : 'text-white'}`}>{home.name}</span>
                                </div>

                                <div className="flex flex-col items-center gap-2">
                                   <div className="text-5xl font-black text-white tracking-tighter flex gap-4">
                                      <span>{match.homeScore}</span>
                                      <span className="text-slate-600">:</span>
                                      <span>{match.awayScore}</span>
                                   </div>
                                   <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Tempo Normal</span>
                                </div>

                                <div className={`flex flex-col items-center gap-2 ${winnerId === away.id ? 'scale-110 transition-transform' : 'opacity-80'}`}>
                                   <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 ${winnerId === away.id ? 'border-yellow-400 bg-yellow-400/20' : 'border-slate-700 bg-slate-800'}`}>
                                      <Globe size={40} className={winnerId === away.id ? 'text-yellow-400' : 'text-slate-500'} />
                                   </div>
                                   <span className={`font-black text-lg ${winnerId === away.id ? 'text-yellow-400' : 'text-white'}`}>{away.name}</span>
                                </div>
                             </div>
                           );
                        })()}
                     </div>
                  )}

                  {(state.world.districtCup?.teams?.length || 0) === 0 && (
                      <div className="col-span-full text-center py-10 text-slate-500">
                        A Copa dos Distritos começa após a Copa Elite.
                      </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {activeWorldTab === 'market' && (
          <div className="space-y-6 animate-in fade-in duration-500">
             {/* Market Filters - Neon Style */}
             <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-fuchsia-500/20 to-cyan-500/20 blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl overflow-hidden">
                   {/* Decorative background element */}
                   <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[60px] rounded-full -mr-16 -mt-16" />
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                     {/* Search */}
                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] flex items-center gap-2">
                          <Search size={12} className="drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]" /> Buscar Nome
                       </label>
                       <div className="relative group/input">
                         <div className="absolute inset-0 bg-cyan-500/5 rounded-lg group-focus-within/input:bg-cyan-500/10 transition-colors" />
                         <input 
                             type="text" 
                             value={marketSearch}
                             onChange={(e) => setMarketSearch(e.target.value)}
                             placeholder="NOME DO ATLETA..."
                             className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs text-white font-bold focus:border-cyan-500/50 focus:outline-none transition-all placeholder:text-slate-700 uppercase tracking-widest relative z-10 shadow-inner"
                           />
                         </div>
                       </div>

                       {/* District Filter */}
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-fuchsia-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Globe size={12} className="drop-shadow-[0_0_5px_rgba(217,70,239,0.5)]" /> Distrito
                         </label>
                         <div className="relative group/input">
                           <div className="absolute inset-0 bg-fuchsia-500/5 rounded-lg group-focus-within/input:bg-fuchsia-500/10 transition-colors" />
                           <select 
                             value={marketDistrict}
                             onChange={(e) => setMarketDistrict(e.target.value)}
                             className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs text-white font-bold focus:border-fuchsia-500/50 focus:outline-none transition-all appearance-none uppercase tracking-widest relative z-10 cursor-pointer shadow-inner"
                           >
                             <option value="all">TODOS OS SETORES</option>
                             <option value="NORTE">SETOR NORTE (TECH)</option>
                             <option value="SUL">SETOR SUL (IND)</option>
                             <option value="LESTE">SETOR LESTE (TRAD)</option>
                             <option value="OESTE">SETOR OESTE (REB)</option>
                           </select>
                           <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none z-20" />
                         </div>
                       </div>

                       {/* Position Filter */}
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Activity size={12} className="drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]" /> Especialidade
                         </label>
                         <div className="relative group/input">
                           <div className="absolute inset-0 bg-amber-500/5 rounded-lg group-focus-within/input:bg-amber-500/10 transition-colors" />
                           <select 
                             value={marketPosition}
                             onChange={(e) => setMarketPosition(e.target.value)}
                             className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs text-white font-bold focus:border-amber-500/50 focus:outline-none transition-all appearance-none uppercase tracking-widest relative z-10 cursor-pointer shadow-inner"
                           >
                             <option value="all">TODAS POSIÇÕES</option>
                             <option value="Goleiro">GOLEIRO</option>
                             <option value="Zagueiro">ZAGUEIRO</option>
                             <option value="Lateral">LATERAL</option>
                             <option value="Volante">VOLANTE</option>
                             <option value="Meia">MEIA</option>
                             <option value="Atacante">ATACANTE</option>
                           </select>
                           <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none z-20" />
                         </div>
                       </div>

                     {/* Points Sliders Group */}
                     <div className="flex flex-col gap-4">
                        {/* Points Slider */}
                        <div className="space-y-2">
                           <div className="flex justify-between items-center">
                              <label className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                 <TeamLogo primaryColor="#22d3ee" secondaryColor="#0891b2" patternId="none" symbolId="Shield" size={12} className="drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]" /> Rating Mín
                              </label>
                              <span className="text-[10px] font-mono text-cyan-400 font-black bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.2)]">{marketPointsMin}</span>
                           </div>
                           <input 
                             type="range" 
                             min="0" 
                             max="1000" 
                             step="10"
                             value={marketPointsMin}
                             onChange={(e) => setMarketPointsMin(parseInt(e.target.value))}
                             className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-cyan-500 shadow-inner"
                           />
                        </div>

                        {/* Potential Slider */}
                        <div className="space-y-2">
                           <div className="flex justify-between items-center">
                              <label className="text-[10px] font-black text-fuchsia-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                 <Zap size={12} className="drop-shadow-[0_0_5px_rgba(217,70,239,0.5)]" /> Potencial Mín
                              </label>
                              <span className="text-[10px] font-mono text-fuchsia-400 font-black bg-fuchsia-500/10 px-2 py-0.5 rounded border border-fuchsia-500/30 shadow-[0_0_10px_rgba(217,70,239,0.2)]">{marketPotentialMin}</span>
                           </div>
                           <input 
                             type="range" 
                             min="0" 
                             max="1000" 
                             step="10"
                             value={marketPotentialMin}
                             onChange={(e) => setMarketPotentialMin(parseInt(e.target.value))}
                             className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-fuchsia-500 shadow-inner"
                           />
                        </div>
                     </div>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
                {players
                  .filter(p => !p.contract.teamId)
                  .filter(p => {
                    const matchesSearch = p.name.toLowerCase().includes(marketSearch.toLowerCase()) || p.nickname.toLowerCase().includes(marketSearch.toLowerCase());
                    const matchesDistrict = marketDistrict === 'all' || p.district === marketDistrict;
                    const matchesPosition = marketPosition === 'all' || p.position === marketPosition;
                    const matchesPoints = p.totalRating >= marketPointsMin;
                    const matchesPotential = p.potential >= marketPotentialMin;
                    return matchesSearch && matchesDistrict && matchesPosition && matchesPoints && matchesPotential;
                  })
                  .slice(0, 20)
                  .map(player => (
                    <PlayerCard key={player.id} player={player} onClick={setSelectedPlayer} />
                ))}
             </div>
          </div>
        )}

        {activeWorldTab === 'ranking' && (
          <div className="space-y-4">
            <div className="flex gap-3 mb-6">
              <div className="relative flex-1 group">
                <div className="absolute inset-0 bg-cyan-500/20 blur-md rounded-xl transition-all" />
                <div className="relative flex items-center bg-black/40 backdrop-blur-md border border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)] rounded-xl overflow-hidden transition-all">
                  <div className="pl-4 pr-2 text-cyan-400">
                    <Search size={18} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="BUSCAR JOGADOR..." 
                    className="bg-transparent px-2 py-3.5 text-sm font-bold text-white w-full focus:outline-none uppercase tracking-widest placeholder:text-slate-500" 
                  />
                </div>
              </div>
              <button className="relative group shrink-0">
                <div className="absolute inset-0 bg-fuchsia-500/20 blur-md rounded-xl transition-all" />
                <div className="relative bg-black/40 backdrop-blur-md border border-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.3)] p-3.5 rounded-xl transition-all flex items-center justify-center">
                  <Sliders size={18} className="text-fuchsia-400" />
                </div>
              </button>
            </div>
            
            <div className="space-y-3">
              {[...players].sort((a, b) => b.totalRating - a.totalRating).slice(0, 20).map((player, index) => {
                const isTop3 = index < 3;
                const rankColor = index === 0 ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 
                                  index === 1 ? 'text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.8)]' : 
                                  index === 2 ? 'text-amber-700 drop-shadow-[0_0_8px_rgba(180,83,9,0.8)]' : 
                                  'text-slate-500';
                
                return (
                  <div 
                    key={player.id} 
                    onClick={() => setSelectedPlayer(player)}
                    className="relative group cursor-pointer"
                  >
                    {/* Card Container */}
                    <div className="relative flex items-center justify-between bg-black/40 backdrop-blur-md border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.1)] hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] rounded-xl p-3 transition-all duration-300 overflow-hidden">
                      {/* Left Accent Line */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isTop3 ? 'bg-gradient-to-b from-amber-400 to-orange-600 shadow-[0_0_10px_rgba(251,191,36,0.8)]' : 'bg-cyan-500/50'}`} />
                      
                      <div className="flex items-center gap-4 pl-3">
                        {/* Rank Position */}
                        <div className={`font-black text-xl italic w-8 text-center ${rankColor}`}>
                          #{index + 1}
                        </div>
                        
                        {/* Rating Box */}
                        <div className="relative w-12 h-12 rounded-xl border border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)] flex items-center justify-center bg-cyan-950/40">
                          <span className="font-black text-xl text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
                            {player.totalRating}
                          </span>
                        </div>

                        {/* Player Info */}
                        <div className="flex flex-col">
                          <div className="font-black text-white text-base tracking-tight drop-shadow-md">{player.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest bg-cyan-900/50 px-2 py-0.5 rounded-lg border border-cyan-500/50 shadow-[0_0_5px_rgba(34,211,238,0.2)]">
                              {player.position}
                            </span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                              {player.contract.teamId ? state.teams[player.contract.teamId]?.name : 'Free Agent'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Side - Value & Badges */}
                      <div className="flex flex-col items-end gap-2 pr-2">
                        <div className="text-sm font-black text-emerald-400 tracking-wider drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                          ${(player.contract.marketValue / 1000000).toFixed(1)}M
                        </div>
                        <div className="flex gap-1.5">
                          {player.badges.slot1 && <div className="w-5 h-5 rounded-lg bg-black/50 border border-cyan-500/50 flex items-center justify-center shadow-[0_0_5px_rgba(34,211,238,0.2)]" title={player.badges.slot1}><Star size={10} className="text-cyan-400" /></div>}
                          {player.badges.slot2 && <div className="w-5 h-5 rounded-lg bg-black/50 border border-cyan-500/50 flex items-center justify-center shadow-[0_0_5px_rgba(34,211,238,0.2)]" title={player.badges.slot2}><Star size={10} className="text-cyan-400" /></div>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeWorldTab === 'teams' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 uppercase tracking-widest font-bold px-2">
               <span>Clube</span>
               <span>Rating Médio</span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {(Object.values(state.teams) as Team[])
                .map(team => {
                    const avgRating = Math.round(team.squad.reduce((acc, id) => acc + (state.players[id]?.totalRating || 0), 0) / (team.squad.length || 1));
                    return { ...team, avgRating };
                })
                .sort((a, b) => b.avgRating - a.avgRating)
                .map((team, index) => (
                <div 
                  key={team.id}
                  onClick={() => setSelectedTeamView(team.id)}
                  className="bg-black/40 backdrop-blur-md border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)] rounded-xl p-4 cursor-pointer hover:border-purple-400 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="font-mono text-purple-500/50 font-bold text-lg w-8">#{index + 1}</div>
                    <div className="w-12 h-12 bg-purple-950/40 rounded-lg flex items-center justify-center border border-purple-400/50 group-hover:bg-purple-900/50 transition-colors overflow-hidden">
                      {team.logo ? (
                        <TeamLogo 
                          primaryColor={team.logo.primary}
                          secondaryColor={team.logo.secondary}
                          patternId={team.logo.patternId as any}
                          symbolId={team.logo.symbolId}
                          size={28}
                        />
                      ) : (
                        <div className="w-8 h-8 flex items-center justify-center">
                          <TeamLogo 
                            primaryColor="#a855f7"
                            secondaryColor="#7e22ce"
                            patternId="none"
                            symbolId="Shield"
                            size={20}
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white drop-shadow-md group-hover:text-purple-300 transition-colors">{team.name}</h3>
                      <p className="text-[10px] text-purple-400 uppercase tracking-widest font-bold mt-0.5">{team.squad.length} Jogadores</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                     <span className="text-2xl font-black text-white drop-shadow-md">{team.avgRating}</span>
                     <span className="text-[8px] text-slate-500 uppercase tracking-widest">Média Geral</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDatabase = () => {
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
  };

  const renderCareer = () => (
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

        <div className="bg-black/40 backdrop-blur-md border border-orange-500/30 rounded-lg p-1.5 flex flex-col justify-between h-14 shadow-[0_0_10px_rgba(249,115,22,0.05)] group hover:border-orange-400 transition-all">
           <div className="flex items-start justify-between">
              <span className="text-[7px] text-orange-400 font-black uppercase tracking-widest">Títulos</span>
              <Crown size={10} className="text-orange-400" />
           </div>
           <div className="flex items-end justify-between">
             <span className="text-sm font-black text-white leading-none">07</span>
             <span className="text-[6px] text-slate-500 font-bold uppercase">ELITE</span>
           </div>
        </div>
      </div>

      {/* Financial / Points Variation Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 px-1">
        {/* Team Points Evolution */}
        <div className="md:col-span-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg p-3 shadow-[0_0_15px_rgba(0,0,0,0.2)]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[8px] font-semibold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
              <TrendingUp size={10} className="text-cyan-400" />
              Variação do Time (pts)
            </h3>
            <span className="text-[7px] text-emerald-400 font-mono bg-emerald-950/30 px-1.5 py-0.5 rounded-lg border border-emerald-500/20">+12% temp.</span>
          </div>
          
          <div className="h-24 flex items-end justify-between gap-0.5 px-1 relative border-l border-b border-white/5">
             {/* Grid Lines */}
             <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
               <div className="h-px bg-white/10 w-full border-dashed border-t border-white/50" />
               <div className="h-px bg-white/10 w-full border-dashed border-t border-white/50" />
               <div className="h-px bg-white/10 w-full border-dashed border-t border-white/50" />
             </div>
             
             {/* Mock Chart Bars */}
             {[30, 45, 40, 55, 60, 50, 65, 75, 70, 85, 90, 80].map((h, i) => (
               <div key={i} className="w-full bg-cyan-900/10 rounded-t-sm relative group z-10">
                 <div 
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-600/40 to-cyan-400/40 group-hover:from-cyan-500 group-hover:to-cyan-300 transition-all rounded-t-sm"
                    style={{ height: `${h}%` }}
                 />
                 {/* Tooltip */}
                 <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/80 border border-cyan-500/30 px-1.5 py-0.5 rounded-lg text-[6px] text-cyan-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                    {h} pts
                 </div>
               </div>
             ))}
          </div>
          <div className="flex justify-between mt-1 px-0.5">
             <span className="text-[6px] text-slate-600 font-mono">R1</span>
             <span className="text-[6px] text-slate-600 font-mono">R12</span>
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
    </div>
  );

  const navItems = [
    { id: 'home', icon: Home, label: '' },
    { id: 'team', icon: (props: any) => <TeamLogo primaryColor="#22d3ee" secondaryColor="#0891b2" patternId="none" symbolId="Shield" size={props.size || 20} />, label: '' },
    { id: 'calendar', icon: Calendar, label: '' },
    { id: 'world', icon: Globe, label: '' },
    { id: 'career', icon: Briefcase, label: '' },
  ] as const;

  if (!state.userTeamId) {
    return <NewGameFlow />;
  }

  return (
    <div 
      className="min-h-screen text-slate-300 font-sans selection:bg-purple-500/30 flex flex-col relative overflow-hidden"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-[#050814]/80 backdrop-blur-[2px] z-0" />

      <header className="fixed top-1.5 left-1.5 right-1.5 z-40 flex items-center justify-between gap-1.5 pointer-events-none max-w-5xl mx-auto h-10">
        {/* Left: Stats Group (Clock & Powercap) */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <div className="bg-black/60 backdrop-blur-xl border border-slate-600/30 rounded-full h-8 px-2.5 flex items-center gap-2 shadow-lg group relative cursor-help">
            <Globe size={12} className={isOnline ? "text-emerald-400" : "text-red-400"} />
            <div className="flex flex-col leading-none">
              <span className="text-[9px] font-black text-white uppercase tracking-tighter">
                {isOnline ? 'Online' : 'Offline'}
              </span>
              <span className="text-[6px] text-slate-400 uppercase font-bold tracking-tighter">
                Universo Sync
              </span>
            </div>
            
            {/* Syncing Indicator */}
            {isSyncing && (
              <div className="absolute -top-1 -right-1">
                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-ping" />
                <div className="absolute inset-0 w-2 h-2 bg-cyan-500 rounded-full" />
              </div>
            )}

            {/* Tooltip */}
            <div className="absolute top-full left-0 mt-2 w-48 bg-[#0a0f1d] border border-white/10 rounded-xl p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl z-50">
              <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest mb-1">Status do Ecossistema</p>
              <p className="text-[10px] text-white font-medium leading-relaxed">
                {isOnline 
                  ? "Você está conectado ao servidor central. Todas as ações são sincronizadas com o Supabase em tempo real." 
                  : "Falha na conexão com o servidor. Verifique sua rede para garantir a persistência do seu universo."}
              </p>
            </div>
          </div>

          <div className="bg-black/60 backdrop-blur-xl border border-slate-600/30 rounded-full h-8 px-2.5 flex items-center gap-2 shadow-lg">
            <Clock size={12} className="text-cyan-400" />
            <div className="flex flex-col leading-none">
              <span className="text-[9px] font-black text-white tabular-nums">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-[6px] text-slate-400 uppercase font-bold tracking-tighter">
                {gameDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')}
              </span>
            </div>
          </div>
          
          <div className="bg-black/60 backdrop-blur-xl border border-purple-500/30 rounded-full h-8 px-2.5 flex items-center gap-2 shadow-lg">
            <Zap size={12} className="text-purple-400" />
            <div className="flex flex-col leading-none">
              <span className="text-[9px] font-black text-white tabular-nums">
                {totalPoints.toLocaleString('pt-BR')}
              </span>
              <span className="text-[6px] text-purple-400/70 uppercase font-bold tracking-tighter">
                CAP {powerCap.toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Season Progress (Compact) */}
        <div className="flex-1 max-w-[240px] pointer-events-auto bg-black/60 backdrop-blur-xl border border-cyan-500/20 rounded-full h-8 px-3 flex items-center gap-2 shadow-lg">
          <span className="text-[7px] text-cyan-400 uppercase font-black tracking-widest whitespace-nowrap">TEMP 2050</span>
          <div className="flex-1 relative h-1 bg-black/40 rounded-full border border-white/5 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-purple-500 shadow-[0_0_5px_rgba(34,211,238,0.4)] transition-all duration-500"
              style={{ width: `${seasonProgress}%` }}
            />
          </div>
          <span className="text-[7px] text-slate-300 font-mono font-bold whitespace-nowrap uppercase">
            {seasonStartReal ? `${daysPassed}D / ${seasonDays}D` : 'OFFLINE'}
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 pt-14 mb-20 overflow-x-hidden overflow-y-auto scroll-smooth">
        {/* Top Gradient Mask to hide scrolling content below header */}
        <div className="fixed top-12 left-0 right-0 h-8 bg-gradient-to-b from-[#050814] to-transparent z-30 pointer-events-none" />
        
        <div className="max-w-5xl mx-auto px-4 pb-8">
          {activeTab === 'home' && renderHome()}
          {activeTab === 'team' && renderTeam()}
          {activeTab === 'calendar' && renderCompetition()}
          {activeTab === 'world' && renderWorld()}
          {activeTab === 'career' && renderCareer()}
        </div>
      </main>

      {/* Bottom Navigation (Floating Pill) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none pb-6 px-4">
        <nav className="pointer-events-auto bg-black/60 backdrop-blur-2xl border border-cyan-500/30 rounded-xl shadow-[0_0_30px_rgba(34,211,238,0.15)] flex items-center justify-between px-2 py-2 w-full max-w-2xl overflow-x-auto hide-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as Tab)}
                className={`flex flex-col items-center justify-center min-w-[64px] h-14 rounded-xl transition-all duration-300 relative ${
                  isActive ? 'text-cyan-400 bg-cyan-900/30 border border-cyan-500/50 shadow-[inset_0_0_15px_rgba(34,211,238,0.2)]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                {item.id === 'team' ? (
                  <div className={`mb-1 transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : ''}`}>
                    {userTeam?.logo ? (
                      <TeamLogo 
                        primaryColor={userTeam.logo.primary}
                        secondaryColor={userTeam.logo.secondary}
                        patternId={userTeam.logo.patternId as any}
                        symbolId={userTeam.logo.symbolId}
                        size={20}
                      />
                    ) : (
                      <TeamLogo 
                        primaryColor={isActive ? "#22d3ee" : "#475569"}
                        secondaryColor={isActive ? "#0891b2" : "#334155"}
                        patternId="none"
                        symbolId="Shield"
                        size={20}
                      />
                    )}
                  </div>
                ) : (
                  <Icon className={`w-5 h-5 mb-1 transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : ''}`} />
                )}
                <span className={`text-[9px] font-bold tracking-wider uppercase transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Modals */}
      {selectedPlayer && (
        <PlayerModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
      )}

      {isCareerModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div 
            className="absolute inset-0 bg-[#050814]/90 backdrop-blur-md transition-opacity animate-in fade-in duration-300" 
            onClick={() => setIsCareerModalOpen(false)} 
          />
          
          <div className="relative bg-[#050814] border border-cyan-500/30 rounded-2xl w-full max-w-sm overflow-hidden shadow-[0_0_50px_rgba(34,211,238,0.2)] animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border-b border-cyan-500/20 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase size={16} className="text-cyan-400" />
                <h3 className="text-xs font-black text-white uppercase tracking-widest">Carreira Profissional</h3>
              </div>
              <button 
                onClick={() => setIsCareerModalOpen(false)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <AlertCircle size={18} className="rotate-45" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {userTeam ? (
                <>
                  <div className="flex flex-col items-center text-center space-y-3 py-2">
                    <div className="w-16 h-16 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/10 overflow-hidden">
                      {userTeam.logo ? (
                        <TeamLogo 
                          primaryColor={userTeam.logo.primary}
                          secondaryColor={userTeam.logo.secondary}
                          patternId={userTeam.logo.patternId as any}
                          symbolId={userTeam.logo.symbolId}
                          size={48}
                        />
                      ) : (
                        <div className="w-12 h-12 flex items-center justify-center">
                          <TeamLogo 
                            primaryColor="#22d3ee"
                            secondaryColor="#0891b2"
                            patternId="none"
                            symbolId="Shield"
                            size={32}
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-white uppercase tracking-tight leading-none">{userTeam.name}</h4>
                      <p className="text-[10px] text-cyan-400 font-black uppercase tracking-widest mt-1">Contrato Vitalício</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center">
                      <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-1">Poder Total</span>
                      <span className="text-base font-black text-white tabular-nums">{totalPoints.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center">
                      <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-1">Elenco</span>
                      <span className="text-base font-black text-white tabular-nums">{userTeam.squad.length} / 25</span>
                    </div>
                  </div>

                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[8px] text-emerald-400 font-black uppercase tracking-widest">Status do Clube</span>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[8px] text-emerald-500 font-bold uppercase">Estável</span>
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-400 leading-relaxed">
                      Seu time está competindo na Série A. O clima no vestiário é excelente e a diretoria confia no seu trabalho.
                    </p>
                  </div>

                  <button 
                    onClick={() => {
                      setActiveTab('team');
                      setIsCareerModalOpen(false);
                    }}
                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-black text-[10px] uppercase tracking-[0.2em] py-3 rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 group"
                  >
                    <span>Gerenciar Equipe</span>
                    <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </>
              ) : (
                <>
                  <div className="flex flex-col items-center text-center space-y-3 py-4">
                    <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/10">
                      <Search size={32} className="text-amber-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-white uppercase tracking-tight leading-none">Agente Livre</h4>
                      <p className="text-[10px] text-amber-400 font-black uppercase tracking-widest mt-1">Aguardando Propostas</p>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 text-center px-4 leading-relaxed">
                    Atualmente você não está vinculado a nenhum clube. Explore o mercado para encontrar novas oportunidades de carreira.
                  </p>

                  <button 
                    onClick={() => {
                      setActiveTab('world');
                      setIsCareerModalOpen(false);
                    }}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black text-[10px] uppercase tracking-[0.2em] py-3 rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 group"
                  >
                    <span>Explorar Mercado</span>
                    <Globe size={14} className="group-hover:rotate-12 transition-transform" />
                  </button>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-black/40 p-3 flex justify-center border-t border-white/5">
              <span className="text-[7px] text-slate-600 font-bold uppercase tracking-[0.3em]">Elite 2050 Professional System</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
