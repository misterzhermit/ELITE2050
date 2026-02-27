import { Player, MatchEvent, MatchResult as MatchResultType, PlayStyle, Mentality, TacticalCard } from '../types';
import { COMMENTARY_COUNT, COMMENTARY_INTERVAL_SECONDS, MATCH_DURATION_MINUTES, MATCH_REAL_TIME_SECONDS } from '../constants/gameConstants';
import { calculateMatchEvent, SectorInput } from './simulation';

export interface TeamStats {
  id: string;
  name: string;
  attack: number;
  midfield: number;
  defense: number;
  goalkeeper: number;
  playStyle: PlayStyle;
  mentality: Mentality;
  linePosition: number;
  aggressiveness: number;
  slots: (TacticalCard | null)[];
  chemistry: number;
}

const PLAYSTYLE_EFFECTS: Record<PlayStyle, { att: number, mid: number, def: number, staminaDrain: number, tickReduction?: number, lateBonus?: number }> = {
  'Blitzkrieg': { att: 1.25, mid: 1.1, def: 0.8, staminaDrain: 1.5 },
  'Tiki-Taka': { att: 0.9, mid: 1.3, def: 1.0, staminaDrain: 0.8, tickReduction: 0.2 },
  'Retranca Armada': { att: 0.8, mid: 0.9, def: 1.4, staminaDrain: 0.9 },
  'Motor Lento': { att: 1.0, mid: 1.0, def: 1.0, staminaDrain: 1.0, lateBonus: 1.4 },
  'Equilibrado': { att: 1.0, mid: 1.0, def: 1.0, staminaDrain: 1.0 },
  'Gegenpressing': { att: 1.15, mid: 1.15, def: 0.9, staminaDrain: 1.4 },
  'Catenaccio': { att: 0.7, mid: 1.1, def: 1.5, staminaDrain: 0.9 },
  'Vertical': { att: 1.15, mid: 1.0, def: 0.9, staminaDrain: 1.2 }
};

const MENTALITY_EFFECTS: Record<Mentality, { attBonus: number, defPenalty: number, staminaPenalty: number }> = {
  'Calculista': { attBonus: 0, defPenalty: 0, staminaPenalty: 0 },
  'Emocional': { attBonus: 0.25, defPenalty: 0.3, staminaPenalty: 0 },
  'Predadora': { attBonus: 0.15, defPenalty: 0, staminaPenalty: 0.2 }
};

const pickWeightedRandom = (players: Player[], count: number, attributeKey: keyof Player['pentagon'] | 'totalRating' = 'totalRating'): Player[] => {
  const weightedPlayers = players.map(p => {
    // Add 200 for "Chaos/Zebra" factor to ensure everyone has a chance
    const attrValue = attributeKey === 'totalRating' ? p.totalRating : p.pentagon[attributeKey as keyof Player['pentagon']];
    const weight = (attrValue || 0) + 200;
    return { player: p, weight };
  });

  const selected: Player[] = [];
  const tempWeighted = [...weightedPlayers];

  for (let i = 0; i < count && tempWeighted.length > 0; i++) {
    const totalWeight = tempWeighted.reduce((sum, p) => sum + p.weight, 0);
    let roll = Math.random() * totalWeight;

    for (let j = 0; j < tempWeighted.length; j++) {
      roll -= tempWeighted[j].weight;
      if (roll <= 0) {
        selected.push(tempWeighted[j].player);
        tempWeighted.splice(j, 1);
        break;
      }
    }
  }
  return selected;
};

const COMMENTARY_TEMPLATES = [
  { title: "INÍCIO DE JOGO", description: "O árbitro apita e a bola rola no gramado sintético de Neo-City!" },
  { title: "ESTRATÉGIA", description: "Os técnicos gesticulam muito na beira do campo, ajuste tático detectado." },
  { title: "CLIMA", description: "A chuva ácida começa a cair, deixando o gramado mais veloz." },
  { title: "TORCIDA", description: "Os hologramas da torcida vibram com a intensidade da partida!" },
  { title: "ANÁLISE", description: "A posse de bola está muito disputada no círculo central." },
  { title: "CURIOSIDADE", description: "Você sabia? Este estádio foi construído sobre as ruínas da antiga bolsa de valores." },
  { title: "DESEMPENHO", description: "O sistema de análise aponta alta eficiência nos passes curtos." },
  { title: "RADAR", description: "Scouts de ligas superiores estão observando alguns talentos hoje." },
  { title: "FÍSICO", description: "O desgaste começa a aparecer, o ritmo de jogo diminui levemente." },
  { title: "TÁTICA", description: "Marcação individual por todo o campo, ninguém tem espaço para respirar." },
  { title: "TECNOLOGIA", description: "O VAR revisou um lance anterior rapidamente, jogo segue limpo." },
  { title: "DRONES", description: "Drones de transmissão captam ângulos incríveis da disputa aérea." },
  { title: "ENERGIA", description: "Os refletores de neon aumentam de intensidade para o segundo tempo." },
  { title: "MERCADO", description: "Rumores indicam que o destaque da partida pode ser transferido em breve." },
  { title: "SISTEMA", description: "Atualização de firmware dos sensores de campo concluída com sucesso." },
  { title: "CONFRONTO", description: "Duelos individuais acirrados nas laterais do campo." },
  { title: "ESTATÍSTICA", description: "O número de interceptações hoje está acima da média da liga." },
  { title: "ARBITRAGEM", description: "O juiz mantém o controle da partida com autoridade cibernética." },
  { title: "LOGÍSTICA", description: "A equipe médica está de prontidão com os mais modernos nano-sprays." },
  { title: "VISÃO", description: "Que visão de jogo! Os lançamentos em profundidade estão perigosos." },
  { title: "DETERMINAÇÃO", description: "Os jogadores mostram uma vontade incrível de vencer este clássico." },
  { title: "CONEXÃO", description: "A química entre os meio-campistas está facilitando as transições." },
  { title: "PRESSÃO", description: "A torcida local aumenta o volume, pressionando o time visitante." },
  { title: "RESISTÊNCIA", description: "Defesas sólidas de ambos os lados impedem grandes chances." },
  { title: "FIM DE JOGO", description: "Apito final! Uma partida para ficar na história de 2050." }
];

export function simulateMatch(
  home: TeamStats,
  away: TeamStats,
  homePlayers: Player[] = [],
  awayPlayers: Player[] = []
): MatchResultType {
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
  const scorers: Array<{ playerId: string; teamId: string }> = [];
  const assists: Array<{ playerId: string; teamId: string }> = [];

  const addRatings = (ratings: Record<string, number>) => {
    Object.entries(ratings).forEach(([id, rating]) => {
      if (!playerRatings[id]) playerRatings[id] = [];
      playerRatings[id].push(rating);
    });
  };

  const defaultSector = { chemistry: 100, phase: 6, stamina: 100, tacticalBonus: 1.0, chaosMax: 10 };

  // Sectors initialized below with full tactical calculation

  const homeEffect = PLAYSTYLE_EFFECTS[home.playStyle] || PLAYSTYLE_EFFECTS['Equilibrado'];
  const awayEffect = PLAYSTYLE_EFFECTS[away.playStyle] || PLAYSTYLE_EFFECTS['Equilibrado'];

  const homeMentality = MENTALITY_EFFECTS[home.mentality] || MENTALITY_EFFECTS['Calculista'];
  const awayMentality = MENTALITY_EFFECTS[away.mentality] || MENTALITY_EFFECTS['Calculista'];

  // Tactical Card Effects
  const getCardEffects = (slots: (TacticalCard | null)[]) => {
    let att = 1.0, mid = 1.0, def = 1.0, gk = 1.0;
    if (slots && Array.isArray(slots)) {
      slots.forEach(card => {
        if (!card) return;
        // Simple logic for card effects based on their name/description
        if (card.name && card.name.includes('Ataque')) att += 0.1;
        if (card.name && card.name.includes('Defesa')) def += 0.1;
        if (card.name && card.name.includes('Meio')) mid += 0.1;
        if (card.name && card.name.includes('Goleiro')) gk += 0.1;
        if (card.name === 'Super Chute') att += 0.15;
        if (card.name === 'Muralha') def += 0.15;
      });
    }
    return { att, mid, def, gk };
  };

  const homeCards = getCardEffects(home.slots);
  const awayCards = getCardEffects(away.slots);

  const homeAttackSector: SectorInput = {
    ...defaultSector,
    averageAttribute: home.attack,
    chemistry: home.chemistry,
    tacticalBonus: (homeEffect.att || 1.0) * (homeCards.att || 1.0) * (1 + ((home.linePosition || 50) - 50) / 200) + (homeMentality.attBonus || 0)
  };
  const homeDefenseSector: SectorInput = {
    ...defaultSector,
    averageAttribute: home.defense,
    chemistry: home.chemistry,
    tacticalBonus: (homeEffect.def || 1.0) * (homeCards.def || 1.0) * (1 + (50 - (home.linePosition || 50)) / 200) - (homeMentality.defPenalty || 0)
  };

  const awayAttackSector: SectorInput = {
    ...defaultSector,
    averageAttribute: away.attack,
    chemistry: away.chemistry,
    tacticalBonus: (awayEffect.att || 1.0) * (awayCards.att || 1.0) * (1 + ((away.linePosition || 50) - 50) / 200) + (awayMentality.attBonus || 0)
  };
  const awayDefenseSector: SectorInput = {
    ...defaultSector,
    averageAttribute: away.defense,
    chemistry: away.chemistry,
    tacticalBonus: (awayEffect.def || 1.0) * (awayCards.def || 1.0) * (1 + (50 - (away.linePosition || 50)) / 200) - (awayMentality.defPenalty || 0)
  };

  // --- INJECT 25 COMMENTARY CARDS (Every 15s in 360s window) ---
  for (let i = 0; i < COMMENTARY_COUNT; i++) {
    const second = i * COMMENTARY_INTERVAL_SECONDS;
    const minute = Math.floor((second / MATCH_REAL_TIME_SECONDS) * MATCH_DURATION_MINUTES);
    const template = COMMENTARY_TEMPLATES[i];

    events.push({
      id: `comm_${i}_${Date.now()}`,
      minute,
      realTimeSecond: second,
      type: 'COMMENTARY',
      title: template.title,
      description: template.description,
      teamId: 'system' // Special ID for neutral commentary
    });
  }

  for (let minute = 1; minute <= MATCH_DURATION_MINUTES; minute++) {
    // Dynamic bonuses based on time (Motor Lento)
    const homeLateBonus = (minute > 75) ? (homeEffect.lateBonus || 1.0) : 1.0;
    const awayLateBonus = (minute > 75) ? (awayEffect.lateBonus || 1.0) : 1.0;

    const homeMid = home.midfield * homeEffect.mid * homeCards.mid * homeLateBonus * (home.chemistry / 100);
    const awayMid = away.midfield * awayEffect.mid * awayCards.mid * awayLateBonus * (away.chemistry / 100);

    const totalMid = homeMid + awayMid;
    const possessionRoll = Math.random() * totalMid;
    const hasPossession = possessionRoll < homeMid ? 'home' : 'away';

    if (hasPossession === 'home') homePossessionWon++;
    else awayPossessionWon++;

    // Calculate second within the 6-minute (360s) window
    const baseSecond = Math.floor((minute / MATCH_DURATION_MINUTES) * MATCH_REAL_TIME_SECONDS);
    const currentEventSecond = Math.max(0, Math.min(MATCH_REAL_TIME_SECONDS - 1, baseSecond + Math.floor(Math.random() * 7) - 3));

    // Event chance: Lowered for more realistic match flow
    // Base intensity 0.1, peaks at 0.3 at minute 90
    let intensity = 0.1 + (minute / 450);
    if (hasPossession === 'home' && awayEffect.tickReduction) intensity *= (1 - awayEffect.tickReduction);
    if (hasPossession === 'away' && homeEffect.tickReduction) intensity *= (1 - homeEffect.tickReduction);

    if (Math.random() > intensity) continue;

    if (hasPossession === 'home') {
      const activeHome = pickWeightedRandom(homePlayers, 3);
      const activeAway = pickWeightedRandom(awayPlayers, 3);

      const result = calculateMatchEvent(minute, homeAttackSector, awayDefenseSector, activeHome, activeAway);
      addRatings(result.ratings);

      const mainAttacker = activeHome[0];
      const defender = activeAway[0];

      if (result.outcome === 'goal') {
        homeScore++;
        homeShots++;
        homeShotsOnTarget++;
        scorers.push({ playerId: mainAttacker.id, teamId: home.id });

        const assistant = activeHome[1];
        if (assistant) assists.push({ playerId: assistant.id, teamId: home.id });

        const goalDescriptions = [
          `Golaço de ${mainAttacker.nickname}! Chute sem chances para o goleiro.`,
          `${mainAttacker.nickname} recebe livre e empurra para as redes!`,
          `Que jogada! ${mainAttacker.nickname} dribla o goleiro e marca!`,
          `Fuzilamento de ${mainAttacker.nickname}! A bola estufa a rede.`,
          `Pura categoria! ${mainAttacker.nickname} coloca a bola onde a coruja dorme.`
        ];

        events.push({
          id: `event_${home.id}_${minute}_${Date.now()}_${Math.random()}`,
          minute,
          realTimeSecond: currentEventSecond,
          type: 'GOAL',
          title: 'GOL!',
          description: goalDescriptions[Math.floor(Math.random() * goalDescriptions.length)],
          playerId: mainAttacker.id,
          assistantId: assistant?.id,
          teamId: home.id
        });
      } else if (result.outcome === 'defense') {
        homeShots++;
        if (Math.random() > 0.4) homeShotsOnTarget++;

        const defenseDescriptions = [
          `${defender.nickname} intercepta o chute de ${mainAttacker.nickname}!`,
          `Milagre! O goleiro espalma a bomba de ${mainAttacker.nickname}!`,
          `${defender.nickname} trava o chute no momento exato!`,
          `A zaga do ${away.name} se joga na bola para evitar o gol!`,
          `Que defesa espetacular de ${defender.nickname}! Impediu o gol certo.`
        ];

        events.push({
          id: `event_${away.id}_${minute}_${Date.now()}_${Math.random()}`,
          minute,
          realTimeSecond: currentEventSecond,
          type: 'CHANCE',
          title: 'DEFESA!',
          description: defenseDescriptions[Math.floor(Math.random() * defenseDescriptions.length)],
          playerId: defender.id,
          teamId: away.id
        });
      } else {
        // --- FOULS, CARDS, INJURIES ---
        const foulRoll = Math.random();

        // Chance of event increases with aggression and minute
        const foulChance = 0.12 * (home.aggressiveness / 50);

        if (foulRoll < foulChance) {
          const isYellow = Math.random() < 0.65;
          const isRed = !isYellow && Math.random() < 0.2;
          const isInjury = !isYellow && !isRed && Math.random() < 0.15;

          if (isInjury) {
            events.push({
              id: `event_${home.id}_${minute}_injury`,
              minute,
              realTimeSecond: currentEventSecond,
              type: 'INJURY',
              title: 'LESÃO!',
              description: `${mainAttacker.nickname} cai no gramado sentindo dores fortes!`,
              playerId: mainAttacker.id,
              teamId: home.id
            });
          } else if (isYellow || isRed) {
            events.push({
              id: `event_${home.id}_${minute}_card`,
              minute,
              realTimeSecond: currentEventSecond,
              type: isRed ? 'CARD_RED' : 'CARD_YELLOW',
              title: isRed ? 'CARTÃO VERMELHO!' : 'CARTÃO AMARELO!',
              description: `${mainAttacker.nickname} recebe o cartão após entrada dura em ${defender.nickname}.`,
              playerId: mainAttacker.id,
              teamId: home.id
            });
          }
        }
      }
    } else {
      // --- AWAY TEAM POSSESSION ---
      const activeAway = pickWeightedRandom(awayPlayers, 3);
      const activeHome = pickWeightedRandom(homePlayers, 3);

      const result = calculateMatchEvent(minute, awayAttackSector, homeDefenseSector, activeAway, activeHome);
      addRatings(result.ratings);

      const mainAttacker = activeAway[0];
      const defender = activeHome[0];

      if (result.outcome === 'goal') {
        awayScore++;
        awayShots++;
        awayShotsOnTarget++;
        scorers.push({ playerId: mainAttacker.id, teamId: away.id });

        const assistant = activeAway[1];
        if (assistant) assists.push({ playerId: assistant.id, teamId: away.id });

        events.push({
          id: `event_${away.id}_${minute}_goal`,
          minute,
          realTimeSecond: currentEventSecond,
          type: 'GOAL',
          title: 'GOL!',
          description: `${mainAttacker.nickname} marca para o ${away.name}!`,
          playerId: mainAttacker.id,
          assistantId: assistant?.id,
          teamId: away.id
        });
      } else if (result.outcome === 'defense') {
        awayShots++;
        if (Math.random() > 0.4) awayShotsOnTarget++;
        events.push({
          id: `event_${home.id}_${minute}_defense`,
          minute,
          realTimeSecond: currentEventSecond,
          type: 'CHANCE',
          title: 'DEFESA!',
          description: `O goleiro do ${home.name} evita o gol de ${mainAttacker.nickname}!`,
          playerId: defender.id,
          teamId: home.id
        });
      } else {
        const foulRoll = Math.random();
        const foulChance = 0.12 * (away.aggressiveness / 50);

        if (foulRoll < foulChance) {
          const isYellow = Math.random() < 0.65;
          const isRed = !isYellow && Math.random() < 0.2;
          const isInjury = !isYellow && !isRed && Math.random() < 0.15;

          if (isInjury) {
            events.push({
              id: `event_${away.id}_${minute}_injury`,
              minute,
              realTimeSecond: currentEventSecond,
              type: 'INJURY',
              title: 'LESÃO!',
              description: `${mainAttacker.nickname} está sendo atendido pelos médicos.`,
              playerId: mainAttacker.id,
              teamId: away.id
            });
          } else if (isYellow || isRed) {
            events.push({
              id: `event_${away.id}_${minute}_card`,
              minute,
              realTimeSecond: currentEventSecond,
              type: isRed ? 'CARD_RED' : 'CARD_YELLOW',
              title: isRed ? 'CARTÃO VERMELHO!' : 'CARTÃO AMARELO!',
              description: `${mainAttacker.nickname} foi advertido pelo árbitro.`,
              playerId: mainAttacker.id,
              teamId: away.id
            });
          }
        }
      }
    }
  }

  const totalPossession = homePossessionWon + awayPossessionWon;
  const finalRatings: Record<string, number> = {};
  Object.entries(playerRatings).forEach(([id, ratings]) => {
    const sum = ratings.reduce((a, b) => a + b, 0);
    finalRatings[id] = Number((sum / ratings.length).toFixed(1));
  });

  // Generate Headline
  let headline = `Empate eletrizante entre ${home.name} e ${away.name}`;
  if (homeScore > awayScore) {
    headline = homeScore - awayScore >= 3 ? `Massacre! ${home.name} domina o ${away.name}` : `Vitória suada do ${home.name} em casa`;
  } else if (awayScore > homeScore) {
    headline = awayScore - homeScore >= 3 ? `Visitante indigesto: ${away.name} goleia` : `${away.name} cala o estádio com vitória nos minutos finais`;
  }

  return {
    homeTeamId: home.id,
    awayTeamId: away.id,
    homeScore,
    awayScore,
    headline,
    scorers,
    assists,
    events,
    headline,
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
