-- Atualização do Schema para Suporte ao Novo Motor de Jogo e Táticas
-- Data: 2025-02-25

-- 1. Atualizar a tabela de players com novos campos do motor de jogo
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS training_progress INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS appearance JSONB DEFAULT '{"gender": "M", "bodyId": 1, "hairId": 1, "bootId": 1}',
ADD COLUMN IF NOT EXISTS role VARCHAR(32) DEFAULT 'MEI',
ADD COLUMN IF NOT EXISTS badges JSONB DEFAULT '{"slot1": null, "slot2": null, "slot3": null}';

-- 2. Criar tabela de Times (Teams) para estruturar melhor as táticas e dados
-- Isso permite consultas mais eficientes que o JSONB dentro de games
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    city VARCHAR(255),
    district VARCHAR(32),
    league VARCHAR(32),
    
    -- Aparência
    colors JSONB NOT NULL DEFAULT '{"primary": "#000000", "secondary": "#ffffff"}',
    logo JSONB NOT NULL DEFAULT '{"primary": "#000000", "secondary": "#ffffff", "patternId": "solid", "symbolId": "shield"}',
    
    -- Gestão
    finances JSONB DEFAULT '{"transferBudget": 0, "sponsorshipQuota": 0, "stadiumLevel": 1, "emergencyCredit": 0}',
    manager_id UUID, -- Pode referenciar uma tabela managers futura
    chemistry INT DEFAULT 50,
    
    -- Táticas (O ponto principal da mudança)
    tactics JSONB NOT NULL DEFAULT '{
        "playStyle": "Equilibrado",
        "mentality": "Calculista",
        "linePosition": 50,
        "aggressiveness": 50,
        "slots": [null, null, null],
        "preferredFormation": "4-4-2"
    }',
    
    inventory JSONB DEFAULT '[]', -- Cartas táticas disponíveis
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index para performance
CREATE INDEX IF NOT EXISTS idx_teams_district ON teams (district);
CREATE INDEX IF NOT EXISTS idx_teams_league ON teams (league);

-- 3. Função para atualizar o timestamp automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists to avoid errors on re-run
DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. RLS (Row Level Security) para Teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist to avoid "policy already exists" error
DROP POLICY IF EXISTS "Leitura pública de times" ON teams;
DROP POLICY IF EXISTS "Autenticados podem criar times" ON teams;
DROP POLICY IF EXISTS "Donos ou admins podem atualizar times" ON teams;

CREATE POLICY "Leitura pública de times"
    ON teams FOR SELECT
    USING (true);

-- Política de escrita pode variar dependendo se é single-player ou multi
-- Por enquanto, permitimos autenticados (ou ajuste conforme necessidade)
CREATE POLICY "Autenticados podem criar times"
    ON teams FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Donos ou admins podem atualizar times"
    ON teams FOR UPDATE
    USING (auth.role() = 'authenticated'); -- Simplificado para dev