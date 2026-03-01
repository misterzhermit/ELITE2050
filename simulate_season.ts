import { advanceGameDay } from './src/engine/gameLogic';
import { generateInitialState } from './src/engine/generator';

let state = generateInitialState();
state.world.status = 'ACTIVE';

const watchTeam1 = Object.keys(state.teams)[0];
state.userTeamId = watchTeam1;

console.log('--- MOSTRANDO VARIAÇÃO DIÁRIA DO TIME ---');
console.log(`Time: ${state.teams[watchTeam1].name}`);
console.log('-----------------------------------------');

let lastPower = state.teams[watchTeam1].squad.reduce((sum, id) => sum + (state.players[id]?.totalRating || 0), 0);
console.log(`[DIA 0] Team Power Inicial: ${lastPower}`);

for (let day = 1; day <= 10; day++) {
    state = advanceGameDay(state, false);

    const squad = state.teams[watchTeam1].squad;
    const currentPower = squad.reduce((sum, id) => sum + (state.players[id]?.totalRating || 0), 0);

    if (currentPower !== lastPower) {
        const diff = currentPower - lastPower;
        console.log(`[DIA ${day}] Team Power: ${currentPower} (Variação no dia: ${diff > 0 ? '+' + diff : diff})`);
    } else {
        console.log(`[DIA ${day}] Team Power: ${currentPower} (Sem jogo / Sem variação)`);
    }

    lastPower = currentPower;
}
