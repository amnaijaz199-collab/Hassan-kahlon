import React from 'react';
import { WeaponType } from '../types';
import { Volume2, VolumeX, Pause, Shield, Zap, Bomb, Heart, Crosshair } from 'lucide-react';

interface HUDProps {
  score: number;
  highScore: number;
  wave: number;
  lives: number;
  shield: number;
  bombs: number;
  weaponType: WeaponType;
  weaponLevel: number;
  combo: number;
  multiplier: number;
  bossHp: { current: number; max: number; name: string } | null;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onPause: () => void;
  onTriggerBomb: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  score,
  highScore,
  wave,
  lives,
  shield,
  bombs,
  weaponType,
  weaponLevel,
  combo,
  multiplier,
  bossHp,
  soundEnabled,
  onToggleSound,
  onPause,
  onTriggerBomb,
}) => {
  const getWeaponLabel = () => {
    switch (weaponType) {
      case 'DOUBLE': return 'DUAL LASERS';
      case 'SPREAD': return 'SPREAD CANNON';
      case 'PLASMA': return 'PLASMA ORB';
      default: return 'PULSE LASER';
    }
  };

  const getWeaponBadgeColor = () => {
    switch (weaponType) {
      case 'DOUBLE': return 'bg-cyan-950/80 border-cyan-500 text-cyan-400';
      case 'SPREAD': return 'bg-amber-950/80 border-amber-500 text-amber-400';
      case 'PLASMA': return 'bg-purple-950/80 border-purple-500 text-purple-400';
      default: return 'bg-blue-950/80 border-blue-500 text-blue-400';
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none p-3 sm:p-5 flex flex-col justify-between select-none">
      {/* Top Header Bar */}
      <div className="flex items-start justify-between gap-3">
        {/* Score & High Score */}
        <div className="flex flex-col gap-1 bg-slate-900/85 backdrop-blur-md px-3.5 py-2 rounded-lg border border-slate-800 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono tracking-widest text-slate-400">SCORE</span>
            <span className="text-xl sm:text-2xl font-mono font-black text-amber-400 tracking-wider">
              {score.toLocaleString().padStart(6, '0')}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span>HI-SCORE</span>
            <span className="text-slate-200 font-bold">{Math.max(score, highScore).toLocaleString()}</span>
          </div>
        </div>

        {/* Wave & Boss Health in Center */}
        <div className="flex flex-col items-center gap-1.5 max-w-[280px] sm:max-w-md w-full">
          <div className="bg-slate-900/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-sky-500/40 shadow-lg flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-sky-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="text-xs sm:text-sm font-mono font-bold text-sky-300 tracking-wider">
              SECTOR {wave}
            </span>
          </div>

          {/* Boss HP Bar */}
          {bossHp && (
            <div className="w-full bg-slate-950/90 p-2 rounded-lg border border-rose-600/80 shadow-2xl backdrop-blur-md animate-pulse">
              <div className="flex justify-between items-center text-[10px] sm:text-xs font-mono font-bold text-rose-400 mb-1">
                <span>⚠️ {bossHp.name}</span>
                <span>{Math.round((bossHp.current / bossHp.max) * 100)}%</span>
              </div>
              <div className="w-full h-2.5 sm:h-3 bg-slate-800 rounded-full overflow-hidden border border-rose-900">
                <div
                  className="h-full bg-gradient-to-r from-rose-600 via-red-500 to-amber-400 transition-all duration-150"
                  style={{ width: `${Math.max(0, Math.min(100, (bossHp.current / bossHp.max) * 100))}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Controls (Sound & Pause) */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            id="toggle-sound-btn"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
            className="p-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700 shadow-md backdrop-blur-md transition active:scale-95"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-sky-400" /> : <VolumeX className="w-5 h-5 text-rose-400" />}
          </button>
          <button
            id="pause-game-btn"
            onClick={onPause}
            aria-label="Pause Game"
            className="p-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700 shadow-md backdrop-blur-md transition active:scale-95"
          >
            <Pause className="w-5 h-5 text-slate-200" />
          </button>
        </div>
      </div>

      {/* Combo Multiplier Banner (When active) */}
      {combo > 1 && (
        <div className="self-center bg-gradient-to-r from-sky-500/20 via-indigo-500/30 to-purple-500/20 border border-sky-400/50 backdrop-blur-md px-4 py-1.5 rounded-full shadow-xl flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400 animate-bounce" />
          <span className="text-xs sm:text-sm font-mono font-black text-amber-300">
            {combo} HITS COMBO
          </span>
          <span className="text-[11px] font-mono font-bold bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded">
            {multiplier}x
          </span>
        </div>
      )}

      {/* Bottom Status Bar */}
      <div className="flex items-end justify-between gap-3">
        {/* Lives & Shield */}
        <div className="flex flex-col gap-2 bg-slate-900/90 backdrop-blur-md p-3 rounded-lg border border-slate-800 shadow-lg min-w-[150px] sm:min-w-[190px]">
          {/* Lives Indicator */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-slate-400 mr-1">LIVES</span>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Heart
                  key={i}
                  className={`w-4 h-4 transition ${
                    i < lives ? 'text-rose-500 fill-rose-500' : 'text-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Shield Gauge */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-[10px] font-mono">
              <span className="flex items-center gap-1 text-sky-400">
                <Shield className="w-3 h-3" /> SHIELD
              </span>
              <span className={`font-bold ${shield > 30 ? 'text-sky-300' : 'text-rose-400'}`}>
                {shield}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className={`h-full transition-all duration-100 ${
                  shield > 30 ? 'bg-gradient-to-r from-cyan-500 to-sky-400' : 'bg-rose-500 animate-pulse'
                }`}
                style={{ width: `${shield}%` }}
              />
            </div>
          </div>
        </div>

        {/* Weapon & Smart Bombs */}
        <div className="flex flex-col items-end gap-2">
          {/* Weapon Badge */}
          <div className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-2 shadow-lg backdrop-blur-md ${getWeaponBadgeColor()}`}>
            <Zap className="w-3.5 h-3.5" />
            <span>{getWeaponLabel()}</span>
            {weaponLevel > 1 && (
              <span className="text-[10px] bg-white/20 px-1 py-0.2 rounded font-black">
                LV.{weaponLevel}
              </span>
            )}
          </div>

          {/* Smart Bomb Button */}
          <button
            id="trigger-bomb-hud-btn"
            onClick={onTriggerBomb}
            disabled={bombs <= 0}
            aria-label="Smart Bomb"
            className={`pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-lg border font-mono text-xs font-bold shadow-lg transition active:scale-95 ${
              bombs > 0
                ? 'bg-rose-950/80 hover:bg-rose-900 border-rose-500/80 text-rose-200 cursor-pointer'
                : 'bg-slate-900/60 border-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            <Bomb className={`w-4 h-4 ${bombs > 0 ? 'text-rose-400 animate-pulse' : ''}`} />
            <span>BOMB ({bombs})</span>
            <span className="hidden sm:inline text-[9px] bg-rose-900/80 px-1 rounded text-rose-300">
              [B / X]
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
