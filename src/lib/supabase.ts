
import { createClient } from '@supabase/supabase-js';
import { GameState } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key missing. Check your .env file.');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

export const saveGameState = async (state: GameState, userId: string = 'default-user') => {
  const { data, error } = await supabase
    .from('games')
    .upsert({ user_id: userId, data: state, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    
  if (error) {
    console.error('Error saving game state:', error);
    return null;
  }
  return data;
};

export const loadGameState = async (userId: string = 'default-user'): Promise<GameState | null> => {
  const { data, error } = await supabase
    .from('games')
    .select('data')
    .eq('user_id', userId)
    .maybeSingle();
    
  if (error) {
    console.error('Error loading game state:', error);
    return null;
  }
  return data?.data as GameState;
};
