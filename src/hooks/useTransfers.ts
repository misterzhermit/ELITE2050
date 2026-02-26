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

        const value = player.contract.marketValue;
        const nextTotalPoints = totalPoints + player.totalRating;

        if (nextTotalPoints > powerCap) {
            addToast(`Contratação excede o Power Cap de ${powerCap / 100}k!`, 'error');
            return;
        }

        if (window.confirm(`Deseja contratar ${player.nickname} por $${(value / 1000000).toFixed(1)}M?`)) {
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

    return { handleMakeProposal };
};
