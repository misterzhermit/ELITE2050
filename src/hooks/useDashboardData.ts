import React from 'react';
import { useGame } from '../store/GameContext';
import { calculateTeamPower } from '../engine/gameLogic';
import { LeagueState } from '../types';

export const useDashboardData = () => {
    const { state } = useGame();

    const userManager = state.userManagerId ? state.managers[state.userManagerId] : null;
    const userTeam = userManager?.career.currentTeamId ? state.teams[userManager.career.currentTeamId] : null;

    const baseDate = new Date(state.world.currentDate || '2050-01-01T08:00:00Z');
    const seasonStartReal = state.world.seasonStartReal ? new Date(state.world.seasonStartReal) : null;
    const currentTime = new Date(); // Could use a global time context, keeping simple 

    const gameDate = seasonStartReal
        ? new Date(baseDate.getTime() + (currentTime.getTime() - seasonStartReal.getTime()))
        : baseDate;

    const totalPoints = userTeam ? calculateTeamPower(userTeam, state.players) : 0;
    const powerCap = 11000;
    const pointsLeft = Math.max(0, powerCap - totalPoints);

    const seasonDays = 40;
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysPassed = seasonStartReal
        ? Math.min(seasonDays, Math.max(0, Math.floor((currentTime.getTime() - seasonStartReal.getTime()) / msPerDay)))
        : 0;
    const seasonProgress = Math.round((daysPassed / seasonDays) * 100);

    const userTeamMatches = React.useMemo(() => {
        if (!userTeam || !state.world?.leagues) return [];

        const leagues = Object.values(state.world.leagues) as LeagueState[];
        const userLeague = leagues.find(l => l.standings.some(s => s.teamId === userTeam.id));

        if (!userLeague || !userLeague.matches) return [];

        const currentRound = state.world.currentRound;
        const matches = userLeague.matches
            .filter(m => (m.homeTeamId === userTeam.id || m.awayTeamId === userTeam.id))
            .sort((a, b) => a.round - b.round);

        return matches.map(m => {
            const homeTeam = state.teams[m.homeTeamId];
            const awayTeam = state.teams[m.awayTeamId];

            const matchDate = new Date(state.world.currentDate);
            const daysDiff = (m.round - currentRound) * 2;
            matchDate.setDate(matchDate.getDate() + daysDiff);

            const hours = [16, 18, 19, 21];
            const matchHour = hours[parseInt(m.id.split('_')[1] || '0') % hours.length] || 16;

            return {
                id: m.id,
                round: m.round,
                date: matchDate.toISOString().split('T')[0],
                time: `${matchHour}:00`,
                home: homeTeam?.name || 'Unknown',
                away: awayTeam?.name || 'Unknown',
                homeId: m.homeTeamId,
                awayId: m.awayTeamId,
                homeLogo: homeTeam?.logo,
                awayLogo: awayTeam?.logo,
                homeScore: m.homeScore,
                awayScore: m.awayScore,
                played: m.played,
                type: 'League'
            };
        });
    }, [userTeam, state.world.leagues, state.world.currentRound, state.teams, state.world.currentDate]);

    const upcomingMatches = React.useMemo(() => {
        return userTeamMatches.filter(m => !m.played);
    }, [userTeamMatches]);

    const leaguesData = React.useMemo(() => {
        if (!state.world?.leagues) return {};

        const processLeague = (league: LeagueState) => {
            const sortedStandings = [...league.standings].sort((a, b) => {
                if (b.points !== a.points) return b.points - a.points;
                const gdA = a.goalsFor - a.goalsAgainst;
                const gdB = b.goalsFor - b.goalsAgainst;
                return gdB - gdA;
            });

            const formattedStandings = sortedStandings.map((stats, index) => ({
                position: index + 1,
                team: state.teams[stats.teamId]?.name || 'Unknown',
                logo: state.teams[stats.teamId]?.logo,
                played: stats.played,
                points: stats.points,
                gd: stats.goalsFor - stats.goalsAgainst,
                id: stats.teamId
            }));

            const leaguePlayers: { name: string; team: string; goals: number; rank: number }[] = [];
            league.standings.forEach(teamStats => {
                const team = state.teams[teamStats.teamId];
                if (team) {
                    team.squad.forEach(playerId => {
                        const player = state.players[playerId];
                        if (player && player.history?.goals > 0) {
                            leaguePlayers.push({
                                name: player.name,
                                team: team.name,
                                goals: player.history.goals,
                                rank: 0
                            });
                        }
                    });
                }
            });

            const sortedScorers = leaguePlayers
                .sort((a, b) => b.goals - a.goals)
                .slice(0, 10)
                .map((p, i) => ({ ...p, rank: i + 1 }));

            return {
                name: league.name,
                standings: formattedStandings,
                scorers: sortedScorers
            };
        };

        return {
            norte: processLeague(state.world.leagues.norte),
            sul: processLeague(state.world.leagues.sul),
            leste: processLeague(state.world.leagues.leste),
            oeste: processLeague(state.world.leagues.oeste)
        };
    }, [state.world, state.teams, state.players]);

    return {
        userManager,
        userTeam,
        baseDate,
        gameDate,
        totalPoints,
        powerCap,
        pointsLeft,
        seasonProgress,
        daysPassed,
        userTeamMatches,
        upcomingMatches,
        leaguesData
    };
};
