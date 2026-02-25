import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Tipos do Supabase para o Motor de Progressão Unificado
export interface Database {
  public: {
    Tables: {
      players: {
        Row: {
          id: string
          name: string
          nickname: string
          district: string
          position: string
          team_id: string | null
          current_rating: number
          potential_rating: number
          current_phase: number
          phase_history: Array<{ 
            date: string
            phase: number
            rating: number
            delta: number 
          }>
          badge_tags: string[]
          for_attr: number
          agi_attr: number
          int_attr: number
          tat_attr: number
          tec_attr: number
          fusion_det: number
          fusion_pas: number
          fusion_dri: number
          fusion_fin: number
          fusion_mov: number
          fusion_ref: number
          fusion_def: number
          fusion_pos: number
          updated_at: string
        }
        Update: {
          current_rating?: number
          current_phase?: number
          phase_history?: Array<{ 
            date: string
            phase: number
            rating: number
            delta: number 
          }>
          for_attr?: number
          agi_attr?: number
          int_attr?: number
          tat_attr?: number
          tec_attr?: number
          fusion_det?: number
          fusion_pas?: number
          fusion_dri?: number
          fusion_fin?: number
          fusion_mov?: number
          fusion_ref?: number
          fusion_def?: number
          fusion_pos?: number
          updated_at?: string
        }
      }
    }
  }
}
