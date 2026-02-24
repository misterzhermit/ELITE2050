import { Player } from '../types';
import { calculateMatchEvent, SectorInput } from './simulation';

export type Tactic = 'Ataque Total' | 'Retranca' | 'Posse de Bola' | 'Contra-Ataque';

export interface TeamStats {
  id: string;
  name: string;
  attack: number;
  midfield: number;
  defense: number;
  goalkeeper: number;
  tactic: Tactic;
}

export interface MatchEvent {
  minute: number;
  type: 'goal' | 'chance' | 'save' | 'foul' | 'card' | 'sub';
  teamId: string;
  description: string;
}

export interface MatchResult {
  homeScore: number;
  awayScore: number;
  events: MatchEvent[];
  stats: {
    possession: { home: number; away: number };
    shots: { home: number; away: number };
    shotsOnTarget: { home: number; away: number };
  };
  ratings: Record<string, number>;
}

const TACTIC_MULTIPLIERS: Record<Tactic, Record<Tactic, number>> = {
  'Ataque Total': {
    'Ataque Total': 1.0,
    'Retranca': 0.9,
    'Posse de Bola': 1.1,
    'Contra-Ataque': 0.85,
  },
  'Retranca': {
    'Ataque Total': 1.1,
    'Retranca': 1.0,
    'Posse de Bola': 0.9,
    'Contra-Ataque': 1.0,
  },
  'Posse de Bola': {
    'Ataque Total': 0.9,
    'Retranca': 1.1,
    'Posse de Bola': 1.0,
    'Contra-Ataque': 0.9,
  },
  'Contra-Ataque': {
    'Ataque Total': 1.15,
    'Retranca': 1.0,
    'Posse de Bola': 1.1,
    'Contra-Ataque': 1.0,
  }
};

const pickRandom = <T>(arr: T[], count: number): T[] => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export function simulateMatch(home: TeamStats, away: TeamStats, homePlayers: Player[] = [], awayPlayers: Player[] = []): MatchResult {
  const events: MatchEvent[] = [];
  let homeScore = 0;
  let awayScore = 0;
  
  let homePossessionWon = 0;
  let awayPossessionWon = 0;
  
  let homeShots = 0;
  let awayShots = 0;
  
  let homeShotsOnTarget = 0;
  let awayShotsOnTarget = 0;

  const playerRatings: Record<string, number[]> = {};

  const addRatings = (ratings: Record<string, number>) => {
     Object.entries(ratings).forEach(([id, rating]) => {
        if (!playerRatings[id]) playerRatings[id] = [];
        playerRatings[id].push(rating);
     });
  };

  // Convert TeamStats to SectorInputs
  const defaultSector = { chemistry: 100, phase: 6, stamina: 100, tacticalBonus: 1.0, chaosMax: 10 };

  const homeAttackSector: SectorInput = { ...defaultSector, averageAttribute: home.attack };
  const homeDefenseSector: SectorInput = { ...defaultSector, averageAttribute: home.defense };
  
  const awayAttackSector: SectorInput = { ...defaultSector, averageAttribute: away.attack };
  const awayDefenseSector: SectorInput = { ...defaultSector, averageAttribute: away.defense };

  const homeMultiplier = TACTIC_MULTIPLIERS[home.tactic]?.[away.tactic] || 1.0;
  const awayMultiplier = TACTIC_MULTIPLIERS[away.tactic]?.[home.tactic] || 1.0;

  homeAttackSector.tacticalBonus = homeMultiplier;
  awayAttackSector.tacticalBonus = awayMultiplier;

  for (let minute = 1; minute <= 90; minute++) {
    // 1. Posse de Bola (Meio vs Meio)
    const homeMid = home.midfield * (home.tactic === 'Posse de Bola' ? 1.2 : 1.0);
    const awayMid = away.midfield * (away.tactic === 'Posse de Bola' ? 1.2 : 1.0);
    
    const totalMid = homeMid + awayMid;
    const possessionRoll = Math.random() * totalMid;
    
    const hasPossession = possessionRoll < homeMid ? 'home' : 'away';
    
    if (hasPossession === 'home') homePossessionWon++;
    else awayPossessionWon++;

    // Only simulate an "Action" 30% of the time to keep realistic scores
    if (Math.random() > 0.3) continue;

    if (hasPossession === 'home') {
      const activeHome = pickRandom(homePlayers, 3);
      const activeAway = pickRandom(awayPlayers, 3);
      
      const result = calculateMatchEvent(minute, homeAttackSector, awayDefenseSector, activeHome, activeAway);
      addRatings(result.ratings);

      if (result.outcome === 'goal') {
        homeScore++;
        homeShots++;
        homeShotsOnTarget++;
        events.push({ minute, type: 'goal', teamId: home.id, description: `GOL do ${home.name}!` });
      } else if (result.outcome === 'defense') {
         homeShots++;
         if (Math.random() > 0.5) homeShotsOnTarget++;
         events.push({ minute, type: 'save', teamId: away.id, description: `Defesa do ${away.name}` });
      } else {
         // Turnover
      }
    } else {
      const activeAway = pickRandom(awayPlayers, 3);
      const activeHome = pickRandom(homePlayers, 3);
      
      const result = calculateMatchEvent(minute, awayAttackSector, homeDefenseSector, activeAway, activeHome);
      addRatings(result.ratings);

      if (result.outcome === 'goal') {
        awayScore++;
        awayShots++;
        awayShotsOnTarget++;
        events.push({ minute, type: 'goal', teamId: away.id, description: `GOL do ${away.name}!` });
      } else if (result.outcome === 'defense') {
         awayShots++;
         if (Math.random() > 0.5) awayShotsOnTarget++;
         events.push({ minute, type: 'save', teamId: home.id, description: `Defesa do ${home.name}` });
      } else {
         // Turnover
      }
    }
  }

  const totalPossession = homePossessionWon + awayPossessionWon;

  // Calculate average ratings
  const finalRatings: Record<string, number> = {};
  Object.entries(playerRatings).forEach(([id, ratings]) => {
     const sum = ratings.reduce((a, b) => a + b, 0);
     finalRatings[id] = Number((sum / ratings.length).toFixed(1));
  });

  return {
    homeScore,
    awayScore,
    events,
    stats: {
      possession: {
        home: totalPossession > 0 ? Math.round((homePossessionWon / totalPossession) * 100) : 50,
        away: totalPossession > 0 ? Math.round((awayPossessionWon / totalPossession) * 100) : 50
      },
      shots: { home: homeShots, away: awayShots },
      shotsOnTarget: { home: homeShotsOnTarget, away: awayShotsOnTarget }
    },
    ratings: finalRatings
  };
}
