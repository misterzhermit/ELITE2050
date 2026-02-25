/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameProvider, useGame } from './store/GameContext';
import { Dashboard } from './components/Dashboard';
import { Login } from './components/Login';
import { WorldSelector } from './components/WorldSelector';

function AppContent() {
  const { isAuthenticated, worldId } = useGame();

  if (!isAuthenticated) {
    return <Login onLogin={() => {}} />;
  }

  if (!worldId) {
    return <WorldSelector />;
  }

  return <Dashboard />;
}

export default function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}
