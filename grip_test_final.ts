import { simulateMatch } from './src/engine/MatchEngine';
import { generatePlayer } from './src/engine/generator';

async function runGripTest(iterations: number) {
    console.log(`=== INICIANDO ANÁLISE DE GRIP (${iterations} ITERAÇÕES) ===\n`);

    const results: any = {
        baseline: { win: 0, draw: 0, loss: 0 },
        tactical: { win: 0, draw: 0, loss: 0 },
        traits: { win: 0, draw: 0, loss: 0 },
        scoreGap: { win: 0, draw: 0, loss: 0 }
    };

    const rating = 600;

    const createTeam = (name: string, r: number, playStyle: any = 'Equilibrado') => ({
        id: name, name, attack: r, midfield: r, defense: r, goalkeeper: r,
        playStyle, mentality: 'Calculista' as any, linePosition: 50, aggressiveness: 50, slots: [null, null, null], chemistry: 100
    });

    const createSquad = (teamId: string, r: number, trait?: string) => {
        const squad = [];
        const roles: any[] = ['GOL', 'ZAG', 'ZAG', 'MEI', 'MEI', 'ATA'];
        for (const role of roles) {
            const p = generatePlayer(`${teamId}_${role}_${Math.random()}`, 'NORTE', r, role);
            if (trait) p.badges.slot3 = trait;
            squad.push(p);
        }
        return squad;
    };

    for (let i = 0; i < iterations; i++) {
        // Baseline
        const resB = simulateMatch(createTeam('BasA', rating), createTeam('BasB', rating), createSquad('A', rating), createSquad('B', rating));
        if (resB.homeScore > resB.awayScore) results.baseline.win++; else if (resB.homeScore < resB.awayScore) results.baseline.loss++; else results.baseline.draw++;

        // Tactical (Blitzkrieg vs Balanced)
        const resT = simulateMatch(createTeam('TacA', rating, 'Blitzkrieg'), createTeam('BasB', rating, 'Equilibrado'), createSquad('A', rating), createSquad('B', rating));
        if (resT.homeScore > resT.awayScore) results.tactical.win++; else if (resT.homeScore < resT.awayScore) results.tactical.loss++; else results.tactical.draw++;

        // Traits (Legendary vs Standard)
        const resTr = simulateMatch(createTeam('TraA', rating), createTeam('BasB', rating), createSquad('A', rating, 'Finaliz Lendária'), createSquad('B', rating));
        if (resTr.homeScore > resTr.awayScore) results.traits.win++; else if (resTr.homeScore < resTr.awayScore) results.traits.loss++; else results.traits.draw++;

        // Score Gap (700 vs 600)
        const resS = simulateMatch(createTeam('HighA', 700), createTeam('BasB', 600), createSquad('A', 700), createSquad('B', 600));
        if (resS.homeScore > resS.awayScore) results.scoreGap.win++; else if (resS.homeScore < resS.awayScore) results.scoreGap.loss++; else results.scoreGap.draw++;
    }

    const log = (name: string, r: any) => {
        const winPct = (r.win / iterations * 100).toFixed(1);
        const grip = (((r.win / iterations) - 0.5) * 100).toFixed(1);
        console.log(`[${name}]: Vitória ${winPct}% | Grip: ${grip}%`);
    };

    log("BASELINE (CAOS)", results.baseline);
    log("TÁTICA (BLITZ)", results.tactical);
    log("TRAITS (LENDAS)", results.traits);
    log("SCORE (+100 PTS)", results.scoreGap);
}

runGripTest(1000).catch(console.error);
