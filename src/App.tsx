/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameProvider, useGame } from './store/GameContext';
import { Dashboard } from './components/Dashboard';
import { Login } from './components/Login';

function AppContent() {
  const { isAuthenticated, setIsAuthenticated } = useGame();

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
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
