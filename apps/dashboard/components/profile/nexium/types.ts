// ── Shared Nexium types ────────────────────────────────────────────────────────

export type NexiumSkill = {
  id: string
  name: string
  level: string
  category: string | null
  yearsExperience: number | null
  sortOrder: number
}

export type NexiumSignal = {
  id: string
  type: string
  title: string
  url: string | null
  description: string | null
  imageUrl: string | null
  metadata: Record<string, unknown> | null
  skills: string[]
  verified: boolean
  sortOrder: number
}

export type NexiumProfile = {
  id: string
  title: string | null
  headline: string | null
  availability: string
  lookingFor: string[]
  location: string | null
  timezone: string | null
  activeHours: string | null
  isVisible: boolean
  skills: NexiumSkill[]
  signals: NexiumSignal[]
  user: {
    name: string | null
    fullName: string | null
    image: string | null
    urlId: string
    vanityId: string | null
    bio: string | null
    website: string | null
    twitter: string | null
    github: string | null
    discord: string | null
    showLinkedAccounts: boolean
    linkedAccounts: { provider: string; providerUsername: string | null }[]
  }
}

export type GithubRepoPick = {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  private: boolean
  fork: boolean
  archived: boolean
  stargazers_count: number
  forks_count: number
  language: string | null
  topics: string[]
  pushed_at: string
  owner: { login: string; avatar_url: string }
}

export type MyApplication = {
  id: string
  status: string
  message: string
  appliedAt: string
  opportunity: {
    id: string
    title: string
    type: string
    status: string
    remote: boolean
    location: string | null
    postedBy: { name: string | null; urlId: string }
  }
}

export type Opportunity = {
  id: string
  title: string
  description: string
  type: string
  status: string
  remote: boolean
  location: string | null
  requiredSkills: string[]
  budgetMin: number | null
  budgetMax: number | null
  currency: string
  timeCommitment: string | null
  deadline: string | null
  createdAt: string
  postedBy: { name: string | null; urlId: string }
  _count: { applications: number }
}

export type NexiumSection = 'profile' | 'skills' | 'signals' | 'opportunities' | 'applications'
