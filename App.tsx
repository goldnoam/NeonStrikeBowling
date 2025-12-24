
import React, { useState, useEffect } from 'react';
import BowlingGame from './components/BowlingGame';
import HUD from './components/HUD';
import Controls from './components/Controls';
import { Sun, Moon, Pause, Play, RotateCcw, Users, User, Cpu } from 'lucide-react';
import { FrameResult, PowerUpType, GameMode } from './types';

const App: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isPaused, setIsPaused] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.SINGLE);
  const [throwPower, setThrowPower] = useState(70);
  const [throwSpin, setThrowSpin] = useState(0);
  const [powerUpCharge, setPowerUpCharge] = useState(0);
  
  // Game State
  const [gameState, setGameState] = useState({
    score: 0,
    currentFrame: 1,
    history: [] as FrameResult[],
    activePowerUp: null as PowerUpType | null,
    powerUpDuration: 0,
    currentPlayer: 1,
    p2Score: 0,
    p2History: [] as FrameResult[],
    isGameOver: false
  });

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const togglePause = () => setIsPaused(prev => !prev);
  
  const resetGame = () => {
    setResetKey(prev => prev + 1);
    setPowerUpCharge(0);
    setGameState({
      score: 0,
      currentFrame: 1,
      history: [],
      activePowerUp: null,
      powerUpDuration: 0,
      currentPlayer: 1,
      p2Score: 0,
      p2History: [],
      isGameOver: false
    });
    setIsPaused(false);
  };

  const handleGameStateUpdate = (update: any) => {
    setGameState(prev => ({ ...prev, ...update }));
    
    // Logic for charging meter based on events reported by the game
    if (update.event) {
      if (update.event === 'STRIKE') {
        setPowerUpCharge(prev => Math.min(100, prev + 35));
      } else if (update.event === 'SPARE') {
        setPowerUpCharge(prev => Math.min(100, prev + 20));
      } else if (update.event === 'PIN_HIT') {
        setPowerUpCharge(prev => Math.min(100, prev + (update.count * 2)));
      }
    }
  };

  const activatePowerUp = (type: PowerUpType) => {
    if (powerUpCharge >= 100) {
      setGameState(prev => ({ 
        ...prev, 
        activePowerUp: type, 
        powerUpDuration: 300 // Set duration to 300 frames as per constants
      }));
      setPowerUpCharge(0);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Header */}
      <header className="p-4 flex justify-between items-center bg-opacity-50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center shadow-lg shadow-rose-500/50">
            <span className="text-white font-bold text-xl">🎳</span>
          </div>
          <h1 className="text-2xl font-orbitron font-bold tracking-tighter">NEON STRIKE</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-800/50 rounded-xl p-1 mr-2">
            <button onClick={() => { setGameMode(GameMode.SINGLE); resetGame(); }} className={`p-2 rounded-lg transition-all ${gameMode === GameMode.SINGLE ? 'bg-rose-500 text-white' : 'hover:bg-slate-700 text-slate-400'}`} title="Solo Play"><User size={18}/></button>
            <button onClick={() => { setGameMode(GameMode.MULTIPLAYER); resetGame(); }} className={`p-2 rounded-lg transition-all ${gameMode === GameMode.MULTIPLAYER ? 'bg-rose-500 text-white' : 'hover:bg-slate-700 text-slate-400'}`} title="2 Player Local"><Users size={18}/></button>
            <button onClick={() => { setGameMode(GameMode.VS_AI); resetGame(); }} className={`p-2 rounded-lg transition-all ${gameMode === GameMode.VS_AI ? 'bg-rose-500 text-white' : 'hover:bg-slate-700 text-slate-400'}`} title="Vs Computer"><Cpu size={18}/></button>
          </div>
          <button 
            onClick={toggleTheme}
            className="p-3 rounded-xl bg-slate-800/50 hover:bg-slate-700 transition-colors"
          >
            {theme === 'dark' ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-indigo-400" />}
          </button>
          <button 
            onClick={togglePause}
            className="p-3 rounded-xl bg-slate-800/50 hover:bg-slate-700 transition-colors"
          >
            {isPaused ? <Play size={20} className="text-green-400" /> : <Pause size={20} className="text-yellow-400" />}
          </button>
          <button 
            onClick={resetGame}
            className="p-3 rounded-xl bg-slate-800/50 hover:bg-slate-700 transition-colors"
          >
            <RotateCcw size={20} className="text-rose-400" />
          </button>
        </div>
      </header>

      {/* Main Game Container */}
      <main className="flex-grow flex flex-col items-center justify-center p-4 gap-4 max-w-4xl mx-auto w-full">
        <HUD 
          score={gameState.score} 
          p2Score={gameState.p2Score}
          isPaused={isPaused} 
          currentFrame={gameState.currentFrame}
          history={gameState.history}
          p2History={gameState.p2History}
          activePowerUp={gameState.activePowerUp}
          powerUpDuration={gameState.powerUpDuration}
          currentPlayer={gameState.currentPlayer}
          gameMode={gameMode}
          isGameOver={gameState.isGameOver}
          charge={powerUpCharge}
          onActivatePowerUp={activatePowerUp}
        />
        
        <div className="relative w-full max-w-[600px] aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-800 bg-slate-800 ring-8 ring-slate-800/20">
          <BowlingGame 
            key={resetKey}
            theme={theme} 
            isPaused={isPaused} 
            gameMode={gameMode}
            onGameStateUpdate={handleGameStateUpdate}
            power={throwPower}
            spin={throwSpin}
          />
          
          {isPaused && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="text-center p-8 bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl transform transition-all">
                <h2 className="text-4xl font-orbitron font-bold mb-4 text-rose-500">PAUSED</h2>
                <button 
                  onClick={togglePause}
                  className="px-8 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-full font-bold transition-all transform hover:scale-105"
                >
                  RESUME GAME
                </button>
              </div>
            </div>
          )}

          {gameState.isGameOver && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-10 pointer-events-none">
              <div className="text-center p-12 animate-bounce">
                <h2 className="text-6xl font-orbitron font-bold text-rose-500 drop-shadow-lg shadow-rose-500/50 uppercase tracking-tighter">Match Over!</h2>
                <p className="text-white text-xl font-bold mt-2">Winner: {gameState.score >= gameState.p2Score ? 'Player 1' : 'Player 2'}</p>
              </div>
            </div>
          )}
        </div>

        <Controls 
          onPause={togglePause} 
          onReset={resetGame} 
          isPaused={isPaused} 
          power={throwPower}
          onPowerChange={setThrowPower}
          spin={throwSpin}
          onSpinChange={setThrowSpin}
        />
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-slate-500 text-sm border-t border-slate-800 bg-slate-900/50">
        <p className="mb-1 font-medium">&copy; Noam Gold AI 2025</p>
        <p>Send Feedback: <a href="mailto:goldnoamai@gmail.com" className="text-rose-400 hover:underline">goldnoamai@gmail.com</a></p>
      </footer>
    </div>
  );
};

export default App;
