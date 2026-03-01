import React from 'react';
import { useGame } from '../../store/GameContext';
import { Rocket, Shield, Zap, TrendingUp, CheckCircle2, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export const DraftPanel: React.FC = () => {
    const { state, setState, saveGame } = useGame();
    const userTeam = state.userTeamId ? state.teams[state.userTeamId] : null;

    if (!userTeam) return null;

    const currentPower = userTeam.squad.reduce((sum, id) => sum + (state.players[id]?.totalRating || 0), 0);
    const DRAFT_BUDGET = 10000;
    const remaining = DRAFT_BUDGET - currentPower;
    const progress = Math.min(100, (currentPower / DRAFT_BUDGET) * 100);

    const handleFinalizeDraft = async () => {
        if (userTeam.squad.length < 11) {
            alert('Você precisa de pelo menos 11 jogadores para iniciar a temporada!');
            return;
        }

        if (window.confirm('Deseja finalizar o Draft e entrar no Modo Pre-Season? Seu elenco atual será confirmado.')) {
            const newState = { ...state };
            newState.world.status = 'LOBBY';
            setState(newState);
            await saveGame(newState);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            {/* Header Header */}
            <div className="glass-card-neon p-6 rounded-3xl border-cyan-500/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all duration-700 pointer-events-none">
                    <Rocket size={150} className="text-cyan-400 rotate-12" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-2 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-3">
                            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,1)]" />
                            <h1 className="text-2xl xl:text-4xl font-black text-white uppercase italic tracking-tighter">
                                FASE DE <span className="text-cyan-400">DRAFT ELITE</span>
                            </h1>
                        </div>
                        <p className="text-[10px] xl:text-xs text-slate-400 font-bold uppercase tracking-[0.3em]">
                            REMONTE SEU CLUBE: ROUBE QUALQUER ATLETA ATÉ O LIMITE DE {DRAFT_BUDGET.toLocaleString()} PTS
                        </p>
                    </div>

                    <div className="w-full md:w-64 space-y-2">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">BUDGET GASTO</span>
                            <span className={`text-sm font-black ${remaining < 0 ? 'text-red-400' : 'text-cyan-400'} italic`}>
                                {currentPower.toLocaleString()} / {DRAFT_BUDGET.toLocaleString()}
                            </span>
                        </div>
                        <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 relative">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                className={`absolute top-0 left-0 h-full bg-gradient-to-r ${remaining < 0 ? 'from-red-500 to-amber-500' : 'from-cyan-500 to-fuchsia-500'} shadow-[0_0_15px_rgba(34,211,238,0.5)]`}
                            />
                        </div>
                        <p className="text-[8px] font-bold text-center text-slate-500 uppercase tracking-widest mt-1">
                            {userTeam.squad.length} ATLETAS NO ELENCO
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Info Card */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="glass-card-neon p-6 rounded-2xl border-white/5 space-y-6">
                        <div className="flex items-center gap-3">
                            <Info size={20} className="text-cyan-400" />
                            <h3 className="text-xs font-black text-white uppercase tracking-widest">COMO FUNCIONA</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0 border border-cyan-500/20">
                                    <Shield size={16} className="text-cyan-400" />
                                </div>
                                <p className="text-[10px] text-slate-400 leading-relaxed font-bold uppercase tracking-tight">
                                    Navegue pelas <span className="text-white">LIGAS</span> no menu inferior para encontrar jogadores de outros times.
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20">
                                    <Zap size={16} className="text-purple-400" />
                                </div>
                                <p className="text-[10px] text-slate-400 leading-relaxed font-bold uppercase tracking-tight">
                                    Nesta fase, você pode <span className="text-white">CONTRATAR INSTANTANEAMENTE</span> sem restrição de satisfação.
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
                                    <TrendingUp size={16} className="text-amber-400" />
                                </div>
                                <p className="text-[10px] text-slate-400 leading-relaxed font-bold uppercase tracking-tight">
                                    Matenha o score abaixo de <span className="text-amber-400">{DRAFT_BUDGET}</span> para poder finalizar.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleFinalizeDraft}
                            disabled={remaining < 0 || userTeam.squad.length < 11}
                            className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-500 font-black text-[10px] uppercase tracking-[0.2em] shadow-xl ${(remaining < 0 || userTeam.squad.length < 11)
                                    ? 'bg-white/5 text-slate-600 grayscale cursor-not-allowed'
                                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black hover:scale-105 active:scale-95 shadow-cyan-500/30'
                                }`}
                        >
                            <CheckCircle2 size={18} />
                            Finalizar Elenco
                        </button>
                    </div>
                </div>

                {/* Squad List Mini */}
                <div className="lg:col-span-2 glass-card-neon p-6 rounded-2xl border-white/5 overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xs font-black text-white uppercase tracking-widest">SEU ELENCO PROVISÓRIO</h3>
                        <span className="text-[9px] font-bold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
                            {userTeam.squad.length} / 25
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto pr-2 max-h-[300px] sm:max-h-none slim-scrollbar">
                        {userTeam.squad.map(playerId => {
                            const p = state.players[playerId];
                            if (!p) return null;
                            return (
                                <div key={p.id} className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5 group hover:border-cyan-500/30 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black text-black ${p.role === 'GOL' ? 'bg-amber-400' :
                                                p.role === 'ZAG' ? 'bg-blue-400' :
                                                    p.role === 'MEI' ? 'bg-emerald-400' : 'bg-red-400'
                                            }`}>
                                            {p.role}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-white uppercase truncate max-w-[100px]">{p.nickname}</p>
                                            <p className="text-[8px] font-bold text-slate-500 uppercase">{p.totalRating} PTS</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setState(prev => {
                                                const newState = { ...prev };
                                                const myTeam = newState.teams[userTeam.id];
                                                myTeam.squad = myTeam.squad.filter(id => id !== p.id);
                                                newState.players[p.id].contract.teamId = null;
                                                return newState;
                                            });
                                        }}
                                        className="p-2 text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Shield size={14} className="rotate-180" />
                                    </button>
                                </div>
                            );
                        })}
                        {userTeam.squad.length === 0 && (
                            <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-600 gap-3 border border-dashed border-white/5 rounded-2xl">
                                <Plus size={32} />
                                <p className="text-[10px] font-black uppercase tracking-widest">Nenhum atleta Draftado ainda</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper for the empty state icon (Rocket is from lucide-react, I used Plus as a typo, but will import Rocket or keep Plus)
import { Plus } from 'lucide-react';
