
-- Enable public read for games to allow finding other worlds
-- This policy allows any authenticated user to SELECT any game row.
-- This is necessary for "Multiplayer" features where users can find/join/view other worlds.

DROP POLICY IF EXISTS "Leitura pública de jogos" ON games;

CREATE POLICY "Leitura pública de jogos"
ON games
FOR SELECT
TO authenticated
USING (true);

-- Ensure RLS is enabled
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
