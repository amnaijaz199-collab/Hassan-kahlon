export type GameStatus = 'START' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'VICTORY';

export type WeaponType = 'SINGLE' | 'DOUBLE' | 'SPREAD' | 'PLASMA' | 'LASER_BEAM';

export type EnemyType = 'DRONE' | 'FIGHTER' | 'BOMBER' | 'INTERCEPTOR' | 'ASTEROID' | 'BOSS';

export type PowerUpType = 'WEAPON_UPGRADE' | 'SHIELD_RESTORE' | 'BOMB' | 'SPEED_BOOST' | 'SCORE_MULTIPLIER' | 'LIFE';

export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  vx: number;
  vy: number;
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  baseSpeed: number;
  lives: number;
  maxLives: number;
  shield: number;
  maxShield: number;
  weaponType: WeaponType;
  weaponLevel: number;
  bombs: number;
  maxBombs: number;
  invulnerableTime: number; // in seconds
  score: number;
  combo: number;
  comboTimer: number;
  multiplier: number;
  fireCooldown: number;
  speedBoostTimer: number;
  shotsFired: number;
  shotsHit: number;
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  isPlayer: boolean;
  color: string;
  glowColor: string;
  type?: 'STANDARD' | 'PLASMA' | 'LASER' | 'ENEMY_ORB' | 'HOMING';
  penetrating?: boolean;
}

export interface Enemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  scoreValue: number;
  shootCooldown: number;
  behaviorTimer: number;
  pattern: 'STRAIGHT' | 'ZIGZAG' | 'SWOOP' | 'HOVER' | 'ROTATING';
  color: string;
  accentColor: string;
  shield?: number;
  phase?: number;
}

export interface Boss extends Enemy {
  name: string;
  phase: number;
  maxPhases: number;
  specialAttackCooldown: number;
  enraged: boolean;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  type: 'SPARK' | 'SMOKE' | 'DEBRIS' | 'RING' | 'STAR' | 'GLOW';
}

export interface PowerUpItem {
  id: string;
  type: PowerUpType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  duration?: number;
  pulsePhase: number;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  size: number;
  alpha: number;
  vy: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  alpha: number;
  layer: number;
}

export interface HighScoreRecord {
  id: string;
  name: string;
  score: number;
  wave: number;
  date: string;
  accuracy: number;
}

export interface DifficultySetting {
  id: 'EASY' | 'NORMAL' | 'HARD';
  name: string;
  description: string;
  enemyHpMultiplier: number;
  enemySpeedMultiplier: number;
  scoreMultiplier: number;
  startingLives: number;
}
