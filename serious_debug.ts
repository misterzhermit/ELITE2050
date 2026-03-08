import { generateInitialState } from './src/engine/generator';
import { advanceGameDay, resolveDraftConflict } from './src/engine/gameLogic';
import { GameState, Team, Manager } from './src/types';

function runSeriousDebug() {
    console.log("=== FUNCTION INTROSPECTION ===");
    const funcStr = resolveDraftConflict.toString();
    console.log(funcStr.substring(0, 300));

    let state = generateInitialState();
    state.world.currentDay = 0;
    const teamId = 't_1';
    const managerId = 'm_human';

    state.managers[managerId] = {
        id: managerId,
        name: 'Serious_DEBUG',
        district: 'NORTE',
        reputation: 50,
        isNPC: false,
        attributes: { evolution: 50, negotiation: 50, scout: 50 },
        career: { titlesWon: 0, totalLeagueTitles: 0, totalCupTitles: 0, hallOfFameEntries: 0, consecutiveTitles: 0, currentTeamId: teamId, historyTeamIds: [] },
        achievements: []
    };
    state.teams[teamId].managerId = managerId;
    state.teams[teamId].squad = [];

    console.log("Starting Debug Simulation...");
    try {
        state = advanceGameDay(state);
        console.log(`Day ${state.world.currentDay} complete.`);
    } catch (e: any) {
        console.error("CRASH:", e.message);
        console.error(e.stack);
    }
}

runSeriousDebug();
