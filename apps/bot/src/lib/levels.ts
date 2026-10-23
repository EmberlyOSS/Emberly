import { Guild, Role } from 'discord.js';
import { logger } from './logger';

// Convert HSL to Hex color (returns as number for Discord.js)
function hslToHex(h: number, s: number, l: number): number {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  
  const toHex = (x: number) => {
    const hex = Math.round(255 * x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return parseInt(toHex(f(0)) + toHex(f(8)) + toHex(f(4)), 16);
}

// Create level roles for a guild
export async function createLevelRoles(guild: Guild, maxLevels: number): Promise<string[] | null> {
  try {
    const roleIds: string[] = [];

    for (let i = 1; i <= maxLevels; i++) {
      try {
        // Generate a color for each level (gradient from blue to red)
        const hue = (i / maxLevels) * 360;
        const saturation = 70;
        const lightness = 50;
        const color = hslToHex(hue, saturation, lightness);

        const role = await guild.roles.create({
          name: `Level ${i}`,
          color: color,
          reason: 'Automatic level role creation'
        });
        roleIds.push(role.id);
        logger.debug(`Created level role`, {
          context: 'Levels',
          guildId: guild.id,
          level: i,
          roleId: role.id
        });
      } catch (err) {
        logger.error(`Failed to create level ${i} role`, {
          context: 'Levels',
          error: err,
          guildId: guild.id,
          level: i
        });
        return null;
      }
    }

    return roleIds;
  } catch (err) {
    logger.error('Failed to create level roles', {
      context: 'Levels',
      error: err,
      guildId: guild.id
    });
    return null;
  }
}

// Update user's level role
export async function updateUserLevelRole(
  guild: Guild,
  userId: string,
  newLevel: number,
  oldLevel: number | null,
  levelRoleIds: string[]
): Promise<boolean> {
  try {
    const member = await guild.members.fetch(userId);
    if (!member) return false;

    // Remove old level role if exists
    if (oldLevel !== null && oldLevel > 0 && levelRoleIds[oldLevel - 1]) {
      try {
        await member.roles.remove(levelRoleIds[oldLevel - 1]);
      } catch (err) {
        logger.warn('Failed to remove old level role', {
          context: 'Levels',
          error: err,
          guildId: guild.id,
          userId,
          oldLevel
        });
      }
    }

    // Add new level role if level > 0
    if (newLevel > 0 && levelRoleIds[newLevel - 1]) {
      try {
        await member.roles.add(levelRoleIds[newLevel - 1]);
      } catch (err) {
        logger.warn('Failed to add new level role', {
          context: 'Levels',
          error: err,
          guildId: guild.id,
          userId,
          newLevel
        });
      }
    }

    return true;
  } catch (err) {
    logger.error('Failed to update user level role', {
      context: 'Levels',
      error: err,
      guildId: guild.id,
      userId
    });
    return false;
  }
}

// Delete level roles for a guild
export async function deleteLevelRoles(guild: Guild, levelRoleIds: string[]): Promise<boolean> {
  try {
    for (const roleId of levelRoleIds) {
      try {
        const role = await guild.roles.fetch(roleId);
        if (role) {
          await role.delete('Level system disabled');
        }
      } catch (err) {
        logger.warn('Failed to delete level role', {
          context: 'Levels',
          error: err,
          guildId: guild.id,
          roleId
        });
      }
    }
    return true;
  } catch (err) {
    logger.error('Failed to delete level roles', {
      context: 'Levels',
      error: err,
      guildId: guild.id
    });
    return false;
  }
}
