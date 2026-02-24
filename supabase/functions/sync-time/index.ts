// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Configuração do Supabase Client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  try {
    // 1. Buscar o estado atual do jogo
    const { data: gameState, error: gameStateError } = await supabase
      .from('global_game_state')
      .select('*')
      .single()

    if (gameStateError) throw gameStateError
    if (!gameState) throw new Error("Estado global do jogo não encontrado.")

    // 2. Buscar a temporada ativa atual
    const { data: activeSeason, error: seasonError } = await supabase
      .from('seasons')
      .select('*')
      .eq('is_active', true)
      .single()

    if (seasonError && seasonError.code !== 'PGRST116') { // PGRST116 = Nenhum resultado encontrado (pode não haver temporada ativa)
      throw seasonError
    }

    // 3. Adicionar +1 dia na data do jogo (current_game_date)
    const currentDate = new Date(gameState.current_game_date)
    currentDate.setDate(currentDate.getDate() + 1)
    const newGameDateStr = currentDate.toISOString().split('T')[0] // Formato YYYY-MM-DD

    let isMarketOpen = gameState.is_market_open
    let currentSeasonId = gameState.current_season_id

    // 4. Verificar se a temporada ativa terminou
    if (activeSeason) {
      const todayRealDate = new Date()
      const seasonEndDate = new Date(activeSeason.end_date)

      // Se a data real atual ultrapassou a data de término da temporada
      if (todayRealDate > seasonEndDate) {
        console.log(`Temporada ${activeSeason.name} encerrada.`)
        
        // Desativar a temporada atual
        await supabase
          .from('seasons')
          .update({ is_active: false })
          .eq('id', activeSeason.id)

        // Travar o mercado e remover o ID da temporada atual do estado global
        isMarketOpen = false
        currentSeasonId = null
      }
    }

    // 5. Atualizar o estado global do jogo
    const { error: updateError } = await supabase
      .from('global_game_state')
      .update({
        current_game_date: newGameDateStr,
        is_market_open: isMarketOpen,
        current_season_id: currentSeasonId,
        updated_at: new Date().toISOString()
      })
      .eq('id', gameState.id)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ 
        message: "Sincronização diária concluída com sucesso.",
        new_date: newGameDateStr,
        market_open: isMarketOpen
      }),
      { headers: { "Content-Type": "application/json" } },
    )
  } catch (error) {
    console.error("Erro na sincronização:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
})
