import { Player, Pentagon } from '../types';

export type SectorInput = {
  averageAttribute: number;
  chemistry: number;
  phase: number;
  stamina: number;
  tacticalBonus: number;
  chaosMax: number;
};

export type MatchTickResult = {
  tick: number;
  outcome: 'goal' | 'defense' | 'turnover';
  probability: number;
  attackPower: number;
  defensePower: number;
  ratings: Record<string, number>;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const applyChaos = (value: number, chaosMax: number) => {
  const chaos = Math.random() * chaosMax;
  return value * (1 + chaos / 100);
};

export const calculateMatchEvent = (
  tick: number,
  attack: SectorInput,
  defense: SectorInput,
  attackers: Player[] = [],
  defenders: Player[] = []
): MatchTickResult => {
  const baseAttack = attack.averageAttribute * attack.chemistry * attack.phase * attack.stamina * attack.tacticalBonus;
  const baseDefense = defense.averageAttribute * defense.chemistry * defense.phase * defense.stamina * defense.tacticalBonus;

  const attackPower = applyChaos(baseAttack, attack.chaosMax);
  const defensePower = applyChaos(baseDefense, defense.chaosMax);

  const ratio = attackPower / Math.max(1, defensePower);
  const goalProbability = clamp(0.08 + (ratio - 1) * 0.45, 0.02, 0.7);
  const defenseProbability = clamp(0.18 + (1 / ratio - 1) * 0.35, 0.05, 0.7);

  let outcome: 'goal' | 'defense' | 'turnover' = 'turnover';
  if (ratio >= 1.12) outcome = 'goal';
  else if (ratio <= 0.9) outcome = 'defense';
  else outcome = Math.random() < goalProbability ? 'goal' : Math.random() < defenseProbability ? 'defense' : 'turnover';

  const ratings: Record<string, number> = {};
  const attackBonus = outcome === 'goal' ? 0.8 : outcome === 'defense' ? -0.2 : -0.4;
  const defenseBonus = outcome === 'defense' ? 0.6 : outcome === 'goal' ? -0.3 : -0.1;

  attackers.forEach((p) => {
    ratings[p.id] = clamp(6 + attackBonus + (ratio - 1) * 0.6, 0, 10);
  });
  defenders.forEach((p) => {
    ratings[p.id] = clamp(6 + defenseBonus + (1 - ratio) * 0.5, 0, 10);
  });

  return {
    tick,
    outcome,
    probability: outcome === 'goal' ? goalProbability : outcome === 'defense' ? defenseProbability : 1 - goalProbability - defenseProbability,
    attackPower,
    defensePower,
    ratings
  };
};

export type EvolutionResult = {
  playerId: string;
  newRating: number;
  newPhase: number;
  newPentagon: Pentagon;
  phaseHistory: number[];
  delta: number;
};

export const calculateEvolution = (
  player: Player,
  matchRating: number | null,
  lastPhases: number[]
): EvolutionResult => {
  const currentRating = player.totalRating;
  const potential = Math.min(1000, player.potential);

  const played = matchRating !== null && matchRating > 0;
  const effectiveRating = played ? matchRating : 0;
  const phaseHistory = [effectiveRating, ...lastPhases].slice(0, 3);
  const newPhase = phaseHistory.reduce((sum, v) => sum + v, 0) / Math.max(1, phaseHistory.length);

  let inertia = 1;
  if (currentRating > 850) inertia = 0.15;
  else if (currentRating < 600) inertia = 1.5;

  let delta = played ? (effectiveRating - 6) * 5 * inertia : -1.2 * inertia;
  delta = Math.round(delta);

  const newPentagon = { ...player.pentagon };
  const keys: Array<keyof Pentagon> = ['FOR', 'AGI', 'INT', 'TAT', 'TEC'];

  // --- Badge/Trait Influence on Delta ---
  let badgeModifier = 1.0;
  
  if (player.badges.slot1) badgeModifier += 0.05; // Technical Trait: +5% evolution
  
  if (player.badges.slot2) {
    const positiveTraits = ['Referência', 'Combativo', 'Vertical', 'Cadenciador', 'Líder', 'Inspirador'];
    const negativeTraits = ['Preciosista', 'Individualista', 'Desatento', 'Instável', 'Preguiçoso', 'Pavio Curto'];
    
    if (positiveTraits.includes(player.badges.slot2)) badgeModifier += 0.1; // Positive: +10%
    if (negativeTraits.includes(player.badges.slot2)) badgeModifier -= 0.1; // Negative: -10%
  }

  if (player.badges.slot3) badgeModifier += 0.2; // Special Trait: +20%

  delta = Math.round(delta * badgeModifier);

  if (played && newPhase > 8) {
    for (let i = 0; i < 2; i++) {
      const key = keys[Math.floor(Math.random() * keys.length)];
      newPentagon[key] = clamp(newPentagon[key] + 1, 0, 100);
    }
  } else if (played && newPhase < 5) {
    for (let i = 0; i < 2; i++) {
      const key = keys[Math.floor(Math.random() * keys.length)];
      newPentagon[key] = clamp(newPentagon[key] - 1, 0, 100);
    }
  }

  let newRating = clamp(currentRating + delta, 0, potential);
  newRating = Math.min(1000, newRating);

  return {
    playerId: player.id,
    newRating,
    newPhase,
    newPentagon,
    phaseHistory,
    delta
  };
};
