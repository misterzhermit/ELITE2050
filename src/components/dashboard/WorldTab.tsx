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
import { Player, Team, GameNotification } from '../../types';
import * as LucideIcons from 'lucide-react';
const { Home, Trophy, ShoppingCart, Database, User, Clock, Newspaper, Wallet, TrendingUp, AlertCircle, Award, Calendar, Users, Activity, Sliders, Flame, Target, Zap, FastForward, Globe, MessageSquare, AlertTriangle, TrendingDown, Briefcase, Star, Search, Crown, ChevronRight, Lock, ChevronDown, Eye, Shield, Brain, X, Save } = LucideIcons;


export const WorldTab = (props: any) => {
  const { state, setState } = useGame();
  const dashData = useDashboardData();
  const { userTeam, upcomingMatches } = dashData;
  const { handleMockVod, setSelectedMatchReport } = useMatchSimulation(userTeam?.id || null);
  const { handleUpdateTactics } = useTactics(userTeam?.id || null);
  const { handleSetFocus, handleStartCardLab, handleChemistryBoost } = useTraining(userTeam?.id || null);
  const { handleAdvanceDay } = useGameDay();
  const { handleMakeProposal } = useTransfers(userTeam?.id || null, dashData.totalPoints, dashData.powerCap);

  // Local states for WorldTab
  const [selectedTeamView, setSelectedTeamView] = useState<string | null>(null);
  const [worldTeamSubTab, setWorldTeamSubTab] = useState<'squad' | 'tactics'>('squad');
  const [activeWorldTab, setActiveWorldTab] = useState<'news' | 'leagues' | 'market' | 'ranking' | 'teams'>('news');
  const [activeLeague, setActiveLeague] = useState<string>('norte');
  const [activeCompetition, setActiveCompetition] = useState<'league' | 'elite' | 'district'>('league');
  const [activeLeagueTab, setActiveLeagueTab] = useState<'standings' | 'scorers' | 'all-teams'>('standings');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Market filters
  const [marketSearch, setMarketSearch] = useState('');
  const [marketDistrict, setMarketDistrict] = useState('');
  const [marketPosition, setMarketPosition] = useState('');
  const [marketPointsMin, setMarketPointsMin] = useState(0);
  const [marketPointsMax, setMarketPointsMax] = useState(1000);
  const [marketPotentialMin, setMarketPotentialMin] = useState(0);
  const [marketLimit, setMarketLimit] = useState(50);
  const [showMarketFilters, setShowMarketFilters] = useState(false);

  // Derived data
  const players = Object.values(state.players);
  const { leaguesData } = dashData as any;

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
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-lg border border-white/10">
                            {state.teams[player.contract.teamId]?.name || player.district}
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
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${notification.type === 'transfer' ? 'bg-emerald-500/20 text-emerald-400' :
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
            <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory">
              <div
                onClick={() => setActiveCompetition('elite')}
                className={`flex-shrink-0 w-[240px] snap-start relative overflow-hidden backdrop-blur-md border rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-all shadow-lg group ${activeCompetition === 'elite' ? 'border-fuchsia-500 bg-fuchsia-900/20' : 'border-white/10 bg-black/40'}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${activeCompetition === 'elite' ? 'bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-400' : 'bg-white/5 border-white/10 text-white/40'}`}>
                  <Flame size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Copa Elite</h4>
                  <p className="text-[8px] text-slate-500 truncate">Continental • Top 32</p>
                </div>
                {activeCompetition === 'elite' && <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,1)]" />}
              </div>

              <div
                onClick={() => setActiveCompetition('district')}
                className={`flex-shrink-0 w-[240px] snap-start relative overflow-hidden backdrop-blur-md border rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-all shadow-lg group ${activeCompetition === 'district' ? 'border-cyan-500 bg-cyan-900/20' : 'border-white/10 bg-black/40'}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${activeCompetition === 'district' ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-white/5 border-white/10 text-white/40'}`}>
                  <Globe size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Copa Distritos</h4>
                  <p className="text-[8px] text-slate-500 truncate">Regional • Top 16</p>
                </div>
                {activeCompetition === 'district' && <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,1)]" />}
              </div>
            </div>

            {/* Seletor de Ligas Horizontal Compacto */}
            <div className="flex overflow-x-auto gap-2 pb-3 slim-scrollbar px-1">
              {(Object.keys(leaguesData) as Array<keyof typeof leaguesData>).map((leagueKey) => {
                const league = leaguesData[leagueKey];
                if (!league) return null;
                const isActive = activeLeague === leagueKey && activeCompetition === 'league';

                const getClasses = () => {
                  switch (leagueKey) {
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
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1">
                  <div className="flex flex-wrap gap-2 bg-black/40 p-0.5 rounded-lg border border-white/10">
                    <button
                      onClick={() => setActiveLeagueTab('standings')}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${activeLeagueTab === 'standings' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-white'}`}
                    >
                      Tabelas
                    </button>
                    <button
                      onClick={() => setActiveLeagueTab('scorers')}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${activeLeagueTab === 'scorers' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-white'}`}
                    >
                      Gols
                    </button>
                    <button
                      onClick={() => setActiveLeagueTab('all-teams')}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${activeLeagueTab === 'all-teams' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-white'}`}
                    >
                      Clubes
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-cyan-400 font-black uppercase tracking-widest text-[10px] drop-shadow-[0_0_5px_rgba(34,211,238,0.5)] bg-cyan-950/30 px-2 py-1 rounded-lg border border-cyan-500/20">
                      {activeLeagueData?.name || 'Liga'}
                    </div>
                    <select
                      value={activeLeague}
                      onChange={(e) => {
                        setActiveLeague(e.target.value);
                        setActiveCompetition('league');
                      }}
                      className="bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-[9px] text-white font-bold focus:outline-none focus:border-cyan-500/50 transition-all uppercase tracking-tighter"
                    >
                      {Object.entries(state.world.leagues).map(([id, l]: [string, any]) => (
                        <option key={id} value={id}>{l.name}</option>
                      ))}
                    </select>
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
                ) : activeLeagueTab === 'scorers' ? (
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
                ) : activeLeagueTab === 'all-teams' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {activeLeagueData?.standings?.map((row) => {
                      const team = state.teams[row.teamId];
                      return (
                        <div
                          key={row.teamId}
                          className="bg-black/40 border border-white/5 rounded-xl p-3 flex flex-col items-center gap-2 hover:border-cyan-500/30 transition-all group cursor-pointer"
                        >
                          <div className="w-10 h-10 group-hover:scale-110 transition-transform">
                            {team?.logo && (
                              <TeamLogo
                                primaryColor={team.logo.primary}
                                secondaryColor={team.logo.secondary}
                                patternId={team.logo.patternId as any}
                                symbolId={team.logo.symbolId}
                                size={40}
                              />
                            )}
                          </div>
                          <div className="text-center overflow-hidden w-full">
                            <span className="text-[9px] font-black text-white uppercase truncate block tracking-tighter">{row.team}</span>
                            <div className="flex items-center justify-center gap-1 mt-0.5">
                              <div className="w-1 h-1 rounded-full bg-emerald-500" />
                              <span className="text-[7px] text-slate-500 font-bold uppercase tracking-widest">{row.points} PTS</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-40 text-slate-500 text-[10px] font-black uppercase tracking-widest italic">
                    Selecione uma aba
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
        <div className="space-y-4 animate-in fade-in duration-500">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 relative group">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={marketSearch}
                  onChange={(e) => setMarketSearch(e.target.value)}
                  placeholder="BUSCAR ATLETA..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white font-bold focus:border-cyan-500/50 focus:outline-none transition-all placeholder:text-slate-600 uppercase tracking-widest shadow-inner"
                />
              </div>
              <button
                onClick={() => setShowMarketFilters(!showMarketFilters)}
                className={`px-4 py-2 rounded-xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all border ${showMarketFilters ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 'bg-white/5 text-cyan-400 border-white/10'}`}
              >
                <Sliders size={14} />
                {showMarketFilters ? 'Fechar' : 'Filtrar'}
              </button>
            </div>

            {showMarketFilters && (
              <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                {/* District Filter */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Setor</label>
                  <select
                    value={marketDistrict}
                    onChange={(e) => setMarketDistrict(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-[10px] text-white font-bold focus:outline-none appearance-none uppercase tracking-widest cursor-pointer"
                  >
                    <option value="all">TODOS OS SETORES</option>
                    <option value="NORTE">SETOR NORTE</option>
                    <option value="SUL">SETOR SUL</option>
                    <option value="LESTE">SETOR LESTE</option>
                    <option value="OESTE">SETOR OESTE</option>
                  </select>
                </div>

                {/* Position Filter */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Posição</label>
                  <select
                    value={marketPosition}
                    onChange={(e) => setMarketPosition(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-[10px] text-white font-bold focus:outline-none appearance-none uppercase tracking-widest cursor-pointer"
                  >
                    <option value="all">TODAS POSIÇÕES</option>
                    <option value="GOL">GOLEIRO</option>
                    <option value="DEF">DEFENSOR</option>
                    <option value="MEI">MEIO-CAMPISTA</option>
                    <option value="ATA">ATACANTE</option>
                  </select>
                </div>

                {/* Points Slider */}
                <div className="space-y-2 col-span-full">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Rating Range</label>
                    <span className="text-[10px] font-mono text-cyan-400 font-black">{marketPointsMin} - {marketPointsMax}</span>
                  </div>
                  <div className="flex gap-4">
                    <input
                      type="range"
                      min="0"
                      max="1000"
                      step="10"
                      value={marketPointsMin}
                      onChange={(e) => setMarketPointsMin(parseInt(e.target.value))}
                      className="flex-1 h-1 bg-slate-800 rounded-full appearance-none cursor-pointer accent-cyan-500"
                    />
                    <input
                      type="range"
                      min="0"
                      max="1000"
                      step="10"
                      value={marketPointsMax}
                      onChange={(e) => setMarketPointsMax(parseInt(e.target.value))}
                      className="flex-1 h-1 bg-slate-800 rounded-full appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
            {players
              .filter(p => !p.contract.teamId)
              .filter(p => {
                const matchesSearch = p.name.toLowerCase().includes(marketSearch.toLowerCase()) || p.nickname.toLowerCase().includes(marketSearch.toLowerCase());
                const matchesDistrict = marketDistrict === 'all' || p.district === marketDistrict;
                const matchesPosition = marketPosition === 'all' || p.role === marketPosition;
                const matchesPoints = p.totalRating >= marketPointsMin && p.totalRating <= marketPointsMax;
                const matchesPotential = p.potential >= marketPotentialMin;
                return matchesSearch && matchesDistrict && matchesPosition && matchesPoints && matchesPotential;
              })
              .slice(0, marketLimit)
              .map(player => (
                <PlayerCard key={player.id} player={player} onClick={setSelectedPlayer} onProposta={handleMakeProposal} />
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
}
