'use client'

import React, { useEffect, useRef } from 'react'

interface GamingBackgroundProps {
  theme:
    | 'retro-arcade'
    | 'cyberpunk-neon'
    | 'vaporwave'
    | 'dark-matrix'
    | 'neon-grid'
    | 'cosmic-space'
  intensity?: number
}

/**
 * Gaming-specific theme background component
 * Provides CRT scanlines, curvature, chroma aberration, and vignette effects
 */
export const GamingBackground: React.FC<GamingBackgroundProps> = ({
  theme,
  intensity = 0.8,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Apply theme-specific styles
    const style = container.style

    switch (theme) {
      case 'retro-arcade':
        style.filter = `
          brightness(1.1)
          saturate(1.2)
          drop-shadow(0 0 20px rgba(255, 0, 127, 0.3))
        `
        // Add scanlines overlay
        container.classList.add('scanlines-overlay')
        break

      case 'cyberpunk-neon':
        style.filter = `
          hue-rotate(10deg)
          saturate(1.5)
          contrast(1.2)
          drop-shadow(0 0 30px rgba(0, 255, 255, 0.4))
        `
        container.classList.add('chromatic-aberration')
        break

      case 'vaporwave':
        style.filter = `
          hue-rotate(-30deg)
          saturate(1.3)
          brightness(0.95)
        `
        break

      case 'dark-matrix':
        style.filter = `
          hue-rotate(120deg)
          saturate(0.8)
          contrast(1.1)
          brightness(0.9)
          drop-shadow(0 0 20px rgba(0, 255, 0, 0.2))
        `
        container.classList.add('scanlines-overlay')
        break

      case 'neon-grid':
        style.filter = `
          contrast(1.3)
          saturate(1.4)
          drop-shadow(0 0 25px rgba(0, 200, 255, 0.3))
        `
        break

      case 'cosmic-space':
        style.filter = `
          brightness(0.9)
          contrast(1.15)
          drop-shadow(0 0 40px rgba(138, 43, 226, 0.2))
        `
        break
    }

    return () => {
      container.classList.remove('scanlines-overlay', 'chromatic-aberration')
    }
  }, [theme])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none z-0"
      style={{
        opacity: intensity,
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Vignette effect */}
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none" />

      {/* Optional CRT curve effect using CSS */}
      <style>{`
        .scanlines-overlay::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: repeating-linear-gradient(
            0deg,
            rgba(0, 0, 0, 0.15),
            rgba(0, 0, 0, 0.15) 1px,
            transparent 1px,
            transparent 2px
          );
          pointer-events: none;
          z-index: 1;
        }

        .chromatic-aberration {
          position: relative;
        }

        .chromatic-aberration::before,
        .chromatic-aberration::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          mix-blend-mode: screen;
          pointer-events: none;
        }

        .chromatic-aberration::before {
          background: rgba(255, 0, 0, 0.1);
          transform: translateX(2px);
        }

        .chromatic-aberration::after {
          background: rgba(0, 255, 255, 0.1);
          transform: translateX(-2px);
        }

        .bg-radial-vignette {
          background: radial-gradient(
            ellipse at center,
            transparent 0%,
            rgba(0, 0, 0, 0.3) 100%
          );
        }
      `}</style>
    </div>
  )
}
