import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

type MatchPerformance = {
  player_id: string
  match_rating: number | null
  match_date: string
}

type TeamTotal = {
  team_id: string
  total_rating: number
}

type SectorInput = {
  averageAttribute: number
  chemistry: number
  phase: number
  stamina: number
  tacticalBonus: number
  chaosMax: number
}

type MatchTickResult = {
  tick: number
  outcome: 'goal' | 'defense' | 'turnover'
  probability: number
  attackPower: number
  defensePower: number
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

const applyChaos = (value: number, chaosMax: number) => {
  const chaos = Math.random() * chaosMax
  return value * (1 + chaos / 100)
}

// Tick de confronto entre setores com caos e probabilidade de desfecho
export const calculateMatchEvent = (
  tick: number,
  attack: SectorInput,
  defense: SectorInput
): MatchTickResult => {
  const baseAttack = attack.averageAttribute * attack.chemistry * attack.phase * attack.stamina * attack.tacticalBonus
  const baseDefense = defense.averageAttribute * defense.chemistry * defense.phase * defense.stamina * defense.tacticalBonus

  const attackPower = applyChaos(baseAttack, attack.chaosMax)
  const defensePower = applyChaos(baseDefense, defense.chaosMax)

  const ratio = attackPower / Math.max(1, defensePower)
  const goalProbability = clamp(0.08 + (ratio - 1) * 0.45, 0.02, 0.7)
  const defenseProbability = clamp(0.18 + (1 / ratio - 1) * 0.35, 0.05, 0.7)

  let outcome: 'goal' | 'defense' | 'turnover' = 'turnover'
  if (ratio >= 1.12) outcome = 'goal'
  else if (ratio <= 0.9) outcome = 'defense'
  else outcome = Math.random() < goalProbability ? 'goal' : Math.random() < defenseProbability ? 'defense' : 'turnover'

  return {
    tick,
    outcome,
    probability: outcome === 'goal' ? goalProbability : outcome === 'defense' ? defenseProbability : 1 - goalProbability - defenseProbability,
    attackPower,
    defensePower
  }
}

// Pós-jogo: evolução de rating e fase com inércia e teto genético
const calculateEvolution = (
  currentRating: number,
  potential: number,
  pentagon: { FOR: number; AGI: number; INT: number; TAT: number; TEC: number },
  lastPhases: number[],
  matchRating: number | null
) => {
  const played = matchRating !== null && matchRating > 0
  const effectiveRating = played ? matchRating : 0
  const phaseHistory = [effectiveRating, ...lastPhases].slice(0, 3)
  const newPhase = phaseHistory.reduce((sum, v) => sum + v, 0) / Math.max(1, phaseHistory.length)

  let inertia = 1
  if (currentRating > 850) inertia = 0.15
  else if (currentRating < 600) inertia = 1.5

  let delta = played ? (effectiveRating - 6) * 5 * inertia : -1.2 * inertia
  delta = Math.round(delta)

  const keys: Array<keyof typeof pentagon> = ['FOR', 'AGI', 'INT', 'TAT', 'TEC']
  const updatedPentagon = { ...pentagon }

  if (played && newPhase > 8) {
    for (let i = 0; i < 2; i++) {
      const key = keys[Math.floor(Math.random() * keys.length)]
      updatedPentagon[key] = clamp(updatedPentagon[key] + 1, 0, 100)
    }
  } else if (played && newPhase < 5) {
    for (let i = 0; i < 2; i++) {
      const key = keys[Math.floor(Math.random() * keys.length)]
      updatedPentagon[key] = clamp(updatedPentagon[key] - 1, 0, 100)
    }
  }

  let newRating = clamp(currentRating + delta, 0, Math.min(1000, potential))
  newRating = Math.min(1000, newRating)

  return { newRating, newPhase, updatedPentagon, delta }
}

// Recalcula fusões com base no pentágono e na posição
const recomputeFusions = (p: { FOR: number; AGI: number; INT: number; TAT: number; TEC: number }, isGoalkeeper: boolean) => {
  const base = {
    DET: p.FOR + p.INT,
    PAS: p.TAT + p.TEC
  }

  if (!isGoalkeeper) {
    return {
      fusion_det: base.DET,
      fusion_pas: base.PAS,
      fusion_dri: p.AGI + p.INT,
      fusion_fin: p.FOR + p.TEC,
      fusion_mov: p.AGI + p.TAT,
      fusion_ref: 0,
      fusion_def: 0,
      fusion_pos: 0
    }
  }

  return {
    fusion_det: base.DET,
    fusion_pas: base.PAS,
    fusion_dri: 0,
    fusion_fin: 0,
    fusion_mov: 0,
    fusion_ref: p.AGI + p.INT,
    fusion_def: p.FOR + p.TEC,
    fusion_pos: p.AGI + p.TAT
  }
}

// Edge Function semanal: atualiza rating, fase e atributos
Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Método não permitido' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

    const { match_performances, team_totals }: { match_performances: MatchPerformance[]; team_totals?: TeamTotal[] } = await req.json()
    if (!match_performances || !Array.isArray(match_performances)) {
      return new Response(JSON.stringify({ error: 'Payload inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const updatedPlayers: Array<{ id: string; old_rating: number; new_rating: number; delta: number; phase: number }> = []

    for (const performance of match_performances) {
      const { data: player, error } = await supabase
        .from('players')
        .select('*')
        .eq('id', performance.player_id)
        .single()

      if (error || !player) {
        continue
      }

      const lastPhases = (player.phase_history || []).map((entry) => entry.phase)
      const pentagon = {
        FOR: player.for_attr,
        AGI: player.agi_attr,
        INT: player.int_attr,
        TAT: player.tat_attr,
        TEC: player.tec_attr
      }

      const evolution = calculateEvolution(
        player.current_rating,
        player.potential_rating,
        pentagon,
        lastPhases,
        performance.match_rating
      )

      const phaseHistory = [
        {
          date: performance.match_date,
          phase: evolution.newPhase,
          rating: evolution.newRating,
          delta: evolution.delta
        },
        ...(player.phase_history || [])
      ].slice(0, 5)

      const fusions = recomputeFusions(evolution.updatedPentagon, player.position === 'Goleiro')

      await supabase
        .from('players')
        .update({
          current_rating: evolution.newRating,
          current_phase: evolution.newPhase,
          phase_history: phaseHistory,
          for_attr: evolution.updatedPentagon.FOR,
          agi_attr: evolution.updatedPentagon.AGI,
          int_attr: evolution.updatedPentagon.INT,
          tat_attr: evolution.updatedPentagon.TAT,
          tec_attr: evolution.updatedPentagon.TEC,
          ...fusions,
          updated_at: new Date().toISOString()
        })
        .eq('id', player.id)

      updatedPlayers.push({
        id: player.id,
        old_rating: player.current_rating,
        new_rating: evolution.newRating,
        delta: evolution.delta,
        phase: evolution.newPhase
      })
    }

    const floorTriggeredTeams = (team_totals || [])
      .filter((team) => team.total_rating < 6000)
      .map((team) => team.team_id)

    return new Response(
      JSON.stringify({
        success: true,
        updated_count: updatedPlayers.length,
        players: updatedPlayers,
        floor_triggered: floorTriggeredTeams
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
