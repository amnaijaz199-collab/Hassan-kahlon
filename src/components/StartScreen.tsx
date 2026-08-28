import React from 'react';
import { DifficultySetting, HighScoreRecord } from '../types';
import { DIFFICULTIES } from '../hooks/useGameEngine';
import { Play, Trophy, Shield, Zap, Crosshair, Award, Volume2, VolumeX } from 'lucide-react';

interface StartScreenProps {
  onStart: (diff: DifficultySetting) => void;
  selectedDifficulty: DifficultySetting;
  onSelectDifficulty: (diff: DifficultySetting) => void;
  highScores: HighScoreRecord[];
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onStart,
  selectedDifficulty,
  onSelectDifficulty,
  highScores,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto select-none z-20">
      <div className="w-full max-w-md bg-slate-900/90 border border-sky-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 text-slate-100">
        
        {/* Arcade Title Header */}
        <div className="text-center flex flex-col items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-mono tracking-widest uppercase">
            <Crosshair className="w-3.5 h-3.5" /> Sector Defense Protocol
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-mono tracking-wider bg-gradient-to-r from-sky-400 via-indigo-300 to-amber-400 bg-clip-text text-transparent">
            SPACE SHOOTER
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Classic 2D Arcade Space Combat & Survival
          </p>
        </div>

        {/* Difficulty Selection */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-mono tracking-wider text-slate-400">SELECT MISSION DIFFICULTY</span>
          <div className="grid grid-cols-3 gap-2">
            {DIFFICULTIES.map(diff => {
              const isSelected = selectedDifficulty.id === diff.id;
              return (
                <button
                  key={diff.id}
                  id={`diff-btn-${diff.id}`}
                  onClick={() => onSelectDifficulty(diff)}
                  className={`p-2.5 rounded-xl border text-center font-mono text-xs transition flex flex-col items-center gap-1 ${
                    isSelected
                      ? 'bg-sky-500/20 border-sky-400 text-sky-300 font-bold shadow-lg shadow-sky-500/10 scale-[1.02]'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span className="font-bold">{diff.name}</span>
                  <span className="text-[10px] opacity-75">{diff.scoreMultiplier}x Score</span>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-400 italic text-center">
            {selectedDifficulty.description}
          </p>
        </div>

        {/* Controls & Features Briefing */}
        <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-2 text-xs font-mono text-slate-300">
          <div className="font-bold text-sky-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> FLIGHT CONTROLS:
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
            <div><span className="text-slate-500">Move:</span> WASD / Arrow Keys</div>
            <div><span className="text-slate-500">Fire:</span> Space / Mouse Drag</div>
            <div><span className="text-slate-500">Smart Bomb:</span> [B] / [X] Key</div>
            <div><span className="text-slate-500">Pause / Mute:</span> [P] / [M] Key</div>
          </div>
        </div>

        {/* High Scores Leaderboard Preview */}
        {highScores.length > 0 && (
          <div className="flex flex-col gap-1.5 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs font-mono text-amber-400 font-bold">
              <span className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5" /> TOP PILOTS</span>
              <span className="text-slate-500 text-[10px]">LOCAL RECORDS</span>
            </div>
            <div className="flex flex-col gap-1 text-xs font-mono">
              {highScores.slice(0, 3).map((rec, i) => (
                <div key={rec.id} className="flex justify-between items-center text-slate-300 text-[11px]">
                  <span className="flex items-center gap-1">
                    <span className="text-amber-500 font-bold">{i + 1}.</span>
                    <span className="font-semibold">{rec.name}</span>
                    <span className="text-slate-500 text-[10px]">W{rec.wave}</span>
                  </span>
                  <span className="font-bold text-amber-300">{rec.score.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Start Game Action */}
        <div className="flex flex-col gap-2">
          <button
            id="start-mission-btn"
            onClick={() => onStart(selectedDifficulty)}
            className="w-full py-3.5 px-6 rounded-xl font-mono font-black text-sm tracking-wider uppercase bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-xl shadow-sky-500/25 border border-sky-400 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" /> LAUNCH MISSION
          </button>

          <div className="flex justify-center">
            <button
              id="start-screen-sound-toggle"
              onClick={onToggleSound}
              className="text-xs font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1.5 px-3 py-1 rounded-lg hover:bg-slate-800/50 transition"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-sky-400" /> Audio: Enabled
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-rose-400" /> Audio: Muted
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
