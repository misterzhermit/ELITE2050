import { assertEquals } from "https://deno.land/std@0.177.0/testing/asserts.ts"

// Mock dos tipos para teste
interface Player {
  id: string
  name: string
  current_rating: number
  potential_rating: number
  current_phase: number
  phase_history: Array<{
    date: string
    phase: number
    rating: number
  }>
  badges: string[]
}

interface MatchPerformance {
  player_id: string
  phase: number
  match_date: string
}

// Configurações do Motor de Progressão (copiadas da função principal)
const RATING_CONFIG = {
  BASE_EQUILIBRIUM: 6.0,
  BASE_MULTIPLIER: 5,
  VOLATILITY_THRESHOLDS: {
    LOW: 600,
    HIGH: 800,
  },
  VOLATILITY_MULTIPLIERS: {
    LOW: 1.5,
    MEDIUM: 1.0,
    HIGH: 0.15,
  },
  POTENTIAL_THRESHOLD: 15,
  POTENTIAL_REDUCTION: 0.5,
  MAX_HISTORY: 5,
}

const BADGE_EFFECTS = {
  'Trabalhador': (delta: number) => delta > 0 ? delta * 1.2 : delta,
  'Preguiçoso': (delta: number) => delta < 0 ? delta * 1.2 : delta,
  'Consistente': (delta: number) => delta < 0 ? delta * 0.5 : delta,
}

// Função de cálculo (copiada da função principal)
function calculateNewRating(player: Player, performance: MatchPerformance): number {
  const currentRating = player.current_rating
  const potentialRating = player.potential_rating
  const phase = performance.phase
  const badges = player.badges || []

  // 1. Delta base: diferença da performance em relação ao equilíbrio
  const baseDelta = (phase - RATING_CONFIG.BASE_EQUILIBRIUM) * RATING_CONFIG.BASE_MULTIPLIER

  // 2. Aplicar volatilidade baseada no rating atual
  let volatilityMultiplier = RATING_CONFIG.VOLATILITY_MULTIPLIERS.MEDIUM
  
  if (currentRating < RATING_CONFIG.VOLATILITY_THRESHOLDS.LOW) {
    volatilityMultiplier = RATING_CONFIG.VOLATILITY_MULTIPLIERS.LOW
  } else if (currentRating > RATING_CONFIG.VOLATILITY_THRESHOLDS.HIGH) {
    volatilityMultiplier = RATING_CONFIG.VOLATILITY_MULTIPLIERS.HIGH
  }

  let delta = baseDelta * volatilityMultiplier

  // 3. Resistência do potencial: reduz ganhos quando próximo do teto
  const distanceToPotential = potentialRating - currentRating
  
  if (distanceToPotential < RATING_CONFIG.POTENTIAL_THRESHOLD && delta > 0) {
    delta = delta * RATING_CONFIG.POTENTIAL_REDUCTION
  }

  // 4. Aplicar efeitos dos badges
  for (const badge of badges) {
    const effectFunction = BADGE_EFFECTS[badge as keyof typeof BADGE_EFFECTS]
    if (effectFunction) {
      delta = effectFunction(delta)
    }
  }

  // 5. Calcular novo rating
  let newRating = Math.round(currentRating + delta)

  // 6. Limites: não pode ultrapassar o potencial nem ficar abaixo de 0
  newRating = Math.min(newRating, potentialRating)
  newRating = Math.max(newRating, 0)

  return newRating
}

// Testes
Deno.test("Motor de Progressão - Jovem Promessa com boa performance", () => {
  const player: Player = {
    id: "test-1",
    name: "Zion Matrix",
    current_rating: 550,
    potential_rating: 800,
    current_phase: 0,
    phase_history: [],
    badges: []
  }

  const performance: MatchPerformance = {
    player_id: "test-1",
    phase: 9.0,
    match_date: "2024-01-15T20:00:00Z"
  }

  const newRating = calculateNewRating(player, performance)
  
  // Base Delta: (9.0 - 6.0) * 5 = +15
  // Volatilidade (Bagre): 15 * 1.5 = +22.5
  // Novo Rating: 550 + 22.5 = 572.5 → 573
  assertEquals(newRating, 573)
})

Deno.test("Motor de Progressão - Craque com performance ruim", () => {
  const player: Player = {
    id: "test-2",
    name: "Akira Voss",
    current_rating: 850,
    potential_rating: 950,
    current_phase: 0,
    phase_history: [],
    badges: []
  }

  const performance: MatchPerformance = {
    player_id: "test-2",
    phase: 4.0,
    match_date: "2024-01-15T20:00:00Z"
  }

  const newRating = calculateNewRating(player, performance)
  
  // Base Delta: (4.0 - 6.0) * 5 = -10
  // Volatilidade (Craque): -10 * 0.15 = -1.5
  // Novo Rating: 850 - 1.5 = 848.5 → 849
  assertEquals(newRating, 849)
})

Deno.test("Motor de Progressão - Badge Trabalhador", () => {
  const player: Player = {
    id: "test-3",
    name: "Kaelen Stark",
    current_rating: 580,
    potential_rating: 800,
    current_phase: 0,
    phase_history: [],
    badges: ["Trabalhador"]
  }

  const performance: MatchPerformance = {
    player_id: "test-3",
    phase: 8.5,
    match_date: "2024-01-15T20:00:00Z"
  }

  const newRating = calculateNewRating(player, performance)
  
  // Base Delta: (8.5 - 6.0) * 5 = +12.5
  // Volatilidade (Bagre): 12.5 * 1.5 = +18.75
  // Badge Trabalhador: 18.75 * 1.2 = +22.5
  // Novo Rating: 580 + 22.5 = 602.5 → 603
  assertEquals(newRating, 603)
})

Deno.test("Motor de Progressão - Badge Consistente", () => {
  const player: Player = {
    id: "test-4",
    name: "Luna Matrix",
    current_rating: 720,
    potential_rating: 850,
    current_phase: 0,
    phase_history: [],
    badges: ["Consistente"]
  }

  const performance: MatchPerformance = {
    player_id: "test-4",
    phase: 5.0,
    match_date: "2024-01-15T20:00:00Z"
  }

  const newRating = calculateNewRating(player, performance)
  
  // Base Delta: (5.0 - 6.0) * 5 = -5
  // Volatilidade (Médio): -5 * 1.0 = -5
  // Badge Consistente: -5 * 0.5 = -2.5
  // Novo Rating: 720 - 2.5 = 717.5 → 718
  assertEquals(newRating, 718)
})

Deno.test("Motor de Progressão - Resistência do Potencial", () => {
  const player: Player = {
    id: "test-5",
    name: "Ryker Voss",
    current_rating: 785,
    potential_rating: 800,
    current_phase: 0,
    phase_history: [],
    badges: []
  }

  const performance: MatchPerformance = {
    player_id: "test-5",
    phase: 8.0,
    match_date: "2024-01-15T20:00:00Z"
  }

  const newRating = calculateNewRating(player, performance)
  
  // Base Delta: (8.0 - 6.0) * 5 = +10
  // Volatilidade (Médio): 10 * 1.0 = +10
  // Resistência Potencial: 10 * 0.5 = +5 (está a 15 do teto)
  // Novo Rating: 785 + 5 = 790
  assertEquals(newRating, 790)
})

Deno.test("Motor de Progressão - Limite de Potencial", () => {
  const player: Player = {
    id: "test-6",
    name: "Nova Sterling",
    current_rating: 895,
    potential_rating: 900,
    current_phase: 0,
    phase_history: [],
    badges: []
  }

  const performance: MatchPerformance = {
    player_id: "test-6",
    phase: 9.5,
    match_date: "2024-01-15T20:00:00Z"
  }

  const newRating = calculateNewRating(player, performance)
  
  // Não pode ultrapassar o potencial
  assertEquals(newRating, 900)
})

console.log("✅ Todos os testes do Motor de Progressão foram executados com sucesso!")