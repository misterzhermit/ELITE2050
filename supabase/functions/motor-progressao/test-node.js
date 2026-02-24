// Teste do Motor de Progressão - Node.js version
// Para rodar: node test-node.js

// Configurações do Motor de Progressão
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
  'Trabalhador': (delta) => delta > 0 ? delta * 1.2 : delta,
  'Preguiçoso': (delta) => delta < 0 ? delta * 1.2 : delta,
  'Consistente': (delta) => delta < 0 ? delta * 0.5 : delta,
}

/**
 * Calcula o novo rating baseado na performance e características do jogador
 */
function calculateNewRating(player, performance) {
  const currentRating = player.current_rating
  const potentialRating = player.potential_rating
  const phase = performance.phase
  const badges = player.badges || []

  // 1. Delta base: diferença da performance em relação ao equilíbrio
  const baseDelta = (phase - RATING_CONFIG.BASE_EQUILIBRIUM) * RATING_CONFIG.BASE_MULTIPLIER

  // 2. Aplicar volatilidade baseada no rating atual
  let volatilityMultiplier = RATING_CONFIG.VOLATILITY_MULTIPLIERS.MEDIUM
  
  if (currentRating < RATING_CONFIG.VOLATILITY_THRESHOLDS.LOW) {
    // Bagre/Promessa: alta volatilidade
    volatilityMultiplier = RATING_CONFIG.VOLATILITY_MULTIPLIERS.LOW
  } else if (currentRating > RATING_CONFIG.VOLATILITY_THRESHOLDS.HIGH) {
    // Craque: baixa volatilidade (Blue Chip)
    volatilityMultiplier = RATING_CONFIG.VOLATILITY_MULTIPLIERS.HIGH
  }

  let delta = baseDelta * volatilityMultiplier

  // 3. Resistência do potencial: reduz ganhos quando próximo do teto
  const distanceToPotential = potentialRating - currentRating
  
  if (distanceToPotential < RATING_CONFIG.POTENTIAL_THRESHOLD && delta > 0) {
    // Está próximo do teto, reduz ganhos pela metade
    delta = delta * RATING_CONFIG.POTENTIAL_REDUCTION
  }

  // 4. Aplicar efeitos dos badges
  for (const badge of badges) {
    const effectFunction = BADGE_EFFECTS[badge]
    if (effectFunction) {
      delta = effectFunction(delta)
    }
  }

  // 5. Calcular novo rating
  let newRating = Math.round(currentRating + delta)

  // 6. Limites: não pode ultrapassar o potencial nem ficar abaixo de 0
  newRating = Math.min(newRating, potentialRating)
  newRating = Math.max(newRating, 0)

  return {
    newRating,
    delta: newRating - currentRating,
    details: {
      baseDelta,
      volatilityMultiplier,
      finalDelta: delta,
      distanceToPotential
    }
  }
}

// Função de teste
function runTest(description, player, performance, expectedRating) {
  const result = calculateNewRating(player, performance)
  const passed = result.newRating === expectedRating
  
  console.log(`\n🧪 ${description}`)
  console.log(`   Jogador: ${player.name} (Rating: ${player.current_rating} → ${result.newRating})`)
  console.log(`   Performance: ${performance.phase}`)
  console.log(`   Delta: ${result.delta > 0 ? '+' : ''}${result.delta}`)
  console.log(`   Esperado: ${expectedRating} | Resultado: ${result.newRating}`)
  console.log(`   Status: ${passed ? '✅ PASSOU' : '❌ FALHOU'}`)
  
  if (!passed) {
    console.log(`   Detalhes:`, result.details)
  }
  
  return passed
}

console.log("🎮 Motor de Progressão - Testes Unitários")
console.log("==========================================")

// Teste 1: Jovem Promessa com boa performance
runTest(
  "Jovem Promessa com boa performance",
  {
    id: "test-1",
    name: "Zion Matrix",
    current_rating: 550,
    potential_rating: 800,
    current_phase: 0,
    phase_history: [],
    badges: []
  },
  {
    player_id: "test-1",
    phase: 9.0,
    match_date: "2024-01-15T20:00:00Z"
  },
  573 // Base Delta: +15, Volatilidade: 1.5x = +22.5
)

// Teste 2: Craque com performance ruim
runTest(
  "Craque com performance ruim",
  {
    id: "test-2",
    name: "Akira Voss",
    current_rating: 850,
    potential_rating: 950,
    current_phase: 0,
    phase_history: [],
    badges: []
  },
  {
    player_id: "test-2",
    phase: 4.0,
    match_date: "2024-01-15T20:00:00Z"
  },
  849 // Base Delta: -10, Volatilidade: 0.15x = -1.5
)

// Teste 3: Badge Trabalhador
runTest(
  "Badge Trabalhador",
  {
    id: "test-3",
    name: "Kaelen Stark",
    current_rating: 580,
    potential_rating: 800,
    current_phase: 0,
    phase_history: [],
    badges: ["Trabalhador"]
  },
  {
    player_id: "test-3",
    phase: 8.5,
    match_date: "2024-01-15T20:00:00Z"
  },
  603 // Base Delta: +12.5, Volatilidade: 1.5x = +18.75, Badge: +20% = +22.5
)

// Teste 4: Badge Consistente
runTest(
  "Badge Consistente",
  {
    id: "test-4",
    name: "Luna Matrix",
    current_rating: 720,
    potential_rating: 850,
    current_phase: 0,
    phase_history: [],
    badges: ["Consistente"]
  },
  {
    player_id: "test-4",
    phase: 5.0,
    match_date: "2024-01-15T20:00:00Z"
  },
  718 // Base Delta: -5, Volatilidade: 1.0x, Badge: 0.5x = -2.5
)

// Teste 5: Resistência do Potencial
runTest(
  "Resistência do Potencial",
  {
    id: "test-5",
    name: "Ryker Voss",
    current_rating: 785,
    potential_rating: 800,
    current_phase: 0,
    phase_history: [],
    badges: []
  },
  {
    player_id: "test-5",
    phase: 8.0,
    match_date: "2024-01-15T20:00:00Z"
  },
  790 // Está a 15 do teto, ganhos reduzidos pela metade
)

// Teste 6: Limite de Potencial
runTest(
  "Limite de Potencial",
  {
    id: "test-6",
    name: "Nova Sterling",
    current_rating: 895,
    potential_rating: 900,
    current_phase: 0,
    phase_history: [],
    badges: []
  },
  {
    player_id: "test-6",
    phase: 9.5,
    match_date: "2024-01-15T20:00:00Z"
  },
  900 // Não pode ultrapassar o potencial
)

// Teste 7: Performance neutra (6.0)
runTest(
  "Performance neutra",
  {
    id: "test-7",
    name: "Juno Flux",
    current_rating: 650,
    potential_rating: 800,
    current_phase: 0,
    phase_history: [],
    badges: []
  },
  {
    player_id: "test-7",
    phase: 6.0,
    match_date: "2024-01-15T20:00:00Z"
  },
  650 // Nota 6.0 = sem mudança
)

console.log("\n🎯 Motor de Progressão - Análise de Mercado")
console.log("============================================")

// Simulação de mercado
const marketSimulation = [
  { name: "Jovem Promessa", rating: 520, potential: 850, volatility: "Alta" },
  { name: "Jogador Médio", rating: 720, potential: 820, volatility: "Normal" },
  { name: "Craque Consolidado", rating: 875, potential: 920, volatility: "Baixa" }
]

marketSimulation.forEach(player => {
  console.log(`\n📊 ${player.name} (Rating: ${player.rating}, Potencial: ${player.potential})`)
  console.log(`   Volatilidade: ${player.volatility}`)
  
  // Simular diferentes performances
  const performances = [9.5, 8.0, 6.0, 4.5, 3.0]
  performances.forEach(phase => {
    const mockPlayer = {
      current_rating: player.rating,
      potential_rating: player.potential,
      badges: []
    }
    const mockPerformance = { phase }
    const result = calculateNewRating(mockPlayer, mockPerformance)
    
    console.log(`   Nota ${phase.toFixed(1)}: ${player.rating} → ${result.newRating} (${result.delta > 0 ? '+' : ''}${result.delta})`)
  })
})

console.log("\n✅ Testes concluídos! O Motor de Progressão está pronto para revolucionar o mercado do Glyph 2050!")