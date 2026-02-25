export type PositionType = 'Linha' | 'Goleiro';
export type PlayerRole = 'GOL' | 'DEF' | 'MEI' | 'ATA';
export type District = 'NORTE' | 'SUL' | 'LESTE' | 'OESTE' | 'EXILADO';

export interface Pentagon {
  FOR: number; // Força
  AGI: number; // Agilidade
  INT: number; // Inteligência
  TAT: number; // Tática
  TEC: number; // Técnica
}

export interface FusionSkills {
  DET: number; // FOR + INT
  DRI?: number; // AGI + INT (Linha)
  REF?: number; // AGI + INT (Goleiro)
  FIN?: number; // FOR + TEC (Linha)
  DEF?: number; // FOR + TEC (Goleiro)
  PAS: number; // TAT + TEC
  MOV?: number; // AGI + TAT (Linha)
  POS?: number; // AGI + TAT (Goleiro)
}

export interface Badges {
  slot1: string | null; // Traço Técnico
  slot2: string | null; // Traço de Perfil (Negativo < 500, Positivo > 750)
  slot3: string | null; // Especial (850+)
}

export interface Contract {
  teamId: string | null;
  salary: number;
  marketValue: number;
}

export interface PlayerHistory {
  goals: number;
  assists: number;
  averageRating: number;
  gamesPlayed: number;
  lastMatchRatings: number[]; // Array of last 5 match ratings (0.0 - 10.0)
}

export interface Player {
  id: string;
  name: string;
  nickname: string;
  district: District;
  appearance: {
    gender: 'M' | 'F';
    bodyId: number; // 1, 2, 3
    hairId: number; // 1..6
    bootId: number; // 1..15
  };
  position: PositionType;
  role: PlayerRole;
  pentagon: Pentagon;
  fusion: FusionSkills;
  totalRating: number; // 0-1000
  potential: number; // Max rating ceiling
  currentPhase: number; // Current form/phase (0.0 - 10.0)
  phaseHistory: number[]; // Last 3-5 match ratings for phase calculation
  badges: Badges;
  contract: Contract;
  history: PlayerHistory;
  satisfaction: number; // 0-100
  trainingProgress: number; // 0-100
}

export type LeagueColor = 'Cyan' | 'Orange' | 'Green' | 'Purple';

export type PlayStyle = 'Blitzkrieg' | 'Tiki-Taka' | 'Retranca Armada' | 'Motor Lento' | 'Equilibrado' | 'Gegenpressing' | 'Catenaccio';

export type Mentality = 'Calculista' | 'Emocional' | 'Predadora';

export interface TacticalCard {
  id: string;
  name: string;
  description: string;
  effect: string;
}

export interface TeamTactics {
  playStyle: PlayStyle;
  mentality: Mentality;
  linePosition: number; // 0 (Recuada) to 100 (Alta)
  aggressiveness: number; // 0 (Sombra) to 100 (Caçada)
  slots: (TacticalCard | null)[]; // Max 3 slots
  preferredFormation: string;
}

export interface TeamFinances {
  transferBudget: number;
  sponsorshipQuota: number;
  stadiumLevel: number; // 1-5
  emergencyCredit: number;
}

export interface TeamLogoMetadata {
  primary: string;
  secondary: string;
  patternId: string;
  symbolId: string;
  secondarySymbolId?: string;
}

export interface Team {
  id: string;
  name: string;
  city: string;
  district: District;
  league: LeagueColor;
  colors: {
    primary: string;
    secondary: string;
  };
  logo: TeamLogoMetadata;
  finances: TeamFinances;
  tactics: TeamTactics;
  inventory: TacticalCard[]; // Cards available to use in slots
  managerId: string | null;
  squad: string[]; // Player IDs
  lineup: Record<string, string>; // Position -> Player ID
  chemistry: number; // 0-100
}

export interface Manager {
  id: string;
  name: string;
  district: District;
  reputation: number; // 0-100
  attributes: {
    evolution: number;
    negotiation: number;
    scout: number;
  };
  career: {
    titlesWon: number;
    currentTeamId: string | null;
    historyTeamIds: string[];
  };
}

export type MatchStatus = 'SCHEDULED' | 'LOCKED' | 'PLAYING' | 'FINISHED';

export interface MatchEvent {
  id: string;
  minute: number; // 0-90
  realTimeSecond: number; // 0-360 (6 minutes)
  type: 'GOAL' | 'CARD_YELLOW' | 'CARD_RED' | 'CHANCE' | 'FOUL' | 'SUBSTITUTION' | 'COMMENTARY' | 'INJURY';
  title: string;
  description: string;
  playerId?: string;
  assistantId?: string;
  teamId: string;
}

export interface MatchResult {
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  scorers: Array<{ playerId: string; teamId: string }>;
  assists: Array<{ playerId: string; teamId: string }>;
  ratings: Record<string, number>;
  events: MatchEvent[];
  headline?: string;
  stats?: {
    possession: { home: number; away: number };
    shots: { home: number; away: number };
    shotsOnTarget: { home: number; away: number };
  };
}

export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  time: string; // HH:mm
  date: string; // ISO String
  status: MatchStatus;
  result: MatchResult | null;
  homeScore?: number;
  awayScore?: number;
  played?: boolean;
  round: number;
}

export interface Round {
  matches: Match[];
}

export interface LeagueTeamStats {
  teamId: string;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface LeagueScorer {
  rank: number;
  name: string;
  team: string;
  goals: number;
  teamId: string;
}

export interface WorldState {
  id: string;
  name: string;
  currentDate: string;
  currentRound: number;
  totalRounds: number;
  leagues: Record<string, {
    id: string;
    name: string;
    district: District;
    standings: LeagueTeamStats[];
    scorers: LeagueScorer[];
    rounds: Round[];
  }>;
}

export interface TrainingState {
  chemistryBoostLastUsed?: string; // ISO Date
  cardLaboratory: {
    slots: Array<{
      cardId: string | null;
      finishTime: string | null; // ISO Date
    }>;
  };
  individualFocus: {
    evolutionSlot: string | null; // Player ID (1.5x Rating gain)
    stabilizationSlot: string | null; // Player ID (Reduced Rating loss)
  };
}

export interface GameState {
  world: WorldState;
  worldId?: string;
  userId?: string;
  teams: Record<string, Team>;
  players: Record<string, Player>;
  managers: Record<string, Manager>;
  userTeamId: string | null;
  userManagerId?: string | null;
  notifications?: Notification[];
  lastHeadline?: {
    title: string;
    message: string;
  };
  training: TrainingState;
}
