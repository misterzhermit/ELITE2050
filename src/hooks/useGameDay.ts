import { useGame, useGameDispatch } from '../store/GameContext';
import { advanceGameDay } from '../engine/gameLogic';

export const useGameDay = () => {
    const { state, setState } = useGame();
    const { addToast } = useGameDispatch();

    const handleAdvanceDay = () => {
        if (!state.isCreator) {
            alert('Apenas o Criador do Mundo pode avançar a data da temporada.');
            return;
        }

        if (state.world.status === 'LOBBY') {
            alert('A temporada ainda não começou! Inicie a temporada na aba Home primeiro.');
            return;
        }

        if (!window.confirm('Deseja avançar para o próximo dia? Todos os jogos da rodada serão simulados.')) return;

        console.log('GM: Avançando dia do jogo...');
        setState(prev => advanceGameDay(prev));
        addToast('Dia avançado com sucesso', 'success');
    };

    return { handleAdvanceDay };
};
