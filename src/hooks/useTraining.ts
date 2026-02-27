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
        // ... (removed or kept for compatibility, but user wants to replace it)
        // I will keep the function signature but maybe the UI won't use it anymore
    };

    const handleSetPlaystyleTraining = (style: string | null) => {
        setState(prev => ({
            ...prev,
            training: {
                ...prev.training,
                playstyleTraining: {
                    ...prev.training.playstyleTraining,
                    currentStyle: style as any
                }
            }
        }));
    };

    return { handleSetFocus, handleStartCardLab, handleChemistryBoost, handleSetPlaystyleTraining };
};
