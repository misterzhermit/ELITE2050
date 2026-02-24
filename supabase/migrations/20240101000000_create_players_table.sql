-- Tabela de jogadores com sistema de Rating dinâmico
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    nickname TEXT NOT NULL,
    district TEXT NOT NULL CHECK (district IN ('NORTE', 'SUL', 'LESTE', 'OESTE', 'EXILADO')),
    position TEXT NOT NULL CHECK (position IN ('Linha', 'Goleiro')),
    
    -- Sistema de Rating (Economia do Jogo)
    current_rating INTEGER NOT NULL CHECK (current_rating >= 0 AND current_rating <= 1000),
    potential_rating INTEGER NOT NULL CHECK (potential_rating >= 0 AND potential_rating <= 1000),
    current_phase NUMERIC(2,1) NOT NULL CHECK (current_phase >= 0.0 AND current_phase <= 10.0),
    
    -- Histórico de fases (últimas 5 notas)
    phase_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Badges que afetam o cálculo
    badges TEXT[] DEFAULT '{}',
    
    -- Dados do pentágono (habilidades)
    pentagon JSONB NOT NULL,
    
    -- Contrato e time
    team_id UUID REFERENCES teams(id),
    contract_value INTEGER DEFAULT 0,
    
    -- Estatísticas
    goals INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    games_played INTEGER DEFAULT 0,
    
    -- Satisfação e moral
    satisfaction INTEGER DEFAULT 50 CHECK (satisfaction >= 0 AND satisfaction <= 100),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Índices para performance
    INDEX idx_current_rating (current_rating),
    INDEX idx_potential_rating (potential_rating),
    INDEX idx_team_id (team_id),
    INDEX idx_district (district)
);

-- Função para atualizar o timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_players_updated_at 
    BEFORE UPDATE ON players 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Função para validar e manter o histórico de fases (máximo 5 notas)
CREATE OR REPLACE FUNCTION validate_phase_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Garante que o histórico tem no máximo 5 elementos
    IF jsonb_array_length(NEW.phase_history) > 5 THEN
        NEW.phase_history = (
            SELECT jsonb_agg(elem ORDER BY (elem->>'date')::timestamptz DESC LIMIT 5)
            FROM jsonb_array_elements(NEW.phase_history) AS elem
        );
    END IF;
    
    -- Garante que current_rating nunca ultrapassa potential_rating
    IF NEW.current_rating > NEW.potential_rating THEN
        NEW.current_rating = NEW.potential_rating;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar histórico de fases
CREATE TRIGGER validate_players_phase_history
    BEFORE INSERT OR UPDATE ON players
    FOR EACH ROW
    EXECUTE FUNCTION validate_phase_history();