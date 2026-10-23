// ── Shared style maps & constants ─────────────────────────────────────────────

export const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5', Rust: '#dea584',
  Go: '#00ADD8', Java: '#b07219', 'C#': '#178600', 'C++': '#f34b7d', Swift: '#F05138',
  Kotlin: '#A97BFF', Ruby: '#701516', PHP: '#4F5D95', Vue: '#41b883', Svelte: '#ff3e00',
  HTML: '#e34c26', CSS: '#563d7c', Shell: '#89e051',
}

export const APP_STATUS_STYLE: Record<string, string> = {
  PENDING: 'text-yellow-600 border-yellow-500/30 bg-yellow-500/10',
  VIEWED: 'text-blue-600 border-blue-500/30 bg-blue-500/10',
  SHORTLISTED: 'text-purple-600 border-purple-500/30 bg-purple-500/10',
  ACCEPTED: 'text-green-600 border-green-500/30 bg-green-500/10',
  REJECTED: 'text-destructive border-destructive/30 bg-destructive/10',
  WITHDRAWN: 'text-muted-foreground border-border',
}

export const OPP_TYPE_STYLE: Record<string, string> = {
  FULL_TIME: 'text-blue-600 border-blue-500/30 bg-blue-500/10',
  PART_TIME: 'text-purple-600 border-purple-500/30 bg-purple-500/10',
  CONTRACT: 'text-orange-600 border-orange-500/30 bg-orange-500/10',
  COLLAB: 'text-green-600 border-green-500/30 bg-green-500/10',
  BOUNTY: 'text-yellow-600 border-yellow-500/30 bg-yellow-500/10',
}

export const OPP_STATUS_STYLE: Record<string, string> = {
  DRAFT: 'text-muted-foreground border-border',
  OPEN: 'text-green-600 border-green-500/30 bg-green-500/10',
  FILLED: 'text-blue-600 border-blue-500/30 bg-blue-500/10',
  CLOSED: 'text-muted-foreground',
}

export const EMPTY_OPP_FORM = {
  title: '',
  description: '',
  type: 'CONTRACT',
  remote: true,
  location: '',
  requiredSkills: '',
  budgetMin: '',
  budgetMax: '',
  currency: 'USD',
  timeCommitment: '',
  status: 'OPEN',
}

export const TALENT_SECTIONS: { value: import('./types').NexiumSection; label: string; icon: string }[] = [
  { value: 'profile', label: 'Profile', icon: 'User' },
  { value: 'skills', label: 'Skills', icon: 'Sparkles' },
  { value: 'signals', label: 'Signals', icon: 'Zap' },
  { value: 'opportunities', label: 'Opportunities', icon: 'Briefcase' },
  { value: 'applications', label: 'Applications', icon: 'ClipboardList' },
]
