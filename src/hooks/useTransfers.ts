import { useGame, useGameDispatch } from '../store/GameContext';
import { Player, GameNotification } from '../types';
import { supabase } from '../lib/supabase';

export const useTransfers = (userTeamId: string | null, totalPoints: number, powerCap: number) => {
    const { state, setState, isOnline } = useGame();
    const { addToast } = useGameDispatch();

    const handleMakeProposal = async (player: Player) => {
        const userTeam = userTeamId ? state.teams[userTeamId] : null;

        if (!userTeam) {
            addToast('Você precisa estar em um time para fazer uma proposta!', 'error');
            return;
        }

        if (userTeam.squad.length >= 20) {
            addToast('Seu elenco já está cheio (máximo 20 jogadores)!', 'error');
            return;
        }

        const value = player.totalRating;
        const nextTotalPoints = totalPoints + player.totalRating;

        if (nextTotalPoints > powerCap) {
            addToast(`Contratação excede o Score Máximo de ${powerCap} pts!`, 'error');
            return;
        }

        if (window.confirm(`Deseja contratar ${player.nickname} por ${player.totalRating} pts de score?`)) {
            try {
                const newNotification: GameNotification = {
                    id: `transf_${Date.now()}`,
                    date: new Date().toISOString(),
                    title: 'Transferência Concluída',
                    message: `${player.nickname} assinou com o ${userTeam.name}!`,
                    type: 'transfer',
                    read: false
                };

                setState(prev => {
                    const newState = { ...prev };
                    newState.players[player.id] = {
                        ...player,
                        contract: {
                            ...player.contract,
                            teamId: userTeam.id
                        }
                    };
                    newState.teams[userTeam.id] = {
                        ...newState.teams[userTeam.id],
                        squad: [...newState.teams[userTeam.id].squad, player.id]
                    };
                    newState.notifications = [newNotification, ...(newState.notifications || [])];
                    return newState;
                });

                if (isOnline) {
                    const { data } = await supabase.auth.getUser();
                    await supabase.from('transfers').insert({
                        player_id: player.id,
                        from_team_id: null,
                        to_team_id: userTeam.id,
                        value: value,
                        user_id: data.user?.id
                    });
                    await supabase.from('notifications').insert({
                        user_id: data.user?.id,
                        title: newNotification.title,
                        message: newNotification.message,
                        type: newNotification.type
                    });
                }
                addToast(`${player.nickname} agora faz parte do seu elenco!`, 'success');
            } catch (error) {
                console.error('Erro ao processar transferência:', error);
                addToast('Erro ao processar transferência. Tente novamente.', 'error');
            }
        }
    };

    const handleSellPlayer = async (playerId: string) => {
        const userTeam = userTeamId ? state.teams[userTeamId] : null;

        if (!userTeam) {
            addToast('Você precisa estar em um time para vender um jogador!', 'error');
            return;
        }

        const player = state.players[playerId];
        if (!player) return;

        if (window.confirm(`Deseja dispensar ${player.nickname}? O teto de ${powerCap} pts será mantido.`)) {
            try {
                const newNotification: GameNotification = {
                    id: `sell_${Date.now()}`,
                    date: new Date().toISOString(),
                    title: 'Atleta Dispensado',
                    message: `${player.nickname} deixou o ${userTeam.name}.`,
                    type: 'transfer',
                    read: false
                };

                setState(prev => {
                    const newState = { ...prev };
                    
                    // Update player: set teamId to null (exiled)
                    newState.players[playerId] = {
                        ...player,
                        contract: {
                            ...player.contract,
                            teamId: '' // Clear team reference
                        }
                    };

                    // Update team: remove from squad and lineup, and PERSIST powerCap
                    const updatedSquad = newState.teams[userTeam.id].squad.filter(id => id !== playerId);
                    const updatedLineup = { ...newState.teams[userTeam.id].lineup };
                    Object.keys(updatedLineup).forEach(pos => {
                        if (updatedLineup[pos] === playerId) {
                            delete updatedLineup[pos];
                        }
                    });

                    newState.teams[userTeam.id] = {
                        ...newState.teams[userTeam.id],
                        squad: updatedSquad,
                        lineup: updatedLineup,
                        powerCap: powerCap // Ensure current cap is saved in team state
                    };

                    newState.notifications = [newNotification, ...(newState.notifications || [])];
                    return newState;
                });

                if (isOnline) {
                    const { data } = await supabase.auth.getUser();
                    // Optional: update transfer history or player status in DB
                    await supabase.from('notifications').insert({
                        user_id: data.user?.id,
                        title: newNotification.title,
                        message: newNotification.message,
                        type: newNotification.type
                    });
                }
                
                addToast(`${player.nickname} foi dispensado do elenco.`, 'success');
            } catch (error) {
                console.error('Erro ao dispensar jogador:', error);
                addToast('Erro ao dispensar jogador. Tente novamente.', 'error');
            }
        }
    };

    return { handleMakeProposal, handleSellPlayer };
};
