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
const { Home, Trophy, ShoppingCart, Database, User, Clock, Newspaper, Wallet, TrendingUp, AlertCircle, Award, Calendar, Users, Activity, Sliders, Flame, Target, Zap, FastForward, Globe, MessageSquare, AlertTriangle, TrendingDown, Briefcase, Star, Search, Crown, ChevronRight, Lock, ChevronDown, Eye, Shield, Brain, X, Save } = LucideIcons;


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
    <div className="space-y-6 animate-in fade-in duration-500 max-w-md mx-auto pb-10">
      <div className="grid grid-cols-2 gap-4">
        {/* ESTILO DE JOGO CARD */}
        <button
          onClick={() => setIsPlayStyleModalOpen(true)}
          className="bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-xl p-4 shadow-[0_0_20px_rgba(34,211,238,0.15)] relative overflow-hidden group hover:bg-cyan-900/10 hover:border-cyan-500/50 transition-all flex flex-col items-center justify-center gap-3 aspect-[4/5]"
        >
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />

          <h3 className="text-cyan-500/70 font-black tracking-widest uppercase text-[10px] mb-1">
            Estilo de Jogo
          </h3>

          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all shadow-[0_0_15px_rgba(34,211,238,0.2)]">
            {tactics.playStyle === 'Blitzkrieg' && <Zap size={32} />}
            {tactics.playStyle === 'Tiki-Taka' && <Activity size={32} />}
            {tactics.playStyle === 'Retranca Armada' && <Shield size={32} />}
            {tactics.playStyle === 'Motor Lento' && <Clock size={32} />}
            {tactics.playStyle === 'Equilibrado' && <Target size={32} />}
            {tactics.playStyle === 'Gegenpressing' && <Flame size={32} />}
            {tactics.playStyle === 'Catenaccio' && <Lock size={32} />}
          </div>

          <span className="text-sm text-white font-black uppercase tracking-tight text-center px-2">
            {tactics.playStyle}
          </span>

          <div className="mt-auto pt-2">
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider border border-cyan-500/30 rounded-full px-2 py-0.5 bg-cyan-500/5">
              Alterar
            </span>
          </div>
        </button>

        {/* MENTALIDADE CARD */}
        <button
          onClick={() => setIsMentalityModalOpen(true)}
          className="bg-black/40 backdrop-blur-md border border-indigo-500/30 rounded-xl p-4 shadow-[0_0_20px_rgba(99,102,241,0.15)] relative overflow-hidden group hover:bg-indigo-900/10 hover:border-indigo-500/50 transition-all flex flex-col items-center justify-center gap-3 aspect-[4/5]"
        >
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />

          <h3 className="text-indigo-500/70 font-black tracking-widest uppercase text-[10px] mb-1">
            Mentalidade
          </h3>

          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <Brain size={32} />
          </div>

          <span className="text-sm text-white font-black uppercase tracking-tight text-center px-2">
            {tactics.mentality}
          </span>

          <div className="mt-auto pt-2">
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider border border-indigo-500/30 rounded-full px-2 py-0.5 bg-indigo-500/5">
              Alterar
            </span>
          </div>
        </button>
      </div>

      {/* PLAYSTYLE MODAL */}
      {isPlayStyleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 w-full max-w-lg shadow-[0_0_50px_rgba(34,211,238,0.2)]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="text-cyan-400" /> Selecionar Estilo
              </h3>
              <button onClick={() => setIsPlayStyleModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {playStyles.map(style => (
                <button
                  key={style}
                  onClick={() => {
                    handleUpdateTactics({ playStyle: style });
                    setIsPlayStyleModalOpen(false);
                  }}
                  className={`relative p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 group ${tactics.playStyle === style
                    ? 'border-cyan-500 bg-cyan-950/50 shadow-[0_0_20px_rgba(34,211,238,0.2)]'
                    : 'border-white/5 bg-white/5 hover:border-cyan-500/50 hover:bg-white/10'
                    }`}
                >
                  <div className={`p-3 rounded-full ${tactics.playStyle === style ? 'bg-cyan-500 text-black' : 'bg-white/5 text-slate-400 group-hover:text-cyan-400 group-hover:bg-cyan-500/20'} transition-colors`}>
                    {style === 'Blitzkrieg' && <Zap size={20} />}
                    {style === 'Tiki-Taka' && <Activity size={20} />}
                    {style === 'Retranca Armada' && <Shield size={20} />}
                    {style === 'Motor Lento' && <Clock size={20} />}
                    {style === 'Equilibrado' && <Target size={20} />}
                    {style === 'Gegenpressing' && <Flame size={20} />}
                    {style === 'Catenaccio' && <Lock size={20} />}
                  </div>
                  <span className={`text-xs font-black uppercase tracking-wide ${tactics.playStyle === style ? 'text-cyan-400' : 'text-slate-300'}`}>
                    {style}
                  </span>
                  {tactics.playStyle === style && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.8)]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MENTALITY MODAL */}
      {isMentalityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 w-full max-w-lg shadow-[0_0_50px_rgba(99,102,241,0.2)]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Brain className="text-indigo-400" /> Selecionar Mentalidade
              </h3>
              <button onClick={() => setIsMentalityModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {mentalities.map(m => (
                <button
                  key={m}
                  onClick={() => {
                    handleUpdateTactics({ mentality: m });
                    setIsMentalityModalOpen(false);
                  }}
                  className={`relative p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-3 group aspect-square ${tactics.mentality === m
                    ? 'border-indigo-500 bg-indigo-950/50 shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                    : 'border-white/5 bg-white/5 hover:border-indigo-500/50 hover:bg-white/10'
                    }`}
                >
                  <div className={`p-3 rounded-full ${tactics.mentality === m ? 'bg-indigo-500 text-black' : 'bg-white/5 text-slate-400 group-hover:text-indigo-400 group-hover:bg-indigo-500/20'} transition-colors`}>
                    <Brain size={24} />
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-wide text-center ${tactics.mentality === m ? 'text-indigo-400' : 'text-slate-300'}`}>
                    {m}
                  </span>
                  {tactics.mentality === m && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_5px_rgba(99,102,241,0.8)]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SLIDERS TÁTICOS */}
      <div className="bg-black/40 backdrop-blur-md border border-purple-500/30 rounded-xl p-5 shadow-[0_0_20px_rgba(168,85,247,0.15)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none" />
        <h3 className="text-center text-purple-300 font-black tracking-widest uppercase mb-4 text-sm drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]">
          Diretrizes de Campo
        </h3>

        <div className="space-y-6">
          {/* Linha Defensiva */}
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] text-purple-400 font-black uppercase tracking-widest">Linha: {tactics.linePosition <= 30 ? 'Recuada' : tactics.linePosition >= 70 ? 'Alta' : 'Média'}</span>
              <span className="text-[10px] text-white font-black">{tactics.linePosition}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={tactics.linePosition}
              onChange={(e) => handleUpdateTactics({ linePosition: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-black/60 rounded-full appearance-none cursor-pointer accent-purple-500 border border-white/5"
            />
          </div>

          {/* Agressividade */}
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] text-red-400 font-black uppercase tracking-widest">Agressividade: {tactics.aggressiveness <= 30 ? 'Sombra' : tactics.aggressiveness >= 70 ? 'Caçada' : 'Padrão'}</span>
              <span className="text-[10px] text-white font-black">{tactics.aggressiveness}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={tactics.aggressiveness}
              onChange={(e) => handleUpdateTactics({ aggressiveness: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-black/60 rounded-full appearance-none cursor-pointer accent-red-500 border border-white/5"
            />
          </div>
        </div>
      </div>

      {/* SLOTS DE CARTAS TÁTICAS (TRUNFOS) */}
      <div className="bg-black/40 backdrop-blur-md border border-amber-500/30 rounded-xl p-5 shadow-[0_0_20px_rgba(245,158,11,0.15)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none" />
        <h3 className="text-center text-amber-300 font-black tracking-widest uppercase mb-4 text-sm drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">
          Trunfos de Jogo <span className="text-amber-500/70 font-medium">(Cartas)</span>
        </h3>

        <div className="grid grid-cols-3 gap-3">
          {([0, 1, 2] as const).map(slotIdx => {
            const card = tactics.slots ? tactics.slots[slotIdx] : null;
            return (
              <button
                key={slotIdx}
                onClick={() => {
                  setSelectedCardSlot(slotIdx);
                  setIsCardModalOpen(true);
                }}
                className={`aspect-[3/4] rounded-xl border-2 border-dashed ${card ? 'border-amber-500 bg-amber-900/20' : 'border-amber-500/20 bg-black/40'} flex flex-col items-center justify-center p-2 hover:border-amber-400 transition-colors group`}
              >
                {card ? (
                  <>
                    <Star size={16} className="text-amber-400 mb-2 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]" />
                    <span className="text-[8px] text-white font-black text-center uppercase leading-tight">{card.name}</span>
                  </>
                ) : (
                  <>
                    <div className="w-6 h-6 rounded-full border border-amber-500/30 flex items-center justify-center mb-1 group-hover:border-amber-500/60">
                      <span className="text-amber-500/40 text-xs font-black">+</span>
                    </div>
                    <span className="text-[8px] text-amber-500/40 font-bold uppercase tracking-widest">Vazio</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
