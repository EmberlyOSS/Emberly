export interface Domain {
    id: string
    domain: string
    verified: boolean
    isPrimary: boolean
    cfHostnameId?: string | null
    cfStatus?: string | null
    cfMeta?: CloudflareMeta | null
    createdAt?: string
}

export interface CloudflareMeta {
    ownership_verification?: {
        name?: string
        txt_name?: string
        value?: string
        txt_value?: string
    }
    validation_records?: Array<{
        type?: string
        name?: string
        txt_name?: string
        value?: string
        txt_value?: string
    }>
    ssl?: {
        validation_records?: Array<{
            name?: string
            txt_name?: string
            value?: string
            txt_value?: string
        }>
    }
}

export interface DomainLimit {
    allowed: number
    base: number
    purchased: number
    used: number
    remaining: number
}
