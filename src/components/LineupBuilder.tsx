
import React, { useState, useMemo } from 'react';
import { useGame } from '../store/GameContext';
import { Player, Team } from '../types';
import { PlayerCard } from './PlayerCard';
import { TeamLogo } from './TeamLogo';
import { UserMinus, Save, Activity, Users, Zap, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LineupBuilderProps {
  team: Team;
  allPlayers: Record<string, Player>;
  onPlayerSelect: (player: Player) => void;
}

const FORMATION_SLOTS = [
  { id: 'ATA1', label: 'ATA', top: '20%', left: '20%' },
  { id: 'ATA2', label: 'ATA', top: '15%', left: '50%' },
  { id: 'ATA3', label: 'ATA', top: '20%', left: '80%' },
  { id: 'MEI1', label: 'MEI', top: '40%', left: '30%' },
  { id: 'MEI2', label: 'MEI', top: '40%', left: '70%' },
  { id: 'MEI3', label: 'MEI', top: '55%', left: '50%' },
  { id: 'DEF1', label: 'DEF', top: '65%', left: '15%' },
  { id: 'DEF2', label: 'DEF', top: '75%', left: '35%' },
  { id: 'DEF3', label: 'DEF', top: '75%', left: '65%' },
  { id: 'DEF4', label: 'DEF', top: '65%', left: '85%' },
  { id: 'GOL', label: 'GOL', top: '90%', left: '50%' },
];

export const LineupBuilder: React.FC<LineupBuilderProps> = ({ team, allPlayers, onPlayerSelect }) => {
  const { setState, saveGame } = useGame();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Stats Calculation
  const lineupStats = useMemo(() => {
    const players = Object.values(team.lineup || {})
      .map((id: string | null) => id ? allPlayers[id] : null)
      .filter((p): p is Player => !!p);
    
    if (players.length === 0) return { avgRating: 0, chemistry: 0, pace: 0 };

    const avgRating = Math.round(players.reduce((acc, p) => acc + p.totalRating, 0) / players.length);
    
    // Simple chemistry mock: based on if they are in correct generic position (GOL vs others)
    const chemistry = Math.min(100, 70 + (players.length * 2)); // Base 70 + bonus for full squad
    
    return { avgRating, chemistry, pace: 85 }; // Mock pace for now
  }, [team.lineup, allPlayers]);

  const handlePlayerClick = (e: React.MouseEvent, playerId: string) => {
    e.stopPropagation();
    if (selectedPlayerId === playerId) {
      setSelectedPlayerId(null);
    } else {
      setSelectedPlayerId(playerId);
    }
  };

  const handleSlotClick = (e: React.MouseEvent, slotId: string) => {
    e.stopPropagation();
    
    if (!selectedPlayerId) {
        // If no player selected, try to select the player in this slot
        const playerInSlot = team.lineup?.[slotId];
        if (playerInSlot) {
            setSelectedPlayerId(playerInSlot);
        }
        return;
    }

    // Place selected player in slot
    setState(prev => {
      const newTeams = { ...prev.teams };
      const currentTeam = { ...newTeams[team.id] };
      const newLineup = { ...currentTeam.lineup };

      // Check if player is already in another slot and remove them
      Object.keys(newLineup).forEach(key => {
        if (newLineup[key] === selectedPlayerId) {
          delete newLineup[key];
        }
      });

      // If slot is occupied, move the occupant to bench (simply overwrite)
      // or swap? For now, let's overwrite (occupant goes to bench automatically as they are no longer in lineup)
      // Actually, if we want to swap, we'd need to know where the selected player came from.
      // But "Click from bench -> Click slot" implies overwrite.
      // "Click from slot A -> Click slot B" implies move.
      // If Slot B has player, it's a swap or overwrite. 
      // Let's implement overwrite for simplicity first: the previous occupant is just removed from lineup.
      
      newLineup[slotId] = selectedPlayerId;
      
      currentTeam.lineup = newLineup;
      newTeams[team.id] = currentTeam;
      
      return { ...prev, teams: newTeams };
    });
    
    setSelectedPlayerId(null);
  };

  const handleRemoveFromLineup = (playerId: string) => {
     setState(prev => {
        const newTeams = { ...prev.teams };
        const currentTeam = { ...newTeams[team.id] };
        const newLineup = { ...currentTeam.lineup };
        
        Object.keys(newLineup).forEach(key => {
            const slotKey = key;
            if (newLineup[slotKey] === playerId) {
                delete newLineup[slotKey];
            }
        });
        
        currentTeam.lineup = newLineup;
        newTeams[team.id] = currentTeam;
        return { ...prev, teams: newTeams };
      });
  };

  const handleSaveLineup = async () => {
    setIsSaving(true);
    await saveGame();
    setTimeout(() => setIsSaving(false), 1000);
  };

  // Get players in lineup
  const lineupPlayerIds = Object.values(team.lineup || {}).filter(Boolean) as string[];
  
  // Get bench players (squad - lineup)
  const benchPlayerIds = team.squad.filter(id => !lineupPlayerIds.includes(id));

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 h-full min-h-[700px]">
      
      {/* Top Section: Pitch & Stats */}
      <div className="flex-1 flex flex-col gap-4 min-h-[450px]">
        {/* Pitch Stats Header */}
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 overflow-hidden">
                        {team.logo ? (
                          <TeamLogo 
                            primaryColor={team.logo.primary}
                            secondaryColor={team.logo.secondary}
                            patternId={team.logo.patternId as any}
                            symbolId={team.logo.symbolId}
                            size={24}
                          />
                        ) : (
                          <TeamLogo 
                            primaryColor="#10b981"
                            secondaryColor="#065f46"
                            patternId="none"
                            symbolId="Shield"
                            size={18}
                          />
                        )}
                    </div>
                    <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Geral</div>
                        <div className="text-xl font-black text-white leading-none">{lineupStats.avgRating}</div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                        <Activity size={18} className="text-blue-400" />
                    </div>
                    <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Química</div>
                        <div className="text-xl font-black text-white leading-none">{lineupStats.chemistry}</div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                        <Zap size={18} className="text-amber-400" />
                    </div>
                    <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Ritmo</div>
                        <div className="text-xl font-black text-white leading-none">{lineupStats.pace}</div>
                    </div>
                </div>
            </div>

            <button 
                onClick={handleSaveLineup}
                disabled={isSaving}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all shadow-lg ${
                    isSaving 
                    ? 'bg-emerald-600/50 text-white/50 cursor-wait' 
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-105 active:scale-95'
                }`}
            >
                <Save size={16} />
                {isSaving ? 'Salvando...' : 'Salvar Escalação'}
            </button>
        </div>

        {/* The Pitch */}
        <div className="flex-1 bg-gradient-to-b from-emerald-950/60 to-black/80 backdrop-blur-md border border-emerald-500/30 rounded-xl relative overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.2)] flex items-center justify-center min-h-[450px]">
            {/* Pitch markings */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay pointer-events-none" />
            <div className="absolute inset-4 border-2 border-emerald-500/20 rounded-xl pointer-events-none shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]" />
            <div className="absolute top-1/2 left-4 right-4 h-0 border-t-2 border-emerald-500/20 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-emerald-500/20 rounded-full pointer-events-none shadow-[0_0_15px_rgba(16,185,129,0.1)]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-emerald-500/50 rounded-full pointer-events-none shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-64 h-32 border-2 border-t-0 border-emerald-500/20 pointer-events-none" />
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-12 border-2 border-t-0 border-emerald-500/20 pointer-events-none" />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-64 h-32 border-2 border-b-0 border-emerald-500/20 pointer-events-none" />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-32 h-12 border-2 border-b-0 border-emerald-500/20 pointer-events-none" />

            {/* Slots */}
            {FORMATION_SLOTS.map(slot => {
            const playerId = team.lineup?.[slot.id];
            const player = playerId ? allPlayers[playerId] : null;
            const isSelected = player?.id === selectedPlayerId;
            const canReceiveDrop = !!selectedPlayerId; // Visual cue for "can place here"

            return (
                <div
                key={slot.id}
                onClick={(e) => handleSlotClick(e, slot.id)}
                className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center transition-all duration-300 w-20 h-28 z-10 cursor-pointer ${
                    canReceiveDrop 
                    ? 'scale-105 z-20' 
                    : ''
                }`}
                style={{ top: slot.top, left: slot.left }}
                >
                {player ? (
                    <div className="relative group w-full flex flex-col items-center">
                    <div 
                        onClick={(e) => {
                          if (selectedPlayerId && selectedPlayerId !== player.id) {
                            return; // Allow bubbling to slot for replacement
                          }
                          handlePlayerClick(e, player.id);
                        }}
                        onDoubleClick={(e) => { e.stopPropagation(); onPlayerSelect(player); }}
                        className={`transform hover:scale-110 transition-transform duration-200 relative z-20 w-16 cursor-pointer ${
                          isSelected 
                            ? 'ring-2 ring-cyan-400 rounded-xl scale-110 shadow-[0_0_15px_rgba(34,211,238,0.5)]' 
                            : player.role !== slot.label
                              ? 'ring-2 ring-red-500/50 rounded-xl shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                              : ''
                        }`}
                    >
                        <PlayerCard player={player} onClick={() => {}} variant="compact" teamLogo={team.logo} />
                        
                        {/* Wrong position warning badge */}
                        {player.role !== slot.label && (
                          <div className="absolute -top-1 -left-1 z-30 bg-red-600 text-white rounded-full p-0.5 shadow-lg border border-white/20 animate-pulse">
                            <AlertTriangle size={10} />
                          </div>
                        )}
                    </div>
                    
                    <div className="absolute -top-2 -right-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFromLineup(player.id);
                            }}
                            className="bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 transition-colors border border-white/20"
                            title="Remover da escalação"
                        >
                            <UserMinus size={12} />
                        </button>
                    </div>
                    
                    <div className={`mt-1 whitespace-nowrap px-2 py-0.5 rounded-lg text-[10px] font-bold backdrop-blur-sm border uppercase tracking-wider shadow-lg ${
                      player.role === slot.label 
                        ? 'bg-black/80 text-emerald-400 border-emerald-500/30' 
                        : 'bg-red-950/80 text-red-400 border-red-500/50 animate-pulse'
                    }`}>
                        {slot.label}
                    </div>
                    </div>
                ) : (
                    <div className={`w-16 h-16 rounded-xl border-2 border-dashed flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.1)] transition-all group ${
                        canReceiveDrop
                            ? 'border-cyan-400 bg-cyan-900/30 animate-pulse scale-105 shadow-[0_0_20px_rgba(34,211,238,0.3)]' 
                            : 'border-emerald-500/20 bg-emerald-900/5 hover:border-emerald-400 hover:bg-emerald-900/30'
                    }`}>
                    <span className={`text-xs font-black uppercase tracking-widest transition-colors ${canReceiveDrop ? 'text-cyan-400' : 'text-emerald-500/40 group-hover:text-emerald-400'}`}>
                        {slot.label}
                    </span>
                    </div>
                )}
                </div>
            );
            })}
        </div>
      </div>

      {/* Bottom Section: Bench (Horizontal Deck) */}
      <div className="bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-xl p-4 shadow-[0_0_20px_rgba(34,211,238,0.15)] flex flex-col gap-3">
        <div className="flex items-center gap-2 px-2">
            <Users size={16} className="text-cyan-400" />
            <h3 className="text-cyan-400 font-black tracking-widest uppercase text-sm drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
                Banco de Reservas ({benchPlayerIds.length})
            </h3>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest ml-auto">
                Selecione para escalar
            </div>
        </div>

        <div className="flex overflow-x-auto gap-4 p-2 pb-4 snap-x hide-scrollbar min-h-[160px] items-center">
            {benchPlayerIds.length > 0 ? (
                benchPlayerIds.map(playerId => {
                    const player = allPlayers[playerId];
                    if (!player) return null;
                    const isSelected = player.id === selectedPlayerId;

                    return (
                        <div 
                            key={player.id} 
                            onClick={(e) => handlePlayerClick(e, player.id)}
                            onDoubleClick={(e) => { e.stopPropagation(); onPlayerSelect(player); }}
                            className={`snap-start shrink-0 w-16 cursor-pointer hover:-translate-y-2 transition-transform duration-300 touch-none select-none ${isSelected ? 'ring-2 ring-cyan-400 rounded-xl scale-110' : ''}`}
                        >
                            <PlayerCard 
                                player={player} 
                                onClick={() => {}} 
                                variant="compact"
                                teamLogo={team.logo}
                            />
                        </div>
                    );
                })
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs text-center border border-dashed border-white/10 rounded-xl h-32">
                    <Users size={24} className="mb-2 opacity-50" />
                    <p>Todos os jogadores estão escalados.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
