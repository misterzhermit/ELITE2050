import React, { createContext, useContext, useReducer, useEffect, ReactNode, useMemo, useCallback, useState } from 'react';
import { GameState } from '../types';
import { generateInitialState } from '../engine/generator';
import { saveGameState, loadGameState, listUserWorlds, listPublicWorlds, supabase } from '../lib/supabase';
import { DEFAULT_TIME_SPEED } from '../constants/gameConstants';
import { advanceGameDay, simulateAndRecordMatch } from '../engine/gameLogic';
import { getMatchStatus } from '../utils/matchUtils';

interface GameStateValue {
  state: GameState;
  isSyncing: boolean;
  isOnline: boolean;
  isAuthenticated: boolean;
  userId: string | null;
  worldId: string | null;
  worlds: Array<{ id: string, name: string, updatedAt: string, userId: string }>;
  publicWorlds: Array<{ id: string, name: string, updatedAt: string, userId: string }>;
  toasts: Array<{ id: string, message: string, type: 'success' | 'error' | 'info' }>;
  isPaused: boolean;
  timeSpeed: number;
}

interface GameDispatchValue {
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  saveGame: (newState?: GameState) => Promise<void>;
  loadGame: (worldId?: string) => Promise<void>;
  setIsAuthenticated: (val: boolean) => void;
  setWorldId: (id: string | null) => void;
  refreshWorlds: () => Promise<void>;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  togglePause: () => void;
  setTimeSpeed: (speed: number) => void;
}

type GameContextType = GameStateValue & GameDispatchValue;

type GameAction =
  | { type: 'SET_STATE'; payload: GameState | ((prev: GameState) => GameState) }
  | { type: 'RESET_STATE' };

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_STATE':
      return typeof action.payload === 'function' ? action.payload(state) : action.payload;
    case 'RESET_STATE':
      return generateInitialState();
    default:
      return state;
  }
}

const GameStateContext = createContext<GameStateValue | undefined>(undefined);
const GameDispatchContext = createContext<GameDispatchValue | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, generateInitialState());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [worldId, setWorldId] = useState<string | null>(null);
  const [worlds, setWorlds] = useState<Array<{ id: string, name: string, updatedAt: string, userId: string }>>([]);
  const [publicWorlds, setPublicWorlds] = useState<Array<{ id: string, name: string, updatedAt: string, userId: string }>>([]);
  const [toasts, setToasts] = useState<Array<{ id: string, message: string, type: 'success' | 'error' | 'info' }>>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [timeSpeed, setTimeSpeed] = useState(DEFAULT_TIME_SPEED);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const setState = useCallback((payload: GameState | ((prev: GameState) => GameState)) => {
    dispatch({ type: 'SET_STATE', payload });
  }, []);

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
        dispatch({ type: 'RESET_STATE' });
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

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const saveGame = useCallback(async (newState?: GameState) => {
    if (!worldId) return;
    setIsSyncing(true);
    try {
      await saveGameState(newState || state, worldId);
      console.log('Game saved successfully');
      setIsOnline(true);
      // Only show toast if it's a manual save or a major event
      if (newState) addToast('Jogo salvo automaticamente', 'success');
    } catch (error) {
      console.error('Failed to save game', error);
      setIsOnline(false);
      addToast('Erro ao salvar progresso', 'error');
    } finally {
      setIsSyncing(false);
    }
  }, [worldId, state, addToast]);

  const loadGame = useCallback(async (targetWorldId?: string) => {
    const idToLoad = targetWorldId || worldId;
    if (!idToLoad) return;

    setIsSyncing(true);
    try {
      const loadedState = await loadGameState(idToLoad);
      if (loadedState) {
        // Migration for legacy saves missing training state
        if (!loadedState.training) {
          loadedState.training = {
            chemistryBoostLastUsed: undefined,
            cardLaboratory: {
              slots: [
                { cardId: null, finishTime: null },
                { cardId: null, finishTime: null }
              ]
            },
            individualFocus: {
              evolutionSlot: null,
              stabilizationSlot: null
            }
          };
        }
        setIsInitialLoad(true);
        setState(loadedState);
        setWorldId(idToLoad);
        console.log('Game loaded successfully');
        setIsOnline(true);
        addToast('Mundo carregado com sucesso', 'success');
      }
    } catch (error) {
      console.error('Failed to load game', error);
      setIsOnline(false);
      addToast('Erro ao carregar mundo', 'error');
    } finally {
      setIsSyncing(false);
      // Small delay to prevent immediate auto-save on load
      setTimeout(() => setIsInitialLoad(false), 1000);
    }
  }, [worldId, setState, addToast]);

  // Auto-save logic
  useEffect(() => {
    if (isInitialLoad || !worldId) return;

    const timer = setTimeout(() => {
      saveGame();
    }, 5000); // 5s debounce

    return () => clearTimeout(timer);
  }, [state, worldId, isInitialLoad, saveGame]);

  // Real-time Clock Logic
  useEffect(() => {
    if (isPaused || isInitialLoad || !worldId) return;

    const interval = setInterval(() => {
      setState(prev => {
        const currentDate = new Date(prev.world.currentDate);
        const oldDay = currentDate.getDate();

        // Add time based on speed
        currentDate.setMinutes(currentDate.getMinutes() + timeSpeed);

        const newDay = currentDate.getDate();
        let newState = {
          ...prev,
          world: {
            ...prev.world,
            currentDate: currentDate.toISOString()
          }
        };

        // --- Auto-Simulation of Finished matches ---
        // Check all active leagues for matches that just finished but weren't simulated
        let matchSimulated = false;
        Object.keys(newState.world.leagues).forEach(leagueKey => {
          const league = newState.world.leagues[leagueKey];
          league.matches.forEach(match => {
            if (match.status !== 'FINISHED' && !match.played) {
              const status = getMatchStatus(match, newState.world.currentDate);
              if (status === 'FINISHED') {
                console.log(`Clock: Match ${match.id} finished logically, simulating...`);
                simulateAndRecordMatch(newState, match, league.standings);
                match.status = 'FINISHED';
                match.played = true;
                matchSimulated = true;
              }
            }
          });
        });

        if (matchSimulated) {
          console.log('Clock: Some matches were simulated automatically.');
        }

        // --- Day Change Logic ---
        if (oldDay !== newDay) {
          console.log('Clock: Day changed, running daily advance...');
          return advanceGameDay(newState, true);
        }

        return newState;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, isInitialLoad, worldId, timeSpeed, setState]);

  const togglePause = useCallback(() => setIsPaused(prev => !prev), []);

  const stateValue = useMemo(() => ({
    state, isSyncing, isOnline, isAuthenticated, userId, worldId, worlds, publicWorlds, toasts, isPaused, timeSpeed
  }), [state, isSyncing, isOnline, isAuthenticated, userId, worldId, worlds, publicWorlds, toasts, isPaused, timeSpeed]);

  const dispatchValue = useMemo(() => ({
    setState, saveGame, loadGame, setIsAuthenticated, setWorldId, refreshWorlds, addToast, removeToast, togglePause, setTimeSpeed
  }), [setState, saveGame, loadGame, setIsAuthenticated, setWorldId, refreshWorlds, addToast, removeToast, togglePause, setTimeSpeed]);

  return (
    <GameDispatchContext.Provider value={dispatchValue}>
      <GameStateContext.Provider value={stateValue}>
        {children}
      </GameStateContext.Provider>
    </GameDispatchContext.Provider>
  );
};

export const useGameState = () => {
  const context = useContext(GameStateContext);
  if (!context) throw new Error('useGameState must be used within a GameProvider');
  return context;
};

export const useGameDispatch = () => {
  const context = useContext(GameDispatchContext);
  if (!context) throw new Error('useGameDispatch must be used within a GameProvider');
  return context;
};

// Legacy hook for compatibility
export const useGame = (): GameContextType => {
  const stateCtx = useContext(GameStateContext);
  const dispatchCtx = useContext(GameDispatchContext);
  if (!stateCtx || !dispatchCtx) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return { ...stateCtx, ...dispatchCtx };
};
