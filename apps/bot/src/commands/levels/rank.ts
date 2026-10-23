import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import db from '../../lib/db';
import { BRAND_COLOR } from '../../lib/brand';

export const data = new SlashCommandBuilder()
  .setName('rank')
  .setDescription('Show your level and activity in this server')
  .setDMPermission(false)
  .addUserOption((opt) => opt.setName('user').setDescription("Someone else's level"));

export async function execute(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId!;
  const target = interaction.options.getUser('user') ?? interaction.user;

  const config = await db.getLevelConfig(guildId);
  if (!config?.enabled) {
    await interaction.reply({ content: "Levels aren't turned on in this server.", flags: 64 });
    return;
  }

  const userLevel = await db.getUserLevel(guildId, target.id);
  if (!userLevel) {
    await interaction.reply({ content: "❌ Couldn't load level data. Please try again.", flags: 64 });
    return;
  }

  const next = db.calculateLevelThreshold(userLevel.level + 1, config.baseThreshold, config.exponentFactor);
  const current = userLevel.level > 0 ? db.calculateLevelThreshold(userLevel.level, config.baseThreshold, config.exponentFactor) : 0;
  const progress = Math.max(0, Math.min(100, Math.round(((userLevel.activityPoints - current) / (next - current)) * 100)));
  const bar = '█'.repeat(Math.round(progress / 10)) + '░'.repeat(10 - Math.round(progress / 10));
  const maxed = userLevel.level >= config.maxLevel;

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(BRAND_COLOR)
        .setTitle(`⭐ ${target.username}'s level`)
        .setThumbnail(target.displayAvatarURL())
        .addFields(
          { name: 'Level', value: `${userLevel.level}/${config.maxLevel}`, inline: true },
          { name: 'Activity points', value: userLevel.activityPoints.toLocaleString(), inline: true },
          { name: 'Messages', value: userLevel.messageCount.toLocaleString(), inline: true },
          {
            name: maxed ? 'Progress' : `Progress to level ${userLevel.level + 1}`,
            value: maxed ? 'Max level reached 🎉' : `${bar} ${progress}% · next at ${next.toLocaleString()} points`,
          }
        ),
    ],
  });
}
