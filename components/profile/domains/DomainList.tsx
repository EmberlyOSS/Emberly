import React from 'react'
import DomainRow from './DomainRow'
import { Domain } from './types'

interface Props {
    domains: Domain[]
    openIds: string[]
    cfCheckingIds: string[]
    onToggle: (id: string) => void
    onSetPrimary: (id: string) => void
    onRecheck: (id: string) => void
    onDelete: (id: string) => Promise<void>
}

export default function DomainList({ domains, openIds, cfCheckingIds, onToggle, onSetPrimary, onRecheck, onDelete }: Props) {
    return (
        <div className="w-full">
            <div className="flex flex-col divide-y">
                {domains.map((d) => (
                    <div key={d.id} className="py-0">
                        <DomainRow
                            d={d}
                            rechecking={cfCheckingIds.includes(d.id)}
                            onSetPrimary={onSetPrimary}
                            onRecheck={onRecheck}
                            onDelete={onDelete}
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}
