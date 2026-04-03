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
        <div className={`glass-card overflow-hidden ${className}`}>
            {children}
        </div>
    )
}

export default function FAQAccordion({ items }: Props) {
    const [openIndex, setOpenIndex] = useState<number | null>(null)

    const toggleItem = (index: number) => {
        setOpenIndex(openIndex === index ? null : index)
    }

    return (
        <GlassCard>
            <div className="divide-y divide-border/50">
                {items.map((item, index) => (
                    <div key={index}>
                        <button
                            type="button"
                            onClick={() => toggleItem(index)}
                            className="w-full px-6 py-4 cursor-pointer flex items-center justify-between hover:text-primary transition-colors text-left gap-4"
                            aria-expanded={openIndex === index}
                        >
                            <span className="font-medium">{item.question}</span>
                            <ChevronDown
                                className={`h-4 w-4 text-muted-foreground transition-transform duration-200 flex-shrink-0 ${openIndex === index ? 'rotate-180' : ''
                                    }`}
                            />
                        </button>
                        {openIndex === index && (
                            <div className="px-6 pb-4 animate-in fade-in-50 slide-in-from-top-2 duration-200">
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {item.answer}
                                </p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </GlassCard>
    )
}
