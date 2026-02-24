// Tipos do Supabase para o Motor de Progressão
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
          current_rating: number
          potential_rating: number
          current_phase: number
          phase_history: Array<{
            date: string
            phase: number
            rating: number
          }>
          badges: string[]
          pentagon: {
            FOR: number
            AGI: number
            INT: number
            TAT: number
            TEC: number
          }
          team_id: string | null
          contract_value: number
          goals: number
          assists: number
          games_played: number
          satisfaction: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          nickname: string
          district: string
          position: string
          current_rating: number
          potential_rating: number
          current_phase: number
          phase_history?: Array<{
            date: string
            phase: number
            rating: number
          }>
          badges?: string[]
          pentagon: {
            FOR: number
            AGI: number
            INT: number
            TAT: number
            TEC: number
          }
          team_id?: string | null
          contract_value?: number
          goals?: number
          assists?: number
          games_played?: number
          satisfaction?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          nickname?: string
          district?: string
          position?: string
          current_rating?: number
          potential_rating?: number
          current_phase?: number
          phase_history?: Array<{
            date: string
            phase: number
            rating: number
          }>
          badges?: string[]
          pentagon?: {
            FOR: number
            AGI: number
            INT: number
            TAT: number
            TEC: number
          }
          team_id?: string | null
          contract_value?: number
          goals?: number
          assists?: number
          games_played?: number
          satisfaction?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}