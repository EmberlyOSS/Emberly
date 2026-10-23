import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const prisma = new PrismaClient();

export default {
  prisma,
  // Level system methods
  async getLevelConfig(guildId: string) {
    try {
      const config = await prisma.levelConfig.findUnique({ where: { guildId } });
      return config;
    } catch (err) {
      logger.error('Failed to get level config', {
        context: 'Database',
        error: err,
        guildId
      });
      return null;
    }
  },

  async setupLevelSystem(guildId: string, maxLevel: number, levelRoleIds: string[]) {
    try {
      const result = await prisma.levelConfig.upsert({
        where: { guildId },
        update: {
          enabled: true,
          maxLevel,
          levelRoleIds: JSON.stringify(levelRoleIds)
        },
        create: {
          guildId,
          enabled: true,
          maxLevel,
          levelRoleIds: JSON.stringify(levelRoleIds)
        }
      });
      return result;
    } catch (err) {
      logger.error('Failed to setup level system', {
        context: 'Database',
        error: err,
        guildId
      });
      return null;
    }
  },

  async disableLevelSystem(guildId: string) {
    try {
      const result = await prisma.levelConfig.update({
        where: { guildId },
        data: { enabled: false }
      });
      return result;
    } catch (err) {
      logger.error('Failed to disable level system', {
        context: 'Database',
        error: err,
        guildId
      });
      return null;
    }
  },

  async getUserLevel(guildId: string, userId: string) {
    try {
      let userLevel = await prisma.userLevel.findUnique({
        where: { guildId_userId: { guildId, userId } }
      });
      
      if (!userLevel) {
        userLevel = await prisma.userLevel.create({
          data: { guildId, userId, level: 0, activityPoints: 0 }
        });
      }
      
      return userLevel;
    } catch (err) {
      logger.error('Failed to get user level', {
        context: 'Database',
        error: err,
        guildId,
        userId
      });
      return null;
    }
  },

  async addActivityPoints(guildId: string, userId: string, points: number, type: 'message' | 'reaction') {
    try {
      const userLevel = await this.getUserLevel(guildId, userId);
      if (!userLevel) return null;

      const updateData: Record<string, any> = {
        activityPoints: { increment: points },
        lastActiveAt: new Date()
      };

      if (type === 'message') {
        updateData.messageCount = { increment: 1 };
      } else if (type === 'reaction') {
        updateData.reactionCount = { increment: 1 };
      }

      const result = await prisma.userLevel.update({
        where: { guildId_userId: { guildId, userId } },
        data: updateData
      });

      return result;
    } catch (err) {
      logger.error('Failed to add activity points', {
        context: 'Database',
        error: err,
        guildId,
        userId,
        points
      });
      return null;
    }
  },

  calculateLevelThreshold(level: number, baseThreshold: number, exponentFactor: number): number {
    // Calculate exponential threshold: baseThreshold * (exponentFactor ^ (level - 1))
    return Math.floor(baseThreshold * Math.pow(exponentFactor, level - 1));
  },

  async calculateUserLevel(guildId: string, userId: string): Promise<number> {
    try {
      const userLevel = await this.getUserLevel(guildId, userId);
      const config = await this.getLevelConfig(guildId);

      if (!userLevel || !config || !config.enabled) return 0;

      let level = 0;
      for (let i = 1; i <= config.maxLevel; i++) {
        const threshold = this.calculateLevelThreshold(i, config.baseThreshold, config.exponentFactor);
        if (userLevel.activityPoints >= threshold) {
          level = i;
        } else {
          break;
        }
      }

      return level;
    } catch (err) {
      logger.error('Failed to calculate user level', {
        context: 'Database',
        error: err,
        guildId,
        userId
      });
      return 0;
    }
  },

  async applyDecay(guildId: string) {
    try {
      const config = await this.getLevelConfig(guildId);
      if (!config || !config.enabled) return;

      const now = new Date();
      const inactiveThreshold = new Date(now.getTime() - config.inactivityDays * 24 * 60 * 60 * 1000);

      // Get inactive users
      const inactiveUsers = await prisma.userLevel.findMany({
        where: {
          guildId,
          lastActiveAt: { lt: inactiveThreshold }
        }
      });

      // Apply decay
      for (const user of inactiveUsers) {
        const decayPoints = Math.max(0, Math.floor(user.activityPoints * config.decayRate));
        await prisma.userLevel.update({
          where: { guildId_userId: { guildId, userId: user.userId } },
          data: {
            activityPoints: { decrement: decayPoints }
          }
        });
      }

      logger.debug('Applied level decay', {
        context: 'Database',
        guildId,
        affectedUsers: inactiveUsers.length
      });
    } catch (err) {
      logger.error('Failed to apply decay', {
        context: 'Database',
        error: err,
        guildId
      });
    }
  },

  // App Config methods (global app settings)
  async getAppConfig() {
    try {
      let config = await prisma.appConfig.findUnique({
        where: { id: 1 }
      });
      
      if (!config) {
        config = await prisma.appConfig.create({
          data: { id: 1 }
        });
      }
      
      return config;
    } catch (err) {
      logger.error('Failed to get app config', {
        context: 'Database',
        error: err
      });
      return null;
    }
  },

  async getGuildIds(): Promise<string[]> {
    try {
      const config = await this.getAppConfig();
      if (!config?.guildIds) return [];
      return JSON.parse(config.guildIds);
    } catch (err) {
      logger.error('Failed to parse guild IDs', {
        context: 'Database',
        error: err
      });
      return [];
    }
  },

  async setGuildIds(guildIds: string[]): Promise<boolean> {
    try {
      await prisma.appConfig.upsert({
        where: { id: 1 },
        update: { guildIds: JSON.stringify(guildIds) },
        create: { id: 1, guildIds: JSON.stringify(guildIds) }
      });
      logger.debug('Guild IDs updated', {
        context: 'Database',
        count: guildIds.length
      });
      return true;
    } catch (err) {
      logger.error('Failed to set guild IDs', {
        context: 'Database',
        error: err
      });
      return false;
    }
  },

  async getDevIds(): Promise<string[]> {
    try {
      const config = await this.getAppConfig();
      if (!config?.devIds) return [];
      return JSON.parse(config.devIds);
    } catch (err) {
      logger.error('Failed to parse dev IDs', {
        context: 'Database',
        error: err
      });
      return [];
    }
  },

  async setDevIds(devIds: string[]): Promise<boolean> {
    try {
      await prisma.appConfig.upsert({
        where: { id: 1 },
        update: { devIds: JSON.stringify(devIds) },
        create: { id: 1, devIds: JSON.stringify(devIds) }
      });
      logger.debug('Dev IDs updated', {
        context: 'Database',
        count: devIds.length
      });
      return true;
    } catch (err) {
      logger.error('Failed to set dev IDs', {
        context: 'Database',
        error: err
      });
      return false;
    }
  },

  async createAnnouncement(guildId: string, channelId: string, authorId: string, type: string, title: string, content: string, color?: number): Promise<any | null> {
    try {
      const result = await prisma.announcement.create({
        data: {
          guildId,
          channelId,
          authorId,
          type,
          title,
          content,
          color: color || 3447003 // default Discord blurple
        }
      });
      logger.debug('Announcement created', {
        context: 'Database',
        guildId,
        authorId,
        type
      });
      return result;
    } catch (err) {
      logger.error('Failed to create announcement', {
        context: 'Database',
        error: err,
        guildId,
        authorId
      });
      return null;
    }
  },

  async updateAnnouncementMessageId(announcementId: number, messageId: string): Promise<boolean> {
    try {
      await prisma.announcement.update({
        where: { id: announcementId },
        data: { messageId }
      });
      logger.debug('Announcement message ID updated', {
        context: 'Database',
        announcementId,
        messageId
      });
      return true;
    } catch (err) {
      logger.error('Failed to update announcement message ID', {
        context: 'Database',
        error: err,
        announcementId
      });
      return false;
    }
  },

  async getAnnouncements(guildId: string, limit: number = 10): Promise<any[]> {
    try {
      const results = await prisma.announcement.findMany({
        where: { guildId },
        orderBy: { createdAt: 'desc' },
        take: limit
      });
      return results;
    } catch (err) {
      logger.error('Failed to fetch announcements', {
        context: 'Database',
        error: err,
        guildId
      });
      return [];
    }
  }
};
