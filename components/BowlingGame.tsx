
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  PIN_RADIUS, 
  BALL_RADIUS, 
  FRICTION, 
  PIN_FRICTION, 
  LANE_X_MIN, 
  LANE_X_MAX,
  MAX_FRAMES,
  POWERUP_DURATION
} from '../constants';
import { Pin, Ball, PowerUpType, Vector2D, FrameResult, GameMode, BallSize } from '../types';
import { soundManager } from './SoundManager';

interface BowlingGameProps {
  theme: 'dark' | 'light';
  isPaused: boolean;
  gameMode: GameMode;
  onGameStateUpdate: (state: any) => void;
  power: number;
  spin: number;
  ballSizeMultiplier: BallSize;
  customBallColor: string;
}

interface Confetti {
  pos: Vector2D;
  vel: Vector2D;
  color: string;
  size: number;
  life: number;
}

const BowlingGame: React.FC<BowlingGameProps> = ({ 
  theme, 
  isPaused, 
  gameMode, 
  onGameStateUpdate, 
  power, 
  spin,
  ballSizeMultiplier,
  customBallColor
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameId = useRef<number>();
  
  const [currentFrame, setCurrentFrame] = useState(1);
  const [activePowerUp, setActivePowerUp] = useState<PowerUpType | null>(null);
  const [powerUpTimer, setPowerUpTimer] = useState(0);
  const [notification, setNotification] = useState<string | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [isGameOver, setIsGameOver] = useState(false);
  
  const p1History = useRef<FrameResult[]>([]);
  const p2History = useRef<FrameResult[]>([]);
  const confettiRef = useRef<Confetti[]>([]);

  const BALL_START_Y = CANVAS_HEIGHT - 120;
  const PIN_START_Y = 180;

  const getEffectiveRadius = useCallback(() => {
    let r = BALL_RADIUS * ballSizeMultiplier;
    if (activePowerUp === PowerUpType.GIANT_BALL) r *= 1.8;
    return r;
  }, [ballSizeMultiplier, activePowerUp]);

  const ballRef = useRef<Ball>({
    pos: { x: CANVAS_WIDTH / 2, y: BALL_START_Y },
    vel: { x: 0, y: 0 },
    radius: BALL_RADIUS * ballSizeMultiplier,
    active: false,
    power: 0,
    curve: 0,
    type: null,
    trail: []
  });

  const pinsRef = useRef<Pin[]>([]);
  const isRolling = useRef(false);
  const isAiming = useRef(true);
  const mouseX = useRef(CANVAS_WIDTH / 2);
  const pinsAtStartOfThrow = useRef(10);
  const isAITurn = useRef(false);

  const initPins = useCallback(() => {
    const pins: Pin[] = [];
    const spacingX = 44;
    const spacingY = 42;
    let id = 0;

    for (let row = 0; row < 4; row++) {
      const rowWidth = row * spacingX;
      const startX = (CANVAS_WIDTH / 2) - (rowWidth / 2);
      for (let i = 0; i <= row; i++) {
        pins.push({
          id: id++,
          pos: { x: startX + i * spacingX, y: PIN_START_Y + row * spacingY },
          vel: { x: 0, y: 0 },
          radius: PIN_RADIUS,
          active: true,
          knocked: false,
          angle: 0
        });
      }
    }
    pinsRef.current = pins;
    pinsAtStartOfThrow.current = 10;
  }, []);

  useEffect(() => {
    initPins();
  }, [initPins]);

  const calculateFullScore = (history: FrameResult[]) => {
    let total = 0;
    const allThrows: number[] = [];
    history.forEach(f => allThrows.push(...f.throws));

    let throwPtr = 0;
    for (let f = 0; f < 10; f++) {
      const frame = history[f];
      if (!frame) break;

      if (f < 9) {
        if (frame.isStrike) {
          total += 10 + (allThrows[throwPtr + 1] || 0) + (allThrows[throwPtr + 2] || 0);
          throwPtr += 1;
        } else if (frame.isSpare) {
          total += 10 + (allThrows[throwPtr + 2] || 0);
          throwPtr += 2;
        } else {
          total += (allThrows[throwPtr] || 0) + (allThrows[throwPtr + 1] || 0);
          throwPtr += 2;
        }
      } else {
        total += (allThrows[throwPtr] || 0) + (allThrows[throwPtr + 1] || 0) + (allThrows[throwPtr + 2] || 0);
      }
      frame.cumulativeScore = total;
    }
    return total;
  };

  useEffect(() => {
    onGameStateUpdate({
      score: calculateFullScore(p1History.current),
      p2Score: calculateFullScore(p2History.current),
      currentFrame,
      history: [...p1History.current],
      p2History: [...p2History.current],
      activePowerUp,
      powerUpDuration: powerUpTimer,
      currentPlayer,
      isGameOver
    });
  }, [currentFrame, activePowerUp, powerUpTimer, notification, currentPlayer, onGameStateUpdate, isGameOver]);

  const spawnConfetti = useCallback((isFullVictory = false) => {
    const colors = ['#f43f5e', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa'];
    const amount = isFullVictory ? 250 : 80;
    for (let i = 0; i < amount; i++) {
      confettiRef.current.push({
        pos: isFullVictory ? { x: Math.random() * CANVAS_WIDTH, y: -20 } : { x: (Math.random() * 200) + (CANVAS_WIDTH / 2 - 100), y: PIN_START_Y + 50 },
        vel: { x: (Math.random() - 0.5) * 12, y: isFullVictory ? (Math.random() * 10 + 5) : -(Math.random() * 14 + 6) },
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 10 + 5,
        life: 1.5 + Math.random()
      });
    }
  }, []);

  const throwBall = useCallback(() => {
    if (!isAiming.current || isRolling.current || isPaused || isGameOver) return;
    
    isAiming.current = false;
    isRolling.current = true;
    
    let baseVel = 10 + (power / 100) * 16;
    const fromCenter = (mouseX.current - CANVAS_WIDTH / 2);
    let curve = (fromCenter / 20) + (spin / 50 * 5); 

    const ball = ballRef.current;
    ball.active = true;
    ball.type = activePowerUp;
    ball.trail = [];
    
    if (activePowerUp === PowerUpType.FIRE_BALL) baseVel *= 1.4;
    ball.radius = getEffectiveRadius();
    
    ball.vel = { x: curve * 0.45, y: -baseVel };
    ball.curve = curve; 
    ball.pos = { x: mouseX.current, y: BALL_START_Y };
  }, [activePowerUp, isPaused, isGameOver, power, spin, getEffectiveRadius]);

  useEffect(() => {
    if (gameMode === GameMode.VS_COMPUTER && currentPlayer === 2 && isAiming.current && !isPaused && !isAITurn.current && !isGameOver) {
      isAITurn.current = true;
      setTimeout(() => {
        mouseX.current = (CANVAS_WIDTH / 2) + (Math.random() - 0.5) * 130;
        setTimeout(() => {
          throwBall();
          isAITurn.current = false;
        }, 1000);
      }, 1000);
    }
  }, [currentPlayer, isAiming.current, gameMode, isPaused, throwBall, isGameOver]);

  const handleFrameLogic = (knockedThisThrow: number) => {
    const history = currentPlayer === 1 ? p1History.current : p2History.current;
    if (!history[currentFrame - 1]) {
      history[currentFrame - 1] = { throws: [], isStrike: false, isSpare: false, cumulativeScore: 0 };
    }
    
    const frameObj = history[currentFrame - 1];
    frameObj.throws.push(knockedThisThrow);
    
    const isFirst = frameObj.throws.length === 1;
    const isStrike = isFirst && knockedThisThrow === 10;
    const totalThisFrame = frameObj.throws.reduce((a, b) => a + b, 0);
    const isSpare = !isStrike && !isFirst && totalThisFrame === 10 && frameObj.throws.length === 2;

    if (currentFrame < 10) {
      frameObj.isStrike = isStrike;
      frameObj.isSpare = isSpare;
    }

    if (isStrike) onGameStateUpdate({ event: 'STRIKE' });
    else if (isSpare) onGameStateUpdate({ event: 'SPARE' });
    else onGameStateUpdate({ event: 'PIN_HIT', count: knockedThisThrow });

    if (isStrike) { 
        setNotification("STRIKE!"); 
        soundManager.playPowerUp(); 
        spawnConfetti(false); 
    } else if (isSpare) {
        setNotification("SPARE!");
    } else if (knockedThisThrow === 0) {
        setNotification("GUTTER");
    }
    setTimeout(() => setNotification(null), 1000);

    let end = false;
    if (currentFrame < 10) {
      end = isStrike || frameObj.throws.length === 2;
    } else {
      const strikeOrSpare = frameObj.throws[0] === 10 || (frameObj.throws[0] + (frameObj.throws[1] || 0) >= 10);
      end = strikeOrSpare ? frameObj.throws.length === 3 : frameObj.throws.length === 2;
    }

    if (end) {
      setTimeout(() => {
        const nextPlayer = (gameMode !== GameMode.SINGLE && currentPlayer === 1) ? 2 : 1;
        if (gameMode !== GameMode.SINGLE) {
          setCurrentPlayer(nextPlayer);
          if (nextPlayer === 1) {
            if (currentFrame >= MAX_FRAMES) {
              setIsGameOver(true);
              spawnConfetti(true);
            } else { setCurrentFrame(f => f + 1); }
          }
        } else {
          if (currentFrame >= MAX_FRAMES) {
            setIsGameOver(true);
            spawnConfetti(true);
          } else { setCurrentFrame(f => f + 1); }
        }
        initPins();
        resetBall();
      }, 1500);
    } else {
      setTimeout(() => {
        if ((knockedThisThrow === 10 || isSpare) && currentFrame === 10) {
          initPins();
        } else {
          pinsRef.current = pinsRef.current.filter(p => p.active && !p.knocked);
        }
        pinsAtStartOfThrow.current = pinsRef.current.length;
        resetBall();
      }, 1500);
    }
  };

  const checkCollisions = () => {
    const ball = ballRef.current;
    if (!ball.active) return;

    if (ball.pos.x - ball.radius < LANE_X_MIN) {
      ball.pos.x = LANE_X_MIN + ball.radius;
      ball.vel.x *= -0.7;
      ball.curve *= -0.8;
      soundManager.playHit();
    } else if (ball.pos.x + ball.radius > LANE_X_MAX) {
      ball.pos.x = LANE_X_MAX - ball.radius;
      ball.vel.x *= -0.7;
      ball.curve *= -0.8; 
      soundManager.playHit();
    }

    pinsRef.current.forEach(pin => {
      if (!pin.active || pin.knocked) return;
      const dx = ball.pos.x - pin.pos.x;
      const dy = ball.pos.y - pin.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < ball.radius + pin.radius) {
        soundManager.playHit();
        const angle = Math.atan2(dy, dx);
        const speed = Math.sqrt(ball.vel.x * ball.vel.x + ball.vel.y * ball.vel.y);
        const force = ball.type === PowerUpType.FIRE_BALL ? 5 : 1.8;
        pin.vel.x = -Math.cos(angle) * speed * force;
        pin.vel.y = -Math.sin(angle) * speed * force;
        pin.knocked = true;
        
        if (ball.type === PowerUpType.FIRE_BALL) {
           pinsRef.current.forEach(p => {
             if (!p.active || p.knocked) return;
             const d = Math.sqrt(Math.pow(pin.pos.x - p.pos.x, 2) + Math.pow(pin.pos.y - p.pos.y, 2));
             if (d < 180) {
               p.knocked = true;
               const a = Math.atan2(p.pos.y - pin.pos.y, p.pos.x - pin.pos.x);
               p.vel.x = Math.cos(a) * 15;
               p.vel.y = Math.sin(a) * 15;
             }
           });
        }
        ball.vel.x *= ball.type === PowerUpType.GIANT_BALL ? 0.99 : 0.85;
        ball.vel.y *= ball.type === PowerUpType.GIANT_BALL ? 0.99 : 0.85;
      }
    });

    for (let i = 0; i < pinsRef.current.length; i++) {
      for (let j = i + 1; j < pinsRef.current.length; j++) {
        const p1 = pinsRef.current[i];
        const p2 = pinsRef.current[j];
        if (!p1.active || !p2.active) continue;
        const dx = p1.pos.x - p2.pos.x;
        const dy = p1.pos.y - p2.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < p1.radius + p2.radius) {
          const angle = Math.atan2(dy, dx);
          const f = 1.2;
          p1.vel.x += Math.cos(angle) * f;
          p1.vel.y += Math.sin(angle) * f;
          p2.vel.x -= Math.cos(angle) * f;
          p2.vel.y -= Math.sin(angle) * f;
          if (!p1.knocked || !p2.knocked) soundManager.playPinCollision();
          p1.knocked = true; p2.knocked = true;
        }
      }
    }
  };

  const update = () => {
    if (isPaused) return;

    confettiRef.current.forEach(c => {
      c.pos.x += c.vel.x;
      c.pos.y += c.vel.y;
      c.vel.y += 0.15;
      c.life -= 0.01;
    });
    confettiRef.current = confettiRef.current.filter(c => c.life > 0);

    if (powerUpTimer > 0) {
      setPowerUpTimer(prev => {
        if (prev === 1) { 
          soundManager.playExpire(); 
          setActivePowerUp(null); 
          onGameStateUpdate({ activePowerUp: null });
        }
        return prev - 1;
      });
    }

    const ball = ballRef.current;
    if (isAiming.current) {
        ball.pos.x = mouseX.current;
        ball.radius = getEffectiveRadius();
    }

    if (ball.active) {
      const speed = Math.sqrt(ball.vel.x * ball.vel.x + ball.vel.y * ball.vel.y);
      if (Math.random() > 0.05) {
        ball.trail.push({ ...ball.pos });
      }
      if (ball.trail.length > 35) ball.trail.shift();

      const lanePositionFactor = (BALL_START_Y - ball.pos.y) / BALL_START_Y;
      const hookStrength = ball.curve * 0.15 * lanePositionFactor;
      ball.vel.x -= hookStrength;

      ball.pos.x += ball.vel.x;
      ball.pos.y += ball.vel.y;
      ball.vel.x *= FRICTION;
      ball.vel.y *= FRICTION;

      if (activePowerUp === PowerUpType.SUPER_CURVE) {
        ball.vel.x += (mouseX.current - ball.pos.x) * 0.15;
      }

      if (ball.pos.y < -80 || (speed < 0.1 && ball.pos.y < PIN_START_Y + 200)) {
        finishThrow();
      }
    }

    pinsRef.current.forEach(pin => {
      if (!pin.active) return;
      pin.pos.x += pin.vel.x;
      pin.pos.y += pin.vel.y;
      pin.vel.x *= PIN_FRICTION;
      pin.vel.y *= PIN_FRICTION;
      if (pin.knocked) pin.angle += (Math.abs(pin.vel.x) + Math.abs(pin.vel.y)) * 0.12;
      if (pin.pos.y < -150 || pin.pos.y > CANVAS_HEIGHT + 150 || pin.pos.x < -150 || pin.pos.x > CANVAS_WIDTH + 150) {
        pin.active = false;
      }
    });

    checkCollisions();
  };

  const finishThrow = () => {
    if (!isRolling.current) return;
    isRolling.current = false;
    ballRef.current.active = false;
    const knocked = pinsAtStartOfThrow.current - pinsRef.current.filter(p => p.active && !p.knocked).length;
    handleFrameLogic(knocked);
  };

  const resetBall = () => {
    ballRef.current = {
      pos: { x: mouseX.current, y: BALL_START_Y },
      vel: { x: 0, y: 0 },
      radius: getEffectiveRadius(),
      active: false,
      power: 0,
      curve: 0,
      type: activePowerUp,
      trail: []
    };
    isRolling.current = false;
    isAiming.current = true;
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = theme === 'dark' ? '#1e293b' : '#f8fafc';
    ctx.fillRect(LANE_X_MIN, 0, LANE_X_MAX - LANE_X_MIN, CANVAS_HEIGHT);
    ctx.fillStyle = theme === 'dark' ? '#0f172a' : '#cbd5e1';
    ctx.fillRect(0, 0, LANE_X_MIN, CANVAS_HEIGHT);
    ctx.fillRect(LANE_X_MAX, 0, CANVAS_WIDTH - LANE_X_MAX, CANVAS_HEIGHT);

    if (isAiming.current && !isGameOver) {
      ctx.save();
      ctx.beginPath(); ctx.setLineDash([5, 8]); ctx.lineWidth = 2;
      ctx.strokeStyle = theme === 'dark' ? 'rgba(244, 63, 94, 0.4)' : 'rgba(14, 165, 233, 0.5)';
      
      let tx = mouseX.current, ty = BALL_START_Y, tvx = ((mouseX.current - CANVAS_WIDTH / 2) / 20 * 0.45) + (spin / 50 * 5 * 0.45), tvy = -(10 + (power/100)*16);
      let tc = (mouseX.current - CANVAS_WIDTH / 2) / 20 + (spin / 50 * 5);
      ctx.moveTo(tx, ty);
      for (let i = 0; i < 45; i++) {
        const lp = (BALL_START_Y - ty) / BALL_START_Y;
        tvx -= tc * 0.15 * lp;
        tx += tvx; ty += tvy; tvx *= FRICTION; tvy *= FRICTION;
        if (activePowerUp === PowerUpType.SUPER_CURVE) tx += (mouseX.current - tx) * 0.15;
        ctx.lineTo(tx, ty);
        if (ty < 0) break;
      }
      ctx.stroke(); ctx.restore();

      ctx.save();
      ctx.translate(mouseX.current, BALL_START_Y);
      ctx.rotate((spin / 100) * Math.PI);
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, ballRef.current.radius + 6, -0.6, 0.6);
      ctx.stroke();
      ctx.restore();
    }

    const ball = ballRef.current;
    if (ball.active && ball.trail.length > 0) {
      ball.trail.forEach((p, i) => {
        const factor = i / ball.trail.length;
        ctx.beginPath();
        if (ball.type === PowerUpType.FIRE_BALL) {
          const emberColor = i % 2 === 0 ? '#f97316' : '#ef4444';
          ctx.fillStyle = emberColor;
          ctx.globalAlpha = factor * 0.8;
          ctx.arc(p.x + (Math.random()-0.5)*15, p.y + (Math.random()-0.5)*15, ball.radius * (0.6 + factor * 0.5), 0, Math.PI * 2);
        } else if (ball.type === PowerUpType.GIANT_BALL) {
          ctx.fillStyle = `rgba(139, 92, 246, ${factor * 0.2})`;
          ctx.arc(p.x, p.y, ball.radius * (0.8 + factor * 0.4), 0, Math.PI * 2);
        } else if (ball.type === PowerUpType.SUPER_CURVE) {
          ctx.fillStyle = `rgba(34, 211, 238, ${factor * 0.4})`;
          ctx.arc(p.x + (Math.random()-0.5)*10, p.y + (Math.random()-0.5)*10, ball.radius * 0.3 * factor, 0, Math.PI * 2);
        } else {
          ctx.fillStyle = customBallColor;
          ctx.globalAlpha = factor * 0.3;
          ctx.arc(p.x, p.y, ball.radius * factor, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });
    }

    pinsRef.current.forEach(pin => {
      if (!pin.active) return;
      ctx.save();
      ctx.translate(pin.pos.x, pin.pos.y);
      ctx.rotate(pin.angle);
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.beginPath(); ctx.ellipse(0, pin.radius, pin.radius, pin.radius/3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath(); ctx.arc(0, 0, pin.radius, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ef4444'; ctx.fillRect(-pin.radius, -2, pin.radius * 2, 4);
      ctx.restore();
    });

    if ((ball.active || isAiming.current) && !isGameOver) {
      ctx.save();
      const scale = ball.type === PowerUpType.GIANT_BALL ? 1 + Math.sin(Date.now() / 100) * 0.1 : 1;
      ctx.translate(ball.pos.x, ball.pos.y);
      ctx.scale(scale, scale);
      
      let color = customBallColor || '#e11d48';
      if (ball.type === PowerUpType.FIRE_BALL) color = '#f97316';
      else if (ball.type === PowerUpType.GIANT_BALL) color = '#8b5cf6';
      else if (ball.type === PowerUpType.SUPER_CURVE) color = '#06b6d4';
      
      if (ball.type === PowerUpType.FIRE_BALL) { 
        ctx.shadowBlur = 40; 
        ctx.shadowColor = '#f97316';
        const flicker = Math.sin(Date.now() / 40) * 3;
        ctx.fillStyle = '#fef3c7';
        ctx.beginPath(); ctx.arc(0, 0, ball.radius * 0.6 + flicker, 0, Math.PI * 2); ctx.fill();
      }

      const grad = ctx.createRadialGradient(-ball.radius/3, -ball.radius/3, ball.radius/4, 0, 0, ball.radius);
      grad.addColorStop(0, '#fff'); grad.addColorStop(1, color);
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(0, 0, ball.radius, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      const hs = ball.radius * 0.15;
      ctx.beginPath(); ctx.arc(-hs, -hs, hs, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(hs, -hs, hs, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(0, hs, hs, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    confettiRef.current.forEach(c => {
      ctx.fillStyle = c.color;
      ctx.globalAlpha = Math.min(c.life, 1.0);
      ctx.fillRect(c.pos.x, c.pos.y, c.size, c.size);
      ctx.globalAlpha = 1;
    });

    if (notification) {
      ctx.save(); ctx.font = 'bold 72px Orbitron'; ctx.fillStyle = '#f43f5e'; ctx.textAlign = 'center';
      ctx.shadowBlur = 30; ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.fillText(notification, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.restore();
    }
  };

  const loop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    update();
    draw(ctx);
    frameId.current = requestAnimationFrame(loop);
  }, [isPaused, theme, activePowerUp, powerUpTimer, notification, currentFrame, currentPlayer, isGameOver, power, spin, customBallColor, getEffectiveRadius]);

  useEffect(() => {
    frameId.current = requestAnimationFrame(loop);
    return () => { if (frameId.current) cancelAnimationFrame(frameId.current); };
  }, [loop]);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPaused || (gameMode === GameMode.VS_COMPUTER && currentPlayer === 2) || isGameOver) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const scaleX = CANVAS_WIDTH / rect.width;
    mouseX.current = Math.min(Math.max(x * scaleX, LANE_X_MIN + getEffectiveRadius()), LANE_X_MAX - getEffectiveRadius());
  };

  return (
    <canvas 
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      onPointerMove={handlePointerMove}
      onClick={throwBall}
      className="w-full h-full cursor-crosshair touch-none"
    />
  );
};

export default BowlingGame;
