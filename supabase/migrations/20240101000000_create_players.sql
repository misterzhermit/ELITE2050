-- ============================================================
-- ELITE 2050 — Unified Players Table Schema
-- ============================================================
-- This migration consolidates the previous duplicate migrations:
--   - 20240101000000_create_players_table.sql
--   - 20240202000000_create_players.sql
-- into a single authoritative schema.

CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    nickname TEXT NOT NULL,
    district TEXT NOT NULL CHECK (district IN ('NORTE', 'SUL', 'LESTE', 'OESTE', 'EXILADO')),
    position TEXT NOT NULL CHECK (position IN ('Linha', 'Goleiro')),

    -- Rating System
    current_rating INTEGER NOT NULL DEFAULT 400 CHECK (current_rating >= 0 AND current_rating <= 1000),
    potential_rating INTEGER NOT NULL DEFAULT 600 CHECK (potential_rating >= 0 AND potential_rating <= 1000),
    current_phase NUMERIC(4,2) NOT NULL DEFAULT 6.0 CHECK (current_phase >= 0.0 AND current_phase <= 10.0),
    phase_history JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Badges & Pentagon (skills)
    badge_tags JSONB NOT NULL DEFAULT '[]',
    pentagon JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Pentagon Attributes (flattened for queries)
    for_attr INT NOT NULL DEFAULT 50,
    agi_attr INT NOT NULL DEFAULT 50,
    int_attr INT NOT NULL DEFAULT 50,
    tat_attr INT NOT NULL DEFAULT 50,
    tec_attr INT NOT NULL DEFAULT 50,

    -- Fusion Skills (derived)
    fusion_det INT NOT NULL DEFAULT 0,
    fusion_pas INT NOT NULL DEFAULT 0,
    fusion_dri INT NOT NULL DEFAULT 0,
    fusion_fin INT NOT NULL DEFAULT 0,
    fusion_mov INT NOT NULL DEFAULT 0,
    fusion_ref INT NOT NULL DEFAULT 0,
    fusion_def INT NOT NULL DEFAULT 0,
    fusion_pos INT NOT NULL DEFAULT 0,

    -- Contract & Team
    team_id UUID,
    contract_value INTEGER DEFAULT 0,

    -- Match Statistics
    goals INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    games_played INTEGER DEFAULT 0,

    -- Morale
    satisfaction INTEGER DEFAULT 50 CHECK (satisfaction >= 0 AND satisfaction <= 100),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_players_team_id ON players (team_id);
CREATE INDEX IF NOT EXISTS idx_players_current_rating ON players (current_rating);
CREATE INDEX IF NOT EXISTS idx_players_potential_rating ON players (potential_rating);
CREATE INDEX IF NOT EXISTS idx_players_district ON players (district);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_players_updated_at
    BEFORE UPDATE ON players
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Phase history validation (max 5 entries, cap rating at potential)
CREATE OR REPLACE FUNCTION validate_phase_history()
RETURNS TRIGGER AS $$
BEGIN
    IF jsonb_array_length(NEW.phase_history) > 5 THEN
        NEW.phase_history = (
            SELECT jsonb_agg(elem ORDER BY (elem->>'date')::timestamptz DESC LIMIT 5)
            FROM jsonb_array_elements(NEW.phase_history) AS elem
        );
    END IF;

    IF NEW.current_rating > NEW.potential_rating THEN
        NEW.current_rating = NEW.potential_rating;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_players_phase_history
    BEFORE INSERT OR UPDATE ON players
    FOR EACH ROW
    EXECUTE FUNCTION validate_phase_history();
