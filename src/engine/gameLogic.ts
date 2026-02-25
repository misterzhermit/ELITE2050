import { GameState, Team, Player, LeagueTeamStats, Notification, District, MatchResult, TeamStats, Match } from '../types';
import { simulateMatch, Tactic, TeamStats as MatchTeamStats } from './MatchEngine';
import { calculateEvolution } from './simulation';

// Season Configuration
const MAX_TEAM_POWER = 11000;
const SEASON_ROUNDS = 14;
const ELITE_CUP_ROUNDS = 4;
const DISTRICT_CUP_ROUNDS = 4;
const SEASON_DAYS = 45;
const MATCH_INTERVAL_DAYS = 2;
const TOTAL_ROUNDS = SEASON_ROUNDS + ELITE_CUP_ROUNDS + DISTRICT_CUP_ROUNDS; // 22 rounds
const SAFETY_NET_TOTAL = 6000;
const SAFETY_NET_MIN_PLAYERS = 15;
const SAFETY_NET_FREE_AGENT_RATING = 400;

// --- Helpers ---

const getSeasonDayNumber = (dateStr: string) => {
  const seasonStart = new Date('2050-01-01T08:00:00Z');
  const current = new Date(dateStr);
  const diffDays = Math.floor((current.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24));
  return (diffDays % SEASON_DAYS) + 1;
};

const isSeasonMatchDay = (dayNumber: number) => {
  // Matches start on Day 3
  if (dayNumber < 3) return false;
  // Matches happen every 2 days: 3, 5, 7, ...
  return (dayNumber - 3) % MATCH_INTERVAL_DAYS === 0;
};

const getRoundFromDay = (dayNumber: number) => {
  if (dayNumber < 3) return 0;
  return Math.floor((dayNumber - 3) / MATCH_INTERVAL_DAYS) + 1;
};

const sortStandings = (standings: LeagueTeamStats[]) =>
  [...standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const gdA = a.goalsFor - a.goalsAgainst;
    const gdB = b.goalsFor - b.goalsAgainst;
    return gdB - gdA;
  });

const shuffle = <T,>(items: T[]) => {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const calculateTeamAttribute = (team: Team, players: Record<string, Player>, attr: 'attack' | 'midfield' | 'defense' | 'goalkeeper'): number => {
  const squadPlayers = team.squad.map(id => players[id]).filter(p => !!p).sort((a, b) => b.totalRating - a.totalRating);
  if (squadPlayers.length === 0) return 50;
  const top11 = squadPlayers.slice(0, 11);
  const avg = top11.reduce((sum, p) => sum + p.totalRating, 0) / top11.length;
  return Math.round(avg / 10);
};

export const calculateTeamPower = (team: Team, players: Record<string, Player>): number => {
  if (!team.squad || team.squad.length === 0) return 0;
  return team.squad.reduce((sum, playerId) => {
    const player = players[playerId];
    return sum + (player ? player.totalRating : 0);
  }, 0);
};

export const checkPowerCap = (team: Team, players: Record<string, Player>): boolean => {
  return calculateTeamPower(team, players) <= MAX_TEAM_POWER;
};

export const applySafetyNet = (state: GameState, teamId: string) => {
  const team = state.teams[teamId];
  if (!team) return;

  const totalBefore = calculateTeamPower(team, state.players);
  const missingPlayers = Math.max(0, SAFETY_NET_MIN_PLAYERS - team.squad.length);
  let addedPlayers = 0;

  if (missingPlayers > 0) {
    const freeAgents = Object.values(state.players).filter(p => !p.contract.teamId);
    for (const agent of freeAgents) {
      if (addedPlayers >= missingPlayers) break;
      team.squad.push(agent.id);
      state.players[agent.id].contract.teamId = team.id;
      state.players[agent.id].totalRating = SAFETY_NET_FREE_AGENT_RATING;
      if (state.players[agent.id].potential < SAFETY_NET_FREE_AGENT_RATING) {
        state.players[agent.id].potential = SAFETY_NET_FREE_AGENT_RATING;
      }
      addedPlayers++;
    }
  }

  const totalAfter = calculateTeamPower(team, state.players);
  const credit = Math.max(0, SAFETY_NET_TOTAL - totalAfter);
  team.finances.emergencyCredit = credit;

  if (addedPlayers > 0 || credit > 0) {
    const message = `Piso de 6.000 ativado. Free Agents: ${addedPlayers}. Crédito de emergência: ${credit} pts.`;
    const notification: Notification = {
      id: `n_${Date.now()}_safetynet_${team.id}`,
      date: state.world.currentDate,
      title: 'Liga dos Renegados',
      message,
      type: 'info',
      read: false
    };
    state.notifications = [notification, ...state.notifications];
  }
};

export const updateStandings = (standings: LeagueTeamStats[], homeId: string, awayId: string, homeScore: number, awayScore: number) => {
  const homeStats = standings.find(s => s.teamId === homeId);
  const awayStats = standings.find(s => s.teamId === awayId);

  if (homeStats && awayStats) {
    homeStats.played++;
    awayStats.played++;
    homeStats.goalsFor += homeScore;
    homeStats.goalsAgainst += awayScore;
    awayStats.goalsFor += awayScore;
    awayStats.goalsAgainst += homeScore;

    if (homeScore > awayScore) {
      homeStats.won++;
      homeStats.points += 3;
      awayStats.lost++;
    } else if (awayScore > homeScore) {
      awayStats.won++;
      awayStats.points += 3;
      homeStats.lost++;
    } else {
      homeStats.drawn++;
      homeStats.points += 1;
      awayStats.drawn++;
      awayStats.points += 1;
    }
  }
};

const updatePlayerEvolutions = (state: GameState, result: MatchResult, homePlayers: Player[], awayPlayers: Player[]) => {
  const allPlayers = [...homePlayers, ...awayPlayers];
  
  allPlayers.forEach(player => {
    // 1. Basic Stats
    player.history.gamesPlayed++;
    
    // 2. Goals & Assists
    const goals = result.scorers.filter(s => s.playerId === player.id).length;
    const assists = result.assists.filter(a => a.playerId === player.id).length;
    player.history.goals += goals;
    player.history.assists += assists;

    // 3. Rating Evolution
    let matchRating = result.ratings?.[player.id];
    
    // If no rating (no events), give average 6.0 with variance
    if (matchRating === undefined) {
       matchRating = 6.0 + (Math.random() - 0.5); // 5.5 - 6.5
    }

    // Ensure rating is within bounds
    matchRating = Math.max(3, Math.min(10, matchRating));

    const isEvolutionFocus = state.training.individualFocus.evolutionSlot === player.id;
    const isStabilizationFocus = state.training.individualFocus.stabilizationSlot === player.id;

    const evolution = calculateEvolution(
      player, 
      matchRating, 
      player.history.lastMatchRatings || [],
      isEvolutionFocus,
      isStabilizationFocus
    );
    
    player.totalRating = evolution.newRating;
    player.pentagon = evolution.newPentagon;
    player.history.lastMatchRatings = [matchRating, ...(player.history.lastMatchRatings || [])].slice(0, 5);
    
    // Calculate average rating incrementally
    const oldGames = player.history.gamesPlayed - 1;
    player.history.averageRating = Number(((player.history.averageRating * oldGames + matchRating) / player.history.gamesPlayed).toFixed(2));
  });
};

export const calculateAttr = (sel: { gk: Player, def: Player[], mid: Player[], att: Player[] }, attr: string) => {
  if (attr === 'goalkeeper') {
      return Math.round(sel.gk.totalRating * (sel.gk.role === 'GOL' ? 1.0 : 0.5));
  }
  let players: Player[] = [];
  let targetRole = '';
  if (attr === 'defense') { players = sel.def; targetRole = 'DEF'; }
  if (attr === 'midfield') { players = sel.mid; targetRole = 'MEI'; }
  if (attr === 'attack') { players = sel.att; targetRole = 'ATA'; }

  if (players.length === 0) return 0;
  
  const sum = players.reduce((acc, p) => {
      const penalty = p.role === targetRole ? 1.0 : 0.6;
      return acc + (p.totalRating * penalty);
  }, 0);
  
  return Math.round(sum / players.length);
};

export const getMatchSquad = (team: Team, players: Record<string, Player>): { gk: Player, def: Player[], mid: Player[], att: Player[], all: Player[] } => {
  const squad = team.squad.map(id => players[id]).filter(p => !!p);
  
  // 1. Find best GK
  let gk = squad.find(p => p.role === 'GOL');
  if (!gk) {
     // Fallback: Best rated player becomes GK
     const sorted = [...squad].sort((a, b) => b.totalRating - a.totalRating);
     gk = sorted[0];
  }

  let pool = squad.filter(p => p.id !== gk!.id);
  pool.sort((a, b) => b.totalRating - a.totalRating);

  const def: Player[] = [];
  const mid: Player[] = [];
  const att: Player[] = [];

  // Helper to fill slots
  const fill = (target: Player[], role: string, count: number) => {
     for (let i = 0; i < count; i++) {
        if (target.length >= count) break;
        const idx = pool.findIndex(p => p.role === role);
        if (idx !== -1) {
           target.push(pool[idx]);
           pool.splice(idx, 1);
        }
     }
  };

  fill(def, 'DEF', 4);
  fill(mid, 'MEI', 3);
  fill(att, 'ATA', 3);

  while (def.length < 4 && pool.length > 0) def.push(pool.shift()!);
  while (mid.length < 3 && pool.length > 0) mid.push(pool.shift()!);
  while (att.length < 3 && pool.length > 0) att.push(pool.shift()!);

  return { gk: gk!, def, mid, att, all: [gk!, ...def, ...mid, ...att] };
};

export const simulateAndRecordMatch = (state: GameState, match: Match, standings: LeagueTeamStats[] | null): MatchResult => {
  const homeTeam = state.teams[match.homeTeamId];
  const awayTeam = state.teams[match.awayTeamId];

  if (!homeTeam || !awayTeam) {
    console.error(`Teams not found: ${match.homeTeamId} vs ${match.awayTeamId}`);
    return { homeTeamId: match.homeTeamId, awayTeamId: match.awayTeamId, homeScore: 0, awayScore: 0, scorers: [], assists: [], ratings: {}, events: [], stats: { possession: { home: 50, away: 50 }, shots: { home: 0, away: 0 }, shotsOnTarget: { home: 0, away: 0 } } };
  }

  const homeSelection = getMatchSquad(homeTeam, state.players);
  const awaySelection = getMatchSquad(awayTeam, state.players);

  const homeStats: MatchTeamStats = {
    id: homeTeam.id,
    name: homeTeam.name,
    attack: calculateAttr(homeSelection, 'attack'),
    midfield: calculateAttr(homeSelection, 'midfield'),
    defense: calculateAttr(homeSelection, 'defense'),
    goalkeeper: calculateAttr(homeSelection, 'goalkeeper'),
    playStyle: homeTeam.tactics.playStyle,
    mentality: homeTeam.tactics.mentality,
    linePosition: homeTeam.tactics.linePosition,
    aggressiveness: homeTeam.tactics.aggressiveness,
    slots: homeTeam.tactics.slots,
    chemistry: homeTeam.chemistry || 50
  };

  // Home advantage (5% bonus to all attributes)
  homeStats.attack = Math.round(homeStats.attack * 1.05);
  homeStats.midfield = Math.round(homeStats.midfield * 1.05);
  homeStats.defense = Math.round(homeStats.defense * 1.05);
  homeStats.goalkeeper = Math.round(homeStats.goalkeeper * 1.05);

  const awayStats: MatchTeamStats = {
    id: awayTeam.id,
    name: awayTeam.name,
    attack: calculateAttr(awaySelection, 'attack'),
    midfield: calculateAttr(awaySelection, 'midfield'),
    defense: calculateAttr(awaySelection, 'defense'),
    goalkeeper: calculateAttr(awaySelection, 'goalkeeper'),
    playStyle: awayTeam.tactics.playStyle,
    mentality: awayTeam.tactics.mentality,
    linePosition: awayTeam.tactics.linePosition,
    aggressiveness: awayTeam.tactics.aggressiveness,
    slots: awayTeam.tactics.slots,
    chemistry: awayTeam.chemistry || 50
  };

  const result = simulateMatch(homeStats, awayStats, homeSelection.all, awaySelection.all);

  match.result = result;
  match.homeScore = result.homeScore;
  match.awayScore = result.awayScore;
  // Note: we don't set played = true here yet because it might be LOCKED status
  
  updatePlayerEvolutions(state, result, homeSelection.all, awaySelection.all);

  if (standings) {
    updateStandings(standings, match.homeTeamId, match.awayTeamId, result.homeScore, result.awayScore);
  }

  return result;
};


const getEliteCupTeams = (state: GameState) => {
  const leagues = ['norte', 'sul', 'leste', 'oeste'] as const;
  const teams: string[] = [];
  leagues.forEach((key) => {
    const standings = sortStandings(state.world.leagues[key].standings);
    standings.slice(0, 4).forEach((row) => teams.push(row.teamId));
  });
  return teams;
};

const getDistrictCupTeams = (state: GameState) => {
  const districts: District[] = ['NORTE', 'SUL', 'LESTE', 'OESTE'];
  const districtTeamIds: string[] = [];

  districts.forEach(district => {
    const districtTeamId = `d_${district.toLowerCase()}`;
    const districtTeam = state.teams[districtTeamId];
    
    if (districtTeam) {
      districtTeam.squad = [];
      const allPlayers = Object.values(state.players);
      const districtPlayers = allPlayers.filter(p => p.district === district);
      const topPlayers = districtPlayers.sort((a, b) => b.totalRating - a.totalRating).slice(0, 18);
      
      districtTeam.squad = topPlayers.map(p => p.id);
      districtTeamIds.push(districtTeamId);
    }
  });

  return districtTeamIds;
};

const buildTopMovers = (prevState: GameState, newState: GameState, count: number) => {
  const movers: { name: string, delta: number }[] = [];
  
  Object.keys(newState.players).forEach(id => {
    const prev = prevState.players[id];
    const curr = newState.players[id];
    if (prev && curr) {
      const delta = curr.totalRating - prev.totalRating;
      if (delta !== 0) {
        movers.push({ name: curr.name, delta });
      }
    }
  });
  
  movers.sort((a, b) => b.delta - a.delta);
  
  const rises = movers.slice(0, count);
  const falls = movers.slice(movers.length - count).reverse();
  
  return { rises, falls };
};

// --- Main Advance Function ---

export const advanceGameDay = (prevState: GameState): GameState => {
  const state = JSON.parse(JSON.stringify(prevState)) as GameState;
  const { world } = state;
  
  const date = new Date(world.currentDate);
  date.setDate(date.getDate() + 1);
  world.currentDate = date.toISOString();

  const dayNumber = getSeasonDayNumber(world.currentDate);
  const isMatchDay = isSeasonMatchDay(dayNumber);
  
  // Transfer Window Logic
  world.transferWindowOpen = dayNumber <= 2 || dayNumber >= SEASON_DAYS;

  // --- Progress Card Laboratory ---
  if (state.training.cardLaboratory.slots) {
    state.training.cardLaboratory.slots.forEach(slot => {
      if (slot.cardId && slot.finishTime) {
        const finish = new Date(slot.finishTime);
        const now = new Date(state.world.currentDate);
        if (now >= finish) {
          // Card finished! Add to user team inventory
          const userTeam = state.teams[state.userTeamId!];
          if (userTeam) {
            // Card Templates
            const cardTemplates: Record<string, Partial<TacticalCard>> = {
              'ataque': {
                name: 'Ataque Total',
                description: 'Aumenta o bônus ofensivo da equipe em 10%.',
                effect: 'Ataque +10%'
              },
              'defesa': {
                name: 'Muralha',
                description: 'Aumenta o bônus defensivo da equipe em 15%.',
                effect: 'Defesa +15%'
              },
              'meio': {
                name: 'Meio Criativo',
                description: 'Aumenta o controle de jogo no meio-campo em 10%.',
                effect: 'Meio-Campo +10%'
              }
            };

            const template = cardTemplates[slot.cardId] || {
              name: 'Carta Desconhecida',
              description: 'Efeito misterioso.',
              effect: '???'
            };

            const newCard: TacticalCard = {
              id: `card_${Date.now()}_${slot.cardId}`,
              name: template.name!,
              description: template.description!,
              effect: template.effect!
            };

            userTeam.inventory.push(newCard);
            
            state.notifications.unshift({
              id: `n_${Date.now()}_card_lab`,
              date: state.world.currentDate,
              title: 'Laboratório de Cartas',
              message: `A pesquisa da carta "${newCard.name}" foi concluída e adicionada ao seu inventário!`,
              type: 'success',
              read: false
            });
          }
          slot.cardId = null;
          slot.finishTime = null;
        }
      }
    });
  }

  if (isMatchDay) {
    const round = getRoundFromDay(dayNumber);
    world.currentRound = round;

    if (round <= SEASON_ROUNDS) {
      // --- LEAGUE PHASE ---
      state.notifications.unshift({
        id: `n_${Date.now()}_round_${round}`,
        date: world.currentDate,
        title: `Rodada ${round} Finalizada`,
        message: 'Os jogos da liga foram realizados.',
        type: 'match',
        read: false
      });

      const leagues = ['norte', 'sul', 'leste', 'oeste'] as const;
      leagues.forEach(leagueKey => {
        const league = world.leagues[leagueKey];
        const roundMatches = league.matches.filter(m => m.round === round);
        roundMatches.forEach(match => {
          simulateAndRecordMatch(state, match, league.standings);
          match.played = true;
          match.status = 'FINISHED';
        });
      });

    } else if (round <= SEASON_ROUNDS + ELITE_CUP_ROUNDS) {
      // --- ELITE CUP ---
      const eliteRound = round - SEASON_ROUNDS; // 1..4
      
      if (eliteRound === 1 && world.eliteCup.teams.length === 0) {
        world.eliteCup.teams = getEliteCupTeams(state);
      }

      const stageName = eliteRound === 1 ? 'Oitavas de Final' : 
                        eliteRound === 2 ? 'Quartas de Final' :
                        eliteRound === 3 ? 'Semifinal' : 'Final';

      state.notifications.unshift({
        id: `n_${Date.now()}_elite_${eliteRound}`,
        date: world.currentDate,
        title: `Copa Elite - ${stageName}`,
        message: `Jogos da fase ${stageName} realizados.`,
        type: 'match',
        read: false
      });

      // Manage Bracket & Generate Matches
      let matchesToPlay: Match[] = [];

      if (eliteRound === 1) { // Octaves
        if (world.eliteCup.bracket.round1.length === 0) {
          const shuffled = shuffle(world.eliteCup.teams);
          for (let i = 0; i < shuffled.length; i += 2) {
             world.eliteCup.bracket.round1.push({
               id: `ec_r1_${i}`, round: eliteRound, homeTeamId: shuffled[i], awayTeamId: shuffled[i+1],
               homeScore: 0, awayScore: 0, played: false, date: world.currentDate
             });
          }
        }
        matchesToPlay = world.eliteCup.bracket.round1;
      } else if (eliteRound === 2) { // Quarters
        if (world.eliteCup.bracket.quarters.length === 0) {
          const prev = world.eliteCup.bracket.round1;
          const winners = prev.map(m => m.homeScore >= m.awayScore ? m.homeTeamId : m.awayTeamId);
          for (let i = 0; i < winners.length; i += 2) {
             world.eliteCup.bracket.quarters.push({
               id: `ec_qf_${i}`, round: eliteRound, homeTeamId: winners[i], awayTeamId: winners[i+1],
               homeScore: 0, awayScore: 0, played: false, date: world.currentDate
             });
          }
        }
        matchesToPlay = world.eliteCup.bracket.quarters;
      } else if (eliteRound === 3) { // Semis
        if (world.eliteCup.bracket.semis.length === 0) {
          const prev = world.eliteCup.bracket.quarters;
          const winners = prev.map(m => m.homeScore >= m.awayScore ? m.homeTeamId : m.awayTeamId);
          for (let i = 0; i < winners.length; i += 2) {
             world.eliteCup.bracket.semis.push({
               id: `ec_sf_${i}`, round: eliteRound, homeTeamId: winners[i], awayTeamId: winners[i+1],
               homeScore: 0, awayScore: 0, played: false, date: world.currentDate
             });
          }
        }
        matchesToPlay = world.eliteCup.bracket.semis;
      } else if (eliteRound === 4) { // Final
        if (!world.eliteCup.bracket.final) {
          const prev = world.eliteCup.bracket.semis;
          const winners = prev.map(m => m.homeScore >= m.awayScore ? m.homeTeamId : m.awayTeamId);
          world.eliteCup.bracket.final = {
             id: `ec_final`, round: eliteRound, homeTeamId: winners[0], awayTeamId: winners[1],
             homeScore: 0, awayScore: 0, played: false, date: world.currentDate
          };
        }
        matchesToPlay = [world.eliteCup.bracket.final!];
      }

      matchesToPlay.forEach(match => {
        simulateAndRecordMatch(state, match, null);
        match.played = true;
        match.status = 'FINISHED';
      });
      world.eliteCup.round = eliteRound;

      if (eliteRound === 4 && world.eliteCup.bracket.final) {
        const final = world.eliteCup.bracket.final;
        // In final, if draw, decide by penalty (random for now)
        if (final.homeScore === final.awayScore) {
          const penaltyWinner = Math.random() > 0.5 ? 'home' : 'away';
          if (penaltyWinner === 'home') final.homeScore += 1; // Representation of winning on penalties
          else final.awayScore += 1;
        }
        
        const winnerId = final.homeScore > final.awayScore ? final.homeTeamId : final.awayTeamId;
        world.eliteCup.winnerId = winnerId;
        const winnerTeam = state.teams[winnerId];
        
        state.notifications.unshift({
          id: `n_${Date.now()}_elite_winner`,
          date: world.currentDate,
          title: 'Campeão da Copa Elite!',
          message: `${winnerTeam.name} conquistou a Copa Elite em uma final emocionante!`,
          type: 'success',
          read: false
        });
      }

    } else if (round <= TOTAL_ROUNDS) {
      // --- DISTRICT CUP ---
      const districtRound = round - (SEASON_ROUNDS + ELITE_CUP_ROUNDS); // 1..4
      
      if (districtRound === 1 && world.districtCup.teams.length === 0) {
        const teamIds = getDistrictCupTeams(state);
        world.districtCup.teams = teamIds;
        world.districtCup.standings = teamIds.map(id => ({
          teamId: id, team: state.teams[id]?.name || id, played: 0, points: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0
        }));
      }

      state.notifications.unshift({
        id: `n_${Date.now()}_district_${districtRound}`,
        date: world.currentDate,
        title: `Copa dos Distritos - Rodada ${districtRound}`,
        message: districtRound === 4 ? 'Grande Final dos Distritos' : `Fase de Grupos - Rodada ${districtRound}`,
        type: 'match',
        read: false
      });

      if (districtRound <= 3) {
         // Group Phase (Round Robin for 4 teams: 3 rounds)
         const pairings = [
           [[0, 1], [2, 3]], 
           [[0, 2], [1, 3]], 
           [[0, 3], [1, 2]]
         ];
         const todaysPairings = pairings[districtRound - 1];
         
         todaysPairings.forEach(([idx1, idx2], i) => {
           const home = world.districtCup.teams[idx1];
           const away = world.districtCup.teams[idx2];
           const match: Match = {
             id: `dc_r${districtRound}_${i}`, round: districtRound, homeTeamId: home, awayTeamId: away,
             homeScore: 0, awayScore: 0, played: false, date: world.currentDate, status: 'FINISHED'
           };
           world.districtCup.matches.push(match);
           simulateAndRecordMatch(state, match, world.districtCup.standings);
           match.played = true;
         });
         world.districtCup.round = districtRound;

      } else {
        // Final (Top 2)
        const sorted = sortStandings(world.districtCup.standings);
        const finalists = sorted.slice(0, 2).map(s => s.teamId);
        
        const match: Match = {
           id: `dc_final`, round: districtRound, homeTeamId: finalists[0], awayTeamId: finalists[1],
           homeScore: 0, awayScore: 0, played: false, date: world.currentDate, status: 'FINISHED'
        };
        world.districtCup.final = match;
        
        simulateAndRecordMatch(state, match, null);
        match.played = true;

        // Penalty logic for final
        if (match.homeScore === match.awayScore) {
          const penaltyWinner = Math.random() > 0.5 ? 'home' : 'away';
          if (penaltyWinner === 'home') match.homeScore! += 1;
          else match.awayScore! += 1;
        }
        
        const winnerId = match.homeScore! > match.awayScore! ? match.homeTeamId : match.awayTeamId;
        world.districtCup.winnerId = winnerId;
        world.districtCup.round = districtRound;
        
        const winnerTeam = state.teams[winnerId];
        state.notifications.unshift({
          id: `n_${Date.now()}_district_winner`,
          date: world.currentDate,
          title: 'Campeão dos Distritos!',
          message: `${winnerTeam.name} venceu a Copa dos Distritos e unificou a região!`,
          type: 'success',
          read: false
        });
      }
    }

    // --- Generate Top 5 Movers Report ---
    const movers = buildTopMovers(prevState, state, 5);
      
    if (movers.rises.length > 0) {
      state.notifications.unshift({
        id: `n_${Date.now()}_movers_up`,
        date: world.currentDate,
        title: 'Top 5 Subiram',
        message: movers.rises.map((m, i) => `${i + 1}. ${m.name} (+${m.delta})`).join('|'),
        type: 'info',
        read: false
      });
    }
    if (movers.falls.length > 0) {
      state.notifications.unshift({
        id: `n_${Date.now()}_movers_down`,
        date: world.currentDate,
        title: 'Top 5 Caíram',
        message: movers.falls.map((m, i) => `${i + 1}. ${m.name} (${m.delta})`).join('|'),
        type: 'alert',
        read: false
      });
    }
  }

  // Weekly Power Cap Check
  if (dayNumber % 7 === 0) {
    Object.keys(state.teams).forEach(teamId => {
      const team = state.teams[teamId];
      if (!checkPowerCap(team, state.players)) {
        // Warning notification could be added here
      }
      if (calculateTeamPower(team, state.players) < SAFETY_NET_TOTAL) {
        applySafetyNet(state, teamId);
      }
    });
  }

  return state;
};
