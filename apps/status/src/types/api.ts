export interface DiscordGuildScheduledEvent {
    id: string;
    guild_id: string;
    channel_id?: string | null;
    creator_id?: string | null;
    name: string;
    description?: string | null;
    scheduled_start_time: string;
    scheduled_end_time?: string | null;
    privacy_level: number;
    status: number;
    entity_type: number;
    entity_id?: string | null;
    entity_metadata?: {
        location?: string;
    } | null;
    creator?: DiscordUser | null;
    user_count?: number;
    image?: string | null;
    recurrence_rule?: any | null;
}

export interface DiscordUser {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    bot?: boolean;
    system?: boolean;
    mfa_enabled?: boolean;
    banner?: string | null;
    accent_color?: number | null;
    locale?: string;
    verified?: boolean;
    email?: string | null;
    flags?: number;
    premium_type?: number;
    public_flags?: number;
    global_name?: string | null;
}
