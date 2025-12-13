"use client"

import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'

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
      <Button variant="ghost" size="lg" onClick={() => setOpen(true)}>
        Play Ember Catch
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Ember Catch mini-game"
            className="relative z-10 w-full max-w-md bg-background rounded-lg shadow-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium">Ember Catch</h3>
              <button
                className="text-sm text-muted-foreground"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>

            <Game />
          </div>
        </div>
      )}
    </>
  )
}

function Game() {
  const [score, setScore] = useState(0)
  const [best, setBest] = useState<number>(() => {
    try {
      const v = localStorage.getItem('ember-catch-best')
      return v ? parseInt(v, 10) : 0
    } catch {
      return 0
    }
  })
  const [timeLeft, setTimeLeft] = useState(15)
  const [running, setRunning] = useState(false)
  const [pos, setPos] = useState({ x: 50, y: 50 })
  const [hitAnim, setHitAnim] = useState(false)
  const areaRef = useRef<HTMLDivElement | null>(null)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (!running) return

    intervalRef.current = window.setInterval(() => move(), 800)

    const ticker = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setRunning(false)
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current)
      window.clearInterval(ticker)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  useEffect(() => {
    if (!running && score > 0) {
      // update best
      setBest((b) => {
        const n = Math.max(b, score)
        try {
          localStorage.setItem('ember-catch-best', String(n))
        } catch { }
        return n
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  function move() {
    const x = 8 + Math.random() * 84
    const y = 8 + Math.random() * 84
    setPos({ x, y })
  }

  function handleHit() {
    if (!running) return
    setScore((s) => s + 1)
    setHitAnim(true)
    setTimeout(() => setHitAnim(false), 200)
    move()
  }

  function start() {
    setScore(0)
    setTimeLeft(15)
    setRunning(true)
    move()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-muted-foreground">
          Time: <span className="font-medium">{timeLeft}s</span>
        </div>
        <div className="text-sm text-muted-foreground">
          Score: <span className="font-medium">{score}</span>
          <span className="text-xs text-muted-foreground ml-3">Best: {best}</span>
        </div>
      </div>

      <div
        ref={areaRef}
        className="relative bg-muted-foreground/5 rounded-md h-48 touch-none overflow-hidden"
      >
        <button
          onClick={handleHit}
          onTouchStart={handleHit}
          aria-label="Ember target"
          className={`absolute rounded-full bg-amber-400 shadow-md transition-transform ${hitAnim ? 'scale-110' : 'scale-100'}`}
          style={{
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            transform: 'translate(-50%, -50%)',
            width: 44,
            height: 44,
          }}
        />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Button size="sm" onClick={start} disabled={running}>
          {running ? 'Running...' : 'Start'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setScore(0)
            setTimeLeft(15)
            setRunning(false)
          }}
        >
          Reset
        </Button>
      </div>
    </div>
  )
}
