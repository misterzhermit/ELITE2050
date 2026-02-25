
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

  const { data, error } = await supabase
    .from('games')
    .upsert({ 
      user_id: user.id, 
      world_id: worldId,
      world_state: state.world,
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

export const loadGameState = async (worldId: string = 'default'): Promise<GameState | null> => {
  // Try to load by worldId. RLS will handle permission.
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('world_id', worldId)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') { // No rows found
      console.error('Error loading game state:', error);
    }
    return null;
  }

  return {
    world: data.world_state,
    worldId: data.world_id,
    teams: data.teams_data,
    players: data.players_data,
    managers: data.managers_data || {},
    userTeamId: data.user_team_id,
    userManagerId: data.user_manager_id,
    notifications: data.notifications || [],
    lastHeadline: data.last_headline,
    training: data.training_data || {
      chemistryBoostLastUsed: undefined,
      cardLaboratory: { slots: [] },
      individualFocus: { evolutionSlot: null, stabilizationSlot: null }
    }
  } as GameState;
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
