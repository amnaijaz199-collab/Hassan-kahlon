import React, { useRef, useState } from 'react';
import { Crosshair, Bomb } from 'lucide-react';

interface TouchControlsProps {
  touchSteerRef: React.MutableRefObject<{ vx: number; vy: number; firing: boolean }>;
  onTriggerBomb: () => void;
  bombs: number;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  touchSteerRef,
  onTriggerBomb,
  bombs,
}) => {
  const joystickRef = useRef<HTMLDivElement | null>(null);
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isTouching, setIsTouching] = useState(false);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsTouching(true);
    updateJoystick(e.touches[0]);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isTouching) return;
    updateJoystick(e.touches[0]);
  };

  const handleTouchEnd = () => {
    setIsTouching(false);
    setKnobPos({ x: 0, y: 0 });
    touchSteerRef.current.vx = 0;
    touchSteerRef.current.vy = 0;
  };

  const updateJoystick = (touch: React.Touch) => {
    if (!joystickRef.current) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const maxRadius = rect.width / 2;
    const dist = Math.hypot(dx, dy);

    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);

    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    setKnobPos({ x: knobX, y: knobY });

    // Normalize -1 to 1
    touchSteerRef.current.vx = knobX / maxRadius;
    touchSteerRef.current.vy = knobY / maxRadius;
  };

  return (
    <div className="absolute inset-x-0 bottom-4 pointer-events-none px-4 flex justify-between items-end sm:hidden z-10 select-none">
      {/* Virtual Joystick */}
      <div
        ref={joystickRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className="pointer-events-auto w-28 h-28 rounded-full bg-slate-900/60 border border-slate-700/80 backdrop-blur-md relative flex items-center justify-center shadow-xl active:border-sky-500/50"
      >
        <div
          className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-indigo-600 border border-sky-300 shadow-md transform transition-transform"
          style={{
            transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          }}
        />
      </div>

      {/* Action Buttons (Fire + Bomb) */}
      <div className="pointer-events-auto flex items-center gap-3">
        {/* Smart Bomb Button */}
        <button
          id="touch-bomb-btn"
          onClick={onTriggerBomb}
          disabled={bombs <= 0}
          className={`w-14 h-14 rounded-full border flex flex-col items-center justify-center font-mono font-black text-[10px] shadow-xl backdrop-blur-md transition active:scale-90 ${
            bombs > 0
              ? 'bg-rose-900/80 border-rose-500 text-rose-200'
              : 'bg-slate-900/50 border-slate-800 text-slate-600'
          }`}
        >
          <Bomb className="w-5 h-5" />
          <span>{bombs}</span>
        </button>

        {/* Rapid Fire Button */}
        <button
          id="touch-fire-btn"
          onTouchStart={() => {
            touchSteerRef.current.firing = true;
          }}
          onTouchEnd={() => {
            touchSteerRef.current.firing = false;
          }}
          onMouseDown={() => {
            touchSteerRef.current.firing = true;
          }}
          onMouseUp={() => {
            touchSteerRef.current.firing = false;
          }}
          className="w-18 h-18 rounded-full bg-gradient-to-br from-amber-500 to-rose-600 border-2 border-amber-300 text-white shadow-2xl flex flex-col items-center justify-center font-mono font-black text-xs active:scale-95 transition"
        >
          <Crosshair className="w-6 h-6 animate-pulse" />
          <span>FIRE</span>
        </button>
      </div>
    </div>
  );
};
