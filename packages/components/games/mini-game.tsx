"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { Flame, Gamepad2, Trophy, Zap, Target, Timer, Sparkles, X } from 'lucide-react'

import { Button } from '@/packages/components/ui/button'
import { Badge } from '@/packages/components/ui/badge'

// Particle type for visual effects
type Particle = {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
  size: number
}

// Target type for the game
type GameTarget = {
  id: number
  x: number
  y: number
  size: number
  points: number
  type: 'ember' | 'golden' | 'speed' | 'bomb'
  createdAt: number
}

const GAME_DURATION = 30
const TARGET_LIFETIME = 2000
const SPAWN_INTERVAL_BASE = 800
const SPAWN_INTERVAL_MIN = 400

const TARGET_CONFIGS = {
  ember: { color: 'from-orange-400 to-amber-500', points: 1, size: 44, chance: 0.6 },
  golden: { color: 'from-yellow-300 to-amber-400', points: 5, size: 36, chance: 0.15 },
  speed: { color: 'from-cyan-400 to-blue-500', points: 2, size: 40, chance: 0.15 },
  bomb: { color: 'from-red-500 to-red-700', points: -3, size: 48, chance: 0.1 },
}

export default function MiniGame() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <Button
        variant="outline"
        size="lg"
        onClick={() => setOpen(true)}
        className="group bg-background/50 border-primary/30 hover:border-primary/60 hover:bg-primary/10 transition-all"
      >
        <Gamepad2 className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
        Play a Game
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Ember Blitz mini-game"
            className="relative z-10 w-full max-w-lg"
          >
            <div className="glass-card shadow-2xl overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-primary/20">
                      <Flame className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Ember Blitz</h3>
                      <p className="text-xs text-muted-foreground">Catch the embers!</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() => setOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <Game />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Game() {
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [best, setBest] = useState<number>(() => {
    if (typeof window === 'undefined') return 0
    try {
      const v = localStorage.getItem('ember-blitz-best')
      return v ? parseInt(v, 10) : 0
    } catch {
      return 0
    }
  })
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [running, setRunning] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [targets, setTargets] = useState<GameTarget[]>([])
  const [particles, setParticles] = useState<Particle[]>([])
  const [lastHitPos, setLastHitPos] = useState<{ x: number; y: number; points: number } | null>(null)

  const areaRef = useRef<HTMLDivElement | null>(null)
  const targetIdRef = useRef(0)
  const particleIdRef = useRef(0)
  const spawnIntervalRef = useRef(SPAWN_INTERVAL_BASE)

  // Spawn particles effect
  const spawnParticles = useCallback((x: number, y: number, color: string, count: number = 8) => {
    const newParticles: Particle[] = []
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5
      const speed = 2 + Math.random() * 3
      newParticles.push({
        id: particleIdRef.current++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color,
        size: 4 + Math.random() * 4,
      })
    }
    setParticles(prev => [...prev, ...newParticles])
  }, [])

  // Spawn a new target
  const spawnTarget = useCallback(() => {
    const rand = Math.random()
    let type: GameTarget['type'] = 'ember'
    let cumulative = 0

    for (const [t, config] of Object.entries(TARGET_CONFIGS)) {
      cumulative += config.chance
      if (rand < cumulative) {
        type = t as GameTarget['type']
        break
      }
    }

    const config = TARGET_CONFIGS[type]
    const padding = config.size / 2 + 10
    const areaWidth = areaRef.current?.clientWidth || 300
    const areaHeight = areaRef.current?.clientHeight || 200

    const newTarget: GameTarget = {
      id: targetIdRef.current++,
      x: padding + Math.random() * (areaWidth - padding * 2),
      y: padding + Math.random() * (areaHeight - padding * 2),
      size: config.size,
      points: config.points,
      type,
      createdAt: Date.now(),
    }

    setTargets(prev => [...prev, newTarget])
  }, [])

  // Handle target hit
  const handleHit = useCallback((target: GameTarget, e: React.MouseEvent | React.TouchEvent) => {
    if (!running) return

    const rect = areaRef.current?.getBoundingClientRect()
    let clientX = 0, clientY = 0

    if ('touches' in e) {
      clientX = e.touches[0]?.clientX || 0
      clientY = e.touches[0]?.clientY || 0
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    const x = clientX - (rect?.left || 0)
    const y = clientY - (rect?.top || 0)

    // Remove the target
    setTargets(prev => prev.filter(t => t.id !== target.id))

    // Handle scoring
    if (target.type === 'bomb') {
      setCombo(0)
      setScore(prev => Math.max(0, prev + target.points))
      spawnParticles(target.x, target.y, '#ef4444', 12)
    } else {
      const comboBonus = Math.floor(combo / 5)
      const points = target.points + comboBonus
      setScore(prev => prev + points)
      setCombo(prev => {
        const newCombo = prev + 1
        setMaxCombo(max => Math.max(max, newCombo))
        return newCombo
      })

      const colorMap = {
        ember: '#f97316',
        golden: '#fbbf24',
        speed: '#22d3ee',
      }
      spawnParticles(target.x, target.y, colorMap[target.type as keyof typeof colorMap] || '#f97316', 10)
    }

    setLastHitPos({ x: target.x, y: target.y, points: target.points })
    setTimeout(() => setLastHitPos(null), 500)
  }, [running, combo, spawnParticles])

  // Game loop
  useEffect(() => {
    if (!running) return

    // Timer countdown
    const timer = window.setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setRunning(false)
          setGameOver(true)
          return 0
        }
        return t - 1
      })
    }, 1000)

    // Target spawning with increasing difficulty
    let spawnTimer: number
    const scheduleSpawn = () => {
      spawnTimer = window.setTimeout(() => {
        spawnTarget()
        // Increase difficulty over time
        spawnIntervalRef.current = Math.max(
          SPAWN_INTERVAL_MIN,
          SPAWN_INTERVAL_BASE - (GAME_DURATION - timeLeft) * 15
        )
        scheduleSpawn()
      }, spawnIntervalRef.current)
    }
    scheduleSpawn()

    // Remove expired targets
    const cleanupTimer = window.setInterval(() => {
      const now = Date.now()
      setTargets(prev => {
        const expired = prev.filter(t => now - t.createdAt > TARGET_LIFETIME)
        expired.forEach(t => {
          if (t.type !== 'bomb') {
            setCombo(0) // Reset combo on miss
          }
        })
        return prev.filter(t => now - t.createdAt <= TARGET_LIFETIME)
      })
    }, 100)

    // Particle animation
    const particleTimer = window.setInterval(() => {
      setParticles(prev =>
        prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.1, // gravity
            life: p.life - 0.05,
          }))
          .filter(p => p.life > 0)
      )
    }, 16)

    return () => {
      window.clearInterval(timer)
      window.clearTimeout(spawnTimer)
      window.clearInterval(cleanupTimer)
      window.clearInterval(particleTimer)
    }
  }, [running, spawnTarget, timeLeft])

  // Save best score
  useEffect(() => {
    if (gameOver && score > best) {
      setBest(score)
      try {
        localStorage.setItem('ember-blitz-best', String(score))
      } catch { }
    }
  }, [gameOver, score, best])

  const start = () => {
    setScore(0)
    setCombo(0)
    setMaxCombo(0)
    setTimeLeft(GAME_DURATION)
    setTargets([])
    setParticles([])
    setGameOver(false)
    spawnIntervalRef.current = SPAWN_INTERVAL_BASE
    setRunning(true)
  }

  const getTargetStyle = (type: GameTarget['type']) => {
    switch (type) {
      case 'golden':
        return 'bg-gradient-to-br from-yellow-300 to-amber-400 shadow-yellow-400/50'
      case 'speed':
        return 'bg-gradient-to-br from-cyan-400 to-blue-500 shadow-cyan-400/50'
      case 'bomb':
        return 'bg-gradient-to-br from-red-500 to-red-700 shadow-red-500/50'
      default:
        return 'bg-gradient-to-br from-orange-400 to-amber-500 shadow-orange-400/50'
    }
  }

  const getTargetIcon = (type: GameTarget['type']) => {
    switch (type) {
      case 'golden':
        return <Trophy className="h-4 w-4 text-yellow-900" />
      case 'speed':
        return <Zap className="h-4 w-4 text-blue-900" />
      case 'bomb':
        return <X className="h-5 w-5 text-white" />
      default:
        return <Flame className="h-4 w-4 text-orange-900" />
    }
  }

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/20 text-sm">
            <Timer className="h-4 w-4 text-primary" />
            <span className="font-mono font-bold">{timeLeft}s</span>
          </div>
          {combo >= 3 && (
            <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 animate-pulse">
              <Sparkles className="h-3 w-3 mr-1" />
              {combo}x Combo!
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="font-bold">{score}</span>
          </div>
          <div className="text-muted-foreground text-xs">
            Best: <span className="font-medium">{best}</span>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div
        ref={areaRef}
        className="relative rounded-xl bg-gradient-to-br from-slate-900/50 via-slate-800/50 to-slate-900/50 border border-border/50 h-64 touch-none overflow-hidden select-none"
        style={{ cursor: running ? 'crosshair' : 'default' }}
      >
        {/* Grid background */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }} />
        </div>

        {/* Particles */}
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: p.x,
              top: p.y,
              width: p.size * p.life,
              height: p.size * p.life,
              backgroundColor: p.color,
              opacity: p.life,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}

        {/* Targets */}
        {targets.map(target => {
          const age = Date.now() - target.createdAt
          const lifePercent = 1 - age / TARGET_LIFETIME
          const scale = 0.8 + lifePercent * 0.2

          return (
            <button
              key={target.id}
              onClick={(e) => handleHit(target, e)}
              onTouchStart={(e) => handleHit(target, e)}
              className={`absolute rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95 ${getTargetStyle(target.type)}`}
              style={{
                left: target.x,
                top: target.y,
                width: target.size,
                height: target.size,
                transform: `translate(-50%, -50%) scale(${scale})`,
                opacity: Math.max(0.5, lifePercent),
              }}
            >
              {getTargetIcon(target.type)}
              {/* Life indicator ring */}
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="2"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="rgba(255,255,255,0.8)"
                  strokeWidth="2"
                  strokeDasharray={`${lifePercent * 100} 100`}
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )
        })}

        {/* Point popup */}
        {lastHitPos && (
          <div
            className={`absolute pointer-events-none font-bold text-lg animate-bounce ${lastHitPos.points > 0 ? 'text-emerald-400' : 'text-red-400'}`}
            style={{
              left: lastHitPos.x,
              top: lastHitPos.y - 20,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {lastHitPos.points > 0 ? `+${lastHitPos.points}` : lastHitPos.points}
          </div>
        )}

        {/* Start/Game Over Overlay */}
        {!running && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="text-center p-6">
              {gameOver ? (
                <>
                  <div className="text-4xl font-bold mb-2">Game Over!</div>
                  <div className="text-muted-foreground mb-1">Score: <span className="text-primary font-bold">{score}</span></div>
                  <div className="text-sm text-muted-foreground mb-4">Max Combo: {maxCombo}x</div>
                  {score > 0 && score >= best && (
                    <Badge className="mb-4 bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0">
                      <Trophy className="h-3 w-3 mr-1" />
                      New High Score!
                    </Badge>
                  )}
                </>
              ) : (
                <>
                  <Flame className="h-12 w-12 mx-auto mb-3 text-primary" />
                  <div className="text-lg font-medium mb-2">Ready to play?</div>
                  <div className="text-xs text-muted-foreground mb-4 max-w-xs">
                    Catch embers for points! Avoid bombs. Build combos for bonus points.
                  </div>
                </>
              )}
              <Button onClick={start} size="lg" className="gap-2">
                <Flame className="h-4 w-4" />
                {gameOver ? 'Play Again' : 'Start Game'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-orange-400 to-amber-500" />
          <span>+1</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-300 to-amber-400" />
          <span>+5</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500" />
          <span>+2</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-red-500 to-red-700" />
          <span>-3</span>
        </div>
      </div>
    </div>
  )
}
