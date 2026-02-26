import { useGame, useGameDispatch } from '../store/GameContext';
import { advanceGameDay } from '../engine/gameLogic';

export const useGameDay = () => {
    const { setState } = useGame();
    const { addToast } = useGameDispatch();

    const handleAdvanceDay = () => {
        if (!window.confirm('Deseja avançar para o próximo dia? Todos os jogos da rodada serão simulados.')) return;

        console.log('GM: Avançando dia do jogo...');
        setState(prev => advanceGameDay(prev));
        addToast('Dia avançado com sucesso', 'success');
    };

    return { handleAdvanceDay };
};
