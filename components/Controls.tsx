
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, PlayCircle, RotateCcw, Zap, RefreshCw } from 'lucide-react';

interface ControlsProps {
  onPause: () => void;
  onReset: () => void;
  isPaused: boolean;
  power: number;
  onPowerChange: (p: number) => void;
  spin: number;
  onSpinChange: (s: number) => void;
}

const Controls: React.FC<ControlsProps> = ({ 
  onPause, 
  onReset, 
  isPaused, 
  power, 
  onPowerChange,
  spin,
  onSpinChange
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaused) return;
      if (e.key === 'ArrowUp' || e.key === 'w') {
        onPowerChange(Math.min(100, power + 5));
      } else if (e.key === 'ArrowDown' || e.key === 's') {
        onPowerChange(Math.max(20, power - 5));
      } else if (e.key === 'q') {
        onSpinChange(Math.max(-100, spin - 10));
      } else if (e.key === 'e') {
        onSpinChange(Math.min(100, spin + 10));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [power, spin, isPaused, onPowerChange, onSpinChange]);

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Power Slider */}
        <div className="flex flex-col gap-2 bg-slate-800/40 p-4 rounded-2xl border border-slate-700">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2 text-amber-400 font-orbitron text-[10px] font-bold uppercase">
              <Zap size={14} />
              Power
            </div>
            <span className="text-white font-orbitron font-bold text-sm">{power}%</span>
          </div>
          <input 
            type="range" 
            min="20" 
            max="100" 
            value={power} 
            onChange={(e) => onPowerChange(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
          />
        </div>

        {/* Spin Slider */}
        <div className="flex flex-col gap-2 bg-slate-800/40 p-4 rounded-2xl border border-slate-700">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2 text-cyan-400 font-orbitron text-[10px] font-bold uppercase">
              <RefreshCw size={14} />
              Spin
            </div>
            <span className="text-white font-orbitron font-bold text-sm">{spin > 0 ? `+${spin}` : spin}%</span>
          </div>
          <input 
            type="range" 
            min="-100" 
            max="100" 
            value={spin} 
            onChange={(e) => onSpinChange(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>
      </div>

      {/* Desktop Hints */}
      <div className="hidden md:flex justify-center gap-6 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
        <div className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">A/D</kbd><span>Aim</span></div>
        <div className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">W/S</kbd><span>Power</span></div>
        <div className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">Q/E</kbd><span>Spin</span></div>
        <div className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">SPACE</kbd><span>Throw</span></div>
      </div>

      {/* Mobile Controls */}
      <div className="flex justify-between items-center p-4 bg-slate-800/40 rounded-3xl border border-slate-800">
        <div className="flex gap-2">
           <div className="grid grid-cols-2 gap-2">
             <button 
               className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center active:scale-90 transition-transform hover:bg-slate-700 select-none"
               onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', {'key': 'a'}))}
             >
               <ChevronLeft size={24} className="text-slate-400" />
             </button>
             <button 
               className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center active:scale-90 transition-transform hover:bg-slate-700 select-none"
               onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', {'key': 'd'}))}
             >
               <ChevronRight size={24} className="text-slate-400" />
             </button>
           </div>
        </div>

        <button 
          className="px-6 h-12 rounded-2xl bg-rose-500 text-white font-orbitron font-bold flex items-center gap-2 shadow-lg shadow-rose-500/20 active:scale-95 transition-transform hover:bg-rose-400 select-none"
          onClick={() => {
            window.dispatchEvent(new KeyboardEvent('keydown', {'key': ' '}));
          }}
        >
          <PlayCircle size={20} />
          STRIKE!
        </button>

        <button 
          onClick={onReset}
          className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center active:scale-90 transition-transform text-slate-400 hover:text-rose-400 hover:bg-slate-700 select-none"
        >
          <RotateCcw size={20} />
        </button>
      </div>
    </div>
  );
};

export default Controls;
