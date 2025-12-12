import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Props {
    value: string
    onChange: (v: string) => void
    onSubmit: (e?: React.FormEvent) => Promise<void>
    loading?: boolean
}

export default function DomainForm({ value, onChange, onSubmit, loading }: Props) {
    return (
        <form onSubmit={onSubmit} className="flex gap-2 w-full">
            <Input
                placeholder="example.com"
                value={value}
                onChange={(e) => onChange((e.target as HTMLInputElement).value)}
                className="flex-1"
            />
            <Button type="submit" disabled={loading}>
                {loading ? 'Adding…' : 'Add Domain'}
            </Button>
        </form>
    )
}
