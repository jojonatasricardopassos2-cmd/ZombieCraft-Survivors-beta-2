
import React from 'react';
import { GameCanvas } from './components/GameCanvas.tsx';

const App: React.FC = () => {
  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-zinc-900 text-white select-none">
      <GameCanvas />
    </div>
  );
};

export default App;
