'use client'

import { useEffect, useRef, useState } from 'react'

export default function Snowfall() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const rafRef = useRef<number | null>(null)
    const [mounted, setMounted] = useState(false)
    const [enabled, setEnabled] = useState(false)

    // Track mount state to avoid hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (!mounted) return

        const checkTheme = () => {
            const dataTheme = document.documentElement.getAttribute('data-theme') || ''
            const classTheme = (document.documentElement.className || '').toString()
            const combined = `${dataTheme} ${classTheme}`.toLowerCase()
            setEnabled(combined.includes('christmas') || combined.includes('holly'))
        }

        // initial
        checkTheme()

        const obs = new MutationObserver(() => checkTheme())
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] })

        return () => obs.disconnect()
    }, [mounted])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let width = (canvas.width = window.innerWidth)
        let height = (canvas.height = window.innerHeight)

        const onResize = () => {
            width = canvas.width = window.innerWidth
            height = canvas.height = window.innerHeight
        }
        window.addEventListener('resize', onResize)

        type Flake = { x: number; y: number; r: number; d: number; vx: number; vy: number }
        const flakes: Flake[] = []
        const maxFlakes = 120

        const initFlakes = () => {
            flakes.length = 0
            for (let i = 0; i < maxFlakes; i++) {
                flakes.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    r: Math.random() * 3 + 1,
                    d: Math.random() * maxFlakes,
                    vx: (Math.random() * 1 - 0.5) * 0.5,
                    vy: Math.random() * 1 + 0.5,
                })
            }
        }

        initFlakes()

        const render = () => {
            ctx.clearRect(0, 0, width, height)
            ctx.fillStyle = 'rgba(255,255,255,0.85)'
            ctx.beginPath()
            for (let i = 0; i < flakes.length; i++) {
                const f = flakes[i]
                ctx.moveTo(f.x, f.y)
                ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2, true)
            }
            ctx.fill()

            for (let i = 0; i < flakes.length; i++) {
                const f = flakes[i]
                f.x += f.vx
                f.y += f.vy
                // reset when out of bounds
                if (f.y > height + 5) {
                    flakes[i] = { x: Math.random() * width, y: -10, r: f.r, d: f.d, vx: f.vx, vy: f.vy }
                }
            }

            rafRef.current = requestAnimationFrame(render)
        }

        if (enabled) {
            rafRef.current = requestAnimationFrame(render)
        }

        return () => {
            window.removeEventListener('resize', onResize)
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [enabled])

    // Always render nothing on server and initial client render to avoid hydration mismatch
    // Only render canvas after mount and when enabled
    if (!mounted || !enabled) return null

    return (
        <canvas
            ref={canvasRef}
            className="pointer-events-none fixed inset-0 z-5"
            style={{ width: '100%', height: '100%' }}
        />
    )
}
