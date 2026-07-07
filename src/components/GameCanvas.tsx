import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Dimensions, GestureResponderEvent } from 'react-native';
import { playSFX, triggerHaptic } from '@/utils/sound';

interface GameCanvasProps {
  isPaused: boolean;
  isGameOver: boolean;
  onScoreUpdate: (score: number) => void;
  onLivesUpdate: (lives: number) => void;
  onShieldUpdate: (active: boolean) => void;
  onBlasterUpdate: (active: boolean) => void;
  onGameOverTrigger: (finalScore: number) => void;
}

interface Asteroid {
  id: number;
  x: number; // 0 to 100 (percentage)
  y: number; // 0 to 100 (percentage)
  size: number;
  speed: number;
}

interface Dust {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
}

interface Laser {
  id: number;
  x: number;
  y: number;
}

interface PowerUp {
  id: number;
  x: number;
  y: number;
  type: 'shield' | 'blaster';
  speed: number;
}

const SPAWN_INTERVALS = {
  ASTEROID: 1500, // Spawn asteroid every 1.5s
  DUST: 800,      // Spawn dust every 0.8s
  POWERUP: 10000, // Spawn powerup every 10s
};

export default function GameCanvas({
  isPaused,
  isGameOver,
  onScoreUpdate,
  onLivesUpdate,
  onShieldUpdate,
  onBlasterUpdate,
  onGameOverTrigger,
}: GameCanvasProps) {
  const [containerWidth, setContainerWidth] = useState(Dimensions.get('window').width);
  
  // Game state held in refs to allow access in requestAnimationFrame without stale closures
  const playerXRef = useRef<number>(50); // percentage (0 - 100)
  const scoreRef = useRef<number>(0);
  const livesRef = useRef<number>(3);
  const shieldActiveRef = useRef<boolean>(false);
  const blasterActiveRef = useRef<boolean>(false);

  // Entity refs to perform pure calculations inside requestAnimationFrame
  const asteroidsRef = useRef<Asteroid[]>([]);
  const dustsRef = useRef<Dust[]>([]);
  const lasersRef = useRef<Laser[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);

  const [playerX, setPlayerX] = useState(50);
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [dusts, setDusts] = useState<Dust[]>([]);
  const [lasers, setLasers] = useState<Laser[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  
  const [shieldActive, setShieldActive] = useState(false);
  const [blasterActive, setBlasterActive] = useState(false);

  const loopRef = useRef<number | null>(null);
  const gameActiveRef = useRef<boolean>(true);

  // Synchronize state with refs for rendering/physics
  useEffect(() => {
    gameActiveRef.current = !isPaused && !isGameOver;
  }, [isPaused, isGameOver]);

  // Handle dimensions layout changes
  const onLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };

  // Drag controls
  const handleTouch = (event: GestureResponderEvent) => {
    if (!gameActiveRef.current) return;
    const touchX = event.nativeEvent.locationX;
    const percentage = (touchX / containerWidth) * 100;
    const clampedX = Math.max(8, Math.min(92, percentage));
    playerXRef.current = clampedX;
    setPlayerX(clampedX);
  };

  function handlePlayerHit() {
    if (shieldActiveRef.current) {
      // Shield absorbs hit
      shieldActiveRef.current = false;
      setShieldActive(false);
      onShieldUpdate(false);
      playSFX('explosion'); // lighter sound or shield shatter
      triggerHaptic('medium');
      return;
    }

    // Deduct life
    livesRef.current -= 1;
    onLivesUpdate(livesRef.current);
    triggerHaptic('heavy');

    if (livesRef.current <= 0) {
      // Game Over
      gameActiveRef.current = false;
      playSFX('gameover');
      onGameOverTrigger(scoreRef.current);
    } else {
      playSFX('explosion');
    }
  }

  function activatePowerUp(type: 'shield' | 'blaster') {
    playSFX('powerup');
    triggerHaptic('success');

    if (type === 'shield') {
      shieldActiveRef.current = true;
      setShieldActive(true);
      onShieldUpdate(true);
      
      // Shield lasts until hit (no timer)
    } else if (type === 'blaster') {
      blasterActiveRef.current = true;
      setBlasterActive(true);
      onBlasterUpdate(true);

      // Blaster lasts 6 seconds
      setTimeout(() => {
        blasterActiveRef.current = false;
        setBlasterActive(false);
        onBlasterUpdate(false);
      }, 6000);
    }
  }

  // Spawners timers
  useEffect(() => {
    if (isPaused || isGameOver) return;

    let idCounter = 0;

    const asteroidInterval = setInterval(() => {
      if (!gameActiveRef.current) return;
      
      // Speed scales up slightly with score
      const speedScale = 1 + Math.min(scoreRef.current / 3000, 1.5);
      const baseSpeed = 0.5 + Math.random() * 0.4; // movement percentage per frame
      
      const newAsteroid: Asteroid = {
        id: ++idCounter,
        x: 5 + Math.random() * 90,
        y: -10,
        size: 30 + Math.random() * 30, // in pixels
        speed: baseSpeed * speedScale,
      };
      
      asteroidsRef.current.push(newAsteroid);
      setAsteroids([...asteroidsRef.current]);
    }, SPAWN_INTERVALS.ASTEROID);

    const dustInterval = setInterval(() => {
      if (!gameActiveRef.current) return;
      const newDust: Dust = {
        id: ++idCounter,
        x: Math.random() * 100,
        y: -5,
        size: 6 + Math.random() * 6,
        speed: 0.8 + Math.random() * 0.5,
      };
      
      dustsRef.current.push(newDust);
      setDusts([...dustsRef.current]);
    }, SPAWN_INTERVALS.DUST);

    const powerupInterval = setInterval(() => {
      if (!gameActiveRef.current) return;
      const types: ('shield' | 'blaster')[] = ['shield', 'blaster'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      const newPowerUp: PowerUp = {
        id: ++idCounter,
        x: 10 + Math.random() * 80,
        y: -10,
        type,
        speed: 0.6,
      };
      
      powerUpsRef.current.push(newPowerUp);
      setPowerUps([...powerUpsRef.current]);
    }, SPAWN_INTERVALS.POWERUP);

    // Auto laser fire when blaster is active
    let blasterInterval: NodeJS.Timeout;
    const checkBlasterFire = () => {
      blasterInterval = setInterval(() => {
        if (!gameActiveRef.current) return;
        if (blasterActiveRef.current) {
          playSFX('laser');
          triggerHaptic('light');
          const newLaser: Laser = {
            id: ++idCounter,
            x: playerXRef.current,
            y: 85, // Spawn right above ship
          };
          
          lasersRef.current.push(newLaser);
          setLasers([...lasersRef.current]);
        }
      }, 350);
    };
    checkBlasterFire();

    return () => {
      clearInterval(asteroidInterval);
      clearInterval(dustInterval);
      clearInterval(powerupInterval);
      clearInterval(blasterInterval);
    };
  }, [isPaused, isGameOver]);

  // Main Physics & Animation Loop
  useEffect(() => {
    const updatePhysics = () => {
      if (!gameActiveRef.current) {
        loopRef.current = requestAnimationFrame(updatePhysics);
        return;
      }

      // 1. Move Lasers & Check Collision with Asteroids
      const nextLasers: Laser[] = [];
      const remainingAsteroids: Asteroid[] = [...asteroidsRef.current];

      for (const laser of lasersRef.current) {
        const nextY = laser.y - 2; // Lasers move up fast
        let hitIndex = -1;

        // Check if this laser hits any asteroid
        for (let i = 0; i < remainingAsteroids.length; i++) {
          const ast = remainingAsteroids[i];
          const xDist = Math.abs(ast.x - laser.x);
          const yDist = Math.abs(ast.y - nextY);

          if (xDist < 6 && yDist < 6) {
            hitIndex = i;
            break;
          }
        }

        if (hitIndex > -1) {
          // Laser hit!
          remainingAsteroids.splice(hitIndex, 1);
          scoreRef.current += 30; // Score bonus
          onScoreUpdate(scoreRef.current);
          playSFX('explosion');
          triggerHaptic('medium');
          // Laser is destroyed
        } else if (nextY > -5) {
          nextLasers.push({ ...laser, y: nextY });
        }
      }

      // 2. Move Remaining Asteroids & Check Player Collisions
      const finalAsteroids: Asteroid[] = [];
      for (const ast of remainingAsteroids) {
        const nextY = ast.y + ast.speed;

        const shipY = 88;
        const shipHalfWidthPct = 8;

        const yDist = Math.abs(nextY - shipY);
        const xDist = Math.abs(ast.x - playerXRef.current);

        if (yDist < 6 && xDist < shipHalfWidthPct) {
          // Collision with player!
          handlePlayerHit();
          continue;
        }

        if (nextY > 105) {
          // Dodged!
          scoreRef.current += 10;
          onScoreUpdate(scoreRef.current);
        } else {
          finalAsteroids.push({ ...ast, y: nextY });
        }
      }

      // 3. Move Dust & Check Collections
      const remainingDusts: Dust[] = [];
      for (const dust of dustsRef.current) {
        const nextY = dust.y + dust.speed;

        const shipY = 88;
        const shipHalfWidthPct = 8;

        const yDist = Math.abs(nextY - shipY);
        const xDist = Math.abs(dust.x - playerXRef.current);

        if (yDist < 5 && xDist < shipHalfWidthPct) {
          // Collected dust!
          scoreRef.current += 50;
          onScoreUpdate(scoreRef.current);
          playSFX('powerup');
          triggerHaptic('light');
          continue;
        }

        if (nextY <= 105) {
          remainingDusts.push({ ...dust, y: nextY });
        }
      }

      // 4. Move Power-Ups & Check Collections
      const remainingPowerUps: PowerUp[] = [];
      for (const p of powerUpsRef.current) {
        const nextY = p.y + p.speed;

        const shipY = 88;
        const shipHalfWidthPct = 8;

        const yDist = Math.abs(nextY - shipY);
        const xDist = Math.abs(p.x - playerXRef.current);

        if (yDist < 6 && xDist < shipHalfWidthPct) {
          // Collected power-up!
          activatePowerUp(p.type);
          continue;
        }

        if (nextY <= 105) {
          remainingPowerUps.push({ ...p, y: nextY });
        }
      }

      // Update refs
      asteroidsRef.current = finalAsteroids;
      lasersRef.current = nextLasers;
      dustsRef.current = remainingDusts;
      powerUpsRef.current = remainingPowerUps;

      // Update states
      setAsteroids(finalAsteroids);
      setLasers(nextLasers);
      setDusts(remainingDusts);
      setPowerUps(remainingPowerUps);

      loopRef.current = requestAnimationFrame(updatePhysics);
    };

    loopRef.current = requestAnimationFrame(updatePhysics);

    return () => {
      if (loopRef.current) {
        cancelAnimationFrame(loopRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View
      style={styles.canvasContainer}
      onLayout={onLayout}
      onTouchStart={handleTouch}
      onTouchMove={handleTouch}
    >
      {/* 1. Dust Particles */}
      {dusts.map((dust) => (
        <View
          key={dust.id}
          style={[
            styles.dust,
            {
              left: `${dust.x}%`,
              top: `${dust.y}%`,
              width: dust.size,
              height: dust.size,
            },
          ]}
        />
      ))}

      {/* 2. Lasers */}
      {lasers.map((laser) => (
        <View
          key={laser.id}
          style={[
            styles.laser,
            {
              left: `${laser.x}%`,
              top: `${laser.y}%`,
            },
          ]}
        />
      ))}

      {/* 3. Power-ups */}
      {powerUps.map((p) => (
        <View
          key={p.id}
          style={[
            styles.powerUp,
            p.type === 'shield' ? styles.shieldPowerUp : styles.blasterPowerUp,
            {
              left: `${p.x}%`,
              top: `${p.y}%`,
            },
          ]}
        >
          <View style={styles.powerUpInner} />
        </View>
      ))}

      {/* 4. Asteroids */}
      {asteroids.map((ast) => (
        <View
          key={ast.id}
          style={[
            styles.asteroid,
            {
              left: `${ast.x}%`,
              top: `${ast.y}%`,
              width: ast.size,
              height: ast.size,
              borderRadius: ast.size / 2,
              marginLeft: -ast.size / 2,
              marginTop: -ast.size / 2,
            },
          ]}
        >
          <View style={[styles.asteroidCrack, { width: ast.size * 0.6, height: 2, top: ast.size * 0.3 }]} />
          <View style={[styles.asteroidCrack, { width: ast.size * 0.4, height: 2, top: ast.size * 0.6, left: ast.size * 0.3 }]} />
        </View>
      ))}

      {/* 5. Player Ship */}
      <View
        style={[
          styles.playerContainer,
          {
            left: `${playerX}%`,
          },
        ]}
      >
        {/* Shield Overlay */}
        {shieldActive && <View style={styles.shieldVisual} />}
        
        {/* Blaster active neon sparks */}
        {blasterActive && <View style={styles.blasterGlow} />}

        {/* Thruster Flame */}
        {!isPaused && !isGameOver && (
          <View style={styles.shipFlame} />
        )}

        {/* Ship wings */}
        <View style={styles.shipWings} />
        
        {/* Ship body */}
        <View style={styles.shipBody} />

        {/* Ship cockpit */}
        <View style={styles.shipCockpit} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  canvasContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#030308',
    overflow: 'hidden',
    width: '100%',
    height: '100%',
  },
  playerContainer: {
    position: 'absolute',
    bottom: '8%', // y-coordinate is around 88-92%
    width: 60,
    height: 60,
    marginLeft: -30, // Center alignment
    justifyContent: 'center',
    alignItems: 'center',
  },
  shipBody: {
    width: 14,
    height: 38,
    backgroundColor: '#ffffff',
    borderRadius: 7,
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: '#ff007f',
  },
  shipCockpit: {
    width: 8,
    height: 16,
    backgroundColor: '#00d2ff',
    borderRadius: 4,
    position: 'absolute',
    top: 15,
  },
  shipWings: {
    width: 48,
    height: 12,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    position: 'absolute',
    top: 25,
    borderWidth: 1.5,
    borderColor: '#ff007f',
  },
  shipFlame: {
    width: 10,
    height: 20,
    backgroundColor: '#ff8c00',
    borderRadius: 5,
    position: 'absolute',
    bottom: 2,
    opacity: 0.8,
  },
  shieldVisual: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: '#00d2ff',
    backgroundColor: 'rgba(0, 210, 255, 0.15)',
    shadowColor: '#00d2ff',
    shadowRadius: 10,
    shadowOpacity: 0.8,
  },
  blasterGlow: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1.5,
    borderColor: '#a020f0', // purple
    backgroundColor: 'rgba(160, 32, 240, 0.05)',
    shadowColor: '#a020f0',
    shadowRadius: 8,
    shadowOpacity: 0.6,
  },
  asteroid: {
    position: 'absolute',
    backgroundColor: '#3a2520',
    borderWidth: 2,
    borderColor: '#d2691e',
    shadowColor: '#ff4500',
    shadowRadius: 6,
    shadowOpacity: 0.5,
  },
  asteroidCrack: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 69, 0, 0.6)',
    left: '10%',
  },
  dust: {
    position: 'absolute',
    backgroundColor: '#ffd700',
    borderRadius: 50,
    shadowColor: '#ffd700',
    shadowRadius: 3,
    shadowOpacity: 0.8,
  },
  laser: {
    position: 'absolute',
    width: 3,
    height: 18,
    backgroundColor: '#ff007f',
    borderRadius: 1.5,
    marginLeft: -1.5,
    shadowColor: '#ff007f',
    shadowRadius: 5,
    shadowOpacity: 0.9,
  },
  powerUp: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginLeft: -12,
    marginTop: -12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shieldPowerUp: {
    borderColor: '#00d2ff',
    backgroundColor: 'rgba(0, 210, 255, 0.2)',
  },
  blasterPowerUp: {
    borderColor: '#a020f0',
    backgroundColor: 'rgba(160, 32, 240, 0.2)',
  },
  powerUpInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffffff',
  },
});
