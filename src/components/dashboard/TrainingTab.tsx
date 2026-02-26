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


export const TrainingTab = (props: any) => {
  const { state, setState } = useGame();
  const dashData = useDashboardData();
  const { userTeam, upcomingMatches } = dashData;
  const { handleMockVod, setSelectedMatchReport } = useMatchSimulation(userTeam?.id || null);
  const { handleUpdateTactics } = useTactics(userTeam?.id || null);
  const { handleSetFocus, handleStartCardLab, handleChemistryBoost } = useTraining(userTeam?.id || null);
  const { handleAdvanceDay } = useGameDay();
  // Modal and Interaction States
  const [isEvolutionModalOpen, setIsEvolutionModalOpen] = useState(false);
  const [isStabilizationModalOpen, setIsStabilizationModalOpen] = useState(false);
  const [isCardLabModalOpen, setIsCardLabModalOpen] = useState(false);
  const [selectedLabSlot, setSelectedLabSlot] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleManualSave = async () => { };

  if (!state.training || !state.training.individualFocus) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <TrendingUp className="w-10 h-10 text-cyan-400 mx-auto animate-bounce" />
          <p className="text-white font-bold">Inicializando módulo de treinamento...</p>
        </div>
      </div>
    );
  }

  const evoPlayer = state.training.individualFocus.evolutionSlot ? state.players[state.training.individualFocus.evolutionSlot] : null;
  const stabPlayer = state.training.individualFocus.stabilizationSlot ? state.players[state.training.individualFocus.stabilizationSlot] : null;
  const squadPlayers = userTeam ? userTeam.squad.map(id => state.players[id]).filter(p => !!p) : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-md mx-auto">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <TrendingUp className="text-cyan-400" /> Treinamento
        </h2>
        <button
          onClick={handleManualSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold transition-all shadow-lg border text-xs uppercase tracking-wider ${isSaving
            ? 'bg-cyan-900/20 border-cyan-500/30 text-cyan-500/50 cursor-wait'
            : 'bg-black/40 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-500 hover:scale-105 active:scale-95'
            }`}
        >
          <Save size={14} />
          {isSaving ? 'Salvando...' : 'Salvar'}
        </button>
      </header>

      {/* Coletivo */}
      <section className="bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-2xl p-5 shadow-lg">
        <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Users size={14} /> Treinamento Coletivo
        </h3>
        <button
          onClick={handleChemistryBoost}
          className="w-full bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-black uppercase tracking-wider py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)] flex flex-col items-center"
        >
          <span className="text-sm">Palestra Motivacional</span>
          <span className="text-[10px] opacity-80">+10 Entrosamento (Cooldown: 7 dias)</span>
        </button>
      </section>

      {/* Foco Individual */}
      <section className="bg-black/40 backdrop-blur-md border border-purple-500/30 rounded-2xl p-5 shadow-lg">
        <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Target size={14} /> Foco Individual
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Evolution Slot */}
          <div
            onClick={() => setIsEvolutionModalOpen(true)}
            className="bg-black/60 border border-emerald-500/20 rounded-xl p-3 cursor-pointer hover:border-emerald-500/50 transition-all text-center"
          >
            <div className="text-[9px] font-bold text-emerald-400 uppercase mb-2">Evolução (1.5x)</div>
            {evoPlayer ? (
              <div className="space-y-1">
                <div className="text-xs font-bold text-white truncate">{evoPlayer.nickname}</div>
                <div className="text-[10px] text-slate-400">{evoPlayer.totalRating} OVR</div>
              </div>
            ) : (
              <div className="text-[10px] text-slate-500 py-2">Vazio</div>
            )}
          </div>

          {/* Stabilization Slot */}
          <div
            onClick={() => setIsStabilizationModalOpen(true)}
            className="bg-black/60 border border-amber-500/20 rounded-xl p-3 cursor-pointer hover:border-amber-500/50 transition-all text-center"
          >
            <div className="text-[9px] font-bold text-amber-400 uppercase mb-2">Estabilização</div>
            {stabPlayer ? (
              <div className="space-y-1">
                <div className="text-xs font-bold text-white truncate">{stabPlayer.nickname}</div>
                <div className="text-[10px] text-slate-400">{stabPlayer.totalRating} OVR</div>
              </div>
            ) : (
              <div className="text-[10px] text-slate-500 py-2">Vazio</div>
            )}
          </div>
        </div>
      </section>

      {/* Laboratório de Cartas */}
      <section className="bg-black/40 backdrop-blur-md border border-amber-500/30 rounded-2xl p-5 shadow-lg">
        <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Zap size={14} /> Laboratório de Cartas
        </h3>
        <div className="space-y-3">
          {state.training.cardLaboratory.slots.map((slot, idx) => (
            <div
              key={idx}
              onClick={() => !slot.cardId && (setSelectedLabSlot(idx), setIsCardLabModalOpen(true))}
              className={`bg-black/60 border ${slot.cardId ? 'border-amber-500/50' : 'border-white/10 hover:border-white/30 cursor-pointer'} rounded-xl p-4 transition-all`}
            >
              {slot.cardId ? (
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-xs font-bold text-white uppercase">Produzindo: {slot.cardId}</div>
                    <div className="text-[9px] text-amber-400">Finaliza em: {new Date(slot.finishTime!).toLocaleDateString()}</div>
                  </div>
                  <div className="animate-pulse text-amber-500"><Clock size={16} /></div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-slate-500 py-1">
                  <Star size={14} />
                  <span className="text-[10px] font-bold uppercase">Iniciar Nova Pesquisa</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Selection Modals */}
      {(isEvolutionModalOpen || isStabilizationModalOpen) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => { setIsEvolutionModalOpen(false); setIsStabilizationModalOpen(false); }} />
          <div className="relative bg-[#0a0f1d] border border-cyan-500/30 rounded-2xl w-full max-w-md max-h-[70vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <header className="p-4 border-b border-white/5 bg-white/5">
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Selecionar Jogador</h3>
            </header>
            <div className="overflow-y-auto p-2 space-y-1 max-h-[50vh]">
              <button
                onClick={() => handleSetFocus(isEvolutionModalOpen ? 'evolution' : 'stabilization', null)}
                className="w-full text-left p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 flex items-center justify-between group"
              >
                <span className="text-sm font-bold text-red-400 uppercase">Remover Foco</span>
              </button>
              {squadPlayers.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleSetFocus(isEvolutionModalOpen ? 'evolution' : 'stabilization', p.id)}
                  className="w-full text-left p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-900/30 flex items-center justify-center text-cyan-400 font-bold text-xs">{p.totalRating}</div>
                    <div className="text-sm font-bold text-white">{p.nickname}</div>
                  </div>
                  <ChevronRight size={16} className="text-slate-600 group-hover:text-cyan-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {isCardLabModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsCardLabModalOpen(false)} />
          <div className="relative bg-[#0a0f1d] border border-amber-500/30 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <header className="p-4 border-b border-white/5 bg-white/5 text-center">
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Pesquisar Carta</h3>
            </header>
            <div className="p-4 space-y-3">
              {[
                { id: 'ataque', name: 'Ataque Total', desc: 'Foco ofensivo (3 dias)' },
                { id: 'defesa', name: 'Muralha', desc: 'Foco defensivo (3 dias)' },
                { id: 'meio', name: 'Meio Criativo', desc: 'Controle de jogo (3 dias)' }
              ].map(c => (
                <button
                  key={c.id}
                  onClick={() => {
                    if (selectedLabSlot !== null) {
                      handleStartCardLab(c.id, selectedLabSlot)
                    }
                  }}
                  className="w-full p-4 rounded-xl bg-black/40 border border-white/5 hover:border-amber-500/50 transition-all text-left group"
                >
                  <div className="text-sm font-bold text-white uppercase group-hover:text-amber-400 transition-colors">{c.name}</div>
                  <div className="text-[10px] text-slate-400">{c.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
