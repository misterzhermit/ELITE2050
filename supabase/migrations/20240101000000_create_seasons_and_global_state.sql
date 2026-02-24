-- Tabela de Temporadas (Seasons)
CREATE TABLE seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Garantir que apenas uma temporada possa estar ativa por vez
CREATE UNIQUE INDEX one_active_season ON seasons (is_active) WHERE is_active = true;

-- Tabela de Estado Global do Jogo (Global Game State)
-- Esta tabela deve conter apenas uma linha.
CREATE TABLE global_game_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  current_season_id UUID REFERENCES seasons(id),
  current_game_date DATE NOT NULL,
  is_market_open BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Garantir que a tabela global_game_state tenha apenas uma linha
CREATE UNIQUE INDEX one_row_only ON global_game_state ((true));

-- Inserir dados iniciais (Exemplo)
-- INSERT INTO seasons (name, start_date, end_date, is_active) VALUES ('Temporada 1 - Gênesis', '2050-01-01', '2050-12-31', true);
-- INSERT INTO global_game_state (current_season_id, current_game_date, is_market_open) VALUES ((SELECT id FROM seasons WHERE is_active = true), '2050-01-01', true);
