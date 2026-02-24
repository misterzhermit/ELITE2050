import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GameState } from '../types';
import { generateInitialState } from '../engine/generator';
import { saveGameState, loadGameState } from '../lib/supabase';

interface GameContextType {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  saveGame: (newState?: GameState) => Promise<void>;
  loadGame: () => Promise<void>;
  isSyncing: boolean;
  isOnline: boolean;
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GameState>(generateInitialState());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const saveGame = async (newState?: GameState) => {
    setIsSyncing(true);
    try {
      await saveGameState(newState || state);
      console.log('Game saved successfully');
      setIsOnline(true);
    } catch (error) {
      console.error('Failed to save game', error);
      setIsOnline(false);
    } finally {
      setIsSyncing(false);
    }
  };

  const loadGame = async () => {
    setIsSyncing(true);
    try {
      const loadedState = await loadGameState();
      if (loadedState) {
        setState(loadedState);
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

  useEffect(() => {
    loadGame();
  }, []);

  return (
    <GameContext.Provider value={{ state, setState, saveGame, loadGame, isSyncing, isOnline, isAuthenticated, setIsAuthenticated }}>
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
