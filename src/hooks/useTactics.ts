import { useGame } from '../store/GameContext';

export const useTactics = (userTeamId: string | null) => {
    const { setState } = useGame();

    const handleUpdateTactics = (updates: Partial<any>) => {
        if (!userTeamId) return;
        setState(prev => ({
            ...prev,
            teams: {
                ...prev.teams,
                [userTeamId]: {
                    ...prev.teams[userTeamId],
                    tactics: {
                        ...prev.teams[userTeamId].tactics,
                        ...updates
                    }
                }
            }
        }));
    };

    return { handleUpdateTactics };
};
