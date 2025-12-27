"use client"

import { useState } from 'react'

import { BookOpen, Plus } from 'lucide-react'

import { Button } from '@/packages/components/ui/button'
import DocHelp from './doc-help'
import { DocEditor } from './doc-editor'
import { DocList } from './doc-list'

export function DocManager() {
    const [editingDocId, setEditingDocId] = useState<string | null>(null)
    const [refreshKey, setRefreshKey] = useState(0)

    return (
        <div className="container space-y-6">
            <div className="rounded-xl border border-border/50 bg-background/30 overflow-hidden">
                <div className="flex items-center gap-4 px-6 py-5 border-b border-border/50 bg-background/50">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Docs Management</h1>
                        <p className="text-muted-foreground">Create and manage documentation content by category.</p>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-border/50 bg-background/30 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-background/50">
                    <h3 className="text-lg font-semibold">Documentation Pages</h3>
                    <Button onClick={() => setEditingDocId('')} className="gap-2">
                        <Plus className="h-4 w-4" />
                        New Doc
                    </Button>
                </div>

                <div className="p-4">
                    {editingDocId !== null && (
                        <div className="mb-6">
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

                    <DocList key={refreshKey} onEdit={(id) => setEditingDocId(id)} />
                </div>
            </div>

            <DocHelp />
        </div>
    )
}

export default DocManager
