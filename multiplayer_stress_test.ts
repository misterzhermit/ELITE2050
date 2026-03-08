import { generateInitialState } from './src/engine/generator';
import { advanceGameDay } from './src/engine/gameLogic';
import { GameState, Player, Team, Manager } from './src/types';

async function runMultiplayerStressTest() {
    console.log("=== PROTOCOLO DE SIMULAÇÃO MULTIPLAYER (8 HUMANOS) ===");

    let state = generateInitialState();

    // 1. Configurar 8 Managers "Humanos"
    const seeds = [
        { teamId: 't_1', managerId: 'h_1', name: 'Elite A1 (Superstars)', strategy: 'Draft Lendários' },
        { teamId: 't_2', managerId: 'h_2', name: 'Elite A2 (Posse)', strategy: 'Tiki-Taka / Passe Ouro' },
        { teamId: 't_9', managerId: 'h_3', name: 'Industrial B1 (Pressão)', strategy: 'Gegenpressing' },
        { teamId: 't_10', managerId: 'h_4', name: 'Industrial B2 (Retranca)', strategy: 'Catenaccio' },
        { teamId: 't_17', managerId: 'h_5', name: 'Shadow C1 (Chaos)', strategy: 'Blitzkrieg' },
        { teamId: 't_18', managerId: 'h_6', name: 'Shadow C2 (Counter)', strategy: 'Vertical' },
        { teamId: 't_25', managerId: 'h_7', name: 'Emergente D1 (Gênios)', strategy: 'Evolução Slot 4' },
        { teamId: 't_26', managerId: 'h_8', name: 'Emergente D2 (Equilibrado)', strategy: 'Equilibrado' }
    ];

    seeds.forEach(s => {
        const team = state.teams[s.teamId];
        const oldManagerId = team.managerId;
        if (oldManagerId) delete state.managers[oldManagerId];

        const newManager: Manager = {
            id: s.managerId,
            name: s.name,
            district: team.district,
            reputation: 50,
            isNPC: false, // HUMAN!
            attributes: { evolution: 50, negotiation: 50, scout: 50 },
            career: { titlesWon: 0, totalLeagueTitles: 0, totalCupTitles: 0, hallOfFameEntries: 0, consecutiveTitles: 0, currentTeamId: s.teamId, historyTeamIds: [] },
            achievements: []
        };
        state.managers[s.managerId] = newManager;
        team.managerId = s.managerId;
        team.squad = []; // Reset squad for draft

        // Aplica estratégia inicial
        if (s.strategy.includes('Tiki-Taka')) team.tactics.playStyle = 'Tiki-Taka';
        if (s.strategy.includes('Gegenpressing')) team.tactics.playStyle = 'Gegenpressing';
        if (s.strategy.includes('Catenaccio')) team.tactics.playStyle = 'Catenaccio';
        if (s.strategy.includes('Blitzkrieg')) team.tactics.playStyle = 'Blitzkrieg';
        if (s.strategy.includes('Vertical')) team.tactics.playStyle = 'Vertical';
    });

    // DIA -1: No Bids yet
    console.log(`\n--- DIA -1: Configuração Inicial Concluída ---`);

    // DIA 0: Humans bid for Legendaries
    state.world.currentDay = 0;
    const legendaries = Object.values(state.players).filter(p => p.totalRating >= 850).sort((a, b) => b.totalRating - a.totalRating);

    console.log(`\n--- DIA 0: Rodada de Propostas (Draft) ---`);
    console.log(`Total de Lendários na Pool: ${legendaries.length}`);

    state.world.draftProposals = [];

    // Seed 1 & 2 bid for top 5
    for (let i = 0; i < 5; i++) {
        state.world.draftProposals.push({ playerId: legendaries[i].id, managerId: 'h_1', teamId: 't_1', priority: i });
        state.world.draftProposals.push({ playerId: legendaries[i].id, managerId: 'h_2', teamId: 't_2', priority: i });
    }
    // Seed 5 & 6 (Shadow) bid for some High Rating Chaos players (800+)
    const highRating = Object.values(state.players).filter(p => p.totalRating >= 780 && p.totalRating < 850);
    for (let i = 0; i < 3; i++) {
        state.world.draftProposals.push({ playerId: highRating[i].id, managerId: 'h_5', teamId: 't_17', priority: i });
        state.world.draftProposals.push({ playerId: highRating[i + 3].id, managerId: 'h_6', teamId: 't_18', priority: i });
    }

    // Advance to Day 1: Resolve Draft Conflicts
    state = advanceGameDay(state);
    console.log(`\n--- DIA 1: Draft Parcial Resolvido (Humano vs Humano / Humano vs NPC) ---`);
    seeds.forEach(s => {
        const team = state.teams[s.teamId];
        console.log(`${s.name}: ${team.squad.length} jogadores. Cap: ${Math.round(team.squad.reduce((sum, id) => sum + state.players[id].totalRating, 0))}/${team.powerCap}`);
    });

    // Advance to Day 2: Auto-Fill and Mode Change
    state = advanceGameDay(state);
    console.log(`\n--- DIA 2: Draft Encerrado, Modo Ativo ---`);
    console.log(`World Status: ${state.world.status}`);

    // MILESTONES
    const milestones = [10, 20, 30, 40, 45];
    for (let day = 3; day <= 45; day++) {
        state = advanceGameDay(state);

        if (milestones.includes(day)) {
            console.log(`\n--- RELATÓRIO DIA ${day} ---`);
            seeds.forEach(s => {
                const team = state.teams[s.teamId];
                const avgRating = team.squad.reduce((sum, id) => sum + state.players[id].totalRating, 0) / team.squad.length;
                const wins = state.world.leagues.norte.standings.find(st => st.teamId === s.teamId)?.won ||
                    state.world.leagues.sul.standings.find(st => st.teamId === s.teamId)?.won ||
                    state.world.leagues.leste.standings.find(st => st.teamId === s.teamId)?.won ||
                    state.world.leagues.oeste.standings.find(st => st.teamId === s.teamId)?.won || 0;

                // Track legendaries
                const legendCount = team.squad.filter(id => state.players[id].totalRating >= 850).length;
                console.log(`[${s.name}] Lendas: ${legendCount} | Avg Rating: ${avgRating.toFixed(1)} | Vitórias: ${wins}`);
            });
        }
    }

    console.log("\n=== SIMULAÇÃO MULTIPLAYER CONCLUÍDA ===");
}

runMultiplayerStressTest().catch(console.error);
