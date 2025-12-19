"use client"

import { useState } from 'react'

import { Button } from '@/packages/components/ui/button'
import DocHelp from './doc-help'
import { DocEditor } from './doc-editor'
import { DocList } from './doc-list'

export function DocManager() {
    const [editingDocId, setEditingDocId] = useState<string | null>(null)
    const [refreshKey, setRefreshKey] = useState(0)

    return (
        <div className="container space-y-6">
            <div className="relative rounded-2xl bg-white/10 dark:bg-black/10 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-black/5 dark:from-white/5 dark:via-transparent dark:to-black/10" />
                <div className="relative p-8">
                    <h1 className="text-3xl font-bold">Docs Management</h1>
                    <p className="text-muted-foreground mt-2">Create and manage documentation content by category.</p>
                </div>
            </div>

            <div className="relative rounded-2xl bg-white/10 dark:bg-black/10 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-black/5 dark:from-white/5 dark:via-transparent dark:to-black/10" />
                <div className="relative p-8">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Docs</h3>
                        <Button onClick={() => setEditingDocId('')}>+ New Doc</Button>
                    </div>

                    {editingDocId !== null && (
                        <div className="mt-6 rounded-2xl bg-background/40 border border-border/40 p-4 shadow-sm">
                            <DocEditor
                                key={editingDocId ?? 'editor'}
                                docId={editingDocId ?? undefined}
                                onSaved={() => {
                                    setEditingDocId(null)
                                    setRefreshKey((k) => k + 1)
                                }}
                                onCancel={() => setEditingDocId(null)}
                            />
                        </div>
                    )}

                    <div className="mt-6">
                        <DocList key={refreshKey} onEdit={(id) => setEditingDocId(id)} />
                    </div>
                </div>
            </div>

            <DocHelp />
        </div>
    )
}

export default DocManager
