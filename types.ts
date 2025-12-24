
export enum PowerUpType {
  GIANT_BALL = 'GIANT_BALL',
  FIRE_BALL = 'FIRE_BALL',
  SUPER_CURVE = 'SUPER_CURVE',
}

export enum GameMode {
  SINGLE = 'SINGLE',
  MULTIPLAYER = 'MULTIPLAYER',
  VS_COMPUTER = 'VS_COMPUTER',
}

export enum BallSize {
  SMALL = 0.7,
  NORMAL = 1.0,
  BIG = 1.4,
  HUGE = 2.0,
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface GameObject {
  pos: Vector2D;
  vel: Vector2D;
  radius: number;
  active: boolean;
}

export interface FrameResult {
  throws: number[];
  isStrike: boolean;
  isSpare: boolean;
  cumulativeScore: number;
}

export interface Pin extends GameObject {
  id: number;
  knocked: boolean;
  angle: number;
}

export interface Ball extends GameObject {
  power: number;
  curve: number;
  type: PowerUpType | null;
  trail: Vector2D[];
  color?: string;
}
