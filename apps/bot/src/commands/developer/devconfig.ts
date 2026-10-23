import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { logger } from '../../lib/logger';
import db from '../../lib/db';

export const data = new SlashCommandBuilder()
  .setName('devconfig')
  .setDescription('Manage app-level configuration (dev-only)')
  .setDMPermission(false)
  .addSubcommandGroup(group =>
    group
      .setName('guilds')
      .setDescription('Manage guild IDs')
      .addSubcommand(sub =>
        sub
          .setName('add')
          .setDescription('Add a guild ID')
          .addStringOption(option =>
            option.setName('guild_id').setDescription('Guild ID to add').setRequired(true)
          )
      )
      .addSubcommand(sub =>
        sub
          .setName('remove')
          .setDescription('Remove a guild ID')
          .addStringOption(option =>
            option.setName('guild_id').setDescription('Guild ID to remove').setRequired(true)
          )
      )
      .addSubcommand(sub =>
        sub
          .setName('list')
          .setDescription('List all guild IDs')
      )
  )
  .addSubcommandGroup(group =>
    group
      .setName('devs')
      .setDescription('Manage developer IDs')
      .addSubcommand(sub =>
        sub
          .setName('add')
          .setDescription('Add a developer ID')
          .addStringOption(option =>
            option.setName('user_id').setDescription('User ID to add as dev').setRequired(true)
          )
      )
      .addSubcommand(sub =>
        sub
          .setName('remove')
          .setDescription('Remove a developer ID')
          .addStringOption(option =>
            option.setName('user_id').setDescription('User ID to remove from devs').setRequired(true)
          )
      )
      .addSubcommand(sub =>
        sub
          .setName('list')
          .setDescription('List all developer IDs')
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  // Dev-only check
  const devIds = await db.getDevIds();
  if (!devIds.includes(interaction.user.id)) {
    return interaction.reply({
      content: '❌ This command is dev-only.',
      flags: [64]
    });
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const group = interaction.options.getSubcommandGroup();
  const subcommand = interaction.options.getSubcommand();

  try {
    // ===== GUILDS =====
    if (group === 'guilds') {
      const guildIds = await db.getGuildIds();

      if (subcommand === 'add') {
        const guildId = interaction.options.getString('guild_id', true);

        if (guildIds.includes(guildId)) {
          return interaction.editReply({
            content: `❌ Guild ID \`${guildId}\` is already in the list.`
          });
        }

        guildIds.push(guildId);
        const success = await db.setGuildIds(guildIds);

        if (!success) {
          return interaction.editReply({
            content: `❌ Failed to add guild ID.`
          });
        }

        const embed = new EmbedBuilder()
          .setColor(0x3BB98E)
          .setTitle('Guild ID Added')
          .setDescription(`Guild ID: \`${guildId}\``)
          .addFields(
            { name: 'Total Guilds', value: String(guildIds.length), inline: true }
          )
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
      }

      if (subcommand === 'remove') {
        const guildId = interaction.options.getString('guild_id', true);

        const index = guildIds.indexOf(guildId);
        if (index === -1) {
          return interaction.editReply({
            content: `❌ Guild ID \`${guildId}\` not found.`
          });
        }

        guildIds.splice(index, 1);
        const success = await db.setGuildIds(guildIds);

        if (!success) {
          return interaction.editReply({
            content: `❌ Failed to remove guild ID.`
          });
        }

        const embed = new EmbedBuilder()
          .setColor(0x3BB98E)
          .setTitle('Guild ID Removed')
          .setDescription(`Guild ID: \`${guildId}\``)
          .addFields(
            { name: 'Total Guilds', value: String(guildIds.length), inline: true }
          )
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
      }

      if (subcommand === 'list') {
        const listGuildIds = await db.getGuildIds();

        const embed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle('Configured Guild IDs')
          .setDescription(
            listGuildIds.length > 0
              ? `\`\`\`\n${listGuildIds.join('\n')}\n\`\`\``
              : 'No guilds configured'
          )
          .addFields(
            { name: 'Total', value: String(listGuildIds.length), inline: true }
          )
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
      }
    }

    // ===== DEVS =====
    if (group === 'devs') {
      const devList = await db.getDevIds();

      if (subcommand === 'add') {
        const userId = interaction.options.getString('user_id', true);

        if (devList.includes(userId)) {
          return interaction.editReply({
            content: `❌ User \`${userId}\` is already a developer.`
          });
        }

        devList.push(userId);
        const success = await db.setDevIds(devList);

        if (!success) {
          return interaction.editReply({
            content: `❌ Failed to add developer.`
          });
        }

        const embed = new EmbedBuilder()
          .setColor(0x3BB98E)
          .setTitle('Developer Added')
          .setDescription(`User ID: \`${userId}\``)
          .addFields(
            { name: 'Total Developers', value: String(devList.length), inline: true }
          )
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
      }

      if (subcommand === 'remove') {
        const userId = interaction.options.getString('user_id', true);

        const index = devList.indexOf(userId);
        if (index === -1) {
          return interaction.editReply({
            content: `❌ User \`${userId}\` is not a developer.`
          });
        }

        devList.splice(index, 1);
        const success = await db.setDevIds(devList);

        if (!success) {
          return interaction.editReply({
            content: `❌ Failed to remove developer.`
          });
        }

        const embed = new EmbedBuilder()
          .setColor(0x3BB98E)
          .setTitle('Developer Removed')
          .setDescription(`User ID: \`${userId}\``)
          .addFields(
            { name: 'Total Developers', value: String(devList.length), inline: true }
          )
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
      }

      if (subcommand === 'list') {
        const currentDevList = await db.getDevIds();

        const embed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle('Developers')
          .setDescription(
            currentDevList.length > 0
              ? `\`\`\`\n${currentDevList.join('\n')}\n\`\`\``
              : 'No developers configured'
          )
          .addFields(
            { name: 'Total', value: String(currentDevList.length), inline: true }
          )
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
      }
    }

  } catch (err) {
    logger.error('Error in devconfig command', {
      context: 'DevConfigCommand',
      error: err,
      userId: interaction.user.id
    });

    return interaction.editReply({
      content: '❌ An error occurred while processing your request.'
    });
  }
}
