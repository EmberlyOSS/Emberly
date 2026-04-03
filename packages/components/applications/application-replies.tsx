'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { Send, Loader2, Shield, User } from 'lucide-react'
import { Button } from '@/packages/components/ui/button'
import { Textarea } from '@/packages/components/ui/textarea'
import { Badge } from '@/packages/components/ui/badge'
import { useToast } from '@/packages/hooks/use-toast'

interface Reply {
  id: string
  content: string
  isStaffReply: boolean
  createdAt: string
  user: {
    id: string
    name: string | null
    image: string | null
    role: string
  }
}

interface ApplicationRepliesProps {
  applicationId: string
  disabled?: boolean
}

export function ApplicationReplies({ applicationId, disabled }: ApplicationRepliesProps) {
  const { toast } = useToast()
  const [replies, setReplies] = useState<Reply[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)

  const fetchReplies = useCallback(async () => {
    try {
      const res = await fetch(`/api/applications/${applicationId}/replies`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setReplies(data.data ?? data)
    } catch {
      // Silent fail on load
    } finally {
      setLoading(false)
    }
  }, [applicationId])

  useEffect(() => {
    fetchReplies()
  }, [fetchReplies])

  const handleSubmit = async () => {
    const trimmed = content.trim()
    if (!trimmed || sending) return

    setSending(true)
    try {
      const res = await fetch(`/api/applications/${applicationId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to send')
      }
      const data = await res.json()
      const newReply = data.data ?? data
      setReplies((prev) => [...prev, newReply])
      setContent('')
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to send reply',
        variant: 'destructive',
      })
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Messages ({replies.length})
      </h3>

      {replies.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No messages yet. Start a conversation about this application.
        </p>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          {replies.map((reply) => (
            <div
              key={reply.id}
              className={`p-3 rounded-lg text-sm ${
                reply.isStaffReply
                  ? 'bg-primary/5 border border-primary/20'
                  : 'bg-background/80 border border-border/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                {reply.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={reply.user.image}
                    alt=""
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-3 h-3 text-muted-foreground" />
                  </div>
                )}
                <span className="font-medium text-xs">
                  {reply.user.name || 'User'}
                </span>
                {reply.isStaffReply && (
                  <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20 py-0 px-1.5 h-4 gap-0.5">
                    <Shield className="w-2.5 h-2.5" />
                    Staff
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground ml-auto">
                  {format(new Date(reply.createdAt), 'MMM d, h:mm a')}
                </span>
              </div>
              <p className="whitespace-pre-wrap break-words text-foreground/90">
                {reply.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {!disabled && (
        <div className="flex gap-2">
          <Textarea
            placeholder="Write a message..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[60px] max-h-[120px] resize-none text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleSubmit()
              }
            }}
          />
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={!content.trim() || sending}
            className="shrink-0 self-end"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
