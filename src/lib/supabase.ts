
import { createClient } from '@supabase/supabase-js';
import { GameState } from '../types';

// Supabase configuration - Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY 
// are set in your Vercel Environment Variables.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key missing. The app requires a valid connection to function.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export const saveGameState = async (state: GameState, worldId: string = 'default') => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const isCreator = state.isCreator === true;

  const { data, error } = await supabase
    .from('games')
    .upsert({
      user_id: user.id,
      world_id: worldId,
      world_state: isCreator ? state.world : undefined, // Only creator updates master world state
      teams_data: state.teams,
      players_data: state.players,
      managers_data: state.managers,
      user_team_id: state.userTeamId,
      user_manager_id: state.userManagerId,
      notifications: state.notifications,
      last_headline: state.lastHeadline,
      training_data: state.training,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,world_id' });

  if (error) {
    console.error('Error saving game state:', error);
    return null;
  }
  return data;
};

export const joinSharedWorld = async (worldId: string): Promise<GameState | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 1. Fetch the master world state (from the creator)
  const { data: masterGame, error: masterError } = await supabase
    .from('games')
    .select('*')
    .eq('world_id', worldId)
    .order('updated_at', { ascending: true }) // First record is likely the creator
    .limit(1)
    .single();

  if (masterError || !masterGame) {
    console.error('Error fetching master world state:', masterError);
    return null;
  }

  // 2. Build a GameState based on master world but for the joining user
  const gameState: GameState = {
    world: masterGame.world_state as any,
    worldId: worldId,
    isCreator: false,
    teams: masterGame.teams_data as any,
    players: masterGame.players_data as any,
    managers: masterGame.managers_data || {},
    userTeamId: null, // Joining user hasn't picked a team yet
    userManagerId: null,
    notifications: [],
    training: {
      cardLaboratory: { slots: [{ cardId: null, finishTime: null }, { cardId: null, finishTime: null }] },
      individualFocus: { evolutionSlot: null, stabilizationSlot: null },
      playstyleTraining: { currentStyle: null, understanding: {} }
    }
  };

  // 3. Persist the joining user's record in Supabase
  const { error: joinError } = await supabase
    .from('games')
    .upsert({
      user_id: user.id,
      world_id: worldId,
      world_state: masterGame.world_state, // Copy master world state
      teams_data: masterGame.teams_data,
      players_data: masterGame.players_data,
      managers_data: masterGame.managers_data || {},
      user_team_id: null,
      user_manager_id: null,
      notifications: [],
      last_headline: {},
      training_data: gameState.training,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,world_id' });

  if (joinError) {
    console.error('Error persisting join record:', joinError);
    // Still return state so user can play locally even if persist fails
  }

  return gameState;
};

export const loadGameState = async (worldId: string = 'default'): Promise<GameState | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 1. Fetch ALL records for this world_id to reconstruct shared state
  const { data: allWorldRecords, error: worldError } = await supabase
    .from('games')
    .select('*')
    .eq('world_id', worldId)
    .order('updated_at', { ascending: true });

  if (worldError || !allWorldRecords || allWorldRecords.length === 0) {
    console.error('Error fetching world records:', worldError);
    return null;
  }

  // 2. The first record (oldest) is the "Master" (Creator)
  const masterRecord = allWorldRecords[0];
  const userRecord = allWorldRecords.find(r => r.user_id === user.id);

  if (!userRecord) return null; // Should not happen if loadGameState is called correctly

  const isCreator = masterRecord.user_id === user.id;

  // 3. Reconstruct State: Start with master data, then merge human player updates
  const mergedTeams = { ...(masterRecord.teams_data as any) };
  const mergedPlayers = { ...(masterRecord.players_data as any) };
  const mergedManagers = { ...(masterRecord.managers_data as any) };

  allWorldRecords.forEach(record => {
    // We only merge data from other players (not the master itself, which is already the base)
    if (record.user_id === masterRecord.user_id) return;

    // Merge Team updates (Tactics, Lineup, etc.)
    const recordUserTeamId = record.user_team_id;
    if (recordUserTeamId && record.teams_data && (record.teams_data as any)[recordUserTeamId]) {
      mergedTeams[recordUserTeamId] = (record.teams_data as any)[recordUserTeamId];
    }

    // Merge Player updates (Individual Focus, Transfers, etc.)
    // We look for players that belong to this user's team or have been modified
    if (record.players_data) {
      const recordPlayers = record.players_data as any;
      Object.keys(recordPlayers).forEach(playerId => {
        const p = recordPlayers[playerId];
        const masterP = mergedPlayers[playerId];

        if (!masterP) {
          mergedPlayers[playerId] = p;
          return;
        }

        // If the player's team changed (transfer) or they have more training/different rating
        // we take the version from the user who "owns" or modified them.
        const teamChanged = p.contract?.teamId !== masterP.contract?.teamId;
        const statsChanged = p.totalRating !== masterP.totalRating || p.trainingProgress !== masterP.trainingProgress;

        if (teamChanged || statsChanged) {
          // Simple rule: if it's different and newer (implied by loop order), we take it
          mergedPlayers[playerId] = p;
        }
      });
    }

    // Merge Manager updates
    const recordUserManagerId = record.user_manager_id;
    if (recordUserManagerId && record.managers_data && (record.managers_data as any)[recordUserManagerId]) {
      mergedManagers[recordUserManagerId] = (record.managers_data as any)[recordUserManagerId];
    }
  });

  const gameState: GameState = {
    world: masterRecord.world_state as any, // Always use master world clock/results
    worldId: masterRecord.world_id,
    isCreator,
    teams: mergedTeams,
    players: mergedPlayers,
    managers: mergedManagers,
    userTeamId: userRecord.user_team_id,
    userManagerId: userRecord.user_manager_id,
    notifications: userRecord.notifications || [],
    lastHeadline: userRecord.last_headline,
    training: userRecord.training_data || {
      chemistryBoostLastUsed: undefined,
      cardLaboratory: { slots: [] },
      individualFocus: { evolutionSlot: null, stabilizationSlot: null },
      playstyleTraining: { currentStyle: null, understanding: {} }
    }
  };
  return gameState;
};

export const listUserWorlds = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('games')
    .select('world_id, updated_at, world_state, user_id')
    .eq('user_id', user.id);

  if (error) {
    console.error('Error listing worlds:', error);
    return [];
  }

  return data.map(d => ({
    id: d.world_id,
    updatedAt: d.updated_at,
    userId: d.user_id,
    name: (d.world_state as any).name || `Mundo ${d.world_id}`
  }));
};

export const deleteWorld = async (worldId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('games')
    .delete()
    .eq('user_id', user.id)
    .eq('world_id', worldId);

  if (error) {
    console.error('Error deleting world:', error);
    return false;
  }
  return true;
};

export const listPublicWorlds = async () => {
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch all worlds except the user's own (to show as "Community" worlds)
  let query = supabase
    .from('games')
    .select('world_id, updated_at, world_state, user_id')
    .order('updated_at', { ascending: false })
    .limit(10);

  if (user) {
    query = query.neq('user_id', user.id);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error listing public worlds:', error);
    return [];
  }

  return data.map(d => ({
    id: d.world_id,
    updatedAt: d.updated_at,
    userId: d.user_id,
    name: (d.world_state as any).name || `Mundo ${d.world_id}`
  }));
};
