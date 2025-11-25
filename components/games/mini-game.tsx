'use client'

import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'

export default function MiniGame() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="ghost" size="lg" onClick={() => setOpen(true)}>
        Play Ember Catch
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />

          <div className="relative z-10 w-full max-w-md bg-background rounded-lg shadow-lg p-4">
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
  const [timeLeft, setTimeLeft] = useState(15)
  const [running, setRunning] = useState(false)
  const [pos, setPos] = useState({ x: 50, y: 50 })
  const areaRef = useRef<HTMLDivElement | null>(null)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (!running) return

    // move ember every 800ms
    intervalRef.current = window.setInterval(() => {
      move()
    }, 800)

    const ticker = setInterval(() => {
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
      clearInterval(ticker)
    }
  }, [running])

  function move() {
    // choose random position within area (10% - 90%)
    const x = 10 + Math.random() * 80
    const y = 10 + Math.random() * 80
    setPos({ x, y })
  }

  function handleHit() {
    if (!running) return
    setScore((s) => s + 1)
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
        </div>
      </div>

      <div
        ref={areaRef}
        className="relative bg-muted-foreground/5 rounded-md h-48 touch-none"
      >
        {/* target */}
        <button
          onClick={handleHit}
          onTouchStart={handleHit}
          aria-label="Ember target"
          className="absolute rounded-full bg-amber-400 shadow-md"
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
