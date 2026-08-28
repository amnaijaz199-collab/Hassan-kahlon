import React, { useRef, useEffect } from 'react';
import { Player, Enemy, Bullet, Particle, PowerUpItem, FloatingText, Star, Boss } from '../types';

interface GameCanvasProps {
  playerRef: React.MutableRefObject<Player>;
  enemiesRef: React.MutableRefObject<Enemy[]>;
  bulletsRef: React.MutableRefObject<Bullet[]>;
  particlesRef: React.MutableRefObject<Particle[]>;
  powerUpsRef: React.MutableRefObject<PowerUpItem[]>;
  floatingTextsRef: React.MutableRefObject<FloatingText[]>;
  starsRef: React.MutableRefObject<Star[]>;
  mousePosRef: React.MutableRefObject<{ x: number; y: number; active: boolean }>;
  screenShake: number;
  canvasWidth: number;
  canvasHeight: number;
  gameStatus: string;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  playerRef,
  enemiesRef,
  bulletsRef,
  particlesRef,
  powerUpsRef,
  floatingTextsRef,
  starsRef,
  mousePosRef,
  screenShake,
  canvasWidth,
  canvasHeight,
  gameStatus,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Apply screen shake
      ctx.save();
      if (screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * screenShake;
        const shakeY = (Math.random() - 0.5) * screenShake;
        ctx.translate(shakeX, shakeY);
      }

      // 1. Draw Deep Space Background with Nebulas
      const bgGrad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      bgGrad.addColorStop(0, '#030712');
      bgGrad.addColorStop(0.5, '#0B0F19');
      bgGrad.addColorStop(1, '#020617');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Subtle Nebula glow circles
      const nebula1 = ctx.createRadialGradient(canvasWidth * 0.25, canvasHeight * 0.3, 20, canvasWidth * 0.25, canvasHeight * 0.3, 350);
      nebula1.addColorStop(0, 'rgba(56, 189, 248, 0.06)');
      nebula1.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = nebula1;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      const nebula2 = ctx.createRadialGradient(canvasWidth * 0.75, canvasHeight * 0.7, 30, canvasWidth * 0.75, canvasHeight * 0.7, 400);
      nebula2.addColorStop(0, 'rgba(168, 85, 247, 0.05)');
      nebula2.addColorStop(1, 'rgba(168, 85, 247, 0)');
      ctx.fillStyle = nebula2;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // 2. Draw Stars
      starsRef.current.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        if (star.size > 2) {
          ctx.fillStyle = `rgba(186, 230, 253, ${star.alpha * 0.4})`;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 3. Draw Particles (Debris, Shockwaves, Sparks)
      particlesRef.current.forEach(p => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);

        if (p.type === 'RING') {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1 - p.alpha + 0.1), 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // 4. Draw Power-Ups
      powerUpsRef.current.forEach(item => {
        ctx.save();
        const pulse = Math.sin(item.pulsePhase) * 3;
        const r = item.radius + pulse;

        // Glow ring
        ctx.shadowBlur = 12;
        let color = '#38BDF8';
        let label = 'W';

        if (item.type === 'WEAPON_UPGRADE') {
          color = '#F59E0B';
          label = '⚡';
        } else if (item.type === 'SHIELD_RESTORE') {
          color = '#10B981';
          label = '🛡️';
        } else if (item.type === 'BOMB') {
          color = '#EF4444';
          label = '💣';
        } else if (item.type === 'SPEED_BOOST') {
          color = '#FBBF24';
          label = '🚀';
        } else if (item.type === 'SCORE_MULTIPLIER') {
          color = '#A855F7';
          label = '3X';
        }

        ctx.shadowColor = color;
        ctx.strokeStyle = color;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.lineWidth = 2.5;

        // Outer Hexagon
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i + item.pulsePhase * 0.5;
          const px = item.x + r * Math.cos(angle);
          const py = item.y + r * Math.sin(angle);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Icon Label
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, item.x, item.y);

        ctx.restore();
      });

      // 5. Draw Enemies & Boss
      enemiesRef.current.forEach(enemy => {
        ctx.save();
        ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);

        if (enemy.type === 'BOSS') {
          const boss = enemy as Boss;
          const w = boss.width;
          const h = boss.height;

          // Boss glow
          ctx.shadowBlur = 18;
          ctx.shadowColor = boss.color;

          // Main Dreadnought Hull
          ctx.fillStyle = '#1E1B4B';
          ctx.strokeStyle = boss.color;
          ctx.lineWidth = 3;

          ctx.beginPath();
          ctx.moveTo(0, h / 2); // bottom beak
          ctx.lineTo(-w / 2, -h / 6); // left wing tip
          ctx.lineTo(-w / 3, -h / 2); // left top
          ctx.lineTo(w / 3, -h / 2); // right top
          ctx.lineTo(w / 2, -h / 6); // right wing tip
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Wing Cannons
          ctx.fillStyle = boss.accentColor;
          ctx.fillRect(-w / 2 + 10, -h / 3, 14, 30);
          ctx.fillRect(w / 2 - 24, -h / 3, 14, 30);

          // Glowing Central Core
          const corePulse = Math.sin(Date.now() * 0.008) * 0.3 + 0.7;
          ctx.fillStyle = `rgba(244, 63, 94, ${corePulse})`;
          ctx.shadowColor = '#F43F5E';
          ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.arc(0, 0, 18, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2);
          ctx.fill();
        } else if (enemy.type === 'ASTEROID') {
          // Rotating Asteroid
          const rot = enemy.behaviorTimer * 1.5;
          ctx.rotate(rot);

          ctx.fillStyle = '#44403C';
          ctx.strokeStyle = '#78716C';
          ctx.lineWidth = 2;

          ctx.beginPath();
          const points = 7;
          const radius = enemy.width / 2;
          for (let i = 0; i < points; i++) {
            const angle = (Math.PI * 2 * i) / points;
            const variance = ((i % 2 === 0) ? 0.85 : 1.15);
            const px = Math.cos(angle) * radius * variance;
            const py = Math.sin(angle) * radius * variance;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Crater details
          ctx.fillStyle = '#292524';
          ctx.beginPath();
          ctx.arc(-radius * 0.3, -radius * 0.2, radius * 0.25, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(radius * 0.25, radius * 0.3, radius * 0.2, 0, Math.PI * 2);
          ctx.fill();
        } else if (enemy.type === 'DRONE') {
          // Fast Scout Drone
          ctx.shadowBlur = 8;
          ctx.shadowColor = enemy.color;

          ctx.fillStyle = '#18181B';
          ctx.strokeStyle = enemy.color;
          ctx.lineWidth = 2;

          ctx.beginPath();
          ctx.moveTo(0, enemy.height / 2);
          ctx.lineTo(-enemy.width / 2, -enemy.height / 2);
          ctx.lineTo(0, -enemy.height / 4);
          ctx.lineTo(enemy.width / 2, -enemy.height / 2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Red eye
          ctx.fillStyle = '#EF4444';
          ctx.beginPath();
          ctx.arc(0, 0, 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (enemy.type === 'BOMBER') {
          // Heavy Bomber
          ctx.shadowBlur = 10;
          ctx.shadowColor = enemy.color;

          ctx.fillStyle = '#2E1065';
          ctx.strokeStyle = enemy.accentColor;
          ctx.lineWidth = 2;

          ctx.beginPath();
          ctx.moveTo(0, enemy.height / 2);
          ctx.lineTo(-enemy.width / 2, 0);
          ctx.lineTo(-enemy.width / 3, -enemy.height / 2);
          ctx.lineTo(enemy.width / 3, -enemy.height / 2);
          ctx.lineTo(enemy.width / 2, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Core
          ctx.fillStyle = '#A855F7';
          ctx.fillRect(-6, -6, 12, 12);
        } else {
          // Standard Fighter / Interceptor
          ctx.shadowBlur = 8;
          ctx.shadowColor = enemy.color;

          ctx.fillStyle = '#1E293B';
          ctx.strokeStyle = enemy.accentColor;
          ctx.lineWidth = 2;

          ctx.beginPath();
          ctx.moveTo(0, enemy.height / 2);
          ctx.lineTo(-enemy.width / 2, -enemy.height / 3);
          ctx.lineTo(-enemy.width / 4, -enemy.height / 2);
          ctx.lineTo(enemy.width / 4, -enemy.height / 2);
          ctx.lineTo(enemy.width / 2, -enemy.height / 3);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Cockpit
          ctx.fillStyle = enemy.color;
          ctx.beginPath();
          ctx.arc(0, 0, 5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        // Enemy HP mini bar if damaged
        if (enemy.hp < enemy.maxHp && enemy.type !== 'BOSS') {
          const barW = enemy.width;
          const barH = 3;
          const pct = Math.max(0, enemy.hp / enemy.maxHp);
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.fillRect(enemy.x, enemy.y - 8, barW, barH);
          ctx.fillStyle = '#EF4444';
          ctx.fillRect(enemy.x, enemy.y - 8, barW * pct, barH);
        }
      });

      // 6. Draw Bullets
      bulletsRef.current.forEach(b => {
        ctx.save();
        ctx.shadowBlur = b.penetrating ? 14 : 8;
        ctx.shadowColor = b.glowColor;

        if (b.isPlayer) {
          if (b.type === 'PLASMA') {
            // Big Plasma Orb
            const grad = ctx.createRadialGradient(b.x, b.y, 2, b.x, b.y, b.radius);
            grad.addColorStop(0, '#FFFFFF');
            grad.addColorStop(0.5, b.color);
            grad.addColorStop(1, 'rgba(168, 85, 247, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Laser beam pill
            ctx.fillStyle = b.color;
            ctx.beginPath();
            ctx.roundRect(b.x - b.radius, b.y - b.radius * 2, b.radius * 2, b.radius * 4, 3);
            ctx.fill();

            // Core highlight
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.roundRect(b.x - b.radius * 0.4, b.y - b.radius * 1.5, b.radius * 0.8, b.radius * 3, 2);
            ctx.fill();
          }
        } else {
          // Enemy Bullet Orb
          ctx.fillStyle = b.color;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // 7. Draw Player Spaceship
      const p = playerRef.current;
      if (p.lives > 0 && gameStatus !== 'GAMEOVER') {
        ctx.save();
        ctx.translate(p.x, p.y);

        // Invulnerability flicker
        if (p.invulnerableTime > 0) {
          ctx.globalAlpha = Math.sin(Date.now() * 0.02) > 0 ? 0.4 : 1.0;
        }

        // Thruster exhaust flame
        const thrusterLen = 14 + Math.random() * 8 + (p.speedBoostTimer > 0 ? 12 : 0);
        const flameGrad = ctx.createLinearGradient(0, p.height / 3, 0, p.height / 3 + thrusterLen);
        flameGrad.addColorStop(0, '#FFFFFF');
        flameGrad.addColorStop(0.3, p.speedBoostTimer > 0 ? '#F59E0B' : '#38BDF8');
        flameGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

        ctx.fillStyle = flameGrad;
        ctx.beginPath();
        ctx.moveTo(-7, p.height / 3);
        ctx.lineTo(0, p.height / 3 + thrusterLen);
        ctx.lineTo(7, p.height / 3);
        ctx.closePath();
        ctx.fill();

        // Ship Body
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#0284C7';

        // Main Hull
        ctx.fillStyle = '#0F172A';
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.moveTo(0, -p.height / 2); // Nose cone
        ctx.lineTo(p.width / 2, p.height / 3); // Right wing tip
        ctx.lineTo(p.width / 3, p.height / 2); // Right thruster
        ctx.lineTo(-p.width / 3, p.height / 2); // Left thruster
        ctx.lineTo(-p.width / 2, p.height / 3); // Left wing tip
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Wing accents
        ctx.strokeStyle = '#0EA5E9';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-p.width / 4, 0);
        ctx.lineTo(-p.width / 2, p.height / 4);
        ctx.moveTo(p.width / 4, 0);
        ctx.lineTo(p.width / 2, p.height / 4);
        ctx.stroke();

        // Cockpit canopy
        const canopyGrad = ctx.createLinearGradient(0, -p.height / 4, 0, p.height / 8);
        canopyGrad.addColorStop(0, '#67E8F9');
        canopyGrad.addColorStop(1, '#0284C7');
        ctx.fillStyle = canopyGrad;
        ctx.beginPath();
        ctx.ellipse(0, -p.height / 8, 5, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Active Shield Bubble
        if (p.shield > 0) {
          const shieldPulse = Math.sin(Date.now() * 0.006) * 0.15 + 0.85;
          ctx.strokeStyle = `rgba(56, 189, 248, ${0.4 * (p.shield / p.maxShield) * shieldPulse})`;
          ctx.lineWidth = 2;
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#38BDF8';
          ctx.beginPath();
          ctx.arc(0, 0, p.width * 0.75, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();
      }

      // 8. Draw Floating Texts
      floatingTextsRef.current.forEach(ft => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.fillStyle = ft.color;
        ctx.shadowColor = ft.color;
        ctx.shadowBlur = 8;
        ctx.font = `bold ${ft.size}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      });

      ctx.restore(); // restore screen shake

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [playerRef, enemiesRef, bulletsRef, particlesRef, powerUpsRef, floatingTextsRef, starsRef, screenShake, canvasWidth, canvasHeight, gameStatus]);

  // Handle Mouse / Pointer Events
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvasWidth / rect.width;
    const scaleY = canvasHeight / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    mousePosRef.current = { x, y, active: true };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!mousePosRef.current.active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvasWidth / rect.width;
    const scaleY = canvasHeight / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    mousePosRef.current.x = x;
    mousePosRef.current.y = y;
  };

  const handlePointerUp = () => {
    mousePosRef.current.active = false;
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden select-none bg-slate-950">
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="w-full h-full max-w-[800px] max-h-[900px] object-contain aspect-[8/9] touch-none cursor-crosshair rounded-xl shadow-2xl border border-slate-800/80 bg-slate-950"
      />
    </div>
  );
};
