'use client'

import { LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'

import { Button } from '@/components/ui/button'

import { useToast } from '@/hooks/use-toast'

export function LogoutButton() {
  const { toast } = useToast()

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: '/' })
    } catch (error) {
      console.error('Logout error:', error)
      toast({
        title: 'Error',
        description: 'Failed to logout',
        variant: 'destructive',
      })
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
    >
      <LogOut className="h-3.5 w-3.5" />
      Sign out
    </Button>
  )
}
