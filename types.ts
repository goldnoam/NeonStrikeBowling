
export enum PowerUpType {
  GIANT_BALL = 'GIANT_BALL',
  FIRE_BALL = 'FIRE_BALL',
  SUPER_CURVE = 'SUPER_CURVE',
}

export enum GameMode {
  SINGLE = 'SINGLE',
  MULTIPLAYER = 'MULTIPLAYER',
  VS_AI = 'VS_AI',
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
}
