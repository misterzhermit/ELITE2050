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
import { PlayStyle, Mentality, TacticalCard } from '../../types';
import * as LucideIcons from 'lucide-react';
const { Home, Trophy, ShoppingCart, Database, User, Clock, Newspaper, TrendingUp, AlertCircle, Award, Calendar, Users, Activity, Sliders, Flame, Target, Zap, FastForward, Globe, MessageSquare, AlertTriangle, TrendingDown, Briefcase, Star, Search, Crown, ChevronRight, Lock, ChevronDown, Eye, Shield, Brain, X, Save } = LucideIcons;


export const TacticsTab = (props: any) => {
  const { state, setState } = useGame();
  const dashData = useDashboardData();
  const { userTeam, upcomingMatches } = dashData;
  const { handleMockVod, setSelectedMatchReport } = useMatchSimulation(userTeam?.id || null);
  const { handleUpdateTactics } = useTactics(userTeam?.id || null);
  const { handleSetFocus, handleStartCardLab, handleChemistryBoost } = useTraining(userTeam?.id || null);
  const { handleAdvanceDay } = useGameDay();
  const [isPlayStyleModalOpen, setIsPlayStyleModalOpen] = useState(false);
  const [isMentalityModalOpen, setIsMentalityModalOpen] = useState(false);
  const [selectedCardSlot, setSelectedCardSlot] = useState<number | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  if (!userTeam) return null;
  const { tactics } = userTeam;

  const playStyles: PlayStyle[] = ['Blitzkrieg', 'Tiki-Taka', 'Retranca Armada', 'Motor Lento', 'Equilibrado', 'Gegenpressing', 'Catenaccio'];
  const mentalities: Mentality[] = ['Calculista', 'Emocional', 'Predadora'];

  return (
    <div className="space-y-4 sm:space-y-8 animate-in fade-in duration-500 pb-20 px-2 sm:px-0 max-w-5xl mx-auto">
      {/* Estilo de Jogo & Mentalidade */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
        {/* Play Style Card */}
        <div className="relative group overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] bg-slate-900/40 backdrop-blur-xl border border-white/5 p-4 sm:p-8 transition-all duration-500 hover:border-cyan-500/30">
          <div className="absolute top-0 right-0 p-4 sm:p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Zap size={window.innerWidth < 640 ? 48 : 80} className="text-cyan-400" />
          </div>
          
          <div className="relative z-10 space-y-4 sm:space-y-6">
            <div className="space-y-1 sm:space-y-2">
              <span className="text-[10px] sm:text-xs font-black text-cyan-400 uppercase tracking-[0.3em] italic">Estratégia Base</span>
              <h3 className="text-xl sm:text-3xl font-black text-white tracking-tighter italic">ESTILO DE JOGO</h3>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              {['Posse', 'Contra-Ataque', 'Gegenpress', 'Equilibrado'].map((style) => (
                <button
                  key={style}
                  onClick={() => handleUpdateTactics({ playStyle: style as any })}
                  className={`py-2 sm:py-3 px-2 sm:px-4 rounded-xl border text-[9px] sm:text-xs font-black uppercase tracking-widest transition-all ${
                    tactics.playStyle === style 
                    ? 'bg-cyan-500 border-cyan-400 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]' 
                    : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mentality Card */}
        <div className="relative group overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] bg-slate-900/40 backdrop-blur-xl border border-white/5 p-4 sm:p-8 transition-all duration-500 hover:border-purple-500/30">
          <div className="absolute top-0 right-0 p-4 sm:p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Brain size={window.innerWidth < 640 ? 48 : 80} className="text-purple-400" />
          </div>

          <div className="relative z-10 space-y-4 sm:space-y-6">
            <div className="space-y-1 sm:space-y-2">
              <span className="text-[10px] sm:text-xs font-black text-purple-400 uppercase tracking-[0.3em] italic">Foco Mental</span>
              <h3 className="text-xl sm:text-3xl font-black text-white tracking-tighter italic">MENTALIDADE</h3>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              {['Ultra-Defensivo', 'Cauteloso', 'Ofensivo', 'Tudo-ou-Nada'].map((mentality) => (
                <button
                  key={mentality}
                  onClick={() => handleUpdateTactics({ mentality: mentality as any })}
                  className={`py-2 sm:py-3 px-2 sm:px-4 rounded-xl border text-[9px] sm:text-xs font-black uppercase tracking-widest transition-all ${
                    tactics.mentality === mentality 
                    ? 'bg-purple-500 border-purple-400 text-black shadow-[0_0_20px_rgba(168,85,247,0.4)]' 
                    : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {mentality}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sliders Táticos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 bg-black/20 backdrop-blur-md border border-white/5 rounded-[1.5rem] sm:rounded-[2.5rem] p-4 sm:p-10">
        <div className="space-y-6 sm:space-y-10">
          {/* Posicionamento */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-center px-1">
              <div className="flex flex-col">
                <span className="text-[9px] sm:text-[10px] text-purple-400 font-black uppercase tracking-widest italic neon-text-purple">Posicionamento</span>
                <span className="text-[8px] sm:text-[9px] text-white/30 font-bold uppercase tracking-widest mt-0.5">Linha {tactics.linePosition <= 30 ? 'Recuada' : tactics.linePosition >= 70 ? 'Alta' : 'Média'}</span>
              </div>
              <span className="text-lg sm:text-xl font-black text-white italic drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{tactics.linePosition}</span>
            </div>
            <div className="relative h-4 sm:h-6 flex items-center">
              <div className="absolute inset-0 h-1 sm:h-1.5 my-auto bg-white/5 rounded-full border border-white/5" />
              <input
                type="range"
                min="0"
                max="100"
                value={tactics.linePosition}
                onChange={(e) => handleUpdateTactics({ linePosition: parseInt(e.target.value) })}
                className="w-full h-1 sm:h-1.5 bg-transparent appearance-none cursor-pointer accent-purple-500 relative z-10"
              />
              <div 
                className="absolute h-1 sm:h-1.5 my-auto bg-gradient-to-r from-purple-600 to-purple-400 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all pointer-events-none" 
                style={{ width: `${tactics.linePosition}%` }}
              />
            </div>
          </div>

          {/* Intensidade */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-center px-1">
              <div className="flex flex-col">
                <span className="text-[9px] sm:text-[10px] text-cyan-400 font-black uppercase tracking-widest italic neon-text-cyan">Intensidade</span>
                <span className="text-[8px] sm:text-[9px] text-white/30 font-bold uppercase tracking-widest mt-0.5">Pressão {tactics.intensity <= 30 ? 'Baixa' : tactics.intensity >= 70 ? 'Sufocante' : 'Moderada'}</span>
              </div>
              <span className="text-lg sm:text-xl font-black text-white italic drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{tactics.intensity}</span>
            </div>
            <div className="relative h-4 sm:h-6 flex items-center">
              <div className="absolute inset-0 h-1 sm:h-1.5 my-auto bg-white/5 rounded-full border border-white/5" />
              <input
                type="range"
                min="0"
                max="100"
                value={tactics.intensity}
                onChange={(e) => handleUpdateTactics({ intensity: parseInt(e.target.value) })}
                className="w-full h-1 sm:h-1.5 bg-transparent appearance-none cursor-pointer accent-cyan-500 relative z-10"
              />
              <div 
                className="absolute h-1 sm:h-1.5 my-auto bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all pointer-events-none" 
                style={{ width: `${tactics.intensity}%` }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6 sm:space-y-10">
          {/* Largura */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-center px-1">
              <div className="flex flex-col">
                <span className="text-[9px] sm:text-[10px] text-emerald-400 font-black uppercase tracking-widest italic neon-text-emerald">Amplitude</span>
                <span className="text-[8px] sm:text-[9px] text-white/30 font-bold uppercase tracking-widest mt-0.5">{tactics.width <= 30 ? 'Estreito' : tactics.width >= 70 ? 'Explorar Pontas' : 'Equilibrado'}</span>
              </div>
              <span className="text-lg sm:text-xl font-black text-white italic drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{tactics.width}</span>
            </div>
            <div className="relative h-4 sm:h-6 flex items-center">
              <div className="absolute inset-0 h-1 sm:h-1.5 my-auto bg-white/5 rounded-full border border-white/5" />
              <input
                type="range"
                min="0"
                max="100"
                value={tactics.width}
                onChange={(e) => handleUpdateTactics({ width: parseInt(e.target.value) })}
                className="w-full h-1 sm:h-1.5 bg-transparent appearance-none cursor-pointer accent-emerald-500 relative z-10"
              />
              <div 
                className="absolute h-1 sm:h-1.5 my-auto bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all pointer-events-none" 
                style={{ width: `${tactics.width}%` }}
              />
            </div>
          </div>

          {/* Passe */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-center px-1">
              <div className="flex flex-col">
                <span className="text-[9px] sm:text-[10px] text-amber-400 font-black uppercase tracking-widest italic neon-text-amber">Distribuição</span>
                <span className="text-[8px] sm:text-[9px] text-white/30 font-bold uppercase tracking-widest mt-0.5">{tactics.passing <= 30 ? 'Curto/Tiki-Taka' : tactics.passing >= 70 ? 'Longo/Direto' : 'Misto'}</span>
              </div>
              <span className="text-lg sm:text-xl font-black text-white italic drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{tactics.passing}</span>
            </div>
            <div className="relative h-4 sm:h-6 flex items-center">
              <div className="absolute inset-0 h-1 sm:h-1.5 my-auto bg-white/5 rounded-full border border-white/5" />
              <input
                type="range"
                min="0"
                max="100"
                value={tactics.passing}
                onChange={(e) => handleUpdateTactics({ passing: parseInt(e.target.value) })}
                className="w-full h-1 sm:h-1.5 bg-transparent appearance-none cursor-pointer accent-amber-500 relative z-10"
              />
              <div 
                className="absolute h-1 sm:h-1.5 my-auto bg-gradient-to-r from-amber-600 to-amber-400 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)] transition-all pointer-events-none" 
                style={{ width: `${tactics.passing}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Game Changers (Breve Visão) */}
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between px-1 sm:px-2">
          <h3 className="text-[10px] sm:text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
            <Flame size={window.innerWidth < 640 ? 14 : 16} className="text-orange-500" />
            Peças Chave
          </h3>
          <span className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">Game Changers</span>
        </div>

        <div className="flex overflow-x-auto gap-3 sm:gap-6 px-1 sm:px-2 pb-6 sm:pb-8 no-scrollbar">
          {userTeam.squad?.slice(0, 3).map(playerId => {
            const player = state.players[playerId];
            if (!player) return null;
            return (
              <div key={playerId} className="w-[120px] sm:w-[150px] shrink-0 grayscale hover:grayscale-0 transition-all duration-500">
                <PlayerCard player={player} variant="compact" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Save Button Floating */}
      <div className="fixed bottom-24 sm:bottom-12 right-4 sm:right-12 z-40">
        <button className="flex items-center gap-2 sm:gap-3 px-6 sm:px-10 py-3 sm:py-5 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-full text-white font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] italic shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:scale-105 active:scale-95 transition-all group">
          <Save size={window.innerWidth < 640 ? 18 : 24} />
          <span className="text-[10px] sm:text-sm">Salvar Tática</span>
        </button>
      </div>
    </div>
  );
}
