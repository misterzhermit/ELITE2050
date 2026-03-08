import { generateInitialState } from './src/engine/generator';
import { advanceGameDay } from './src/engine/gameLogic';
import { GameState, Team, Manager } from './src/types';

function runCleanSimulation() {
    let state = generateInitialState();

    // Setup 8 Human-like Seeds
    const seeds = [
        { teamId: 't_1', managerId: 'h_1', name: 'Elite_A1_Legend', strategy: 'Superstars' },
        { teamId: 't_2', managerId: 'h_2', name: 'Elite_A2_Posse', strategy: 'TikiTaka' },
        { teamId: 't_9', managerId: 'h_3', name: 'Indus_B1_Press', strategy: 'HighPress' },
        { teamId: 't_10', managerId: 'h_4', name: 'Indus_B2_Def', strategy: 'Catenaccio' },
        { teamId: 't_17', managerId: 'h_5', name: 'Shadow_C1_Chaos', strategy: 'Blitzkrieg' },
        { teamId: 't_18', managerId: 'h_6', name: 'Shadow_C2_Clutch', strategy: 'Vertical' },
        { teamId: 't_25', managerId: 'h_7', name: 'Emerg_D1_Genio', strategy: 'Slot4' },
        { teamId: 't_26', managerId: 'h_8', name: 'Emerg_D2_Bagre', strategy: 'Balanced' }
    ];

    seeds.forEach(s => {
        const team = state.teams[s.teamId];
        state.managers[s.managerId] = {
            id: s.managerId,
            name: s.name,
            district: team.district,
            reputation: 50,
            isNPC: false,
            attributes: { evolution: 50, negotiation: 50, scout: 50 },
            career: { titlesWon: 0, totalLeagueTitles: 0, totalCupTitles: 0, hallOfFameEntries: 0, consecutiveTitles: 0, currentTeamId: s.teamId, historyTeamIds: [] },
            achievements: []
        };
        team.managerId = s.managerId;
        team.squad = [];
    });

    // DIA 0 Draft
    const legendaries = Object.values(state.players).filter(p => p.totalRating >= 850).sort((a, b) => b.totalRating - a.totalRating);
    state.world.draftProposals = [];
    legendaries.slice(0, 10).forEach((l, i) => {
        // Evenly distribute among the humans
        const humanId = `h_${(i % 8) + 1}`;
        state.world.draftProposals.push({ playerId: l.id, managerId: humanId, teamId: seeds.find(s => s.managerId === humanId)!.teamId, priority: 1 });
    });

    // Resolve Draft Day 1 & 2
    state = advanceGameDay(state);
    state = advanceGameDay(state);

    const results = [];

    const milestones = [2, 10, 20, 30, 40, 45];
    for (let day = 3; day <= 45; day++) {
        state = advanceGameDay(state);
        if (milestones.includes(day)) {
            const milestoneData = seeds.map(s => {
                const team = state.teams[s.teamId];
                const stats = state.world.leagues[team.district.toLowerCase() === 'norte' ? 'norte' : team.district.toLowerCase() === 'sul' ? 'sul' : team.district.toLowerCase() === 'leste' ? 'leste' : 'oeste'].standings.find(st => st.teamId === s.teamId);
                return {
                    day,
                    name: s.name,
                    rating: Math.round(team.squad.reduce((sum, id) => sum + state.players[id].totalRating, 0) / team.squad.length),
                    points: stats?.points || 0,
                    won: stats?.won || 0,
                    legends: team.squad.filter(id => state.players[id].totalRating >= 850).length
                };
            });
            results.push(...milestoneData);
        }
    }

    console.log(JSON.stringify(results, null, 2));
}

runCleanSimulation();
