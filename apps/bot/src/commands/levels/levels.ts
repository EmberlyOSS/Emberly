import { ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import db from '../../lib/db';
import { logger } from '../../lib/logger';
import { BRAND_COLOR, ERROR_COLOR, SUCCESS_COLOR, WARNING_COLOR } from '../../lib/brand';
import { createLevelRoles, deleteLevelRoles } from '../../lib/levels';

export const data = new SlashCommandBuilder()
  .setName('levels')
  .setDescription('Set up the activity level system for this server')
  .setDMPermission(false)
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand((sub) =>
    sub
      .setName('setup')
      .setDescription('Turn on levels and create a role for each level')
      .addIntegerOption((opt) =>
        opt.setName('max_level').setDescription('Highest level (default 10)').setMinValue(1).setMaxValue(50)
      )
  )
  .addSubcommand((sub) => sub.setName('disable').setDescription('Turn off levels and delete the level roles'))
  .addSubcommand((sub) => sub.setName('status').setDescription('Show the current level settings'));

export async function execute(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild;
  if (!guild) return;
  const subcommand = interaction.options.getSubcommand();

  try {
    if (subcommand === 'setup') {
      const maxLevel = interaction.options.getInteger('max_level') ?? 10;
      await interaction.deferReply({ flags: 64 });

      const levelRoleIds = await createLevelRoles(guild, maxLevel);
      if (!levelRoleIds) {
        await interaction.editReply({ content: "❌ Couldn't create the level roles. Make sure I have **Manage Roles**." });
        return;
      }
      await db.setupLevelSystem(guild.id, maxLevel, levelRoleIds);

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(SUCCESS_COLOR)
            .setTitle('✅ Levels turned on')
            .setDescription('Members now earn levels by chatting. Anyone can check theirs with `/rank`.')
            .addFields(
              { name: 'Max level', value: String(maxLevel), inline: true },
              { name: 'Roles created', value: String(levelRoleIds.length), inline: true }
            ),
        ],
      });
      return;
    }

    if (subcommand === 'disable') {
      await interaction.deferReply({ flags: 64 });
      const config = await db.getLevelConfig(guild.id);
      if (!config?.enabled) {
        await interaction.editReply({ content: 'Levels are already off.' });
        return;
      }
      if (config.levelRoleIds) await deleteLevelRoles(guild, JSON.parse(config.levelRoleIds));
      await db.disableLevelSystem(guild.id);

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(WARNING_COLOR)
            .setTitle('Levels turned off')
            .setDescription('The level roles were deleted. Run `/levels setup` to start again.'),
        ],
      });
      return;
    }

    if (subcommand === 'status') {
      const config = await db.getLevelConfig(guild.id);
      if (!config?.enabled) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(ERROR_COLOR)
              .setTitle('Levels are off')
              .setDescription('Run `/levels setup` to turn them on.'),
          ],
          flags: 64,
        });
        return;
      }

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(BRAND_COLOR)
            .setTitle('📊 Level settings')
            .addFields(
              { name: 'Status', value: '✅ On', inline: true },
              { name: 'Max level', value: String(config.maxLevel), inline: true },
              { name: 'Level 1 at', value: `${config.baseThreshold} points`, inline: true },
              { name: 'Growth per level', value: `×${config.exponentFactor}`, inline: true },
              { name: 'Decay', value: `${(config.decayRate * 100).toFixed(0)}% per day`, inline: true },
              { name: 'Decay starts after', value: `${config.inactivityDays} days inactive`, inline: true }
            ),
        ],
        flags: 64,
      });
    }
  } catch (err) {
    logger.error('Failed to handle levels command', { context: 'LevelsCommand', error: err, guildId: guild.id, subcommand });
    const reply = { content: '❌ Something went wrong. Please try again.' };
    if (interaction.deferred || interaction.replied) await interaction.editReply(reply);
    else await interaction.reply({ ...reply, flags: 64 });
  }
}
