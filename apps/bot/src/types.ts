import {
  AutocompleteInteraction,
  Client,
  Collection,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  GuildMember,
  Message,
  Interaction,
  User,
  TextChannel
} from 'discord.js';

/**
 * Represents a Discord.js slash command module
 * All commands must export data and execute properties
 */
export interface CommandModule {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  /** Answers autocomplete for options declared with setAutocomplete(true) */
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
}

/**
 * Extended Client type that includes the commands collection
 * Used throughout the application to ensure type-safe command access
 */
export interface ExtendedClient extends Client {
  commands: Collection<string, CommandModule>;
}

/**
 * Generic event handler type for Discord.js event listeners
 * Maps event names to their handler signatures
 */
export type EventHandler<T extends unknown[] = unknown[]> = (
  client: ExtendedClient,
  ...args: T
) => Promise<void> | void;

/**
 * Interaction event handler specifically for interaction events
 */
export type InteractionEventHandler = (
  client: ExtendedClient,
  interaction: Interaction
) => Promise<void>;

/**
 * Guild member event handler for member join/leave/update events
 */
export type GuildMemberEventHandler = (
  client: ExtendedClient,
  member: GuildMember
) => Promise<void>;

/**
 * Message event handler for message-related events
 */
export type MessageEventHandler = (
  client: ExtendedClient,
  message: Message
) => Promise<void>;

/**
 * Ready event handler (only receives client, no additional args)
 */
export type ReadyEventHandler = (client: ExtendedClient) => Promise<void> | void;

/**
 * Cache entry with TTL support
 */
export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Configuration for in-memory cache with TTL
 */
export interface CacheConfig {
  ttl: number; // Time-to-live in milliseconds
  maxSize?: number; // Maximum number of entries
}

/**
 * Generic memoization cache for expensive operations
 */
export class MemoizationCache<K, V> {
  private cache: Map<K, CacheEntry<V>>;
  private readonly ttl: number;
  private readonly maxSize: number;

  constructor(config: CacheConfig) {
    this.cache = new Map();
    this.ttl = config.ttl;
    this.maxSize = config.maxSize ?? 1000;
  }

  set(key: K, value: V): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttl
    });
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.value;
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Type guard to check if interaction has a member property
 * Useful for narrowing Interaction type to guild-based interactions
 */
export function isGuildInteraction(
  interaction: Interaction
): interaction is Interaction & { member: GuildMember | null } {
  return 'member' in interaction;
}

/**
 * Type guard to check if message was sent in a guild
 */
export function isGuildMessage(
  message: Message
): message is Message & { member: GuildMember | null; guild: NonNullable<Message['guild']> } {
  return message.guild !== null && message.member !== null;
}
