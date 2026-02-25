import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { Database } from './database.types.ts'

type MatchPerformance = {
  player_id: string
  phase: number // nota da partida (0.0 a 10.0)
  match_date: string
}

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

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

/**
 * Calcula a evolução do pentágono baseada no desempenho
 */
function updatePentagon(
  pentagon: { FOR: number; AGI: number; INT: number; TAT: number; TEC: number },
  phase: number
) {
  const updated = { ...pentagon }
  const keys: Array<keyof typeof pentagon> = ['FOR', 'AGI', 'INT', 'TAT', 'TEC']
  
  if (phase > 8.0) {
    // Evolução excelente: +1 em 2 atributos aleatórios
    for (let i = 0; i < 2; i++) {
      const key = keys[Math.floor(Math.random() * keys.length)]
      updated[key] = clamp(updated[key] + 1, 0, 100)
    }
  } else if (phase < 4.5) {
    // Desempenho muito ruim: -1 em 1 atributo aleatório
    const key = keys[Math.floor(Math.random() * keys.length)]
    updated[key] = clamp(updated[key] - 1, 0, 100)
  }
  
  return updated
}

/**
 * Recalcula as fusões baseadas no pentágono e posição
 */
function calculateFusions(p: { FOR: number; AGI: number; INT: number; TAT: number; TEC: number }, position: string) {
  const isGK = position === 'Goleiro'
  
  const base = {
    fusion_det: p.FOR + p.INT,
    fusion_pas: p.TAT + p.TEC,
    fusion_dri: isGK ? 0 : p.AGI + p.INT,
    fusion_fin: isGK ? 0 : p.FOR + p.TEC,
    fusion_mov: isGK ? 0 : p.AGI + p.TAT,
    fusion_ref: isGK ? p.AGI + p.INT : 0,
    fusion_def: isGK ? p.FOR + p.TEC : 0,
    fusion_pos: isGK ? p.AGI + p.TAT : 0,
  }

  return base
}

/**
 * Calcula o novo rating baseado na performance e características
 */
function calculateEvolution(player: any, performance: MatchPerformance) {
  const currentRating = player.current_rating
  const potentialRating = player.potential_rating
  const phase = performance.phase
  const badges = player.badge_tags || []

  // 1. Delta base
  const baseDelta = (phase - RATING_CONFIG.BASE_EQUILIBRIUM) * RATING_CONFIG.BASE_MULTIPLIER

  // 2. Volatilidade
  let volatility = RATING_CONFIG.VOLATILITY_MULTIPLIERS.MEDIUM
  if (currentRating < RATING_CONFIG.VOLATILITY_THRESHOLDS.LOW) volatility = RATING_CONFIG.VOLATILITY_MULTIPLIERS.LOW
  else if (currentRating > RATING_CONFIG.VOLATILITY_THRESHOLDS.HIGH) volatility = RATING_CONFIG.VOLATILITY_MULTIPLIERS.HIGH

  let delta = baseDelta * volatility

  // 3. Próximo do teto
  if (potentialRating - currentRating < RATING_CONFIG.POTENTIAL_THRESHOLD && delta > 0) {
    delta *= RATING_CONFIG.POTENTIAL_REDUCTION
  }

  // 4. Badges
  for (const badge of badges) {
    const effect = BADGE_EFFECTS[badge as keyof typeof BADGE_EFFECTS]
    if (effect) delta = effect(delta)
  }

  const finalDelta = Math.round(delta)
  const newRating = clamp(currentRating + finalDelta, 0, potentialRating)

  // 5. Pentágono e Fusões
  const currentPentagon = {
    FOR: player.for_attr,
    AGI: player.agi_attr,
    INT: player.int_attr,
    TAT: player.tat_attr,
    TEC: player.tec_attr
  }
  const updatedPentagon = updatePentagon(currentPentagon, phase)
  const fusions = calculateFusions(updatedPentagon, player.position)

  return {
    newRating,
    delta: finalDelta,
    updatedPentagon,
    fusions
  }
}

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Método não permitido' }), { status: 405 })
    }

    const { match_performances }: { match_performances: MatchPerformance[] } = await req.json()
    if (!match_performances || !Array.isArray(match_performances)) {
      return new Response(JSON.stringify({ error: 'Dados inválidos' }), { status: 400 })
    }

    const updatedPlayers = []

    for (const performance of match_performances) {
      const { data: player, error: fetchError } = await supabase
        .from('players')
        .select('*')
        .eq('id', performance.player_id)
        .single()

      if (fetchError || !player) continue

      const evolution = calculateEvolution(player, performance)

      const newHistory = [
        {
          date: performance.match_date,
          phase: performance.phase,
          rating: evolution.newRating,
          delta: evolution.delta
        },
        ...(player.phase_history || [])
      ].slice(0, RATING_CONFIG.MAX_HISTORY)

      const { error: updateError } = await supabase
        .from('players')
        .update({
          current_rating: evolution.newRating,
          current_phase: performance.phase,
          phase_history: newHistory,
          for_attr: evolution.updatedPentagon.FOR,
          agi_attr: evolution.updatedPentagon.AGI,
          int_attr: evolution.updatedPentagon.INT,
          tat_attr: evolution.updatedPentagon.TAT,
          tec_attr: evolution.updatedPentagon.TEC,
          ...evolution.fusions,
          updated_at: new Date().toISOString()
        })
        .eq('id', player.id)

      if (!updateError) {
        updatedPlayers.push({
          id: player.id,
          name: player.name,
          old_rating: player.current_rating,
          new_rating: evolution.newRating,
          delta: evolution.delta
        })
      }
    }

    return new Response(JSON.stringify({ success: true, updated_count: updatedPlayers.length, players: updatedPlayers }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
