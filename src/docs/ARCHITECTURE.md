# ELITE 2050 Architecture

## Overview
ELITE 2050 is a Single Page Application (SPA) built with React, Vite, and Supabase. It uses a centralized state management system with specialized engine components for game logic and match simulation.

## System Components

### 1. Frontend Layer (React)
- **Store**: `GameContext` provides the global state using a Reducer pattern for predictable state transitions.
- **Routing**: `react-router-dom` handles navigation between the Login, World Selection, and Dashboard.
- **Components**: Modularized by domain (Dashboard, Lineup, Match, etc.).

### 2. Game Engine (`src/engine/`)
- **MatchEngine.ts**: Handles the tick-by-tick simulation of matches. It calculates possession, shots, and goals based on team and player attributes.
- **gameLogic.ts**: Manages the advancement of time, updating standings, league processing, and "Safety Net" logic for AI teams.
- **simulation.ts**: Contains the core mathematical models for individual match events and player evolution.
- **generator.ts**: Responsible for procedural generation of players, teams, and world state.

### 3. Data Layer (Supabase)
- **PostgreSQL**: Stores persistent game state, world definitions, and player data.
- **Row Level Security (RLS)**: Ensures data isolation and secure access for multiplayer worlds.
- **Edge Functions**: Used for compute-intensive or sensitive server-side logic (e.g., progression processing).

## Data Flow
1. **Load**: User selects a world; `GameState` is fetched from Supabase and populated in the context.
2. **Action**: User makes a tactical change or advances the day.
3. **Process**: The Game Engine calculates the outcome of the action.
4. **Update**: The new state is dispatched to the reducer and synchronized back to Supabase.
5. **Render**: Components re-render based on the updated state.

## Optimization Patterns
- **React.memo**: Used on list items (PlayerCard, TeamLogo) to prevent unnecessary re-renders.
- **useMemo**: Derivatives like standings and filtered lists are memoized.
- **Lazy Loading**: Major tabs and heavy libraries (Recharts) are loaded dynamically.
