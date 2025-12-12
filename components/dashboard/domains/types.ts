export interface Domain {
    id: string
    domain: string
    verified: boolean
    isPrimary: boolean
    cfHostnameId?: string | null
    cfStatus?: string | null
    cfMeta?: any
}

export type CFMeta = any
