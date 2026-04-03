'use client'

import { useCallback, useEffect, useState } from 'react'

import {
    Crown,
    Pencil,
    Plus,
    Settings2,
    Trash2,
    UserPlus,
    Users,
    X,
} from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/packages/components/ui/avatar'
import { Badge } from '@/packages/components/ui/badge'
import { Button } from '@/packages/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/packages/components/ui/dialog'
import { Input } from '@/packages/components/ui/input'
import { Label } from '@/packages/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/packages/components/ui/select'
import { Switch } from '@/packages/components/ui/switch'

import { useToast } from '@/packages/hooks/use-toast'

interface Collaborator {
    id: string
    role: 'EDITOR' | 'SUGGESTER'
    user: {
        id: string
        name: string | null
        email: string | null
        image: string | null
        urlId: string
    }
}

interface CollaboratorManagerProps {
    fileId: string
    isOwner: boolean
}

export function CollaboratorManager({ fileId, isOwner }: CollaboratorManagerProps) {
    const [collaborators, setCollaborators] = useState<Collaborator[]>([])
    const [allowSuggestions, setAllowSuggestions] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isAddingOpen, setIsAddingOpen] = useState(false)
    const [newUserEmail, setNewUserEmail] = useState('')
    const [newUserRole, setNewUserRole] = useState<'EDITOR' | 'SUGGESTER'>('EDITOR')
    const [isAdding, setIsAdding] = useState(false)
    const { toast } = useToast()

    const fetchCollaborators = useCallback(async () => {
        try {
            const res = await fetch(`/api/files/${fileId}/collaborators`)
            if (!res.ok) throw new Error('Failed to fetch')
            const data = await res.json()
            setCollaborators(data.collaborators || [])
            setAllowSuggestions(data.allowSuggestions || false)
        } catch {
            toast({
                title: 'Error',
                description: 'Failed to load collaborators',
                variant: 'destructive',
            })
        } finally {
            setIsLoading(false)
        }
    }, [fileId, toast])

    useEffect(() => {
        if (isOwner) {
            fetchCollaborators()
        }
    }, [isOwner, fetchCollaborators])

    const handleAddCollaborator = async () => {
        if (!newUserEmail.trim()) return

        setIsAdding(true)
        try {
            const res = await fetch(`/api/files/${fileId}/collaborators`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userEmail: newUserEmail.includes('@') ? newUserEmail : undefined,
                    userUrlId: !newUserEmail.includes('@') ? newUserEmail : undefined,
                    role: newUserRole,
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to add collaborator')
            }

            setCollaborators((prev) => [...prev, data.collaborator])
            setNewUserEmail('')
            setIsAddingOpen(false)
            toast({
                title: 'Success',
                description: 'Collaborator added',
            })
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to add collaborator',
                variant: 'destructive',
            })
        } finally {
            setIsAdding(false)
        }
    }

    const handleRemoveCollaborator = async (collaboratorId: string) => {
        try {
            const res = await fetch(
                `/api/files/${fileId}/collaborators?collaboratorId=${collaboratorId}`,
                { method: 'DELETE' }
            )

            if (!res.ok) throw new Error('Failed to remove')

            setCollaborators((prev) => prev.filter((c) => c.id !== collaboratorId))
            toast({
                title: 'Success',
                description: 'Collaborator removed',
            })
        } catch {
            toast({
                title: 'Error',
                description: 'Failed to remove collaborator',
                variant: 'destructive',
            })
        }
    }

    const handleToggleSuggestions = async (enabled: boolean) => {
        try {
            const res = await fetch(`/api/files/${fileId}/collaborators`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ allowSuggestions: enabled }),
            })

            if (!res.ok) throw new Error('Failed to update')

            setAllowSuggestions(enabled)
            toast({
                title: 'Success',
                description: enabled
                    ? 'Public suggestions enabled'
                    : 'Public suggestions disabled',
            })
        } catch {
            toast({
                title: 'Error',
                description: 'Failed to update settings',
                variant: 'destructive',
            })
        }
    }

    if (!isOwner) return null

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="glass-subtle glass-hover rounded-xl px-2.5 sm:px-3"
                >
                    <Users className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Collaborators</span>
                    {collaborators.length > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                            {collaborators.length}
                        </Badge>
                    )}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Manage Collaborators
                    </DialogTitle>
                    <DialogDescription>
                        Add users who can edit or suggest changes to this paste.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Public Suggestions Toggle */}
                    <div className="flex items-center justify-between p-3 glass-subtle">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-medium flex items-center gap-2">
                                <Settings2 className="h-4 w-4" />
                                Allow Public Suggestions
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Anyone can suggest edits (requires your approval)
                            </p>
                        </div>
                        <Switch
                            checked={allowSuggestions}
                            onCheckedChange={handleToggleSuggestions}
                        />
                    </div>

                    {/* Add Collaborator */}
                    {isAddingOpen ? (
                        <div className="space-y-3 p-3 glass-subtle">
                            <div className="space-y-2">
                                <Label htmlFor="userEmail">Email or Username</Label>
                                <Input
                                    id="userEmail"
                                    placeholder="user@example.com or username"
                                    value={newUserEmail}
                                    onChange={(e) => setNewUserEmail(e.target.value)}
                                    className="bg-background/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Permission</Label>
                                <Select
                                    value={newUserRole}
                                    onValueChange={(v) => setNewUserRole(v as 'EDITOR' | 'SUGGESTER')}
                                >
                                    <SelectTrigger className="bg-background/50">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="EDITOR">
                                            <span className="flex items-center gap-2">
                                                <Pencil className="h-3 w-3" />
                                                Editor - Can edit directly
                                            </span>
                                        </SelectItem>
                                        <SelectItem value="SUGGESTER">
                                            <span className="flex items-center gap-2">
                                                <UserPlus className="h-3 w-3" />
                                                Suggester - Can only suggest edits
                                            </span>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    onClick={handleAddCollaborator}
                                    disabled={isAdding || !newUserEmail.trim()}
                                    className="flex-1"
                                >
                                    {isAdding ? 'Adding...' : 'Add'}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setIsAddingOpen(false)
                                        setNewUserEmail('')
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setIsAddingOpen(true)}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Collaborator
                        </Button>
                    )}

                    {/* Collaborators List */}
                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                            Collaborators ({collaborators.length})
                        </Label>
                        {isLoading ? (
                            <div className="text-sm text-muted-foreground text-center py-4">
                                Loading...
                            </div>
                        ) : collaborators.length === 0 ? (
                            <div className="text-sm text-muted-foreground text-center py-4 border border-dashed border-border/50 rounded-lg">
                                No collaborators yet
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                {collaborators.map((collab) => (
                                    <div
                                        key={collab.id}
                                        className="flex items-center justify-between p-2 rounded-lg bg-background/80 border border-border/50"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage
                                                    src={collab.user.image || undefined}
                                                    alt={collab.user.name || ''}
                                                />
                                                <AvatarFallback className="text-xs">
                                                    {collab.user.name?.charAt(0) || '?'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {collab.user.name || collab.user.urlId}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {collab.user.email || `@${collab.user.name}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant={collab.role === 'EDITOR' ? 'default' : 'secondary'}
                                                className="text-xs"
                                            >
                                                {collab.role === 'EDITOR' ? (
                                                    <Pencil className="h-3 w-3 mr-1" />
                                                ) : (
                                                    <UserPlus className="h-3 w-3 mr-1" />
                                                )}
                                                {collab.role}
                                            </Badge>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-destructive hover:text-destructive"
                                                onClick={() => handleRemoveCollaborator(collab.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
