import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Tipos do banco
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
  phase: number // nota da partida (0.0 a 10.0)
  match_date: string
}

// Configurações do Motor de Progressão
const RATING_CONFIG = {
  BASE_EQUILIBRIUM: 6.0, // Nota base de equilíbrio
  BASE_MULTIPLIER: 5, // Multiplicador base do delta
  VOLATILITY_THRESHOLDS: {
    LOW: 600, // Bagre/Promessa
    HIGH: 800, // Craque
  },
  VOLATILITY_MULTIPLIERS: {
    LOW: 1.5, // Alta volatilidade para jogadores < 600
    MEDIUM: 1.0, // Volatilidade normal para 600-800
    HIGH: 0.15, // Baixa volatilidade para > 800 (Blue Chips)
  },
  POTENTIAL_THRESHOLD: 15, // Quando current_rating está a 15 do potential, reduz ganhos
  POTENTIAL_REDUCTION: 0.5, // Reduz ganhos pela metade quando próximo do teto
  MAX_HISTORY: 5, // Máximo de fases no histórico
}

// Badges que afetam o cálculo
const BADGE_EFFECTS = {
  'Trabalhador': (delta: number) => delta > 0 ? delta * 1.2 : delta, // +20% em ganhos positivos
  'Preguiçoso': (delta: number) => delta < 0 ? delta * 1.2 : delta, // -20% piorado em perdas
  'Consistente': (delta: number) => delta < 0 ? delta * 0.5 : delta, // Metade da queda negativa
}

/**
 * Motor de Progressão - Edge Function que atualiza os ratings dos jogadores
 * Roda semanalmente após cada rodada de partidas
 */
Deno.serve(async (req) => {
  try {
    // Configuração do Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

    // Verificar método HTTP
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Método não permitido' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Obter dados da requisição
    const { match_performances }: { match_performances: MatchPerformance[] } = await req.json()

    if (!match_performances || !Array.isArray(match_performances)) {
      return new Response(JSON.stringify({ error: 'Dados inválidos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log(`Processando ${match_performances.length} performances de jogadores...`)

    const updatedPlayers = []

    // Processar cada performance
    for (const performance of match_performances) {
      try {
        // Buscar jogador no banco
        const { data: player, error: playerError } = await supabase
          .from('players')
          .select('*')
          .eq('id', performance.player_id)
          .single()

        if (playerError || !player) {
          console.error(`Jogador ${performance.player_id} não encontrado:`, playerError)
          continue
        }

        // Calcular novo rating
        const newRating = calculateNewRating(player, performance)
        
        // Atualizar histórico de fases
        const newPhaseHistory = updatePhaseHistory(player.phase_history || [], {
          date: performance.match_date,
          phase: performance.phase,
          rating: newRating
        })

        // Atualizar jogador no banco
        const { error: updateError } = await supabase
          .from('players')
          .update({
            current_rating: newRating,
            current_phase: performance.phase,
            phase_history: newPhaseHistory,
            updated_at: new Date().toISOString()
          })
          .eq('id', player.id)

        if (updateError) {
          console.error(`Erro ao atualizar jogador ${player.id}:`, updateError)
          continue
        }

        updatedPlayers.push({
          id: player.id,
          name: player.name,
          old_rating: player.current_rating,
          new_rating: newRating,
          delta: newRating - player.current_rating,
          phase: performance.phase
        })

      } catch (error) {
        console.error(`Erro ao processar performance do jogador ${performance.player_id}:`, error)
      }
    }

    console.log(`Motor de Progressão concluído. ${updatedPlayers.length} jogadores atualizados.`)

    return new Response(
      JSON.stringify({
        success: true,
        updated_count: updatedPlayers.length,
        players: updatedPlayers
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Erro no Motor de Progressão:', error)
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

/**
 * Calcula o novo rating baseado na performance e características do jogador
 */
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

  console.log(`Rating calculado para ${player.name}: ${currentRating} → ${newRating} (delta: ${delta}, phase: ${phase})`)

  return newRating
}

/**
 * Atualiza o histórico de fases, mantendo apenas as últimas 5
 */
function updatePhaseHistory(
  currentHistory: Array<{ date: string; phase: number; rating: number }>,
  newEntry: { date: string; phase: number; rating: number }
): Array<{ date: string; phase: number; rating: number }> {
  const history = [...currentHistory]
  
  // Adicionar nova entrada no início
  history.unshift({
    date: newEntry.date,
    phase: newEntry.phase,
    rating: newEntry.rating
  })

  // Manter apenas as últimas 5 entradas
  if (history.length > RATING_CONFIG.MAX_HISTORY) {
    history.splice(RATING_CONFIG.MAX_HISTORY)
  }

  return history
}