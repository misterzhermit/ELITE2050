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
  position: PositionType;
  role: PlayerRole;
  pentagon: Pentagon;
  fusion: FusionSkills;
  totalRating: number; // 0-1000
  potential: number; // Max rating ceiling
  badges: Badges;
  contract: Contract;
  history: PlayerHistory;
  satisfaction: number; // 0-100
  trainingProgress: number; // 0-100
}

export type LeagueColor = 'Cyan' | 'Orange' | 'Green' | 'Purple';

export type PlayStyle = 'Vertical' | 'Cadenciado' | 'Retranca';

export interface TeamFinances {
  transferBudget: number;
  sponsorshipQuota: number;
  stadiumLevel: number; // 1-5
  emergencyCredit: number;
}

export interface TeamLogoMetadata {
  primary: string;
  secondary: string;
  patternId: string; // 'none' | 'stripes-v' | 'stripes-h' | 'diagonal' | 'half-v' | 'half-h' | 'cross' | 'circle'
  symbolId: string; // Lucide icon name
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
  tactics: {
    playStyle: PlayStyle;
    preferredFormation: string;
  };
  managerId: string | null;
  squad: string[]; // Player IDs, max 20
  lineup: Record<string, string | null>; // Slot ID -> Player ID
}

export interface ManagerAttributes {
  evolution: number; // 0-100
  negotiation: number; // 0-100
  scout: number; // 0-100
}

export interface Manager {
  id: string;
  name: string;
  district: District;
  reputation: number; // 0-100
  attributes: ManagerAttributes;
  career: {
    titlesWon: number;
    currentTeamId: string | null;
    historyTeamIds: string[];
  };
}

export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  round: number;
  played: boolean;
  date: string;
}



export interface LeagueTeamStats {
  teamId: string;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface League {
  id: string;
  name: string;
  standings: LeagueTeamStats[];
  matches: Match[];
  tvQuota: 'Alta' | 'Média' | 'Baixa';
  difficulty: 'Fácil' | 'Normal' | 'Difícil';
}

export interface EliteCupState {
  round: number; // 0=Not Started, 1=Round of 16, 2=Quarters, 3=Semis, 4=Final
  teams: string[]; // 16 Team IDs
  bracket: {
    round1: Match[]; // 8 matches
    quarters: Match[]; // 4 matches
    semis: Match[]; // 2 matches
    final: Match | null; // 1 match
  };
  winnerId: string | null;
}

export interface DistrictCupState {
  round: number; // 0=Not Started, 1=Round 1, 2=Round 2, 3=Round 3, 4=Final
  teams: string[]; // 4 District Team IDs
  standings: LeagueTeamStats[]; // For the round robin phase
  matches: Match[]; // All matches
  final: Match | null;
  winnerId: string | null;
}

export interface WorldState {
  leagues: {
    norte: League;
    sul: League;
    leste: League;
    oeste: League;
  };
  eliteCup: EliteCupState;
  districtCup: DistrictCupState;
  transferWindowOpen: boolean;
  rank1000PlayerId: string | null; // Tracks the 1000th ranked player for "relegation" logic
  currentSeason: number;
  currentRound: number;
  currentDate: string;
  seasonStartReal: number | null; // Timestamp of when the user started the season (real time)
}

export interface Notification {
  id: string;
  date: string;
  title: string;
  message: string;
  type: 'info' | 'alert' | 'success' | 'match' | 'transfer';
  read: boolean;
}

export interface GameState {
  world: WorldState;
  teams: Record<string, Team>;
  players: Record<string, Player>;
  managers: Record<string, Manager>;
  userTeamId: string | null;
  userManagerId: string | null;
  notifications: Notification[];
}

export type MatchEventType = 'goal' | 'card' | 'injury' | 'substitution' | 'chance' | 'save';

export interface MatchEvent {
  minute: number;
  type: MatchEventType;
  teamId: string;
  playerId?: string;
  description: string;
}

export interface MatchStats {
  possession: { home: number; away: number };
  shots: { home: number; away: number };
  shotsOnTarget: { home: number; away: number };
  fouls?: { home: number; away: number };
  corners?: { home: number; away: number };
}

export interface MatchResult {
  homeScore: number;
  awayScore: number;
  events: MatchEvent[];
  stats: MatchStats;
  ratings?: Record<string, number>;
}

export interface TeamStats {
  id: string;
  name: string;
  attack: number;
  midfield: number;
  defense: number;
  goalkeeper: number;
  tactic: string;
}
