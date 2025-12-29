'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

type FAQItem = {
    question: string
    answer: string
}

type Props = {
    items: FAQItem[]
}

// Reusable GlassCard component
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`relative rounded-2xl bg-background/60 backdrop-blur-xl border border-border/50 shadow-lg shadow-black/5 dark:shadow-black/20 overflow-hidden ${className}`}>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
            <div className="relative">{children}</div>
        </div>
    )
}

export default function FAQAccordion({ items }: Props) {
    const [openIndex, setOpenIndex] = useState<number | null>(null)

    const toggleItem = (index: number) => {
        setOpenIndex(openIndex === index ? null : index)
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto items-start">
            {items.map((item, index) => (
                <GlassCard key={index}>
                    <div>
                        <button
                            type="button"
                            onClick={() => toggleItem(index)}
                            className="w-full p-4 cursor-pointer flex items-center justify-between hover:text-primary transition-colors text-left"
                            aria-expanded={openIndex === index}
                        >
                            <span className="font-medium pr-4">{item.question}</span>
                            <ChevronDown
                                className={`h-4 w-4 text-muted-foreground transition-transform flex-shrink-0 ${openIndex === index ? 'rotate-180' : ''
                                    }`}
                            />
                        </button>
                        {openIndex === index && (
                            <div className="px-4 pb-4 animate-in fade-in-50 slide-in-from-top-2 duration-200">
                                <p className="text-sm text-muted-foreground">
                                    {item.answer}
                                </p>
                            </div>
                        )}
                    </div>
                </GlassCard>
            ))}
        </div>
    )
}
