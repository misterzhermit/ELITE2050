import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GameState } from '../types';
import { generateInitialState } from '../engine/generator';
import { saveGameState, loadGameState, listUserWorlds, listPublicWorlds, supabase } from '../lib/supabase';

interface GameContextType {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  saveGame: (newState?: GameState) => Promise<void>;
  loadGame: (worldId?: string) => Promise<void>;
  isSyncing: boolean;
  isOnline: boolean;
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
  userId: string | null;
  worldId: string | null;
  setWorldId: (id: string | null) => void;
  worlds: Array<{ id: string, name: string, updatedAt: string, userId: string }>;
  publicWorlds: Array<{ id: string, name: string, updatedAt: string, userId: string }>;
  refreshWorlds: () => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GameState>(generateInitialState());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [worldId, setWorldId] = useState<string | null>(null);
  const [worlds, setWorlds] = useState<Array<{ id: string, name: string, updatedAt: string, userId: string }>>([]);
  const [publicWorlds, setPublicWorlds] = useState<Array<{ id: string, name: string, updatedAt: string, userId: string }>>([]);

  // Listen for auth changes
  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      console.warn('Supabase not configured. Auth skipped.');
      setIsAuthenticated(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      const hasSession = !!session;
      setIsAuthenticated(hasSession);
      setUserId(session?.user.id || null);
      if (hasSession) {
        refreshWorlds();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const hasSession = !!session;
      setIsAuthenticated(hasSession);
      setUserId(session?.user.id || null);
      if (hasSession) {
        refreshWorlds();
      } else {
        setWorldId(null);
        setWorlds([]);
        setState(generateInitialState());
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshWorlds = async () => {
    const [userWorlds, otherWorlds] = await Promise.all([
      listUserWorlds(),
      listPublicWorlds()
    ]);
    setWorlds(userWorlds);
    setPublicWorlds(otherWorlds);
  };

  const saveGame = async (newState?: GameState) => {
    if (!worldId) return;
    setIsSyncing(true);
    try {
      await saveGameState(newState || state, worldId);
      console.log('Game saved successfully');
      setIsOnline(true);
    } catch (error) {
      console.error('Failed to save game', error);
      setIsOnline(false);
    } finally {
      setIsSyncing(false);
    }
  };

  const loadGame = async (targetWorldId?: string) => {
    const idToLoad = targetWorldId || worldId;
    if (!idToLoad) return;
    
    setIsSyncing(true);
    try {
      const loadedState = await loadGameState(idToLoad);
      if (loadedState) {
        setState(loadedState);
        setWorldId(idToLoad);
        console.log('Game loaded successfully');
        setIsOnline(true);
      }
    } catch (error) {
      console.error('Failed to load game', error);
      setIsOnline(false);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <GameContext.Provider value={{ 
      state, 
      setState, 
      saveGame, 
      loadGame, 
      isSyncing, 
      isOnline, 
      isAuthenticated, 
      setIsAuthenticated, 
      userId,
      worldId,
      setWorldId,
      worlds,
      publicWorlds,
      refreshWorlds
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
