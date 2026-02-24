CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  nickname VARCHAR(255),
  district VARCHAR(32) NOT NULL,
  position VARCHAR(32) NOT NULL,
  team_id UUID,
  current_rating INT NOT NULL DEFAULT 400,
  potential_rating INT NOT NULL DEFAULT 600,
  current_phase NUMERIC(4,2) NOT NULL DEFAULT 6.0,
  phase_history JSONB NOT NULL DEFAULT '[]',
  badge_tags JSONB NOT NULL DEFAULT '[]',
  for_attr INT NOT NULL DEFAULT 50,
  agi_attr INT NOT NULL DEFAULT 50,
  int_attr INT NOT NULL DEFAULT 50,
  tat_attr INT NOT NULL DEFAULT 50,
  tec_attr INT NOT NULL DEFAULT 50,
  fusion_det INT NOT NULL DEFAULT 0,
  fusion_pas INT NOT NULL DEFAULT 0,
  fusion_dri INT NOT NULL DEFAULT 0,
  fusion_fin INT NOT NULL DEFAULT 0,
  fusion_mov INT NOT NULL DEFAULT 0,
  fusion_ref INT NOT NULL DEFAULT 0,
  fusion_def INT NOT NULL DEFAULT 0,
  fusion_pos INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_players_team_id ON players (team_id);
CREATE INDEX IF NOT EXISTS idx_players_current_rating ON players (current_rating);
