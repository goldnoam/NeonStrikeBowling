
import React from 'react';
import { Trophy, Zap, Layers, Flame, Maximize, MoveHorizontal, User, Cpu, Users, Sparkles } from 'lucide-react';
import { PowerUpType, FrameResult, GameMode } from '../types';

interface HUDProps {
  score: number;
  isPaused: boolean;
  currentFrame: number;
  history: FrameResult[];
  activePowerUp: PowerUpType | null;
  powerUpDuration: number;
  currentPlayer: number;
  gameMode: GameMode;
  p2Score: number;
  p2History: FrameResult[];
  isGameOver?: boolean;
  charge: number;
  onActivatePowerUp: (type: PowerUpType) => void;
}

const HUD: React.FC<HUDProps> = ({ 
  score, 
  isPaused, 
  currentFrame, 
  history, 
  activePowerUp, 
  powerUpDuration,
  currentPlayer,
  gameMode,
  p2Score,
  p2History,
  isGameOver,
  charge,
  onActivatePowerUp
}) => {
  const isExpiring = powerUpDuration > 0 && powerUpDuration < 120;
  const secondsRemaining = Math.ceil(powerUpDuration / 60);

  const getPowerUpIcon = (type: PowerUpType, size = 20) => {
    switch (type) {
      case PowerUpType.FIRE_BALL: return <Flame className="text-orange-500" size={size} />;
      case PowerUpType.GIANT_BALL: return <Maximize className="text-purple-500" size={size} />;
      case PowerUpType.SUPER_CURVE: return <MoveHorizontal className="text-cyan-500" size={size} />;
      default: return null;
    }
  };

  const activeHistory = currentPlayer === 1 ? history : p2History;

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex justify-between items-center bg-slate-800/80 p-4 rounded-2xl border border-slate-700 shadow-xl backdrop-blur-sm relative overflow-hidden flex-shrink-0">
        <div className="absolute bottom-0 left-0 h-1 bg-rose-500/30 transition-all duration-500" style={{ width: `${charge}%` }} />

        <div className="flex gap-4">
          <div className={`flex flex-col min-w-[80px] transition-all duration-300 ${currentPlayer === 1 ? 'scale-105 opacity-100 border-b-2 border-rose-500' : 'opacity-50 scale-95'}`}>
            <span className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1">P1</span>
            <div className="flex items-center gap-2">
              <Trophy className={currentPlayer === 1 ? "text-amber-400" : "text-slate-500"} size={16} />
              <span className={`text-xl font-orbitron font-bold tabular-nums ${currentPlayer === 1 ? 'text-white' : 'text-slate-400'}`}>{score}</span>
            </div>
          </div>

          {gameMode !== GameMode.SINGLE && (
            <div className={`flex flex-col min-w-[80px] border-l border-slate-700 pl-4 transition-all duration-300 ${currentPlayer === 2 ? 'scale-105 opacity-100 border-b-2 border-rose-500' : 'opacity-50 scale-95'}`}>
              <span className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1">{gameMode === GameMode.VS_COMPUTER ? 'COMP' : 'P2'}</span>
              <div className="flex items-center gap-2">
                <Trophy className={currentPlayer === 2 ? "text-amber-400" : "text-slate-500"} size={16} />
                <span className={`text-xl font-orbitron font-bold tabular-nums ${currentPlayer === 2 ? 'text-white' : 'text-slate-400'}`}>{p2Score}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {charge >= 100 ? (
            <div className="flex gap-2 items-center bg-rose-500/10 p-1.5 rounded-xl border border-rose-500 animate-pulse">
              <Sparkles size={14} className="text-rose-400" />
              <button onClick={() => onActivatePowerUp(PowerUpType.FIRE_BALL)} className="p-1.5 bg-slate-900 rounded-lg hover:bg-orange-900 transition-colors" title="Fire Ball">{getPowerUpIcon(PowerUpType.FIRE_BALL, 16)}</button>
              <button onClick={() => onActivatePowerUp(PowerUpType.GIANT_BALL)} className="p-1.5 bg-slate-900 rounded-lg hover:bg-purple-900 transition-colors" title="Giant Ball">{getPowerUpIcon(PowerUpType.GIANT_BALL, 16)}</button>
              <button onClick={() => onActivatePowerUp(PowerUpType.SUPER_CURVE)} className="p-1.5 bg-slate-900 rounded-lg hover:bg-cyan-900 transition-colors" title="Super Curve">{getPowerUpIcon(PowerUpType.SUPER_CURVE, 16)}</button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-slate-400 text-[8px] font-bold uppercase mb-1">Boost</span>
              <div className="w-16 h-1.5 bg-slate-900 rounded-full border border-slate-700 overflow-hidden shadow-inner">
                <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${charge}%` }} />
              </div>
            </div>
          )}

          <div className="flex flex-col items-center">
            <span className="text-slate-400 text-[8px] font-bold uppercase mb-1">Frame</span>
            <div className="bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-700 text-rose-400 font-orbitron font-bold text-sm">{currentFrame}/10</div>
          </div>

          {activePowerUp && (
            <div className={`bg-slate-900/50 p-1.5 rounded-xl border ${isExpiring ? 'border-rose-500 animate-pulse' : 'border-slate-700'} flex items-center gap-1.5`}>
              {getPowerUpIcon(activePowerUp, 16)}
              <span className="text-white font-mono text-[10px]">{secondsRemaining}s</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide flex-shrink-0">
        {Array.from({ length: 10 }).map((_, idx) => {
          const frame = activeHistory[idx];
          const isActive = idx + 1 === currentFrame;
          return (
            <div key={idx} className={`flex-shrink-0 w-[42px] h-12 rounded-lg border flex flex-col items-center justify-between p-1 transition-all ${isActive ? 'bg-rose-500/20 border-rose-500 shadow-md' : 'bg-slate-800/40 border-slate-700'}`}>
              <div className="text-[7px] font-bold text-slate-500 uppercase">F{idx + 1}</div>
              <div className="flex gap-0.5 font-orbitron text-[8px] bg-slate-900/40 rounded px-0.5">
                {frame ? (
                  <>
                    <span className="w-2.5 text-center">{frame.throws[0] === 10 ? 'X' : frame.throws[0]}</span>
                    <span className="w-2.5 text-center border-l border-slate-700">{frame.isSpare ? '/' : (frame.throws[1] ?? '')}</span>
                  </>
                ) : <span className="text-slate-700">--</span>}
              </div>
              <div className="text-[9px] font-orbitron font-bold text-white/90 leading-none">{frame?.cumulativeScore || ''}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HUD;
