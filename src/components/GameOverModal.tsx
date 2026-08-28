import React, { useState } from 'react';
import { RotateCcw, Home, Trophy, Crosshair, Award, Zap } from 'lucide-react';
import { HighScoreRecord } from '../types';

interface GameOverModalProps {
  score: number;
  wave: number;
  shotsFired: number;
  shotsHit: number;
  highScores: HighScoreRecord[];
  onRestart: () => void;
  onHome: () => void;
  onSaveScore: (name: string) => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  wave,
  shotsFired,
  shotsHit,
  highScores,
  onRestart,
  onHome,
  onSaveScore,
}) => {
  const [pilotName, setPilotName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const accuracy = shotsFired > 0 ? Math.round((shotsHit / shotsFired) * 100) : 0;
  const isHighScore = highScores.length === 0 || score > (highScores[highScores.length - 1]?.score || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pilotName.trim() || submitted) return;
    onSaveScore(pilotName);
    setSubmitted(true);
  };

  return (
    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-30 select-none">
      <div className="w-full max-w-md bg-slate-900/95 border border-rose-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 text-slate-100 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="text-center flex flex-col items-center gap-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono tracking-widest uppercase">
            ⚠️ VESSEL DESTROYED
          </div>
          <h2 className="text-3xl sm:text-4xl font-black font-mono tracking-wider text-rose-500">
            GAME OVER
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Mission ended in Sector {wave}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 bg-slate-950/80 p-4 rounded-xl border border-slate-800 font-mono text-center">
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-400">FINAL SCORE</span>
            <span className="text-2xl font-black text-amber-400">
              {score.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-400">SECTOR REACHED</span>
            <span className="text-2xl font-black text-sky-400">
              {wave}
            </span>
          </div>
          <div className="flex flex-col border-t border-slate-800/80 pt-2 mt-1">
            <span className="text-[11px] text-slate-400">FIRING ACCURACY</span>
            <span className="text-base font-bold text-slate-200">
              {accuracy}%
            </span>
          </div>
          <div className="flex flex-col border-t border-slate-800/80 pt-2 mt-1">
            <span className="text-[11px] text-slate-400">TARGETS HIT</span>
            <span className="text-base font-bold text-slate-200">
              {shotsHit} / {shotsFired}
            </span>
          </div>
        </div>

        {/* High Score Submission */}
        {!submitted ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <label htmlFor="pilot-callsign-input" className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              {isHighScore ? 'NEW HIGH SCORE! ENTER CALLSIGN:' : 'LOG YOUR FLIGHT CALLSIGN:'}
            </label>
            <div className="flex gap-2">
              <input
                id="pilot-callsign-input"
                type="text"
                maxLength={10}
                placeholder="PILOT"
                value={pilotName}
                onChange={e => setPilotName(e.target.value.toUpperCase())}
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono text-sm tracking-wider uppercase focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                id="submit-callsign-btn"
                disabled={!pilotName.trim()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-mono font-bold text-xs rounded-lg transition active:scale-95 cursor-pointer"
              >
                SAVE
              </button>
            </div>
          </form>
        ) : (
          <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/50 rounded-lg text-center text-xs font-mono text-emerald-400 font-bold">
            ✓ RECORD LOGGED TO COMMAND ARCHIVES
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            id="restart-mission-btn"
            onClick={onRestart}
            className="flex-1 py-3 px-4 rounded-xl font-mono font-bold text-xs tracking-wider uppercase bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/30 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> PLAY AGAIN
          </button>
          <button
            id="home-menu-btn"
            onClick={onHome}
            className="py-3 px-4 rounded-xl font-mono font-bold text-xs tracking-wider uppercase bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Home className="w-4 h-4" /> MENU
          </button>
        </div>

      </div>
    </div>
  );
};
