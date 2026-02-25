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
  const matchesPerRound = n / 2;
  const roundsPerHalf = n - 1;

  // Rotation teams for next round
  let rotation = [...teamIds];

  for (let roundNum = 1; roundNum <= roundsPerHalf * 2; roundNum++) {
    // Each round happens every 2 days
    const roundDate = new Date('2050-01-01T08:00:00Z');
    roundDate.setDate(roundDate.getDate() + (roundNum * 2));
    const dateStr = roundDate.toISOString().split('T')[0];

    for (let i = 0; i < matchesPerRound; i++) {
      const isFirstHalf = roundNum <= roundsPerHalf;
      const home = isFirstHalf ? rotation[i] : rotation[n - 1 - i];
      const away = isFirstHalf ? rotation[n - 1 - i] : rotation[i];

      // Distribute times: 16:00, 18:00, 20:00
      const hours = [16, 18, 20];
      const timeStr = `${hours[i % hours.length]}:00`;

      matches.push({
        id: `m_${leagueId}_r${roundNum}_${i}`,
        homeTeamId: home,
        awayTeamId: away,
        date: dateStr,
        time: timeStr,
        status: 'SCHEDULED',
        result: null,
        round: roundNum
      });
    }

    // Rotate teams for next round (keep first team fixed)
    const last = rotation.pop();
    if (last) {
      rotation.splice(1, 0, last);
    }
  }

  // Sort matches by date and time
  return matches.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.time.localeCompare(b.time);
  });
};
