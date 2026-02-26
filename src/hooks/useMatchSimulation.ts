import { useState, useEffect } from 'react';
import { useGame } from '../store/GameContext';
import { Match, MatchEvent } from '../types';

export const useMatchSimulation = (userTeamId: string | null) => {
    const { state } = useGame();

    const [isWatchingVod, setIsWatchingVod] = useState(false);
    const [vodSecond, setVodSecond] = useState(0);
    const [selectedMatchReport, setSelectedMatchReport] = useState<Match | null>(null);

    useEffect(() => {
        let interval: any;
        if (isWatchingVod && vodSecond < 360) {
            interval = setInterval(() => {
                setVodSecond(prev => Math.min(360, prev + 1));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isWatchingVod, vodSecond]);

    const handleStartVod = () => {
        setVodSecond(0);
        setIsWatchingVod(true);
    };

    const handleMockVod = (mode: 'live' | 'finished' = 'live', customHeadline?: string) => {
        console.log(`GM: Simulando relatório de jogo (VOD mock) em modo ${mode}...`);

        const teams = Object.values(state.teams);
        if (teams.length < 2) {
            console.error('GM: Necessário pelo menos 2 times no estado para mockar VOD');
            return;
        }

        const userTeam = userTeamId ? state.teams[userTeamId] : null;
        const homeTeam = userTeam || teams[0];
        const awayTeam = teams.find(t => t.id !== homeTeam.id) || teams[1];

        const allPlayers = Object.values(state.players);
        if (allPlayers.length < 10) {
            console.error('GM: Necessário pelo menos 10 jogadores no estado para mockar VOD');
            return;
        }

        const homePlayers = allPlayers.filter(p => p.contract.teamId === homeTeam.id);
        const awayPlayers = allPlayers.filter(p => p.contract.teamId === awayTeam.id);

        const scorer1 = homePlayers[0] || allPlayers[0];
        const scorer2 = homePlayers[1] || allPlayers[1];
        const scorer3 = awayPlayers[0] || allPlayers[2];

        const assist1 = homePlayers[2] || allPlayers[3];
        const defender1 = awayPlayers[1] || allPlayers[4];
        const injured1 = homePlayers[3] || allPlayers[5];

        const commentaryTemplates = [
            { title: "INÍCIO DE JOGO", description: "O árbitro apita e a bola rola no gramado sintético de Neo-City!" },
            { title: "ESTRATÉGIA", description: "Os técnicos gesticulam muito na beira do campo, ajuste tático detectado." },
            { title: "CLIMA", description: "A chuva ácida começa a cair, deixando o gramado mais veloz." },
            { title: "TORCIDA", description: "Os hologramas da torcida vibram com a intensidade da partida!" },
            { title: "ANÁLISE", description: "A posse de bola está muito disputada no círculo central." },
        ];

        const mockEvents: MatchEvent[] = [];
        for (let i = 0; i < 25; i++) {
            const second = i * 15;
            const minute = Math.floor((second / 360) * 90);
            const template = commentaryTemplates[i % commentaryTemplates.length];

            mockEvents.push({
                id: `comm_${i}_${Date.now()}`,
                minute,
                realTimeSecond: second,
                type: 'COMMENTARY',
                title: template.title,
                description: template.description,
                teamId: 'system'
            });
        }

        mockEvents.push({
            id: 'ev1', minute: 12, realTimeSecond: 48, type: 'GOAL', title: 'GOL!',
            description: `GOLAÇO! ${scorer1.nickname} abre o placar com um chute de fora da área!`,
            playerId: scorer1.id, teamId: homeTeam.id
        });

        mockEvents.push({
            id: 'ev2', minute: 35, realTimeSecond: 140, type: 'CARD_YELLOW', title: 'CARTÃO AMARELO',
            description: `Entrada dura de ${defender1.nickname} de campo.`,
            playerId: defender1.id, teamId: awayTeam.id
        });

        mockEvents.push({
            id: 'ev3', minute: 45, realTimeSecond: 180, type: 'GOAL', title: 'GOL!',
            description: `${scorer2.nickname} amplia de cabeça após escanteio cobrado por ${assist1.nickname}!`,
            playerId: scorer2.id, teamId: homeTeam.id
        });

        mockEvents.push({
            id: 'ev4', minute: 78, realTimeSecond: 312, type: 'GOAL', title: 'GOL!',
            description: `Diminuiu! ${scorer3.nickname} marca para o time visitante após falha na zaga.`,
            playerId: scorer3.id, teamId: awayTeam.id
        });

        const mockMatch: Match = {
            id: `mock_${Date.now()}`,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            status: 'FINISHED',
            date: new Date().toISOString(),
            time: '20:00',
            round: 1,
            played: true,
            homeScore: 2,
            awayScore: 1,
            result: {
                homeTeamId: homeTeam.id,
                awayTeamId: awayTeam.id,
                homeScore: 2,
                awayScore: 1,
                scorers: [
                    { playerId: scorer1.id, teamId: homeTeam.id },
                    { playerId: scorer2.id, teamId: homeTeam.id },
                    { playerId: scorer3.id, teamId: awayTeam.id }
                ],
                assists: [{ playerId: assist1.id, teamId: homeTeam.id }],
                events: mockEvents,
                headline: customHeadline || `${homeTeam.name} vence em casa com autoridade!`,
                stats: {
                    possession: { home: 58, away: 42 },
                    shots: { home: 14, away: 7 },
                    shotsOnTarget: { home: 6, away: 3 }
                },
                ratings: {
                    [scorer1.id]: 85, [scorer2.id]: 79, [scorer3.id]: 72,
                    [assist1.id]: 75, [defender1.id]: 61, [injured1.id]: 68
                }
            }
        };

        if (mode === 'live') {
            setVodSecond(0);
            setIsWatchingVod(true);
        } else {
            setVodSecond(360);
            setIsWatchingVod(false);
        }
        setSelectedMatchReport(mockMatch);
    };

    const handleSimulateGameReport = () => {
        handleMockVod();
    };

    return {
        isWatchingVod,
        setIsWatchingVod,
        vodSecond,
        selectedMatchReport,
        setSelectedMatchReport,
        handleStartVod,
        handleMockVod,
        handleSimulateGameReport,
        setVodSecond
    };
};
