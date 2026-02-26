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
import { Users, Brain, Target, Home, Trophy, History, MessageSquare, Shield, Clock, TrendingUp, Save } from 'lucide-react';
import { useGameDispatch, useGameState } from '../store/GameContext';

type Tab = 'home' | 'team' | 'calendar' | 'world' | 'career';
type TeamSubTab = 'squad' | 'tactics' | 'training';

export const Dashboard: React.FC = () => {
  const { state, isPaused } = useGameState();
  const { setState, saveGame, togglePause } = useGameDispatch();

  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [activeTeamTab, setActiveTeamTab] = useState<TeamSubTab>('squad');

  // Background image URL (referenced by the generated artifact name or logic)
  const bgImage = "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop";
  // Note: Since I generated an image, I will use a local reference or a high-quality placeholder that matches the style if local isn't ready.
  // Actually, I should use the one I generated if I can refer to it, but for now I'll use a CSS class approach.

  // Patch state if training is missing (compatibility with old saves)
  useEffect(() => {
    if (!state.training) {
      setState(prev => ({
        ...prev,
        training: {
          chemistryBoostLastUsed: undefined,
          cardLaboratory: {
            slots: [
              { cardId: null, finishTime: null },
              { cardId: null, finishTime: null }
            ]
          },
          individualFocus: {
            evolutionSlot: null,
            stabilizationSlot: null
          }
        }
      }));
    }
  }, [state.training, setState]);

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

  return (
    <div className="relative h-screen w-screen overflow-hidden text-white font-sans selection:bg-cyan-500/30 stadium-bg"
      style={{ backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.9)), url(${bgImage})` }}>

      {/* Persistent Glass Header */}
      <header className="fixed top-0 left-0 right-0 h-16 sm:h-20 glass-header z-50 flex items-center px-4 sm:px-8 justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl glass-card flex items-center justify-center neon-border-cyan overflow-hidden scale-90 sm:scale-100">
            <div className="w-full h-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
              <span className="font-black text-lg sm:text-xl italic text-cyan-400 neon-text-cyan">M</span>
            </div>
          </div>
          <div className="hidden xs:block">
            <h1 className="text-[10px] sm:text-sm font-black italic tracking-tighter uppercase neon-text-white leading-none">Admin Elite</h1>
            <p className="text-[7px] sm:text-[10px] font-bold text-white/40 uppercase tracking-widest mt-0.5">Nível 10</p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          <div className="glass-card px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border-white/5 flex items-center gap-2 sm:gap-3">
            <div className="text-right">
              <div className="text-xs sm:text-sm font-black italic tabular-nums text-white">
                {new Date(state.world.currentDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-[7px] sm:text-[8px] font-black text-cyan-400 uppercase tracking-widest">
                Dia {Math.floor((new Date(state.world.currentDate).getTime() - new Date('2050-01-01').getTime()) / (1000 * 60 * 60 * 24)) + 1}
              </div>
            </div>
            <button onClick={togglePause} className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all border border-white/10">
              <Clock size={14} className={isPaused ? 'text-amber-500' : 'text-cyan-400'} />
            </button>
          </div>

          <button onClick={() => saveGame()} className="p-2 sm:p-3 glass-card rounded-lg sm:rounded-xl hover:bg-white/10 transition-all border-white/5 text-emerald-400">
            <Save size={18} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="h-full overflow-y-auto pt-20 sm:pt-24 pb-32 slim-scrollbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          {renderCurrentTab()}
        </div>
      </main>

      {/* Universal Bottom Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 max-w-2xl w-[95%] glass-card rounded-[2.5rem] p-2 flex justify-between items-center z-50 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
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
            className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-[2rem] transition-all relative group ${activeTab === tab.id ? 'text-cyan-400' : 'text-white/30 hover:text-white/60'}`}
          >
            {activeTab === tab.id && (
              <div className="absolute inset-0 bg-cyan-400/10 rounded-[2rem] z-0" />
            )}
            <tab.icon size={22} className={`relative z-10 ${activeTab === tab.id ? 'drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : ''}`} />
            <span className="text-[8px] font-black tracking-[0.2em] uppercase relative z-10">{tab.label}</span>

            {activeTab === tab.id && (
              <div className="absolute -bottom-1 w-12 h-[2px] bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,1)] rounded-full" />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};
