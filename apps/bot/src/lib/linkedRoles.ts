/**
 * Linked role requirements for the Emberly app.
 *
 * Server admins pick these under Server Settings → Roles → (role) → Links →
 * Emberly. Members connect at embrly.ca/api/discord/linked-roles, which pushes
 * their values. Keys must match LINKED_ROLE_KEYS in
 * embrly.ca/packages/lib/discord/linked-roles.ts.
 */
import { REST, Routes } from 'discord.js';
import { logger } from './logger';

// Role connection metadata types from the Discord API
const INTEGER_GREATER_THAN_OR_EQUAL = 2;
const DATETIME_LESS_THAN_OR_EQUAL = 5; // "at least N days ago"
const BOOLEAN_EQUAL = 7;

const METADATA = [
  { type: BOOLEAN_EQUAL, key: 'account', name: 'Emberly user', description: 'Has an Emberly account' },
  { type: INTEGER_GREATER_THAN_OR_EQUAL, key: 'files_uploaded', name: 'Files uploaded', description: 'Files uploaded to Emberly at least' },
  { type: DATETIME_LESS_THAN_OR_EQUAL, key: 'member_since', name: 'Member for', description: 'Days since joining Emberly at least' },
];

/** Idempotent, so running it on every start keeps Discord in sync with this list */
export async function registerLinkedRoleMetadata(token: string, applicationId: string) {
  const rest = new REST({ version: '10' }).setToken(token);
  await rest.put(Routes.applicationRoleConnectionMetadata(applicationId), { body: METADATA });
  logger.info('Linked role metadata registered', { context: 'LinkedRoles', fields: METADATA.length });
}
