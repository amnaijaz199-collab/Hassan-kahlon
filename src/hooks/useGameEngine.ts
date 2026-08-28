import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  GameStatus, Player, Enemy, Bullet, Particle, PowerUpItem, 
  FloatingText, Star, HighScoreRecord, DifficultySetting, PowerUpType, WeaponType, Boss
} from '../types';
import { sound } from '../audio';

export const DIFFICULTIES: DifficultySetting[] = [
  { id: 'EASY', name: 'Cadet', description: 'Relaxed enemy speed, extra shields & lives', enemyHpMultiplier: 0.8, enemySpeedMultiplier: 0.8, scoreMultiplier: 0.8, startingLives: 4 },
  { id: 'NORMAL', name: 'Veteran', description: 'Balanced arcade challenge', enemyHpMultiplier: 1.0, enemySpeedMultiplier: 1.0, scoreMultiplier: 1.0, startingLives: 3 },
  { id: 'HARD', name: 'Ace', description: 'Fast enemies, intense bullet patterns, higher score', enemyHpMultiplier: 1.3, enemySpeedMultiplier: 1.25, scoreMultiplier: 1.5, startingLives: 2 },
];

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 900;

export function useGameEngine() {
  const [gameStatus, setGameStatus] = useState<GameStatus>('START');
  const [difficulty, setDifficulty] = useState<DifficultySetting>(DIFFICULTIES[1]);
  const [highScores, setHighScores] = useState<HighScoreRecord[]>(() => {
    try {
      const saved = localStorage.getItem('retro_space_shooter_highscores');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [
      { id: '1', name: 'STARLORD', score: 25000, wave: 8, date: '2026-08-20', accuracy: 82 },
      { id: '2', name: 'NOVA', score: 18400, wave: 6, date: '2026-08-22', accuracy: 78 },
      { id: '3', name: 'VIPER', score: 12100, wave: 4, date: '2026-08-23', accuracy: 71 },
      { id: '4', name: 'COSMO', score: 8500, wave: 3, date: '2026-08-24', accuracy: 65 },
    ];
  });

  const [wave, setWave] = useState<number>(1);
  const [waveBanner, setWaveBanner] = useState<string | null>(null);
  const [screenShake, setScreenShake] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // High-frequency mutable state in refs to ensure 60fps game loop without React render lag
  const playerRef = useRef<Player>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 120,
    width: 44,
    height: 48,
    speed: 360,
    baseSpeed: 360,
    lives: 3,
    maxLives: 5,
    shield: 100,
    maxShield: 100,
    weaponType: 'SINGLE',
    weaponLevel: 1,
    bombs: 2,
    maxBombs: 3,
    invulnerableTime: 0,
    score: 0,
    combo: 0,
    comboTimer: 0,
    multiplier: 1,
    fireCooldown: 0,
    speedBoostTimer: 0,
    shotsFired: 0,
    shotsHit: 0,
  });

  const [displayState, setDisplayState] = useState({
    score: 0,
    lives: 3,
    shield: 100,
    bombs: 2,
    weaponType: 'SINGLE' as WeaponType,
    weaponLevel: 1,
    combo: 0,
    multiplier: 1,
    bossHp: null as { current: number; max: number; name: string } | null,
  });

  const enemiesRef = useRef<Enemy[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const powerUpsRef = useRef<PowerUpItem[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const starsRef = useRef<Star[]>([]);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const mousePosRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });
  const touchSteerRef = useRef<{ vx: number; vy: number; firing: boolean }>({ vx: 0, vy: 0, firing: false });

  const waveStateRef = useRef({
    currentWave: 1,
    enemiesToSpawn: 0,
    spawnTimer: 0,
    spawnInterval: 1.2,
    waveInProgress: false,
    bossActive: false,
  });

  const lastFrameTimeRef = useRef<number>(0);
  const animFrameIdRef = useRef<number | null>(null);

  // Initialize stars for background parallax
  useEffect(() => {
    const stars: Star[] = [];
    for (let i = 0; i < 120; i++) {
      stars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        size: Math.random() * 2.2 + 0.6,
        speed: Math.random() * 80 + 30,
        alpha: Math.random() * 0.8 + 0.2,
        layer: Math.floor(Math.random() * 3) + 1,
      });
    }
    starsRef.current = stars;
  }, []);

  // Save High Scores
  const saveHighScore = useCallback((playerName: string) => {
    const p = playerRef.current;
    const accuracy = p.shotsFired > 0 ? Math.round((p.shotsHit / p.shotsFired) * 100) : 0;
    const newRecord: HighScoreRecord = {
      id: Date.now().toString(),
      name: (playerName.trim() || 'PILOT').toUpperCase().slice(0, 10),
      score: p.score,
      wave: waveStateRef.current.currentWave,
      date: new Date().toISOString().split('T')[0],
      accuracy,
    };

    setHighScores(prev => {
      const updated = [...prev, newRecord].sort((a, b) => b.score - a.score).slice(0, 10);
      try {
        localStorage.setItem('retro_space_shooter_highscores', JSON.stringify(updated));
      } catch {
        // storage ignored
      }
      return updated;
    });
  }, []);

  // Trigger floating text
  const addFloatingText = (text: string, x: number, y: number, color: string = '#FBBF24', size: number = 18) => {
    floatingTextsRef.current.push({
      id: Math.random().toString(),
      text,
      x,
      y,
      color,
      size,
      alpha: 1,
      vy: -45,
    });
  };

  // Create explosion particles
  const createExplosion = (x: number, y: number, color: string = '#F97316', count: number = 24, isLarge: boolean = false) => {
    setScreenShake(isLarge ? 12 : 5);
    sound.playExplosion(isLarge);

    // Shockwave ring
    particlesRef.current.push({
      id: Math.random().toString(),
      x,
      y,
      vx: 0,
      vy: 0,
      size: isLarge ? 80 : 35,
      color,
      alpha: 0.9,
      decay: isLarge ? 1.8 : 2.5,
      type: 'RING',
    });

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
      const speed = Math.random() * (isLarge ? 280 : 160) + 40;
      particlesRef.current.push({
        id: Math.random().toString(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * (isLarge ? 6 : 4) + 1.5,
        color: i % 3 === 0 ? '#FFFFFF' : i % 2 === 0 ? '#FDE047' : color,
        alpha: 1,
        decay: Math.random() * 1.5 + 1.2,
        type: 'SPARK',
      });
    }
  };

  // Spawn powerup chance
  const maybeSpawnPowerUp = (x: number, y: number) => {
    const chance = Math.random();
    if (chance < 0.28) {
      const types: PowerUpType[] = ['WEAPON_UPGRADE', 'SHIELD_RESTORE', 'BOMB', 'SPEED_BOOST', 'SCORE_MULTIPLIER'];
      // Weapon upgrade / shield higher chance
      const roll = Math.random();
      let selectedType: PowerUpType = 'WEAPON_UPGRADE';
      if (roll < 0.35) selectedType = 'WEAPON_UPGRADE';
      else if (roll < 0.60) selectedType = 'SHIELD_RESTORE';
      else if (roll < 0.75) selectedType = 'BOMB';
      else if (roll < 0.90) selectedType = 'SPEED_BOOST';
      else selectedType = 'SCORE_MULTIPLIER';

      powerUpsRef.current.push({
        id: Math.random().toString(),
        type: selectedType,
        x,
        y,
        vx: (Math.random() - 0.5) * 40,
        vy: Math.random() * 30 + 50,
        radius: 16,
        pulsePhase: 0,
      });
    }
  };

  // Use Bomb (Wipes bullets, damages all enemies)
  const triggerBomb = useCallback(() => {
    const p = playerRef.current;
    if (p.bombs <= 0 || gameStatus !== 'PLAYING') return;

    p.bombs -= 1;
    sound.playBomb();
    setScreenShake(20);
    addFloatingText('SMART BOMB DEPLOYED!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, '#60A5FA', 24);

    // Convert all enemy bullets to score particles
    bulletsRef.current = bulletsRef.current.filter(b => {
      if (!b.isPlayer) {
        particlesRef.current.push({
          id: Math.random().toString(),
          x: b.x,
          y: b.y,
          vx: (Math.random() - 0.5) * 60,
          vy: (Math.random() - 0.5) * 60,
          size: 3,
          color: '#60A5FA',
          alpha: 1,
          decay: 2,
          type: 'SPARK',
        });
        return false;
      }
      return true;
    });

    // Damage all enemies
    enemiesRef.current.forEach(enemy => {
      enemy.hp -= 150;
      createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#38BDF8', 12);
    });

    // Flash bomb ring
    particlesRef.current.push({
      id: Math.random().toString(),
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      vx: 0,
      vy: 0,
      size: CANVAS_WIDTH,
      color: '#38BDF8',
      alpha: 1,
      decay: 1.2,
      type: 'RING',
    });
  }, [gameStatus]);

  // Start new game
  const startGame = useCallback((selectedDiff: DifficultySetting = difficulty) => {
    setDifficulty(selectedDiff);
    playerRef.current = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 120,
      width: 44,
      height: 48,
      speed: 360,
      baseSpeed: 360,
      lives: selectedDiff.startingLives,
      maxLives: 5,
      shield: 100,
      maxShield: 100,
      weaponType: 'SINGLE',
      weaponLevel: 1,
      bombs: 2,
      maxBombs: 3,
      invulnerableTime: 2.0, // Spawn grace period
      score: 0,
      combo: 0,
      comboTimer: 0,
      multiplier: 1,
      fireCooldown: 0,
      speedBoostTimer: 0,
      shotsFired: 0,
      shotsHit: 0,
    };

    enemiesRef.current = [];
    bulletsRef.current = [];
    particlesRef.current = [];
    powerUpsRef.current = [];
    floatingTextsRef.current = [];

    waveStateRef.current = {
      currentWave: 1,
      enemiesToSpawn: 10,
      spawnTimer: 0,
      spawnInterval: 1.2,
      waveInProgress: true,
      bossActive: false,
    };

    setWave(1);
    setWaveBanner('WAVE 1 - INITIAL CONTACT');
    setTimeout(() => setWaveBanner(null), 3000);
    setGameStatus('PLAYING');
    lastFrameTimeRef.current = performance.now();
  }, [difficulty]);

  // Start next wave
  const startNextWave = useCallback((nextWaveNum: number) => {
    setWave(nextWaveNum);
    waveStateRef.current.currentWave = nextWaveNum;

    const isBossWave = nextWaveNum % 5 === 0;

    if (isBossWave) {
      waveStateRef.current.enemiesToSpawn = 0;
      waveStateRef.current.bossActive = true;
      setWaveBanner(`⚠️ WARNING: BOSS THREAT DETECTED - SECTOR ${nextWaveNum} ⚠️`);
      sound.playBossAlarm();
      // Spawn Boss
      setTimeout(() => {
        const hpMultiplier = difficulty.enemyHpMultiplier;
        const bossHp = Math.round(500 * (1 + nextWaveNum * 0.3) * hpMultiplier);
        const boss: Boss = {
          id: 'boss_' + nextWaveNum,
          name: nextWaveNum === 5 ? 'ORBITAL DREADNOUGHT' : nextWaveNum === 10 ? 'CYBER-TITAN MK-II' : 'VOID OMEGA APEX',
          type: 'BOSS',
          x: CANVAS_WIDTH / 2 - 80,
          y: -150,
          width: 160,
          height: 120,
          vx: 80,
          vy: 60,
          hp: bossHp,
          maxHp: bossHp,
          scoreValue: 10000 * nextWaveNum,
          shootCooldown: 1.5,
          behaviorTimer: 0,
          pattern: 'HOVER',
          color: '#E11D48',
          accentColor: '#F43F5E',
          phase: 1,
          maxPhases: 3,
          specialAttackCooldown: 4.0,
          enraged: false,
        };
        enemiesRef.current.push(boss);
        setWaveBanner(null);
      }, 2500);
    } else {
      waveStateRef.current.enemiesToSpawn = 10 + nextWaveNum * 4;
      waveStateRef.current.spawnInterval = Math.max(0.4, 1.3 - nextWaveNum * 0.08);
      waveStateRef.current.bossActive = false;
      setWaveBanner(`WAVE ${nextWaveNum} - ENGAGE HOSTILES`);
      setTimeout(() => setWaveBanner(null), 2500);
    }
  }, [difficulty]);

  // Player shoot
  const playerShoot = useCallback(() => {
    const p = playerRef.current;
    if (p.fireCooldown > 0) return;

    sound.playLaser(p.weaponType);
    p.shotsFired += 1;

    const baseDamage = 25 * (1 + (p.weaponLevel - 1) * 0.2);

    if (p.weaponType === 'SINGLE') {
      p.fireCooldown = 0.16;
      bulletsRef.current.push({
        id: Math.random().toString(),
        x: p.x,
        y: p.y - p.height / 2,
        vx: 0,
        vy: -750,
        radius: 4,
        damage: baseDamage,
        isPlayer: true,
        color: '#38BDF8',
        glowColor: '#0284C7',
      });
    } else if (p.weaponType === 'DOUBLE') {
      p.fireCooldown = 0.15;
      bulletsRef.current.push(
        {
          id: Math.random().toString(),
          x: p.x - 14,
          y: p.y - p.height / 3,
          vx: 0,
          vy: -780,
          radius: 4,
          damage: baseDamage * 0.85,
          isPlayer: true,
          color: '#38BDF8',
          glowColor: '#0284C7',
        },
        {
          id: Math.random().toString(),
          x: p.x + 14,
          y: p.y - p.height / 3,
          vx: 0,
          vy: -780,
          radius: 4,
          damage: baseDamage * 0.85,
          isPlayer: true,
          color: '#38BDF8',
          glowColor: '#0284C7',
        }
      );
    } else if (p.weaponType === 'SPREAD') {
      p.fireCooldown = 0.22;
      const angles = [-0.22, -0.1, 0, 0.1, 0.22];
      angles.forEach(angle => {
        const speed = 720;
        bulletsRef.current.push({
          id: Math.random().toString(),
          x: p.x,
          y: p.y - p.height / 2,
          vx: Math.sin(angle) * speed,
          vy: -Math.cos(angle) * speed,
          radius: 4.5,
          damage: baseDamage * 0.65,
          isPlayer: true,
          color: '#F59E0B',
          glowColor: '#D97706',
        });
      });
    } else if (p.weaponType === 'PLASMA') {
      p.fireCooldown = 0.26;
      bulletsRef.current.push({
        id: Math.random().toString(),
        x: p.x,
        y: p.y - p.height / 2,
        vx: 0,
        vy: -680,
        radius: 10,
        damage: baseDamage * 2.2,
        isPlayer: true,
        color: '#A855F7',
        glowColor: '#7E22CE',
        penetrating: true,
        type: 'PLASMA',
      });
    }
  }, []);

  // Spawn dynamic enemies
  const spawnEnemy = useCallback(() => {
    const waveNum = waveStateRef.current.currentWave;
    const diff = difficulty;
    const roll = Math.random();

    let enemyType: 'DRONE' | 'FIGHTER' | 'BOMBER' | 'INTERCEPTOR' | 'ASTEROID' = 'DRONE';
    let hp = 30;
    let scoreVal = 100;
    let color = '#EF4444';
    let accentColor = '#F87171';
    let width = 36;
    let height = 36;
    let vx = (Math.random() - 0.5) * 80;
    let vy = Math.random() * 80 + 100;
    let pattern: 'STRAIGHT' | 'ZIGZAG' | 'SWOOP' | 'HOVER' | 'ROTATING' = 'STRAIGHT';

    if (roll < 0.25) {
      // Fast Zigzag Drone
      enemyType = 'DRONE';
      hp = 25 * diff.enemyHpMultiplier;
      scoreVal = 120;
      width = 30;
      height = 30;
      vy = (140 + waveNum * 6) * diff.enemySpeedMultiplier;
      pattern = 'ZIGZAG';
      color = '#F97316';
      accentColor = '#FDBA74';
    } else if (roll < 0.55) {
      // Shooting Fighter
      enemyType = 'FIGHTER';
      hp = 50 * diff.enemyHpMultiplier;
      scoreVal = 250;
      width = 38;
      height = 42;
      vy = (90 + waveNum * 4) * diff.enemySpeedMultiplier;
      pattern = 'SWOOP';
      color = '#EC4899';
      accentColor = '#F472B6';
    } else if (roll < 0.75) {
      // Heavy Bomber
      enemyType = 'BOMBER';
      hp = 110 * diff.enemyHpMultiplier;
      scoreVal = 450;
      width = 52;
      height = 50;
      vy = (60 + waveNum * 2) * diff.enemySpeedMultiplier;
      pattern = 'HOVER';
      color = '#8B5CF6';
      accentColor = '#A78BFA';
    } else if (roll < 0.90) {
      // Asteroid hazard
      enemyType = 'ASTEROID';
      hp = 80 * diff.enemyHpMultiplier;
      scoreVal = 180;
      width = 46;
      height = 46;
      vy = (100 + Math.random() * 60) * diff.enemySpeedMultiplier;
      vx = (Math.random() - 0.5) * 100;
      pattern = 'ROTATING';
      color = '#78716C';
      accentColor = '#A8A29E';
    } else {
      // Interceptor
      enemyType = 'INTERCEPTOR';
      hp = 70 * diff.enemyHpMultiplier;
      scoreVal = 380;
      width = 40;
      height = 40;
      vy = (160 + waveNum * 8) * diff.enemySpeedMultiplier;
      pattern = 'STRAIGHT';
      color = '#E11D48';
      accentColor = '#FB7185';
    }

    const enemy: Enemy = {
      id: Math.random().toString(),
      type: enemyType,
      x: Math.random() * (CANVAS_WIDTH - width - 40) + 20,
      y: -height - 10,
      width,
      height,
      vx,
      vy,
      hp,
      maxHp: hp,
      scoreValue: Math.round(scoreVal * diff.scoreMultiplier),
      shootCooldown: Math.random() * 1.5 + 1.0,
      behaviorTimer: 0,
      pattern,
      color,
      accentColor,
    };

    enemiesRef.current.push(enemy);
  }, [difficulty]);

  // Main 60FPS Game Loop
  useEffect(() => {
    if (gameStatus !== 'PLAYING') return;

    let isRunning = true;

    const gameLoop = (currentTime: number) => {
      if (!isRunning) return;

      if (!lastFrameTimeRef.current) {
        lastFrameTimeRef.current = currentTime;
      }

      // Delta time in seconds, capped at 0.05 to prevent huge jumps
      const dt = Math.min(0.05, (currentTime - lastFrameTimeRef.current) / 1000);
      lastFrameTimeRef.current = currentTime;

      const p = playerRef.current;

      // 1. Screen Shake decay
      setScreenShake(prev => (prev > 0.1 ? prev * 0.9 : 0));

      // 2. Stars Update
      starsRef.current.forEach(star => {
        star.y += star.speed * dt;
        if (star.y > CANVAS_HEIGHT) {
          star.y = 0;
          star.x = Math.random() * CANVAS_WIDTH;
        }
      });

      // 3. Player Movement & Input handling
      const keys = keysRef.current;
      const speed = p.speedBoostTimer > 0 ? p.speed * 1.4 : p.speed;

      let dx = 0;
      let dy = 0;

      if (keys['ArrowLeft'] || keys['KeyA']) dx -= 1;
      if (keys['ArrowRight'] || keys['KeyD']) dx += 1;
      if (keys['ArrowUp'] || keys['KeyW']) dy -= 1;
      if (keys['ArrowDown'] || keys['KeyS']) dy += 1;

      // Touch / Virtual Joystick input override
      if (touchSteerRef.current.vx !== 0 || touchSteerRef.current.vy !== 0) {
        dx = touchSteerRef.current.vx;
        dy = touchSteerRef.current.vy;
      }

      // Mouse drag steering option
      if (mousePosRef.current.active) {
        const targetX = mousePosRef.current.x;
        const targetY = mousePosRef.current.y;
        const distToMouse = Math.hypot(targetX - p.x, targetY - p.y);
        if (distToMouse > 5) {
          const moveDist = Math.min(distToMouse, speed * dt * 2);
          const angle = Math.atan2(targetY - p.y, targetX - p.x);
          p.x += Math.cos(angle) * moveDist;
          p.y += Math.sin(angle) * moveDist;
        }
      } else if (dx !== 0 || dy !== 0) {
        const length = Math.hypot(dx, dy) || 1;
        p.x += (dx / length) * speed * dt;
        p.y += (dy / length) * speed * dt;
      }

      // Bound player to canvas
      p.x = Math.max(p.width / 2 + 10, Math.min(CANVAS_WIDTH - p.width / 2 - 10, p.x));
      p.y = Math.max(p.height / 2 + 60, Math.min(CANVAS_HEIGHT - p.height / 2 - 10, p.y));

      // Player Firing
      if (p.fireCooldown > 0) p.fireCooldown -= dt;
      if (p.invulnerableTime > 0) p.invulnerableTime -= dt;
      if (p.speedBoostTimer > 0) p.speedBoostTimer -= dt;

      // Combo Timer decay
      if (p.combo > 0) {
        p.comboTimer -= dt;
        if (p.comboTimer <= 0) {
          p.combo = 0;
          p.multiplier = 1;
        }
      }

      if (keys['Space'] || mousePosRef.current.active || touchSteerRef.current.firing) {
        playerShoot();
      }

      // 4. Wave Spawner
      const waveState = waveStateRef.current;
      if (waveState.waveInProgress && !waveState.bossActive) {
        waveState.spawnTimer += dt;
        if (waveState.spawnTimer >= waveState.spawnInterval && waveState.enemiesToSpawn > 0) {
          waveState.spawnTimer = 0;
          spawnEnemy();
          waveState.enemiesToSpawn -= 1;
        }

        // Check if wave is cleared
        if (waveState.enemiesToSpawn <= 0 && enemiesRef.current.length === 0) {
          waveState.waveInProgress = false;
          addFloatingText(`WAVE ${waveState.currentWave} CLEARED!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50, '#10B981', 28);
          sound.playPowerUp();
          // Bonus score for wave clear
          p.score += waveState.currentWave * 1000;
          setTimeout(() => {
            if (isRunning) {
              startNextWave(waveState.currentWave + 1);
            }
          }, 2000);
        }
      }

      // 5. Update Enemies & AI
      enemiesRef.current.forEach(enemy => {
        enemy.behaviorTimer += dt;

        if (enemy.type === 'BOSS') {
          const boss = enemy as Boss;
          // Boss entrance and movement
          if (boss.y < 120) {
            boss.y += boss.vy * dt;
          } else {
            // Horizontal hover oscillation
            boss.x += boss.vx * dt;
            if (boss.x <= 40 || boss.x + boss.width >= CANVAS_WIDTH - 40) {
              boss.vx *= -1;
            }
          }

          // Boss Attacks
          boss.shootCooldown -= dt;
          if (boss.shootCooldown <= 0 && boss.y >= 100) {
            sound.playEnemyLaser();
            if (boss.hp < boss.maxHp * 0.4) {
              // Enraged Phase: 7-way spread barrage
              boss.shootCooldown = 1.0;
              for (let i = -3; i <= 3; i++) {
                const angle = i * 0.22;
                bulletsRef.current.push({
                  id: Math.random().toString(),
                  x: boss.x + boss.width / 2,
                  y: boss.y + boss.height,
                  vx: Math.sin(angle) * 320,
                  vy: Math.cos(angle) * 320,
                  radius: 5.5,
                  damage: 25,
                  isPlayer: false,
                  color: '#F43F5E',
                  glowColor: '#E11D48',
                  type: 'ENEMY_ORB',
                });
              }
            } else {
              // Standard Phase: Dual heavy orbs aimed at player
              boss.shootCooldown = 1.4;
              const angle = Math.atan2(p.y - (boss.y + boss.height), p.x - (boss.x + boss.width / 2));
              bulletsRef.current.push(
                {
                  id: Math.random().toString(),
                  x: boss.x + 30,
                  y: boss.y + boss.height,
                  vx: Math.cos(angle - 0.15) * 300,
                  vy: Math.sin(angle - 0.15) * 300,
                  radius: 5,
                  damage: 20,
                  isPlayer: false,
                  color: '#EF4444',
                  glowColor: '#B91C1C',
                },
                {
                  id: Math.random().toString(),
                  x: boss.x + boss.width - 30,
                  y: boss.y + boss.height,
                  vx: Math.cos(angle + 0.15) * 300,
                  vy: Math.sin(angle + 0.15) * 300,
                  radius: 5,
                  damage: 20,
                  isPlayer: false,
                  color: '#EF4444',
                  glowColor: '#B91C1C',
                }
              );
            }
          }
        } else {
          // Standard Enemy Movement
          if (enemy.pattern === 'ZIGZAG') {
            enemy.y += enemy.vy * dt;
            enemy.x += Math.sin(enemy.behaviorTimer * 5) * 160 * dt;
          } else if (enemy.pattern === 'SWOOP') {
            enemy.y += enemy.vy * dt;
            enemy.x += Math.cos(enemy.behaviorTimer * 3) * 120 * dt;
          } else if (enemy.pattern === 'HOVER') {
            if (enemy.y < 220) {
              enemy.y += enemy.vy * dt;
            } else {
              enemy.x += Math.sin(enemy.behaviorTimer * 2) * 90 * dt;
            }
          } else {
            enemy.y += enemy.vy * dt;
            enemy.x += enemy.vx * dt;
          }

          // Enemy shooting
          if (enemy.type === 'FIGHTER' || enemy.type === 'BOMBER' || enemy.type === 'INTERCEPTOR') {
            enemy.shootCooldown -= dt;
            if (enemy.shootCooldown <= 0 && enemy.y > 40 && enemy.y < CANVAS_HEIGHT - 180) {
              enemy.shootCooldown = Math.random() * 1.8 + 1.2;
              sound.playEnemyLaser();
              bulletsRef.current.push({
                id: Math.random().toString(),
                x: enemy.x + enemy.width / 2,
                y: enemy.y + enemy.height,
                vx: 0,
                vy: 320,
                radius: 4,
                damage: 15,
                isPlayer: false,
                color: '#EF4444',
                glowColor: '#DC2626',
              });
            }
          }
        }
      });

      // Filter off-screen enemies
      enemiesRef.current = enemiesRef.current.filter(e => {
        if (e.y > CANVAS_HEIGHT + 60) return false;
        return true;
      });

      // 6. Update Bullets
      bulletsRef.current.forEach(bullet => {
        bullet.x += bullet.vx * dt;
        bullet.y += bullet.vy * dt;
      });

      // Filter off-screen bullets
      bulletsRef.current = bulletsRef.current.filter(
        b => b.x >= -30 && b.x <= CANVAS_WIDTH + 30 && b.y >= -40 && b.y <= CANVAS_HEIGHT + 40
      );

      // 7. Update Power-ups
      powerUpsRef.current.forEach(item => {
        item.y += item.vy * dt;
        item.x += item.vx * dt;
        item.pulsePhase += dt * 4;
        if (item.x < item.radius || item.x > CANVAS_WIDTH - item.radius) item.vx *= -1;
      });
      powerUpsRef.current = powerUpsRef.current.filter(i => i.y < CANVAS_HEIGHT + 40);

      // 8. Update Particles
      particlesRef.current.forEach(part => {
        part.x += part.vx * dt;
        part.y += part.vy * dt;
        part.alpha -= part.decay * dt;
      });
      particlesRef.current = particlesRef.current.filter(p => p.alpha > 0);

      // 9. Update Floating Texts
      floatingTextsRef.current.forEach(ft => {
        ft.y += ft.vy * dt;
        ft.alpha -= 0.9 * dt;
      });
      floatingTextsRef.current = floatingTextsRef.current.filter(ft => ft.alpha > 0);

      // 10. COLLISION DETECTION

      // A. Player Bullets vs Enemies
      bulletsRef.current.forEach(bullet => {
        if (!bullet.isPlayer) return;

        enemiesRef.current.forEach(enemy => {
          if (enemy.hp <= 0) return;

          // Box/Circle collision
          const closestX = Math.max(enemy.x, Math.min(bullet.x, enemy.x + enemy.width));
          const closestY = Math.max(enemy.y, Math.min(bullet.y, enemy.y + enemy.height));
          const distX = bullet.x - closestX;
          const distY = bullet.y - closestY;
          const isColliding = distX * distX + distY * distY < bullet.radius * bullet.radius;

          if (isColliding) {
            enemy.hp -= bullet.damage;
            sound.playHit();
            p.shotsHit += 1;

            // Bullet impact spark
            for (let i = 0; i < 4; i++) {
              particlesRef.current.push({
                id: Math.random().toString(),
                x: bullet.x,
                y: bullet.y,
                vx: (Math.random() - 0.5) * 120,
                vy: (Math.random() - 0.5) * 120,
                size: 2.5,
                color: bullet.color,
                alpha: 1,
                decay: 3,
                type: 'SPARK',
              });
            }

            if (!bullet.penetrating) {
              bullet.y = -999; // destroy bullet
            }

            // Check enemy death
            if (enemy.hp <= 0) {
              const isBoss = enemy.type === 'BOSS';
              createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color, isBoss ? 48 : 20, isBoss);

              // Combo update
              p.combo += 1;
              p.comboTimer = 2.5;
              p.multiplier = Math.min(5, 1 + Math.floor(p.combo / 5) * 0.5);

              const pointsEarned = Math.round(enemy.scoreValue * p.multiplier);
              p.score += pointsEarned;
              addFloatingText(`+${pointsEarned}`, enemy.x + enemy.width / 2, enemy.y, '#FBBF24', 16);

              if (p.combo > 1 && p.combo % 5 === 0) {
                sound.playCombo(p.multiplier);
                addFloatingText(`${p.multiplier}x MULTIPLIER!`, p.x, p.y - 40, '#38BDF8', 20);
              }

              // Power-up Drop
              if (isBoss) {
                // Guaranteed weapon upgrade + shield
                powerUpsRef.current.push({
                  id: Math.random().toString(),
                  type: 'WEAPON_UPGRADE',
                  x: enemy.x + enemy.width / 2 - 25,
                  y: enemy.y + enemy.height / 2,
                  vx: -20,
                  vy: 60,
                  radius: 16,
                  pulsePhase: 0,
                });
                powerUpsRef.current.push({
                  id: Math.random().toString(),
                  type: 'SHIELD_RESTORE',
                  x: enemy.x + enemy.width / 2 + 25,
                  y: enemy.y + enemy.height / 2,
                  vx: 20,
                  vy: 60,
                  radius: 16,
                  pulsePhase: 0,
                });
                waveState.bossActive = false;
                addFloatingText('BOSS DESTROYED!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, '#EC4899', 32);
                setTimeout(() => {
                  if (isRunning) {
                    startNextWave(waveState.currentWave + 1);
                  }
                }, 3000);
              } else {
                maybeSpawnPowerUp(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
              }
            }
          }
        });
      });

      // Filter dead enemies & destroyed bullets
      enemiesRef.current = enemiesRef.current.filter(e => e.hp > 0);
      bulletsRef.current = bulletsRef.current.filter(b => b.y > -100);

      // B. Enemy Bullets vs Player
      if (p.invulnerableTime <= 0) {
        bulletsRef.current.forEach(bullet => {
          if (bullet.isPlayer) return;

          const dist = Math.hypot(bullet.x - p.x, bullet.y - p.y);
          if (dist < bullet.radius + p.width / 2.2) {
            bullet.y = 9999; // destroy bullet
            takePlayerDamage(bullet.damage);
          }
        });
      }

      // C. Player vs Enemy Ramming Collision
      if (p.invulnerableTime <= 0) {
        enemiesRef.current.forEach(enemy => {
          const closestX = Math.max(enemy.x, Math.min(p.x, enemy.x + enemy.width));
          const closestY = Math.max(enemy.y, Math.min(p.y, enemy.y + enemy.height));
          const dist = Math.hypot(p.x - closestX, p.y - closestY);

          if (dist < p.width / 2.5) {
            enemy.hp -= 80;
            takePlayerDamage(40);
            createExplosion(closestX, closestY, '#EF4444', 16);
            if (enemy.hp <= 0 && enemy.type !== 'BOSS') {
              createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color, 24);
            }
          }
        });
      }

      // D. Player vs Power-up Collection
      powerUpsRef.current.forEach(item => {
        const dist = Math.hypot(item.x - p.x, item.y - p.y);
        if (dist < item.radius + p.width / 2) {
          item.y = 9999; // collect
          sound.playPowerUp();

          if (item.type === 'WEAPON_UPGRADE') {
            if (p.weaponType === 'SINGLE') {
              p.weaponType = 'DOUBLE';
              addFloatingText('DOUBLE LASERS!', p.x, p.y - 30, '#38BDF8', 20);
            } else if (p.weaponType === 'DOUBLE') {
              p.weaponType = 'SPREAD';
              addFloatingText('SPREAD CANNON!', p.x, p.y - 30, '#F59E0B', 20);
            } else if (p.weaponType === 'SPREAD') {
              p.weaponType = 'PLASMA';
              addFloatingText('PLASMA CANNON!', p.x, p.y - 30, '#A855F7', 20);
            } else {
              p.weaponLevel = Math.min(5, p.weaponLevel + 1);
              addFloatingText(`WEAPON LV.${p.weaponLevel} MAX!`, p.x, p.y - 30, '#EC4899', 20);
            }
          } else if (item.type === 'SHIELD_RESTORE') {
            p.shield = Math.min(p.maxShield, p.shield + 40);
            addFloatingText('+40 SHIELD!', p.x, p.y - 30, '#10B981', 20);
          } else if (item.type === 'BOMB') {
            p.bombs = Math.min(p.maxBombs, p.bombs + 1);
            addFloatingText('+1 SMART BOMB!', p.x, p.y - 30, '#60A5FA', 20);
          } else if (item.type === 'SPEED_BOOST') {
            p.speedBoostTimer = 8.0;
            addFloatingText('THRUSTER OVERDRIVE!', p.x, p.y - 30, '#FBBF24', 20);
          } else if (item.type === 'SCORE_MULTIPLIER') {
            p.combo = 15;
            p.multiplier = 3;
            p.comboTimer = 6.0;
            addFloatingText('3X SCORE MULTIPLIER!', p.x, p.y - 30, '#A855F7', 20);
          }

          p.score += 500;
        }
      });
      powerUpsRef.current = powerUpsRef.current.filter(i => i.y < 9000);

      // 11. Sync HUD State
      const boss = enemiesRef.current.find(e => e.type === 'BOSS') as Boss | undefined;
      setDisplayState({
        score: p.score,
        lives: p.lives,
        shield: Math.max(0, Math.round(p.shield)),
        bombs: p.bombs,
        weaponType: p.weaponType,
        weaponLevel: p.weaponLevel,
        combo: p.combo,
        multiplier: p.multiplier,
        bossHp: boss ? { current: Math.max(0, boss.hp), max: boss.maxHp, name: boss.name } : null,
      });

      animFrameIdRef.current = requestAnimationFrame(gameLoop);
    };

    const takePlayerDamage = (damage: number) => {
      const p = playerRef.current;
      setScreenShake(8);

      if (p.shield > 0) {
        sound.playShieldHit();
        p.shield -= damage;
        if (p.shield < 0) {
          p.shield = 0;
        }
        // Shield impact particle ring
        particlesRef.current.push({
          id: Math.random().toString(),
          x: p.x,
          y: p.y,
          vx: 0,
          vy: 0,
          size: 32,
          color: '#38BDF8',
          alpha: 0.8,
          decay: 2.5,
          type: 'RING',
        });
      } else {
        // Direct hull damage -> life lost
        createExplosion(p.x, p.y, '#EF4444', 30, true);
        p.lives -= 1;
        p.shield = 100;
        p.invulnerableTime = 2.5;
        p.combo = 0;
        p.multiplier = 1;
        // Downgrade weapon slightly on death
        if (p.weaponType === 'PLASMA') p.weaponType = 'SPREAD';
        else if (p.weaponType === 'SPREAD') p.weaponType = 'DOUBLE';
        else if (p.weaponType === 'DOUBLE') p.weaponType = 'SINGLE';

        if (p.lives <= 0) {
          sound.playGameOver();
          setGameStatus('GAMEOVER');
        } else {
          addFloatingText('HULL BREACH! SHIELD RESTORED', p.x, p.y - 40, '#EF4444', 20);
        }
      }
    };

    animFrameIdRef.current = requestAnimationFrame(gameLoop);

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [gameStatus, playerShoot, spawnEnemy, startNextWave, difficulty]);

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (gameStatus === 'PLAYING') setGameStatus('PAUSED');
        else if (gameStatus === 'PAUSED') setGameStatus('PLAYING');
        return;
      }

      if (e.code === 'KeyB' || e.code === 'KeyX') {
        triggerBomb();
        return;
      }

      if (e.code === 'KeyM') {
        setSoundEnabled(prev => {
          const next = !prev;
          sound.setSoundEnabled(next);
          return next;
        });
      }

      keysRef.current[e.code] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameStatus, triggerBomb]);

  const toggleSound = () => {
    setSoundEnabled(prev => {
      const next = !prev;
      sound.setSoundEnabled(next);
      return next;
    });
  };

  return {
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
  };
}
