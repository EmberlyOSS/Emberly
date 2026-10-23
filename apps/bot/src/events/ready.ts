import { ActivityType, Client } from 'discord.js';
import db from '../lib/db';
import { logger } from '../lib/logger';
import { init as initErrorReporter } from '../lib/errorReporter';

export default async (client: Client) => {
  logger.info(`Bot is ready and logged in as: ${client.user?.tag}`, {
    context: 'ReadyEvent'
  });

  // Init error reporter so command errors can be forwarded to Discord channel
  initErrorReporter(client);

  // Platform status lives on the Emberly mod bot; this one just says hello
  client.user?.setPresence({
    status: 'online',
    activities: [{ name: 'embrly.ca · /help', state: 'embrly.ca · /help', type: ActivityType.Custom }],
  });

  // Function to apply decay to all guild level systems
  const applyLevelDecay = async () => {
    try {
      logger.debug('Starting daily level decay job', {
        context: 'ReadyEvent'
      });

      for (const [guildId] of client.guilds.cache) {
        try {
          await db.applyDecay(guildId);
        } catch (err) {
          logger.error('Failed to apply decay for guild', {
            context: 'ReadyEvent',
            error: err,
            guildId
          });
        }
      }
    } catch (err) {
      logger.error('Level decay job error', {
        context: 'ReadyEvent',
        error: err
      });
    }
  };

  // Run decay once on startup, then daily at 2 AM
  const now = new Date();
  const target = new Date();
  target.setHours(2, 0, 0, 0);
  
  // If past 2 AM, schedule for tomorrow
  if (now > target) {
    target.setDate(target.getDate() + 1);
  }

  const timeUntilDecay = target.getTime() - now.getTime();
  setTimeout(() => {
    applyLevelDecay();
    // Run daily after initial delay
    setInterval(applyLevelDecay, 24 * 60 * 60 * 1000);
  }, timeUntilDecay);

  logger.info('Level system decay scheduled', {
    context: 'ReadyEvent',
    nextRunAt: target.toISOString()
  });
};
