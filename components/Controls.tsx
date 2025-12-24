
import React, { useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, PlayCircle, RotateCcw, Zap, RefreshCw, Maximize2, Palette } from 'lucide-react';
import { BallSize } from '../types';

interface ControlsProps {
  onPause: () => void;
  onReset: () => void;
  isPaused: boolean;
  power: number;
  onPowerChange: (p: number) => void;
  spin: number;
  onSpinChange: (s: number) => void;
  ballSize: BallSize;
  onBallSizeChange: (size: BallSize) => void;
  ballColor: string;
  onBallColorChange: (color: string) => void;
}

// Vibrant neon color palette for the bowling balls
const NEON_PALETTE = [
  '#f43f5e', // Rose
  '#0ea5e9', // Sky Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f8fafc', // Ghost White
];

const Controls: React.FC<ControlsProps> = ({ 
  onPause, 
  onReset, 
  isPaused, 
  power, 
  onPowerChange,
  spin,
  onSpinChange,
  ballSize,
  onBallSizeChange,
  ballColor,
  onBallColorChange
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaused) return;
      const key = e.key.toLowerCase();
      // WASD and Arrows for Power and Spin (W/S only here as A/D are handled by mouse/touch in game component)
      if (key === 'w' || key === 'arrowup') onPowerChange(Math.min(100, power + 5));
      if (key === 's' || key === 'arrowdown') onPowerChange(Math.max(20, power - 5));
      if (key === 'q') onSpinChange(Math.max(-100, spin - 10));
      if (key === 'e') onSpinChange(Math.min(100, spin + 10));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [power, spin, isPaused, onPowerChange, onSpinChange]);

  const dispatchKey = (key: string) => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key }));
  };

  return (
    <div className="w-full flex flex-col gap-3 max-w-[450px] flex-shrink-0 pb-6 animate-in slide-in-from-bottom duration-500">
      <div className="grid grid-cols-2 gap-3">
        {/* Power Slider */}
        <div className="flex flex-col gap-2 bg-slate-800/40 p-3 rounded-2xl border border-slate-700/50 shadow-inner group">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-1.5 text-rose-400 font-orbitron text-[9px] font-bold uppercase tracking-wider">
              <Zap size={12} className="group-hover:animate-pulse" /> Launch Power
            </div>
            <span className="text-white font-orbitron font-bold text-xs bg-slate-900/60 px-1.5 py-0.5 rounded border border-slate-700">{power}%</span>
          </div>
          <input 
            type="range" min="20" max="100" value={power} step="5"
            onChange={(e) => onPowerChange(parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
          />
        </div>

        {/* Spin Slider */}
        <div className="flex flex-col gap-2 bg-slate-800/40 p-3 rounded-2xl border border-slate-700/50 shadow-inner group">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-1.5 text-cyan-400 font-orbitron text-[9px] font-bold uppercase tracking-wider">
              <RefreshCw size={12} className="group-hover:rotate-180 transition-transform duration-700" /> Lateral Hook
            </div>
            <span className="text-white font-orbitron font-bold text-xs bg-slate-900/60 px-1.5 py-0.5 rounded border border-slate-700">{spin}%</span>
          </div>
          <input 
            type="range" min="-100" max="100" value={spin} step="10"
            onChange={(e) => onSpinChange(parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Variety Selection (Ball Size) */}
        <div className="bg-slate-800/40 p-3 rounded-2xl border border-slate-700/50 flex flex-col gap-2 shadow-inner">
          <div className="flex items-center gap-1.5 text-indigo-400 font-orbitron text-[9px] font-bold uppercase tracking-wider px-1">
            <Maximize2 size={12} /> Ball Size
          </div>
          <div className="flex justify-between gap-1">
            {(Object.keys(BallSize) as Array<keyof typeof BallSize>).filter(k => isNaN(Number(k))).map(sizeKey => {
              const sVal = BallSize[sizeKey as any] as unknown as BallSize;
              return (
                <button 
                  key={sizeKey}
                  onClick={() => onBallSizeChange(sVal)}
                  className={`flex-1 py-1 text-[8px] font-bold rounded-lg transition-all ${ballSize === sVal ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 scale-105' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                  title={`${sizeKey} size`}
                >
                  {sizeKey}
                </button>
              );
            })}
          </div>
        </div>

        {/* Color Palette (Ball Color) */}
        <div className="bg-slate-800/40 p-3 rounded-2xl border border-slate-700/50 flex flex-col gap-2 shadow-inner">
          <div className="flex items-center gap-1.5 text-amber-400 font-orbitron text-[9px] font-bold uppercase tracking-wider px-1">
             <Palette size={12} /> Ball Color
          </div>
          <div className="flex flex-wrap justify-center gap-1.5">
            {NEON_PALETTE.map(c => (
              <button 
                key={c}
                onClick={() => onBallColorChange(c)}
                style={{ backgroundColor: c }}
                className={`w-4 h-4 rounded-full border-2 transition-all hover:scale-125 hover:shadow-lg ${ballColor === c ? 'border-white scale-125 shadow-md ring-2 ring-slate-800' : 'border-slate-600'}`}
                aria-label={`Select ball color ${c}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Mobile-Friendly WASD Buttons & Launch */}
      <div className="flex justify-between items-center p-3 bg-slate-800/60 rounded-[32px] border border-slate-700/60 shadow-2xl flex-shrink-0">
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-900/40 rounded-2xl border border-slate-800">
           <div />
           <button 
             onPointerDown={() => dispatchKey('w')} 
             className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center active:scale-90 transition-all shadow-md active:bg-rose-500/20 active:border-rose-500"
             title="Increase Power (W)"
           >
             <ChevronUp size={20} className="text-slate-300" />
           </button>
           <div />
           <button 
             onPointerDown={() => dispatchKey('a')} 
             className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center active:scale-90 transition-all shadow-md active:bg-rose-500/20 active:border-rose-500"
             title="Move Left (A)"
           >
             <ChevronLeft size={20} className="text-slate-300" />
           </button>
           <button 
             onPointerDown={() => dispatchKey('s')} 
             className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center active:scale-90 transition-all shadow-md active:bg-rose-500/20 active:border-rose-500"
             title="Decrease Power (S)"
           >
             <ChevronDown size={20} className="text-slate-300" />
           </button>
           <button 
             onPointerDown={() => dispatchKey('d')} 
             className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center active:scale-90 transition-all shadow-md active:bg-rose-500/20 active:border-rose-500"
             title="Move Right (D)"
           >
             <ChevronRight size={20} className="text-slate-300" />
           </button>
        </div>

        <button 
          className="group px-8 h-16 rounded-[24px] bg-rose-500 text-white font-orbitron font-bold flex flex-col items-center justify-center gap-0 shadow-lg shadow-rose-500/30 active:scale-95 transition-all hover:bg-rose-400 select-none border-b-4 border-rose-700 active:border-b-0"
          onPointerDown={() => dispatchKey(' ')}
          title="Launch Ball (Space)"
        >
          <PlayCircle size={24} className="group-active:scale-110 transition-transform" />
          <span className="text-[10px] mt-1 tracking-widest uppercase font-bold">Launch</span>
        </button>

        <button 
          onClick={onReset}
          className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center active:scale-90 transition-all text-slate-400 hover:text-rose-400 hover:bg-slate-700 shadow-lg"
          title="Reset Match (R)"
        >
          <RotateCcw size={22} />
        </button>
      </div>
    </div>
  );
};

export default Controls;
