"use client"

import React, { useEffect, useRef } from 'react'
// Phaser is large and can cause server-side bundling issues; dynamically import at runtime

export default function Runner() {
    const containerRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (!containerRef.current) return

        let game: any | null = null

        // dynamically import Phaser on the client to avoid server bundling issues
        let cancelled = false
            ; (async () => {
                try {
                    const PhaserLib: any = await import('phaser')

                    if (cancelled) return

                    class MainScene extends PhaserLib.Scene {
                        constructor() {
                            super({ key: 'MainScene' })
                        }

                        create() {
                            const { width, height } = this.scale

                            // simple background
                            const bg = this.add.rectangle(0, 0, width * 2, height * 2, 0x0b1220)
                            bg.setOrigin(0)

                            // ground
                            const ground = this.add.rectangle(0, height - 80, width * 2, 80, 0x153243)
                            ground.setOrigin(0)

                            // player (placeholder)
                            const player = this.add.rectangle(120, height - 140, 36, 48, 0x8be9fd)

                            // simple runner motion: move background/obstacles left
                            this.time.addEvent({
                                delay: 100,
                                loop: true,
                                callback: () => {
                                    // tiny bob animation for player
                                    this.tweens.add({ targets: player, y: player.y - 8, duration: 180, yoyo: true })
                                },
                            })

                            // placeholder obstacle spawner
                            const obstacles: any[] = []
                            this.time.addEvent({
                                delay: 1200,
                                loop: true,
                                callback: () => {
                                    const obs = this.add.rectangle(width + 40, height - 120, 32, 48, 0xff6b6b)
                                    obstacles.push(obs)
                                    this.tweens.add({ targets: obs, x: -100, duration: 6000, onComplete: () => obs.destroy() })
                                },
                            })

                            // basic input: jump on pointer or space
                            this.input.on('pointerdown', () => {
                                this.tweens.add({ targets: player, y: player.y - 100, duration: 250, yoyo: true })
                            })

                            this.input.keyboard.on('keydown-SPACE', () => {
                                this.tweens.add({ targets: player, y: player.y - 100, duration: 250, yoyo: true })
                            })

                            // HUD
                            this.add.text(16, 16, 'Runner — Prototype', { font: '18px monospace', color: '#ffffff' })
                        }
                    }

                    const cfg: any = {
                        type: PhaserLib.AUTO,
                        parent: containerRef.current,
                        width: containerRef.current.clientWidth || 800,
                        height: Math.max(360, Math.round((containerRef.current.clientWidth || 800) * 0.5)),
                        backgroundColor: '#000000',
                        scene: [MainScene],
                        scale: {
                            mode: PhaserLib.Scale.RESIZE,
                            autoCenter: PhaserLib.Scale.CENTER_BOTH,
                        },
                    }

                    try {
                        game = new PhaserLib.Game(cfg)
                    } catch (err) {
                        console.error('Failed to start Phaser', err)
                    }
                } catch (err) {
                    console.error('Failed to dynamically import phaser', err)
                }
            })()

        // cleanup
        return () => {
            try {
                if (game) {
                    game.destroy(true)
                    game = null
                }
            } catch (e) {
                // ignore
            }
        }
    }, [])

    return (
        <div className="w-full h-[60vh] bg-black rounded-md overflow-hidden">
            <div ref={containerRef} className="w-full h-full" />
        </div>
    )
}
