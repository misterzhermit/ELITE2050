import { useGame } from '../store/GameContext';

export const useTraining = (userTeamId: string | null) => {
    const { state, setState } = useGame();

    const handleSetFocus = (type: 'evolution' | 'stabilization', playerId: string | null) => {
        setState(prev => ({
            ...prev,
            training: {
                ...prev.training,
                individualFocus: {
                    ...prev.training.individualFocus,
                    [type === 'evolution' ? 'evolutionSlot' : 'stabilizationSlot']: playerId
                }
            }
        }));
    };

    const handleStartCardLab = (cardType: string, selectedLabSlot: number | null) => {
        if (selectedLabSlot === null) return;

        const finishDate = new Date(state.world.currentDate);
        finishDate.setDate(finishDate.getDate() + 3);

        setState(prev => {
            const newSlots = [...prev.training.cardLaboratory.slots];
            newSlots[selectedLabSlot] = {
                cardId: cardType,
                finishTime: finishDate.toISOString()
            };
            return {
                ...prev,
                training: {
                    ...prev.training,
                    cardLaboratory: {
                        ...prev.training.cardLaboratory,
                        slots: newSlots
                    }
                }
            };
        });
    };

    const handleChemistryBoost = () => {
        if (!userTeamId) return;

        const lastUsed = state.training.chemistryBoostLastUsed;
        const now = new Date(state.world.currentDate);

        if (lastUsed) {
            const last = new Date(lastUsed);
            const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays < 7) {
                alert('O Treinamento Coletivo está em cooldown (7 dias).');
                return;
            }
        }

        setState(prev => ({
            ...prev,
            training: {
                ...prev.training,
                chemistryBoostLastUsed: now.toISOString()
            },
            teams: {
                ...prev.teams,
                [userTeamId]: {
                    ...prev.teams[userTeamId],
                    chemistry: Math.min(100, (prev.teams[userTeamId].chemistry || 50) + 10)
                }
            }
        }));
        alert('Treinamento Coletivo realizado! Entrosamento aumentado em +10.');
    };

    return { handleSetFocus, handleStartCardLab, handleChemistryBoost };
};
