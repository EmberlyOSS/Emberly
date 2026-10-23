import { Client, Message, EmbedBuilder, REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { logger } from '../lib/logger';
import db from '../lib/db';
import { BRAND_COLOR } from '../lib/brand';

/**
 * Levels count every guild message. Without the Message Content intent the
 * bot only sees the text of messages that mention it, which is all the
 * developer commands and the hello reply need.
 */
export default async (client: Client, message: Message) => {
  if (message.author.bot || !message.inGuild()) return;

  const levelConfig = await db.getLevelConfig(message.guildId);
  if (levelConfig?.enabled) {
    db.addActivityPoints(message.guildId, message.author.id, 1, 'message').catch((err) => {
      logger.debug('Failed to add activity points', { context: 'MessageCreate', error: err });
    });
  }

  if (!message.mentions.has(client.user!.id, { ignoreEveryone: true, ignoreRoles: true })) return;

  const content = message.content.replace(new RegExp(`<@!?${client.user!.id}>`, 'g'), '').trim();
  const command = content.split(/\s+/)[0]?.toLowerCase();
  const devIds = await db.getDevIds().catch(() => [] as string[]);

  if (devIds.includes(message.author.id) && (command === 'clearcache' || command === 'reload')) {
    await runDevCommand(client, message, command);
    return;
  }

  if (!content) {
    const embed = new EmbedBuilder()
      .setColor(BRAND_COLOR)
      .setTitle("👋 Hi, I'm Emberly")
      .setDescription(
        'I bring your Emberly account into Discord: link it with `/link`, then check your files, shorten links and more.\n\n' +
          'Use `/help` to see every command.'
      )
      .setThumbnail(client.user?.displayAvatarURL() || '')
      .setFooter({ text: 'embrly.ca' });

    await message.reply({ embeds: [embed] }).catch(() => null);
  }
};

async function runDevCommand(client: Client, message: Message, command: 'clearcache' | 'reload') {
  const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN!);
  const clientId = client.application?.id ?? process.env.CLIENT_ID!;
  const guildIds = await db.getGuildIds();

  if (command === 'clearcache') {
    const msg = await message.reply('🔄 Clearing command cache...');
    try {
      await rest.put(Routes.applicationCommands(clientId), { body: [] });
      for (const guildId of guildIds) {
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] }).catch((err) => {
          logger.debug(`Failed to clear commands for guild ${guildId}`, { context: 'MessageCreate', error: err });
        });
      }
      await msg.edit('✅ Cleared all slash commands. Restart the bot to register them again.');
    } catch (err) {
      logger.error('Failed to clear commands', { context: 'MessageCreate', error: err });
      await msg.edit('❌ Failed to clear commands.');
    }
    return;
  }

  const msg = await message.reply('🔄 Reloading commands...');
  try {
    const commands: unknown[] = [];
    const walk = (dir: string) => {
      for (const file of fs.readdirSync(dir)) {
        const full = path.join(dir, file);
        if (fs.statSync(full).isDirectory()) walk(full);
        else if ((file.endsWith('.js') || file.endsWith('.ts')) && !file.startsWith('_')) {
          delete require.cache[require.resolve(full)];
          const cmd = require(full);
          if (cmd.data) commands.push(cmd.data.toJSON());
        }
      }
    };
    walk(path.join(__dirname, '..', 'commands'));

    for (const guildId of guildIds) {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands }).catch((err) => {
        logger.error(`Failed to reload commands in guild ${guildId}`, { context: 'MessageCreate', error: err });
      });
    }
    await msg.edit(`✅ Reloaded ${commands.length} slash commands in ${guildIds.length} server(s).`);
  } catch (err) {
    logger.error('Failed to reload commands', { context: 'MessageCreate', error: err });
    await msg.edit('❌ Failed to reload commands.');
  }
}
