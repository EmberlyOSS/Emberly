'use client'

import React, { useEffect, useRef } from 'react'

interface AnimatedBackgroundProps {
  type:
    | 'particles'
    | 'gradient-shift'
    | 'waves'
    | 'glitch'
    | 'grid'
    | 'parallax'
    | 'aurora'
    | 'stars'
    | 'matrix'
    | 'scanlines'
  intensity?: number
  speed?: 'slow' | 'medium' | 'fast'
  color?: string
}

/**
 * Animated Background Effects Component
 * Provides various visual effects for themed backgrounds
 */
export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  type,
  intensity = 0.5,
  speed = 'medium',
  color = '#6366f1',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      console.error('[AnimatedBackground] Canvas ref not found')
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.error('[AnimatedBackground] Could not get 2D context')
      return
    }

    // Set canvas size to match viewport exactly
    const resizeCanvas = () => {
      const w = window.innerWidth
      const h = window.innerHeight

      // Set canvas internal resolution
      canvas.width = w
      canvas.height = h

      // Reset context state after resize
      ctx.imageSmoothingEnabled = true
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const speedMultiplier = speed === 'slow' ? 0.5 : speed === 'fast' ? 2 : 1

    console.log(
      `[AnimatedBackground] Starting ${type} animation with intensity=${intensity}, speed=${speed}`
    )

    // Start the appropriate animation
    if (type === 'particles') {
      animationRef.current = startParticles(
        ctx,
        canvas,
        intensity,
        speedMultiplier,
        color
      )
    } else if (type === 'gradient-shift') {
      animationRef.current = startGradientShift(
        ctx,
        canvas,
        intensity,
        speedMultiplier
      )
    } else if (type === 'waves') {
      animationRef.current = startWaves(
        ctx,
        canvas,
        intensity,
        speedMultiplier,
        color
      )
    } else if (type === 'grid') {
      animationRef.current = startGrid(ctx, canvas, intensity, color)
    } else if (type === 'aurora') {
      animationRef.current = startAurora(
        ctx,
        canvas,
        intensity,
        speedMultiplier
      )
    } else if (type === 'stars') {
      animationRef.current = startStarfield(
        ctx,
        canvas,
        intensity,
        speedMultiplier
      )
    } else if (type === 'matrix') {
      animationRef.current = startMatrix(
        ctx,
        canvas,
        intensity,
        speedMultiplier
      )
    } else if (type === 'parallax') {
      animationRef.current = startParallax(
        ctx,
        canvas,
        intensity,
        speedMultiplier
      )
    } else if (type === 'glitch') {
      animationRef.current = startGlitch(
        ctx,
        canvas,
        intensity,
        speedMultiplier
      )
    } else if (type === 'scanlines') {
      animationRef.current = startScanlines(ctx, canvas, intensity)
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    }
  }, [type, intensity, speed, color])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        display: 'block',
      }}
    />
  )
}

// ============ ANIMATION STARTERS ============

function startParticles(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  intensity: number,
  speedMultiplier: number,
  color: string
): number {
  const particles: Array<{
    x: number
    y: number
    vx: number
    vy: number
    size: number
  }> = []
  const particleCount = Math.floor(intensity * 100) + 20 // Minimum 20 particles

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * speedMultiplier * 2,
      vy: (Math.random() - 0.5) * speedMultiplier * 2,
      size: Math.random() * 4 + 1,
    })
  }

  const animate = () => {
    // Clear with semi-transparent background for motion blur
    ctx.fillStyle = 'rgba(15, 23, 42, 0.1)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = color
    ctx.globalAlpha = Math.min(intensity, 1)

    particles.forEach((p) => {
      p.x += p.vx
      p.y += p.vy

      if (p.x < 0) p.x = canvas.width
      if (p.x > canvas.width) p.x = 0
      if (p.y < 0) p.y = canvas.height
      if (p.y > canvas.height) p.y = 0

      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
    })

    ctx.globalAlpha = 1
    return requestAnimationFrame(animate)
  }

  return animate()
}

function startGradientShift(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  intensity: number,
  speedMultiplier: number
): number {
  let hue = Math.random() * 360

  const animate = () => {
    hue = (hue + speedMultiplier * 0.2) % 360

    // Create a more dynamic gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, `hsl(${hue}, 80%, 40%)`)
    gradient.addColorStop(0.5, `hsl(${(hue + 120) % 360}, 70%, 35%)`)
    gradient.addColorStop(1, `hsl(${(hue + 240) % 360}, 75%, 40%)`)

    ctx.fillStyle = gradient
    ctx.globalAlpha = Math.min(intensity * 0.6, 0.7)
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Add secondary gradient layer for depth
    const gradient2 = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      0,
      canvas.width / 2,
      canvas.height / 2,
      Math.max(canvas.width, canvas.height)
    )
    gradient2.addColorStop(0, `hsla(${hue}, 60%, 50%, 0.2)`)
    gradient2.addColorStop(1, `hsla(${hue}, 60%, 30%, 0)`)

    ctx.fillStyle = gradient2
    ctx.globalAlpha = Math.min(intensity * 0.3, 0.5)
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.globalAlpha = 1

    return requestAnimationFrame(animate)
  }

  return animate()
}

function startWaves(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  intensity: number,
  speedMultiplier: number,
  color: string
): number {
  let time = 0

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = 'rgba(15, 23, 42, 1)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.globalAlpha = Math.min(intensity, 0.8)

    for (let waveIndex = 0; waveIndex < 4; waveIndex++) {
      ctx.beginPath()

      const waveHeight = 40 * intensity
      const waveFrequency = 0.01
      const yOffset = (canvas.height / 5) * (waveIndex + 1)
      const phaseShift = waveIndex * 0.5

      for (let x = 0; x < canvas.width; x += 5) {
        const y =
          yOffset +
          Math.sin(
            (x * waveFrequency + time * speedMultiplier * 0.02 + phaseShift) *
              Math.PI
          ) *
            waveHeight

        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }

      ctx.stroke()
    }

    ctx.globalAlpha = 1
    time++

    return requestAnimationFrame(animate)
  }

  return animate()
}

function startGrid(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  intensity: number,
  color: string
): number {
  let offset = 0

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = 'rgba(15, 23, 42, 1)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.strokeStyle = color
    ctx.globalAlpha = Math.min(intensity * 0.8, 0.7)
    ctx.lineWidth = 1

    const gridSize = 50

    // Draw vertical lines
    for (let x = -gridSize; x < canvas.width + gridSize; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x + offset, 0)
      ctx.lineTo(x + offset, canvas.height)
      ctx.stroke()
    }

    // Draw horizontal lines
    for (let y = -gridSize; y < canvas.height + gridSize; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y + offset)
      ctx.lineTo(canvas.width, y + offset)
      ctx.stroke()
    }

    // Add subtle glow/perspective effect
    ctx.strokeStyle = `rgba(${color.match(/\d+/g)?.slice(0, 3).join(', ') || '100, 150, 255'}, ${0.2 * intensity})`
    ctx.lineWidth = 0.5

    for (let i = 1; i < 3; i++) {
      const innerGridSize = gridSize * 2
      for (
        let x = -innerGridSize;
        x < canvas.width + innerGridSize;
        x += innerGridSize
      ) {
        ctx.beginPath()
        ctx.moveTo(x + offset * 0.3, 0)
        ctx.lineTo(x + offset * 0.3, canvas.height)
        ctx.stroke()
      }
    }

    ctx.globalAlpha = 1
    offset += 0.8
    if (offset > gridSize) offset -= gridSize

    return requestAnimationFrame(animate)
  }

  return animate()
}

function startAurora(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  intensity: number,
  speedMultiplier: number
): number {
  let time = 0

  const animate = () => {
    // Fade the canvas background over time for aurora trail effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw multiple flowing aurora bands with wave motion
    const bandCount = Math.max(2, Math.floor(intensity * 4))

    for (let bandIndex = 0; bandIndex < bandCount; bandIndex++) {
      const baseHue = 200 + bandIndex * 30
      const waveOffset =
        Math.sin(time * 0.005 * speedMultiplier + bandIndex * 0.8) * 60
      const bandHeight = canvas.height * 0.12
      const bandY = canvas.height * 0.3 + bandIndex * 80 + waveOffset

      // Create horizontal gradient for the aurora band
      const gradient = ctx.createLinearGradient(
        0,
        bandY - bandHeight / 2,
        0,
        bandY + bandHeight / 2
      )

      const hue = (baseHue + time * speedMultiplier * 0.15) % 360
      const hue2 = (baseHue + 60 + time * speedMultiplier * 0.1) % 360

      // Create color stops for smooth aurora effect
      gradient.addColorStop(0, `hsla(${hue}, 100%, 35%, 0)`)
      gradient.addColorStop(0.2, `hsla(${hue}, 100%, 50%, 0.4)`)
      gradient.addColorStop(0.5, `hsla(${hue2}, 100%, 60%, 0.7)`)
      gradient.addColorStop(0.8, `hsla(${hue}, 100%, 50%, 0.4)`)
      gradient.addColorStop(1, `hsla(${hue}, 100%, 35%, 0)`)

      ctx.fillStyle = gradient
      ctx.globalAlpha = Math.min(intensity * 0.8, 0.9)
      ctx.fillRect(0, bandY - bandHeight / 2, canvas.width, bandHeight)

      // Add a subtle glow layer
      const glowGradient = ctx.createLinearGradient(
        0,
        bandY - bandHeight * 1.5,
        0,
        bandY + bandHeight * 1.5
      )
      glowGradient.addColorStop(0.2, `hsla(${hue}, 80%, 40%, 0.15)`)
      glowGradient.addColorStop(0.5, `hsla(${hue2}, 80%, 50%, 0.3)`)
      glowGradient.addColorStop(0.8, `hsla(${hue}, 80%, 40%, 0.15)`)

      ctx.fillStyle = glowGradient
      ctx.globalAlpha = Math.min(intensity * 0.3, 0.4)
      ctx.fillRect(0, bandY - bandHeight * 1.5, canvas.width, bandHeight * 3)
    }

    ctx.globalAlpha = 1
    time++

    return requestAnimationFrame(animate)
  }

  return animate()
}

function startStarfield(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  intensity: number,
  speedMultiplier: number
): number {
  const stars: Array<{ x: number; y: number; z: number; vz: number }> = []
  const starCount = Math.floor(intensity * 150)

  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width - canvas.width / 2,
      y: Math.random() * canvas.height - canvas.height / 2,
      z: Math.random() * 1000,
      vz: Math.random() * 5 * speedMultiplier + speedMultiplier,
    })
  }

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = 'rgba(0, 0, 0, 1)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#fff'

    stars.forEach((star) => {
      star.z -= star.vz

      if (star.z <= 0) {
        star.z = 1000
      }

      const x = (star.x / star.z) * 300 + canvas.width / 2
      const y = (star.y / star.z) * 300 + canvas.height / 2
      const size = (1 - star.z / 1000) * 3

      if (size > 0) {
        ctx.globalAlpha = Math.min(1 - star.z / 1000 + 0.3, 1)
        ctx.fillRect(x, y, size, size)
      }
    })

    ctx.globalAlpha = 1
    return requestAnimationFrame(animate)
  }

  return animate()
}

function startMatrix(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  intensity: number,
  speedMultiplier: number
): number {
  const chars =
    '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'.split(
      ''
    )
  const fontSize = 14
  const columns = Math.floor(canvas.width / fontSize)
  const drops: number[] = []

  for (let i = 0; i < columns; i++) {
    drops[i] = Math.floor(Math.random() * canvas.height)
  }

  const animate = () => {
    ctx.fillStyle = 'rgba(0, 20, 0, 1)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = `hsla(120, 100%, 50%, ${Math.min(intensity, 0.8)})`
    ctx.font = `${fontSize}px monospace`

    for (let i = 0; i < drops.length; i++) {
      const char = chars[Math.floor(Math.random() * chars.length)]
      ctx.fillText(char, i * fontSize, drops[i] * fontSize)

      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0
      }

      drops[i] += speedMultiplier * 0.5
    }

    return requestAnimationFrame(animate)
  }

  return animate()
}

function startParallax(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  intensity: number,
  speedMultiplier: number
): number {
  let offset = 0
  const layers = [
    { speed: 0.2, color: 'rgba(100, 150, 255, 0.1)', height: 0.3 },
    { speed: 0.5, color: 'rgba(150, 100, 255, 0.15)', height: 0.6 },
    { speed: 1, color: 'rgba(200, 100, 255, 0.2)', height: 1 },
  ]

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = 'rgba(15, 23, 42, 1)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw parallax layers with actual movement
    layers.forEach((layer, index) => {
      ctx.fillStyle = layer.color
      ctx.globalAlpha = Math.min(intensity * layer.speed, 0.8)

      const moveAmount = (offset * speedMultiplier * layer.speed) % canvas.width
      const baseY = canvas.height * (0.3 + index * 0.25)
      const layerHeight = 30

      // Draw two copies for seamless scrolling
      ctx.fillRect(moveAmount - canvas.width, baseY, canvas.width, layerHeight)
      ctx.fillRect(moveAmount, baseY, canvas.width, layerHeight)
    })

    ctx.globalAlpha = 1
    offset += 0.5

    return requestAnimationFrame(animate)
  }

  return animate()
}

function startGlitch(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  intensity: number,
  speedMultiplier: number
): number {
  let time = 0
  const glitchStrength = Math.max(0.1, intensity * 0.5)

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = 'rgba(15, 23, 42, 1)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Random glitch lines - more controlled frequency
    if (Math.random() > 0.85) {
      for (let i = 0; i < 3 + Math.floor(intensity * 3); i++) {
        const y = Math.random() * canvas.height
        const height = Math.random() * 40 + 10
        const offset = (Math.random() - 0.5) * 50 * glitchStrength
        const width = Math.random() * 200 + 100

        ctx.fillStyle =
          i % 2 === 0
            ? `rgba(255, 0, 0, ${0.3 * intensity})`
            : `rgba(0, 255, 255, ${0.3 * intensity})`
        ctx.globalAlpha = Math.min(intensity * 0.7, 0.8)
        ctx.fillRect(Math.max(0, offset), y, width, height)
      }
    }

    // Glitch blocks with controlled timing
    if (time % Math.max(5, Math.floor(20 / speedMultiplier)) === 0) {
      const numGlitches = Math.max(1, Math.floor(intensity * 2))
      for (let i = 0; i < numGlitches; i++) {
        const x = Math.random() * canvas.width
        const y = Math.random() * canvas.height
        const w = Math.random() * 120 + 40
        const h = Math.random() * 60 + 20

        ctx.fillStyle =
          Math.random() > 0.5
            ? `rgba(255, 0, 0, ${0.25 * intensity})`
            : `rgba(0, 255, 255, ${0.25 * intensity})`
        ctx.globalAlpha = intensity * 0.6
        ctx.fillRect(x, y, w, h)
      }
    }

    // Add color distortion
    if (Math.random() > 0.92) {
      const distortY = Math.random() * 0.3 * canvas.height
      const distortHeight = Math.random() * 100 + 50

      ctx.fillStyle = `rgba(255, 0, 127, ${0.15 * intensity})`
      ctx.globalAlpha = 0.3
      ctx.fillRect(0, distortY, canvas.width, distortHeight)
    }

    ctx.globalAlpha = 1
    time += speedMultiplier

    return requestAnimationFrame(animate)
  }

  return animate()
}

// Scanlines effect - CRT monitor style
function startScanlines(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  intensity: number
): number {
  let time = 0

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw animated scanlines
    ctx.fillStyle = `rgba(0, 0, 0, ${0.12 * intensity})`
    for (let y = 0; y < canvas.height; y += 2) {
      ctx.fillRect(0, y, canvas.width, 1)
    }

    // Add subtle vertical flicker effect
    if (Math.random() > 0.98) {
      ctx.fillStyle = `rgba(255, 255, 255, ${0.03 * intensity})`
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    // Add occasional horizontal distortion
    if (Math.random() > 0.95) {
      const distortY = Math.random() * canvas.height
      const distortHeight = Math.random() * 40 + 10
      ctx.fillStyle = `rgba(100, 150, 255, ${0.05 * intensity})`
      ctx.globalAlpha = 0.2
      ctx.fillRect(0, distortY, canvas.width, distortHeight)
      ctx.globalAlpha = 1
    }

    time++
    return requestAnimationFrame(animate)
  }

  return animate()
}
