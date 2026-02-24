import { Match, Team } from '../types';

/**
 * Generates a double round-robin calendar for the given teams.
 * Teams play each other twice (home and away).
 * Total rounds = (N-1) * 2
 */
export const generateCalendar = (teams: Team[], leagueId: string): Match[] => {
  const matches: Match[] = [];
  const teamIds = teams.map(t => t.id);
  const n = teamIds.length;
  
  if (n % 2 !== 0) {
    throw new Error("Number of teams must be even for this generator.");
  }

  const roundsPerHalf = n - 1;
  const totalRounds = roundsPerHalf * 2;
  const matchesPerRound = n / 2;

  // Copy team IDs to a working array for rotation
  let rotation = [...teamIds];

  for (let round = 0; round < roundsPerHalf; round++) {
    // Generate matches for this round
    for (let i = 0; i < matchesPerRound; i++) {
      const home = rotation[i];
      const away = rotation[n - 1 - i];

      // First half of season
      matches.push({
        id: `m_${leagueId}_r${round + 1}_${home}_${away}`,
        round: round + 1,
        homeTeamId: home,
        awayTeamId: away,
        homeScore: null,
        awayScore: null,
        played: false,
        leagueId: leagueId
      });

      // Second half of season (swap home/away)
      matches.push({
        id: `m_${leagueId}_r${round + 1 + roundsPerHalf}_${away}_${home}`,
        round: round + 1 + roundsPerHalf,
        homeTeamId: away,
        awayTeamId: home,
        homeScore: null,
        awayScore: null,
        played: false,
        leagueId: leagueId
      });
    }

    // Rotate teams for next round (keep first team fixed)
    // Array: [0, 1, 2, 3, ... N-1]
    // Rotate: [0, N-1, 1, 2, ... N-2]
    const last = rotation.pop();
    if (last) {
      rotation.splice(1, 0, last);
    }
  }

  // Sort matches by round
  return matches.sort((a, b) => a.round - b.round);
};
