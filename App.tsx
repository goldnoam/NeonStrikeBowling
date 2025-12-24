
import React, { useState, useEffect } from 'react';
import BowlingGame from './components/BowlingGame';
import HUD from './components/HUD';
import Controls from './components/Controls';
import { Sun, Moon, Pause, Play, RotateCcw, Users, User, Cpu, Volume2, VolumeX } from 'lucide-react';
import { FrameResult, PowerUpType, GameMode, BallSize } from './types';
import { soundManager } from './components/SoundManager';

const App: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isPaused, setIsPaused] = useState(false);
  const [isMusicOn, setIsMusicOn] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.SINGLE);
  const [throwPower, setThrowPower] = useState(75);
  const [throwSpin, setThrowSpin] = useState(0);
  const [powerUpCharge, setPowerUpCharge] = useState(0);
  
  // Customization State
  const [ballSize, setBallSize] = useState<BallSize>(BallSize.NORMAL);
  const [ballColor, setBallColor] = useState<string>('#f43f5e');
  
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

  useEffect(() => {
    soundManager.toggleMusic(isMusicOn);
  }, [isMusicOn]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const togglePause = () => setIsPaused(prev => !prev);
  const toggleMusic = () => setIsMusicOn(prev => !prev);
  
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
    
    // Charge power-up bar based on events
    if (update.event) {
      if (update.event === 'STRIKE') {
        setPowerUpCharge(prev => Math.min(100, prev + 40));
      } else if (update.event === 'SPARE') {
        setPowerUpCharge(prev => Math.min(100, prev + 25));
      } else if (update.event === 'PIN_HIT') {
        setPowerUpCharge(prev => Math.min(100, prev + (update.count * 2.5)));
      }
    }
  };

  const activatePowerUp = (type: PowerUpType) => {
    if (powerUpCharge >= 100) {
      setGameState(prev => ({ 
        ...prev, 
        activePowerUp: type, 
        powerUpDuration: 300 
      }));
      setPowerUpCharge(0);
      soundManager.playPowerUp();
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 overflow-hidden ${theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Header with Navigation and Mode Controls */}
      <header className="p-4 flex justify-between items-center bg-opacity-30 backdrop-blur-md sticky top-0 z-50 border-b border-slate-700/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center shadow-lg shadow-rose-500/50 transform hover:rotate-12 transition-transform cursor-pointer">
            <span className="text-white font-bold text-xl">🎳</span>
          </div>
          <h1 className="text-xl md:text-2xl font-orbitron font-bold tracking-tighter">NEON STRIKE</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex bg-slate-800/50 rounded-xl p-1 mr-2 border border-slate-700/50">
            <button onClick={() => { setGameMode(GameMode.SINGLE); resetGame(); }} className={`p-2 rounded-lg transition-all ${gameMode === GameMode.SINGLE ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30' : 'hover:bg-slate-700 text-slate-400'}`} title="Solo Play"><User size={18}/></button>
            <button onClick={() => { setGameMode(GameMode.MULTIPLAYER); resetGame(); }} className={`p-2 rounded-lg transition-all ${gameMode === GameMode.MULTIPLAYER ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30' : 'hover:bg-slate-700 text-slate-400'}`} title="2 Player Local"><Users size={18}/></button>
            <button onClick={() => { setGameMode(GameMode.VS_COMPUTER); resetGame(); }} className={`p-2 rounded-lg transition-all ${gameMode === GameMode.VS_COMPUTER ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30' : 'hover:bg-slate-700 text-slate-400'}`} title="Vs Computer"><Cpu size={18}/></button>
          </div>
          <button onClick={toggleMusic} className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-700 transition-colors border border-slate-700/50" title="Toggle Music">
            {isMusicOn ? <Volume2 size={18} className="text-cyan-400" /> : <VolumeX size={18} className="text-slate-400" />}
          </button>
          <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-700 transition-colors border border-slate-700/50" title="Toggle Theme">
            {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-400" />}
          </button>
          <button onClick={togglePause} className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-700 transition-colors border border-slate-700/50" title="Pause Game">
            {isPaused ? <Play size={18} className="text-green-400" /> : <Pause size={18} className="text-yellow-400" />}
          </button>
          <button onClick={resetGame} className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-700 transition-colors border border-slate-700/50" title="Restart Game">
            <RotateCcw size={18} className="text-rose-400" />
          </button>
        </div>
      </header>

      {/* Main Game Interface */}
      <main className="flex-grow flex flex-col items-center justify-start p-4 gap-4 max-w-4xl mx-auto w-full overflow-y-auto scrollbar-hide">
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
        
        {/* Responsive Lane Container */}
        <div className="relative w-full max-w-[450px] aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-800 bg-slate-800 ring-8 ring-slate-800/20 flex-shrink-0">
          <BowlingGame 
            key={resetKey}
            theme={theme} 
            isPaused={isPaused} 
            gameMode={gameMode}
            onGameStateUpdate={handleGameStateUpdate}
            power={throwPower}
            spin={throwSpin}
            ballSizeMultiplier={ballSize}
            customBallColor={ballColor}
          />
          
          {/* Pause Overlay */}
          {isPaused && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="text-center p-8 bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl transform transition-all scale-110">
                <h2 className="text-4xl font-orbitron font-bold mb-6 text-rose-500 tracking-tighter">PAUSED</h2>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={togglePause}
                    className="px-8 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-full font-bold transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-rose-500/20"
                  >
                    RESUME
                  </button>
                  <button 
                    onClick={resetGame}
                    className="px-8 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-full font-bold transition-all"
                  >
                    RESTART
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Game Over Screen */}
          {gameState.isGameOver && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-10 pointer-events-none">
              <div className="text-center p-12 animate-in fade-in zoom-in duration-500">
                <h2 className="text-5xl font-orbitron font-bold text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.6)] uppercase tracking-tighter mb-4">Match Over!</h2>
                <div className="bg-slate-900/80 px-8 py-4 rounded-3xl border-2 border-rose-500 shadow-2xl">
                  <p className="text-white text-xl font-bold uppercase tracking-widest">
                    {gameState.score > gameState.p2Score 
                      ? 'Player 1 Wins!' 
                      : (gameState.score === gameState.p2Score ? 'Draw Match!' : (gameMode === GameMode.VS_COMPUTER ? 'Computer Wins!' : 'Player 2 Wins!'))}
                  </p>
                  <div className="flex justify-center gap-4 mt-2 text-sm text-slate-400">
                    <span>P1: {gameState.score}</span>
                    <span>VS</span>
                    <span>{gameMode === GameMode.VS_COMPUTER ? 'COMP' : 'P2'}: {gameState.p2Score}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Variety and Game Control Panel */}
        <Controls 
          onPause={togglePause} 
          onReset={resetGame} 
          isPaused={isPaused} 
          power={throwPower}
          onPowerChange={setThrowPower}
          spin={throwSpin}
          onSpinChange={setThrowSpin}
          ballSize={ballSize}
          onBallSizeChange={setBallSize}
          ballColor={ballColor}
          onBallColorChange={setBallColor}
        />
      </main>

      {/* Footer Branded as Requested */}
      <footer className="p-4 text-center text-slate-500 text-[10px] md:text-xs border-t border-slate-800 bg-slate-900/50 flex-shrink-0 z-10">
        <p className="mb-1 font-medium opacity-80 uppercase tracking-widest">(C) Noam Gold AI 2025</p>
        <p className="flex items-center justify-center gap-1">
          Send Feedback: <a href="mailto:goldnoamai@gmail.com" className="text-rose-400 hover:underline font-semibold hover:text-rose-300 transition-colors">goldnoamai@gmail.com</a>
        </p>
      </footer>
    </div>
  );
};

export default App;
