import React, { useState } from 'react';
import { useGame } from '../store/GameContext';
import { Globe, Plus, Calendar, Clock, ChevronRight, LogOut, Users, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateInitialState } from '../engine/generator';

export const WorldSelector: React.FC = () => {
  const { worlds, publicWorlds, setWorldId, loadGame, joinGame, setState, saveGame, refreshWorlds, deleteWorld, logout } = useGame();
  const [isCreating, setIsCreating] = useState(false);
  const [newWorldName, setNewWorldName] = useState('');
  const [tempInitialState, setTempInitialState] = useState<any | null>(null);
  const [selectingTeam, setSelectingTeam] = useState(false);
  const [activeTab, setActiveTab] = useState<'my-worlds' | 'community'>('my-worlds');

  const handleSelectWorld = async (id: string, isPublic: boolean = false) => {
    if (isPublic) {
      await joinGame(id);
    } else {
      await loadGame(id);
    }
  };

  const handleCreateWorld = async () => {
    if (!newWorldName.trim()) return;

    const initialState = generateInitialState();
    (initialState.world as any).name = newWorldName;

    setTempInitialState(initialState);
    setSelectingTeam(true);
    setIsCreating(false);
  };

  const handleConfirmTeam = async (teamId: string) => {
    if (!tempInitialState) return;

    const id = Date.now().toString();
    const finalState = { ...tempInitialState };

    // Set User Team
    finalState.userTeamId = teamId;

    // Clear the selected team's squad for the 10,000pt draft
    const team = finalState.teams[teamId];
    if (team) {
      // Free current players of this team
      team.squad.forEach((pId: string) => {
        if (finalState.players[pId]) {
          finalState.players[pId].contract.teamId = null;
        }
      });
      team.squad = [];
      team.lineup = {};
      team.managerId = finalState.userTeamId; // Assuming user is the manager
    }

    // Set status to DRAFT
    finalState.world.status = 'DRAFT';
    finalState.world.transferWindowOpen = true;

    // Set local state
    setState(finalState);
    setWorldId(id);

    // Save to supabase
    await saveGame(finalState);
    await refreshWorlds();

    setTempInitialState(null);
    setSelectingTeam(false);
    setNewWorldName('');
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-[#050814] text-slate-300 font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-cyan-500/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        <div className="text-center mb-12">
          <div className="inline-block p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-3xl mb-6 shadow-[0_0_30px_rgba(34,211,238,0.1)]">
            <Globe size={48} className="text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
          </div>
          <h1 className="text-4xl font-black text-white uppercase tracking-[0.2em] mb-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            Multiverso <span className="text-cyan-400">Elite</span>
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Explore as linhas do tempo disponíveis</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-8 bg-black/40 p-1 rounded-2xl border border-white/5">
          <button
            onClick={() => setActiveTab('my-worlds')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'my-worlds'
              ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
              : 'text-slate-500 hover:text-slate-300'
              }`}
          >
            Meus Mundos
          </button>
          <button
            onClick={() => setActiveTab('community')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'community'
              ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
              : 'text-slate-500 hover:text-slate-300'
              }`}
          >
            Comunidade
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectingTeam && tempInitialState ? (
            <div className="col-span-full animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-6 text-center">
                <h2 className="text-xl font-black text-cyan-400 uppercase tracking-widest mb-2">Selecione seu Time</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Você assumirá o controle deste clube e reconstruirá o elenco com 10.000 pts</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto pr-2 slim-scrollbar p-1">
                {Object.values(tempInitialState.teams as Record<string, any>).filter(t => t.district !== 'EXILADO' && !t.name.startsWith('Seleção')).map((team: any) => (
                  <button
                    key={team.id}
                    onClick={() => handleConfirmTeam(team.id)}
                    className="group flex flex-col items-center p-4 bg-black/40 border border-white/5 hover:border-cyan-500/50 rounded-2xl transition-all hover:scale-105"
                  >
                    <div className="w-12 h-12 rounded-xl mb-3 flex items-center justify-center bg-black/40 border border-white/10 group-hover:border-cyan-500/30 overflow-hidden">
                      <span className="text-lg font-black italic text-white/20 group-hover:text-cyan-400 transition-colors">{team.name[0]}</span>
                    </div>
                    <span className="text-[9px] font-black text-white uppercase tracking-tighter text-center line-clamp-1">{team.name}</span>
                    <span className="text-[7px] font-bold text-slate-500 uppercase tracking-widest mt-1">{team.district}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setSelectingTeam(false)}
                className="mt-6 w-full py-3 bg-white/5 hover:bg-white/10 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
              >
                Voltar
              </button>
            </div>
          ) : activeTab === 'my-worlds' ? (
            <>
              {worlds.map((world) => (
                <div
                  key={world.id}
                  className="group relative bg-black/40 backdrop-blur-xl border border-white/5 hover:border-cyan-500/50 rounded-2xl p-6 text-left transition-all duration-300 hover:shadow-[0_0_30px_rgba(34,211,238,0.1)] overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                    <Globe size={64} className="text-cyan-400" />
                  </div>

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-black text-white uppercase tracking-wider group-hover:text-cyan-400 transition-colors">
                        {world.name}
                      </h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Deseja deletar o mundo "${world.name}"? Esta ação não pode ser desfeita.`)) {
                            deleteWorld(world.id);
                          }
                        }}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-red-400 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                        title="Deletar Mundo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        <Clock size={12} />
                        Último Acesso: {new Date(world.updatedAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectWorld(world.id)}
                    className="mt-6 w-full flex items-center justify-between group/enter"
                  >
                    <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                      Entrar no Mundo
                    </span>
                    <ChevronRight size={16} className="text-cyan-500 transform group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              ))}

              {isCreating ? (
                <div className="bg-black/60 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(34,211,238,0.15)] animate-in zoom-in-95 duration-300">
                  <h3 className="text-sm font-black text-cyan-400 uppercase tracking-widest mb-4">Novo Universo</h3>
                  <input
                    autoFocus
                    type="text"
                    value={newWorldName}
                    onChange={(e) => setNewWorldName(e.target.value)}
                    placeholder="NOME DO MUNDO..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold focus:border-cyan-500/50 focus:outline-none transition-all placeholder:text-slate-700 uppercase tracking-widest mb-4"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateWorld()}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateWorld}
                      className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-[10px] uppercase tracking-widest py-3 rounded-xl transition-all shadow-lg shadow-cyan-500/20"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => setIsCreating(false)}
                      className="flex-1 bg-white/5 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-widest py-3 rounded-xl transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsCreating(true)}
                  className="group bg-black/20 border border-dashed border-white/10 hover:border-cyan-500/50 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 transition-all duration-300 hover:bg-cyan-500/5"
                >
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-cyan-500/20 group-hover:scale-110 transition-all">
                    <Plus size={24} className="text-slate-500 group-hover:text-cyan-400" />
                  </div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] group-hover:text-cyan-400">Criar Novo Universo</span>
                </button>
              )}
            </>
          ) : (
            <>
              {publicWorlds.length > 0 ? (
                publicWorlds.map((world) => (
                  <button
                    key={world.id}
                    onClick={() => handleSelectWorld(world.id, true)}
                    className="group relative bg-black/40 backdrop-blur-xl border border-white/5 hover:border-purple-500/50 rounded-2xl p-6 text-left transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.1)] overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                      <Globe size={64} className="text-purple-400" />
                    </div>

                    <div className="relative z-10">
                      <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2 group-hover:text-purple-400 transition-colors">
                        {world.name}
                      </h3>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                          <Users size={12} />
                          Criado por: {world.userId.substring(0, 8)}...
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                          <Clock size={12} />
                          Sincronizado: {new Date(world.updatedAt).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                        Explorar Mundo
                      </span>
                      <ChevronRight size={16} className="text-purple-500 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                ))
              ) : (
                <div className="col-span-full py-12 text-center bg-black/20 border border-dashed border-white/5 rounded-2xl">
                  <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">Nenhum mundo público encontrado no momento.</p>
                </div>
              )}
            </>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="mt-12 mx-auto flex items-center gap-2 px-6 py-3 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-[10px] font-black uppercase tracking-widest transition-all group"
        >
          <LogOut size={14} className="group-hover:-translate-x-1 transition-transform" />
          Encerrar Sessão
        </button>
      </div>
    </div>
  );
};
