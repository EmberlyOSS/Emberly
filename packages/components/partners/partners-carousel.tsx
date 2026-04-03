import { Handshake, Users } from 'lucide-react'
import { Badge } from '@/packages/components/ui/badge'

type Partner = {
  id: string
  name: string
  tagline?: string
  imageUrl?: string
}

type Props = {
  partners?: Partner[]
}

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`glass-card overflow-hidden ${className}`}>
      {children}
    </div>
  )
}

export default function PartnersCarousel({ partners }: Props) {
  const list = partners || []

  return (
    <GlassCard>
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="space-y-2">
            <Badge className="bg-primary/20 text-primary border-primary/30">
              <Handshake className="h-3 w-3 mr-1" />
              Partners
            </Badge>
            <h3 className="text-2xl font-bold">Trusted by Amazing Teams</h3>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{list.length} {list.length === 1 ? 'partner' : 'partners'} and growing</span>
          </div>
        </div>

        {/* Partners Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {list.map((p) => (
            <div
              key={p.id}
              className="group flex flex-col items-center gap-3 p-4 rounded-xl glass-subtle hover:bg-muted/40 transition-all duration-200"
            >
              {/* Logo */}
              <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt={`${p.name} logo`}
                    loading="lazy"
                    className="relative w-full h-full object-contain bg-background rounded-lg p-1"
                  />
                ) : (
                  <div className="relative w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary font-bold text-lg rounded-lg">
                    {p.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                )}
              </div>

              {/* Name & Tagline */}
              <div className="text-center min-w-0 w-full">
                <p className="font-medium text-sm truncate">{p.name}</p>
                {p.tagline && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.tagline}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  )
}
