import React, { useState, useEffect } from 'react';
import { useGame } from '../store/GameContext';
import { HomeTab } from './dashboard/HomeTab';
import { SquadTab } from './dashboard/SquadTab';
import { TacticsTab } from './dashboard/TacticsTab';
import { TrainingTab } from './dashboard/TrainingTab';
import { CompetitionTab } from './dashboard/CompetitionTab';
import { WorldTab } from './dashboard/WorldTab';
import { DatabaseTab } from './dashboard/DatabaseTab';
import { CareerTab } from './dashboard/CareerTab';
import { NewGameFlow } from './NewGameFlow';
import { Users, Brain, Target, Home, Trophy, History, MessageSquare, Shield, Clock, TrendingUp, Save, Rocket, PlayCircle, LogOut } from 'lucide-react';
import { useGameDispatch, useGameState } from '../store/GameContext';
import { motion } from 'framer-motion';

import { useDashboardData } from '../hooks/useDashboardData';

type Tab = 'home' | 'team' | 'calendar' | 'world' | 'career';
type TeamSubTab = 'squad' | 'tactics' | 'training';

export const Dashboard: React.FC = () => {
  const { state, isPaused } = useGameState();
  const { setState, togglePause, logout, leaveWorld } = useGameDispatch();
  const { daysPassed } = useDashboardData();

  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [activeTeamTab, setActiveTeamTab] = useState<TeamSubTab>('squad');

  // Background image URL (referenced by the generated artifact name or logic)
  const bgImage = "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop";
  // Note: Since I generated an image, I will use a local reference or a high-quality placeholder that matches the style if local isn't ready.
  // Actually, I should use the one I generated if I can refer to it, but for now I'll use a CSS class approach.

  // Patch state if training is missing (compatibility with old saves)
  useEffect(() => {
    if (state && (!state.training || !state.training.cardLaboratory || !state.training.individualFocus)) {
      console.log('Dashboard: Training state incomplete or missing, patching...');
      setState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          training: {
            chemistryBoostLastUsed: prev.training?.chemistryBoostLastUsed,
            playstyleTraining: prev.training?.playstyleTraining || {
              currentStyle: null,
              understanding: {
                'Blitzkrieg': 0,
                'Tiki-Taka': 0,
                'Retranca Armada': 0,
                'Motor Lento': 0,
                'Equilibrado': 20,
                'Gegenpressing': 0,
                'Catenaccio': 0,
                'Vertical': 0
              }
            },
            cardLaboratory: prev.training?.cardLaboratory || {
              slots: [
                { cardId: null, finishTime: null },
                { cardId: null, finishTime: null }
              ]
            },
            individualFocus: prev.training?.individualFocus || {
              evolutionSlot: null,
              stabilizationSlot: null
            }
          }
        };
      });
    }
  }, [state, setState]);

  const renderCurrentTab = () => {
    switch (activeTab) {
      case 'home': return <HomeTab />;
      case 'team':
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex bg-black/40 backdrop-blur-md rounded-2xl p-1 border border-white/5 shadow-lg overflow-x-auto scrollbar-hide">
              {[
                { id: 'squad', label: 'Elenco', icon: Users },
                { id: 'tactics', label: 'Tática', icon: Brain },
                { id: 'training', label: 'Treino', icon: Target },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTeamTab(tab.id as TeamSubTab)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap text-[10px] uppercase tracking-widest
                    ${activeTeamTab === tab.id
                      ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                      : 'text-white/40 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <tab.icon size={14} className={activeTeamTab === tab.id ? 'animate-pulse' : ''} />
                  {tab.label}
                </button>
              ))}
            </div>
            {activeTeamTab === 'squad' && <SquadTab />}
            {activeTeamTab === 'tactics' && <TacticsTab />}
            {activeTeamTab === 'training' && <TrainingTab />}
          </div>
        );
      case 'calendar': return <CompetitionTab />;
      case 'world': return <WorldTab />;
      case 'career': return <CareerTab />;
      default: return <HomeTab />;
    }
  };

  if (!state.userTeamId) {
    return <NewGameFlow />;
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden text-white font-sans selection:bg-cyan-500/30 stadium-bg"
      style={{ backgroundImage: `linear-gradient(to bottom, rgba(10, 10, 15, 0.6), rgba(10, 10, 15, 0.98)), url(${bgImage})` }}>
      
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-[50%] h-[30%] bg-cyan-500/10 blur-[150px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-[50%] h-[30%] bg-fuchsia-500/10 blur-[150px] pointer-events-none animate-pulse" />

      {/* Persistent Glass Header */}
      <header className="fixed top-0 left-0 right-0 h-16 sm:h-24 glass-header z-50 flex items-center px-4 sm:px-12 justify-between border-b border-white/5 backdrop-blur-3xl shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl glass-card flex items-center justify-center neon-border-cyan overflow-hidden shadow-2xl group cursor-pointer hover:scale-110 transition-transform active:scale-95">
            <div className="w-full h-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center group-hover:from-cyan-500/40 transition-all">
              <span className="font-black text-lg sm:text-2xl italic text-cyan-400 neon-text-cyan">M</span>
            </div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-[10px] sm:text-base font-black italic tracking-tighter uppercase neon-text-white leading-none truncate max-w-[120px] sm:max-w-none">
              {state.userTeam?.name || 'Admin Elite'}
            </h1>
            <p className="text-[7px] sm:text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] mt-1 sm:mt-1.5">
              Admin Nível 10
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-8">
          <div className="glass-card px-3 sm:px-6 py-1.5 sm:py-3 rounded-xl sm:rounded-2xl border-white/5 flex items-center gap-3 sm:gap-4 shadow-2xl backdrop-blur-2xl">
            <div className="text-right">
              <div className="text-[10px] sm:text-sm font-black italic tabular-nums text-white leading-tight">
                {new Date(state.world.currentDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-[7px] sm:text-[10px] font-black text-cyan-400 uppercase tracking-widest mt-0.5">
                Dia {daysPassed}
              </div>
            </div>
            <button 
              onClick={togglePause} 
              className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all border border-white/10 shadow-inner group active:scale-90"
            >
              <Clock size={14} className={`${isPaused ? 'text-amber-500 animate-pulse' : 'text-cyan-400'} group-hover:scale-110 transition-transform sm:size-[18px]`} />
            </button>
            <button 
              onClick={() => {
                if (window.confirm('Deseja sair deste mundo e voltar à seleção?')) {
                  leaveWorld();
                }
              }}
              className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all border border-white/10 shadow-inner group active:scale-90"
              title="Sair do Mundo"
            >
              <LogOut size={14} className="text-red-400 group-hover:scale-110 transition-transform sm:size-[18px]" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="h-full overflow-y-auto pt-20 sm:pt-32 pb-32 sm:pb-40 slim-scrollbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 w-full">
          {/* LOBBY STATUS BANNER */}
          {state.world.status === 'LOBBY' && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 sm:mb-8 p-4 sm:p-6 xl:p-8 rounded-3xl sm:rounded-[2.5rem] bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 backdrop-blur-3xl shadow-[0_0_50px_rgba(245,158,11,0.15)] relative overflow-hidden group"
            >
              {/* Animated Background Icon */}
              <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-all duration-700 group-hover:scale-110 group-hover:-rotate-12">
                <Rocket size={120} className="text-amber-400 sm:size-[200px]" />
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 relative z-10">
                <div className="space-y-2 sm:space-y-3 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2 sm:gap-3">
                    <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,1)]" />
                    <h2 className="text-lg sm:text-xl xl:text-3xl font-black text-white uppercase tracking-tighter italic">
                      MODO <span className="text-amber-400">PRE-SEASON</span>
                    </h2>
                  </div>
                  <p className="text-[8px] sm:text-[10px] xl:text-xs text-slate-400 font-black uppercase tracking-[0.3em] leading-relaxed max-w-xl">
                    O mundo está em modo de espera. Você pode ajustar sua tática, treinar atletas e explorar o mercado, mas o tempo só começará a correr após a ativação oficial da temporada.
                  </p>
                </div>

                {state.isCreator ? (
                  <button 
                    onClick={() => {
                      setState(prev => ({
                        ...prev,
                        world: { ...prev.world, status: 'ACTIVE' }
                      }));
                    }}
                    className="group relative w-full md:w-auto px-8 xl:px-14 py-3.5 xl:py-5 rounded-xl sm:rounded-2xl bg-amber-500 text-black font-black text-[10px] sm:text-xs xl:text-sm uppercase tracking-[0.4em] transition-all duration-500 hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(245,158,11,0.4)]"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3 sm:gap-4">
                      INICIAR TEMPORADA
                      <PlayCircle size={16} className="group-hover:translate-x-1 transition-transform sm:size-[20px]" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </button>
                ) : (
                  <div className="flex items-center gap-3 px-6 py-3.5 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 text-slate-400 font-bold text-[8px] sm:text-[10px] uppercase tracking-widest italic text-center sm:text-left">
                    <Clock size={14} className="text-amber-500 animate-pulse sm:size-[16px]" />
                    Aguardando o Criador do Mundo iniciar a temporada...
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {renderCurrentTab()}
        </div>
      </main>

      {/* Universal Bottom Navigation */}
      <nav className="fixed bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 max-w-3xl w-[94%] sm:w-[92%] glass-card rounded-[2rem] sm:rounded-[3rem] p-1.5 sm:p-2.5 flex justify-between items-center z-50 border border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-3xl">
        {[
          { id: 'home', label: 'Home', icon: Home },
          { id: 'team', label: 'Elenco', icon: Users },
          { id: 'calendar', label: 'Geral', icon: Trophy },
          { id: 'world', label: 'Universo', icon: History },
          { id: 'career', label: 'Admin', icon: Shield },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`flex-1 flex flex-col items-center gap-1 sm:gap-2 py-3 sm:py-4 rounded-[1.5rem] sm:rounded-[2.5rem] transition-all relative group ${activeTab === tab.id ? 'text-cyan-400' : 'text-white/20 hover:text-white/50'}`}
          >
            {activeTab === tab.id && (
              <motion.div 
                layoutId="nav-glow"
                className="absolute inset-0 bg-gradient-to-b from-cyan-400/10 to-transparent rounded-[1.5rem] sm:rounded-[2.5rem] z-0" 
              />
            )}
            <tab.icon 
              size={activeTab === tab.id ? 22 : 20} 
              className={`relative z-10 transition-all duration-300 sm:size-[${activeTab === tab.id ? 26 : 24}px] ${activeTab === tab.id ? 'drop-shadow-[0_0_12px_rgba(34,211,238,1)] scale-110' : 'group-hover:scale-110'}`} 
            />
            <span className={`text-[7px] sm:text-[9px] font-black tracking-[0.2em] uppercase relative z-10 transition-all duration-300 ${activeTab === tab.id ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-0.5 group-hover:opacity-100 group-hover:translate-y-0'}`}>
              {tab.label}
            </span>

            {activeTab === tab.id && (
              <motion.div 
                layoutId="nav-indicator"
                className="absolute -bottom-1 w-8 sm:w-12 h-[2px] sm:h-[3px] bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,1)] rounded-full" 
              />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};
