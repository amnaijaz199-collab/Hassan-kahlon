import React from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { StartScreen } from './components/StartScreen';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { TouchControls } from './components/TouchControls';
import { Rocket, Shield, Crosshair, Zap, Trophy, Volume2, VolumeX } from 'lucide-react';

export default function App() {
  const {
    gameStatus,
    setGameStatus,
    difficulty,
    setDifficulty,
    highScores,
    saveHighScore,
    displayState,
    wave,
    waveBanner,
    screenShake,
    soundEnabled,
    toggleSound,
    startGame,
    triggerBomb,
    playerRef,
    enemiesRef,
    bulletsRef,
    particlesRef,
    powerUpsRef,
    floatingTextsRef,
    starsRef,
    mousePosRef,
    touchSteerRef,
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
  } = useGameEngine();

  const highestScore = highScores.length > 0 ? highScores[0].score : 0;

  return (
    <main className="w-screen h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center overflow-hidden font-sans select-none">
      
      {/* Game Cabinet Container */}
      <div className="relative w-full h-full max-w-[840px] max-h-[920px] p-1 sm:p-3 flex flex-col items-center justify-center">
        
        {/* Playfield Area */}
        <div className="relative w-full h-full flex items-center justify-center rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950">
          
          {/* Main 2D Canvas */}
          <GameCanvas
            playerRef={playerRef}
            enemiesRef={enemiesRef}
            bulletsRef={bulletsRef}
            particlesRef={particlesRef}
            powerUpsRef={powerUpsRef}
            floatingTextsRef={floatingTextsRef}
            starsRef={starsRef}
            mousePosRef={mousePosRef}
            screenShake={screenShake}
            canvasWidth={CANVAS_WIDTH}
            canvasHeight={CANVAS_HEIGHT}
            gameStatus={gameStatus}
          />

          {/* HUD Overlay during Gameplay or Pause */}
          {(gameStatus === 'PLAYING' || gameStatus === 'PAUSED') && (
            <HUD
              score={displayState.score}
              highScore={highestScore}
              wave={wave}
              lives={displayState.lives}
              shield={displayState.shield}
              bombs={displayState.bombs}
              weaponType={displayState.weaponType}
              weaponLevel={displayState.weaponLevel}
              combo={displayState.combo}
              multiplier={displayState.multiplier}
              bossHp={displayState.bossHp}
              soundEnabled={soundEnabled}
              onToggleSound={toggleSound}
              onPause={() => setGameStatus('PAUSED')}
              onTriggerBomb={triggerBomb}
            />
          )}

          {/* Wave Alert Banner */}
          {waveBanner && gameStatus === 'PLAYING' && (
            <div className="absolute top-24 inset-x-0 flex justify-center pointer-events-none z-15 animate-bounce">
              <div className="px-6 py-2.5 rounded-full bg-slate-900/90 border border-sky-400 text-sky-300 font-mono font-black text-sm sm:text-base tracking-widest uppercase shadow-2xl shadow-sky-500/20 backdrop-blur-md">
                {waveBanner}
              </div>
            </div>
          )}

          {/* Start Screen */}
          {gameStatus === 'START' && (
            <StartScreen
              onStart={startGame}
              selectedDifficulty={difficulty}
              onSelectDifficulty={setDifficulty}
              highScores={highScores}
              soundEnabled={soundEnabled}
              onToggleSound={toggleSound}
            />
          )}

          {/* Pause Modal */}
          {gameStatus === 'PAUSED' && (
            <PauseModal
              onResume={() => setGameStatus('PLAYING')}
              onRestart={() => startGame(difficulty)}
              onHome={() => setGameStatus('START')}
              soundEnabled={soundEnabled}
              onToggleSound={toggleSound}
            />
          )}

          {/* Game Over Modal */}
          {gameStatus === 'GAMEOVER' && (
            <GameOverModal
              score={displayState.score}
              wave={wave}
              shotsFired={playerRef.current.shotsFired}
              shotsHit={playerRef.current.shotsHit}
              highScores={highScores}
              onRestart={() => startGame(difficulty)}
              onHome={() => setGameStatus('START')}
              onSaveScore={saveHighScore}
            />
          )}

          {/* Mobile Touch Controls */}
          {gameStatus === 'PLAYING' && (
            <TouchControls
              touchSteerRef={touchSteerRef}
              onTriggerBomb={triggerBomb}
              bombs={displayState.bombs}
            />
          )}

        </div>

      </div>

    </main>
  );
}
