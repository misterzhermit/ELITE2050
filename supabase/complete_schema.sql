-- ==========================================
-- SCHEMA COMPLETO DO BANCO DE DADOS ELITE 2050
-- ==========================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE JOGOS (PERSISTÊNCIA DE ESTADO DO USUÁRIO)
-- Esta tabela armazena o estado completo de cada "mundo" ou "save" do usuário.
CREATE TABLE IF NOT EXISTS games (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  world_id TEXT NOT NULL DEFAULT 'default',
  world_state JSONB NOT NULL DEFAULT '{}',
  teams_data JSONB NOT NULL DEFAULT '{}',
  players_data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, world_id)
);

-- RLS para Games
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seus próprios jogos"
  ON games FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios jogos"
  ON games FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios jogos"
  ON games FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios jogos"
  ON games FOR DELETE
  USING (auth.uid() = user_id);


-- 2. TABELA DE JOGADORES (DADOS GLOBAIS / MULTIPLAYER)
-- Usada pelas Edge Functions para progressão e ticks semanais.
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  nickname VARCHAR(255),
  district VARCHAR(32) NOT NULL,
  position VARCHAR(32) NOT NULL,
  team_id UUID, -- Referência opcional a uma tabela de times (se existir)
  current_rating INT NOT NULL DEFAULT 400,
  potential_rating INT NOT NULL DEFAULT 600,
  current_phase NUMERIC(4,2) NOT NULL DEFAULT 6.0,
  phase_history JSONB NOT NULL DEFAULT '[]',
  badge_tags JSONB NOT NULL DEFAULT '[]',
  
  -- Atributos do Pentágono
  for_attr INT NOT NULL DEFAULT 50,
  agi_attr INT NOT NULL DEFAULT 50,
  int_attr INT NOT NULL DEFAULT 50,
  tat_attr INT NOT NULL DEFAULT 50,
  tec_attr INT NOT NULL DEFAULT 50,
  
  -- Habilidades de Fusão (Calculadas)
  fusion_det INT NOT NULL DEFAULT 0,
  fusion_pas INT NOT NULL DEFAULT 0,
  fusion_dri INT NOT NULL DEFAULT 0,
  fusion_fin INT NOT NULL DEFAULT 0,
  fusion_mov INT NOT NULL DEFAULT 0,
  fusion_ref INT NOT NULL DEFAULT 0,
  fusion_def INT NOT NULL DEFAULT 0,
  fusion_pos INT NOT NULL DEFAULT 0,
  
  -- Estatísticas e Carreira
  contract_value NUMERIC(15,2) DEFAULT 0,
  goals INT DEFAULT 0,
  assists INT DEFAULT 0,
  games_played INT DEFAULT 0,
  satisfaction INT DEFAULT 70,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_players_team_id ON players (team_id);
CREATE INDEX IF NOT EXISTS idx_players_current_rating ON players (current_rating);

-- RLS para Players (Público para leitura, Service Role para escrita)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública de jogadores"
  ON players FOR SELECT
  USING (true);


-- 3. TABELA DE TEMPORADAS (SEASONS)
CREATE TABLE IF NOT EXISTS seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Garantir que apenas uma temporada possa estar ativa por vez
CREATE UNIQUE INDEX IF NOT EXISTS one_active_season ON seasons (is_active) WHERE is_active = true;


-- 4. TABELA DE ESTADO GLOBAL DO JOGO (GLOBAL GAME STATE)
CREATE TABLE IF NOT EXISTS global_game_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  current_season_id UUID REFERENCES seasons(id),
  current_game_date DATE NOT NULL,
  is_market_open BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Garantir que a tabela global_game_state tenha apenas uma linha
CREATE UNIQUE INDEX IF NOT EXISTS one_row_only ON global_game_state ((true));


-- 5. DADOS INICIAIS (OPCIONAL)
-- Inserir uma temporada inicial e o estado global se não existirem
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM seasons WHERE is_active = true) THEN
        INSERT INTO seasons (name, start_date, end_date, is_active) 
        VALUES ('Temporada 1 - Gênesis', '2050-01-01', '2050-12-31', true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM global_game_state) THEN
        INSERT INTO global_game_state (current_season_id, current_game_date, is_market_open) 
        VALUES ((SELECT id FROM seasons WHERE is_active = true LIMIT 1), '2050-01-01', true);
    END IF;
END $$;
