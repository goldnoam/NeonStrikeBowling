
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
import { Pin, Ball, PowerUpType, Vector2D, FrameResult, GameMode } from '../types';
import { soundManager } from './SoundManager';

interface BowlingGameProps {
  theme: 'dark' | 'light';
  isPaused: boolean;
  gameMode: GameMode;
  onGameStateUpdate: (state: any) => void;
  power: number;
  spin: number;
}

interface Confetti {
  pos: Vector2D;
  vel: Vector2D;
  color: string;
  size: number;
  life: number;
}

const BowlingGame: React.FC<BowlingGameProps> = ({ theme, isPaused, gameMode, onGameStateUpdate, power, spin }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameId = useRef<number>();
  
  const [currentFrame, setCurrentFrame] = useState(1);
  const [throwsInFrame, setThrowsInFrame] = useState(0);
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

  const ballRef = useRef<Ball>({
    pos: { x: CANVAS_WIDTH / 2, y: BALL_START_Y },
    vel: { x: 0, y: 0 },
    radius: BALL_RADIUS,
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
      showNotification: notification || undefined,
      isGameOver
    });
  }, [currentFrame, activePowerUp, powerUpTimer, notification, currentPlayer, onGameStateUpdate, isGameOver]);

  const spawnConfetti = useCallback((isFullVictory = false) => {
    const colors = ['#f43f5e', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa'];
    const amount = isFullVictory ? 150 : 60;
    for (let i = 0; i < amount; i++) {
      confettiRef.current.push({
        pos: isFullVictory ? { x: Math.random() * CANVAS_WIDTH, y: -20 } : { x: (Math.random() * 200) + (CANVAS_WIDTH / 2 - 100), y: PIN_START_Y + 50 },
        vel: { x: (Math.random() - 0.5) * 8, y: isFullVictory ? (Math.random() * 8 + 4) : -(Math.random() * 12 + 5) },
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        life: 1.0 + Math.random()
      });
    }
  }, []);

  const throwBall = useCallback(() => {
    if (!isAiming.current || isRolling.current || isPaused || isGameOver) return;
    
    isAiming.current = false;
    isRolling.current = true;
    
    let baseVel = 10 + (power / 100) * 15;
    
    // Explicit Spin from control prop + implicit spin from position
    const fromCenter = (mouseX.current - CANVAS_WIDTH / 2);
    let curve = (fromCenter / 20) + (spin / 50 * 5); // Combine pos and slider

    const ball = ballRef.current;
    ball.active = true;
    ball.type = activePowerUp;
    ball.trail = [];
    
    if (activePowerUp === PowerUpType.FIRE_BALL) baseVel *= 1.35;
    ball.radius = activePowerUp === PowerUpType.GIANT_BALL ? BALL_RADIUS * 1.8 : BALL_RADIUS;
    
    ball.vel = { x: curve * 0.4, y: -baseVel };
    ball.curve = curve; 
    ball.pos = { x: mouseX.current, y: BALL_START_Y };
  }, [activePowerUp, isPaused, isGameOver, power, spin]);

  useEffect(() => {
    if (gameMode === GameMode.VS_AI && currentPlayer === 2 && isAiming.current && !isPaused && !isAITurn.current && !isGameOver) {
      isAITurn.current = true;
      setTimeout(() => {
        mouseX.current = (CANVAS_WIDTH / 2) + (Math.random() - 0.5) * 120;
        setTimeout(() => {
          throwBall();
          isAITurn.current = false;
        }, 800);
      }, 1000);
    }
  }, [currentPlayer, isAiming.current, gameMode, isPaused, throwBall, isGameOver]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaused || !isAiming.current || (gameMode === GameMode.VS_AI && currentPlayer === 2) || isGameOver) return;
      const key = e.key.toLowerCase();
      if (key === 'a' || e.key === 'ArrowLeft') {
        mouseX.current = Math.max(LANE_X_MIN + (ballRef.current.radius || BALL_RADIUS), mouseX.current - 14);
      } else if (key === 'd' || e.key === 'ArrowRight') {
        mouseX.current = Math.min(LANE_X_MAX - (ballRef.current.radius || BALL_RADIUS), mouseX.current + 14);
      } else if (key === ' ' || key === 'Enter') {
        throwBall();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaused, throwBall, currentPlayer, gameMode, isGameOver]);

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

    // Report results for charging
    if (isStrike) {
      onGameStateUpdate({ event: 'STRIKE' });
    } else if (isSpare) {
      onGameStateUpdate({ event: 'SPARE' });
    } else {
      onGameStateUpdate({ event: 'PIN_HIT', count: knockedThisThrow });
    }

    if (isStrike) { 
        setNotification("STRIKE!"); 
        soundManager.playPowerUp(); 
        spawnConfetti(); 
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
        setThrowsInFrame(0);
        initPins();
        resetBall();
      }, 1500);
    } else {
      setThrowsInFrame(frameObj.throws.length);
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

    // Power-up duration update
    if (activePowerUp) {
      // Power-up stays active for the specific duration frames tracked in update()
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
        const force = ball.type === PowerUpType.FIRE_BALL ? 5 : 1.7;
        pin.vel.x = -Math.cos(angle) * speed * force;
        pin.vel.y = -Math.sin(angle) * speed * force;
        pin.knocked = true;
        
        if (ball.type === PowerUpType.FIRE_BALL) {
           pinsRef.current.forEach(p => {
             if (!p.active || p.knocked) return;
             const d = Math.sqrt(Math.pow(pin.pos.x - p.pos.x, 2) + Math.pow(pin.pos.y - p.pos.y, 2));
             if (d < 170) {
               p.knocked = true;
               const a = Math.atan2(p.pos.y - pin.pos.y, p.pos.x - pin.pos.x);
               p.vel.x = Math.cos(a) * 12;
               p.vel.y = Math.sin(a) * 12;
             }
           });
        }
        ball.vel.x *= ball.type === PowerUpType.GIANT_BALL ? 0.99 : 0.8;
        ball.vel.y *= ball.type === PowerUpType.GIANT_BALL ? 0.99 : 0.8;
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
          const f = 1.1;
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
      c.life -= 0.008;
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
    if (isAiming.current) ball.pos.x = mouseX.current;

    if (ball.active) {
      const speed = Math.sqrt(ball.vel.x * ball.vel.x + ball.vel.y * ball.vel.y);
      if (Math.random() > 0.1 || ball.trail.length < 5) {
        ball.trail.push({ ...ball.pos });
      }
      if (ball.trail.length > 25) ball.trail.shift();

      const lanePositionFactor = (BALL_START_Y - ball.pos.y) / BALL_START_Y;
      const hookStrength = ball.curve * 0.15 * lanePositionFactor;
      ball.vel.x -= hookStrength;

      ball.pos.x += ball.vel.x;
      ball.pos.y += ball.vel.y;
      ball.vel.x *= FRICTION;
      ball.vel.y *= FRICTION;

      if (activePowerUp === PowerUpType.SUPER_CURVE) {
        ball.vel.x += (mouseX.current - ball.pos.x) * 0.1;
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
      if (pin.knocked) pin.angle += (Math.abs(pin.vel.x) + Math.abs(pin.vel.y)) * 0.1;
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
      radius: activePowerUp === PowerUpType.GIANT_BALL ? BALL_RADIUS * 1.8 : BALL_RADIUS,
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
      
      let tx = mouseX.current, ty = BALL_START_Y, tvx = ((mouseX.current - CANVAS_WIDTH / 2) / 20 * 0.4) + (spin / 50 * 5 * 0.4), tvy = -(10 + (power/100)*15);
      let tc = (mouseX.current - CANVAS_WIDTH / 2) / 20 + (spin / 50 * 5);
      ctx.moveTo(tx, ty);
      for (let i = 0; i < 45; i++) {
        const lp = (BALL_START_Y - ty) / BALL_START_Y;
        tvx -= tc * 0.15 * lp;
        tx += tvx; ty += tvy; tvx *= FRICTION; tvy *= FRICTION;
        if (activePowerUp === PowerUpType.SUPER_CURVE) tx += (mouseX.current - tx) * 0.1;
        ctx.lineTo(tx, ty);
        if (ty < 0) break;
      }
      ctx.stroke(); ctx.restore();
    }

    const ball = ballRef.current;
    if (ball.active && ball.trail.length > 0) {
      const speed = Math.sqrt(ball.vel.x ** 2 + ball.vel.y ** 2);
      ball.trail.forEach((p, i) => {
        const factor = i / ball.trail.length;
        const jitterX = (Math.random() - 0.5) * (activePowerUp === PowerUpType.FIRE_BALL ? 15 : 4) * (1 - factor);
        const jitterY = (Math.random() - 0.5) * (activePowerUp === PowerUpType.FIRE_BALL ? 15 : 4) * (1 - factor);
        
        ctx.beginPath();
        if (activePowerUp === PowerUpType.FIRE_BALL) {
          const emberColor = i % 3 === 0 ? '#f97316' : (i % 3 === 1 ? '#fbbf24' : '#ef4444');
          ctx.fillStyle = emberColor;
          ctx.globalAlpha = factor * 0.8;
          const radiusScale = (0.3 + Math.random() * 0.7) * ball.radius * (0.5 + factor * 0.5);
          ctx.arc(p.x + jitterX, p.y + jitterY, radiusScale, 0, Math.PI * 2);
        } else {
          ctx.fillStyle = theme === 'dark' ? `rgba(244, 63, 94, ${factor * 0.3 * (speed / 15)})` : `rgba(14, 165, 233, ${factor * 0.3 * (speed / 15)})`;
          ctx.arc(p.x + jitterX, p.y + jitterY, ball.radius * factor, 0, Math.PI * 2);
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
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.beginPath(); ctx.ellipse(0, pin.radius, pin.radius, pin.radius/3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath(); ctx.arc(0, 0, pin.radius, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ef4444'; ctx.fillRect(-pin.radius, -2, pin.radius * 2, 4);
      ctx.restore();
    });

    if ((ball.active || isAiming.current) && !isGameOver) {
      ctx.save();
      const scale = activePowerUp === PowerUpType.GIANT_BALL ? 1 + Math.sin(Date.now() / 150) * 0.08 : 1;
      ctx.translate(ball.pos.x, ball.pos.y);
      ctx.scale(scale, scale);
      
      let color = '#e11d48';
      if (activePowerUp === PowerUpType.FIRE_BALL) color = '#f97316';
      else if (activePowerUp === PowerUpType.GIANT_BALL) color = '#8b5cf6';
      else if (activePowerUp === PowerUpType.SUPER_CURVE) color = '#06b6d4';
      
      if (activePowerUp === PowerUpType.FIRE_BALL) { 
        ctx.shadowBlur = 40; 
        ctx.shadowColor = '#f97316';
        const flicker = Math.sin(Date.now() / 50) * 2;
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
      ctx.shadowBlur = 25; ctx.shadowColor = 'rgba(0,0,0,0.9)';
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
  }, [isPaused, theme, activePowerUp, powerUpTimer, notification, currentFrame, currentPlayer, isGameOver, power, spin]);

  useEffect(() => {
    frameId.current = requestAnimationFrame(loop);
    return () => { if (frameId.current) cancelAnimationFrame(frameId.current); };
  }, [loop]);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPaused || (gameMode === GameMode.VS_AI && currentPlayer === 2) || isGameOver) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const scaleX = CANVAS_WIDTH / rect.width;
    mouseX.current = Math.min(Math.max(x * scaleX, LANE_X_MIN + (ballRef.current.radius || BALL_RADIUS)), LANE_X_MAX - (ballRef.current.radius || BALL_RADIUS));
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
