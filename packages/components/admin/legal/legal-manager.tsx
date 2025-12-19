"use client"

import { useState } from 'react'

import { Button } from '@/packages/components/ui/button'
import LegalHelp from './legal-help'
import { LegalEditor } from './legal-editor'
import { LegalList } from './legal-list'

export function LegalManager() {
    const [editingId, setEditingId] = useState<string | null>(null)
    const [refreshKey, setRefreshKey] = useState(0)

    return (
        <div className="container space-y-6">
            <div className="relative rounded-2xl bg-white/10 dark:bg-black/10 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-black/5 dark:from-white/5 dark:via-transparent dark:to-black/10" />
                <div className="relative p-8">
                    <h1 className="text-3xl font-bold">Legal Pages</h1>
                    <p className="text-muted-foreground mt-2">Create and manage legal documents with Markdown, status, and ordering.</p>
                </div>
            </div>

            <div className="relative rounded-2xl bg-white/10 dark:bg-black/10 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-black/5 dark:from-white/5 dark:via-transparent dark:to-black/10" />
                <div className="relative p-8">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Pages</h3>
                        <Button onClick={() => setEditingId('')}>+ New Page</Button>
                    </div>

                    {editingId !== null && (
                        <div className="mt-6 rounded-2xl bg-background/40 border border-border/40 p-4 shadow-sm">
                            <LegalEditor
                                key={editingId ?? 'editor'}
                                legalId={editingId || undefined}
                                onSaved={() => {
                                    setEditingId(null)
                                    setRefreshKey((k) => k + 1)
                                }}
                                onCancel={() => setEditingId(null)}
                            />
                        </div>
                    )}

                    <div className="mt-6">
                        <LegalList key={refreshKey} onEdit={(id) => setEditingId(id)} />
                    </div>
                </div>
            </div>

            <LegalHelp />
        </div>
    )
}

export default LegalManager
