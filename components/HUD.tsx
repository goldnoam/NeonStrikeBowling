
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
      <div className="flex justify-between items-center bg-slate-800/80 p-4 rounded-2xl border border-slate-700 shadow-xl backdrop-blur-sm relative overflow-hidden">
        {/* Charge Progress Background */}
        <div 
          className="absolute bottom-0 left-0 h-1 bg-rose-500/30 transition-all duration-500" 
          style={{ width: `${charge}%` }}
        />

        <div className="flex gap-4">
          <div className={`flex flex-col min-w-[100px] transition-all duration-300 ${currentPlayer === 1 ? 'scale-105 opacity-100 border-b-2 border-rose-500' : 'opacity-50 scale-95'}`}>
            <span className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
              P1 {gameMode === GameMode.SINGLE ? '' : (currentPlayer === 1 ? '• ACTIVE' : '')}
            </span>
            <div className="flex items-center gap-2">
              <Trophy className={currentPlayer === 1 ? "text-amber-400" : "text-slate-500"} size={18} />
              <span className={`text-2xl font-orbitron font-bold tabular-nums ${currentPlayer === 1 ? 'text-white' : 'text-slate-400'}`}>
                {score}
              </span>
            </div>
          </div>

          {gameMode !== GameMode.SINGLE && (
            <div className={`flex flex-col min-w-[100px] border-l border-slate-700 pl-4 transition-all duration-300 ${currentPlayer === 2 ? 'scale-105 opacity-100 border-b-2 border-rose-500' : 'opacity-50 scale-95'}`}>
              <span className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                {gameMode === GameMode.VS_AI ? 'CPU' : 'P2'} {currentPlayer === 2 ? '• ACTIVE' : ''}
              </span>
              <div className="flex items-center gap-2">
                <Trophy className={currentPlayer === 2 ? "text-amber-400" : "text-slate-500"} size={18} />
                <span className={`text-2xl font-orbitron font-bold tabular-nums ${currentPlayer === 2 ? 'text-white' : 'text-slate-400'}`}>
                  {p2Score}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Power Up Activation Area */}
          {charge >= 100 ? (
            <div className="flex gap-2 items-center bg-rose-500/10 p-2 rounded-xl border border-rose-500 animate-pulse">
              <Sparkles size={16} className="text-rose-400" />
              <button onClick={() => onActivatePowerUp(PowerUpType.FIRE_BALL)} className="p-2 bg-slate-900 rounded-lg hover:bg-orange-900 transition-colors" title="Fire Ball">{getPowerUpIcon(PowerUpType.FIRE_BALL, 18)}</button>
              <button onClick={() => onActivatePowerUp(PowerUpType.GIANT_BALL)} className="p-2 bg-slate-900 rounded-lg hover:bg-purple-900 transition-colors" title="Giant Ball">{getPowerUpIcon(PowerUpType.GIANT_BALL, 18)}</button>
              <button onClick={() => onActivatePowerUp(PowerUpType.SUPER_CURVE)} className="p-2 bg-slate-900 rounded-lg hover:bg-cyan-900 transition-colors" title="Super Curve">{getPowerUpIcon(PowerUpType.SUPER_CURVE, 18)}</button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-slate-400 text-[9px] font-bold uppercase mb-1">Charge</span>
              <div className="w-24 h-2 bg-slate-900 rounded-full border border-slate-700 overflow-hidden">
                <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${charge}%` }} />
              </div>
            </div>
          )}

          <div className="flex flex-col items-center">
            <span className="text-slate-400 text-[9px] font-bold uppercase mb-1">Frame</span>
            <div className="bg-slate-900 px-3 py-1 rounded-lg border border-slate-700 text-rose-400 font-orbitron font-bold text-lg">
              {currentFrame}/10
            </div>
          </div>

          {activePowerUp && (
            <div className={`bg-slate-900/50 p-2 rounded-xl border ${isExpiring ? 'border-rose-500 animate-pulse' : 'border-slate-700'} flex items-center gap-2`}>
              {getPowerUpIcon(activePowerUp)}
              <span className="text-white font-mono text-xs">{secondsRemaining}s</span>
            </div>
          )}
        </div>
      </div>

      {/* Frame History */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {Array.from({ length: 10 }).map((_, idx) => {
          const frame = activeHistory[idx];
          const isActive = idx + 1 === currentFrame;
          return (
            <div key={idx} className={`flex-shrink-0 w-[64px] h-16 rounded-lg border flex flex-col items-center justify-between p-1 transition-all ${isActive ? 'bg-rose-500/20 border-rose-500 shadow-lg' : 'bg-slate-800/40 border-slate-700'}`}>
              <div className="text-[8px] font-bold text-slate-500 uppercase">F{idx + 1}</div>
              <div className="flex gap-1 font-orbitron text-[10px] bg-slate-900/40 rounded px-1">
                {frame ? (
                  <>
                    <span className="w-3 text-center">{frame.throws[0] === 10 ? 'X' : frame.throws[0]}</span>
                    {idx < 9 ? (
                      <span className="w-3 text-center border-l border-slate-700">{frame.isSpare ? '/' : (frame.throws[1] ?? '')}</span>
                    ) : (
                      <>
                        <span className="w-3 text-center border-l border-slate-700">{frame.throws[1] === 10 ? 'X' : (frame.throws[0]+frame.throws[1] === 10 && frame.throws[0] !== 10 ? '/' : (frame.throws[1] ?? ''))}</span>
                        <span className="w-3 text-center border-l border-slate-700">{frame.throws[2] === 10 ? 'X' : (frame.throws[2] ?? '')}</span>
                      </>
                    )}
                  </>
                ) : <span className="text-slate-700">--</span>}
              </div>
              <div className="text-[10px] font-orbitron font-bold text-white/90 leading-none">
                {frame?.cumulativeScore || ''}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HUD;
