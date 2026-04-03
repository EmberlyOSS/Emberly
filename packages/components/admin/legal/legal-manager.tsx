"use client"

import { useState } from 'react'

import { Plus, Scale } from 'lucide-react'

import { Button } from '@/packages/components/ui/button'
import LegalHelp from './legal-help'
import { LegalEditor } from './legal-editor'
import { LegalList } from './legal-list'

export function LegalManager() {
    const [editingId, setEditingId] = useState<string | null>(null)
    const [refreshKey, setRefreshKey] = useState(0)

    return (
        <div className="container space-y-6">
            <div className="glass-subtle overflow-hidden">
                <div className="flex items-center gap-4 px-6 py-5 border-b border-border/40 bg-muted/20">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <Scale className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Legal Pages</h1>
                        <p className="text-muted-foreground">Create and manage legal documents with Markdown, status, and ordering.</p>
                    </div>
                </div>
            </div>

            <div className="glass-subtle overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-muted/20">
                    <h3 className="text-lg font-semibold">Legal Documents</h3>
                    <Button onClick={() => setEditingId('')} className="gap-2">
                        <Plus className="h-4 w-4" />
                        New Page
                    </Button>
                </div>

                <div className="p-4">
                    {editingId !== null && (
                        <div className="mb-6">
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

                    <LegalList key={refreshKey} onEdit={(id) => setEditingId(id)} />
                </div>
            </div>

            <LegalHelp />
        </div>
    )
}

export default LegalManager
