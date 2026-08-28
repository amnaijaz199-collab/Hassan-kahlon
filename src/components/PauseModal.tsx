import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onHome,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-30 select-none">
      <div className="w-full max-w-xs sm:max-w-sm bg-slate-900/95 border border-slate-700 rounded-2xl p-6 shadow-2xl flex flex-col gap-5 text-slate-100 text-center animate-in fade-in zoom-in duration-150">
        <h3 className="text-2xl font-black font-mono tracking-wider text-sky-400">
          MISSION PAUSED
        </h3>

        <div className="flex flex-col gap-2.5 font-mono text-xs">
          <button
            id="resume-btn"
            onClick={onResume}
            className="w-full py-3 px-4 rounded-xl font-bold tracking-wider uppercase bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/20 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" /> RESUME MISSION
          </button>

          <button
            id="pause-toggle-sound-btn"
            onClick={onToggleSound}
            className="w-full py-2.5 px-4 rounded-xl font-bold tracking-wider uppercase bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-sky-400" /> SOUND: ON
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-rose-400" /> SOUND: MUTED
              </>
            )}
          </button>

          <button
            id="pause-restart-btn"
            onClick={onRestart}
            className="w-full py-2.5 px-4 rounded-xl font-bold tracking-wider uppercase bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> RESTART MISSION
          </button>

          <button
            id="pause-home-btn"
            onClick={onHome}
            className="w-full py-2.5 px-4 rounded-xl font-bold tracking-wider uppercase bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" /> RETURN TO MENU
          </button>
        </div>

        <p className="text-[11px] text-slate-500 font-mono">
          Press [P] or [ESC] to resume
        </p>
      </div>
    </div>
  );
};
