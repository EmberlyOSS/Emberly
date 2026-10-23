import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ChannelSelectMenuBuilder, ChannelType } from 'discord.js';
import { logger } from '../../lib/logger';
import db from '../../lib/db';

export const data = new SlashCommandBuilder()
  .setName('changelog')
  .setDescription('Create and send a changelog or announcement (dev-only)')
  .setDMPermission(false)
  .addSubcommand(sub =>
    sub
      .setName('create')
      .setDescription('Create a new changelog/announcement')
      .addStringOption(option =>
        option
          .setName('type')
          .setDescription('Type of announcement')
          .setRequired(true)
          .addChoices(
            { name: '📝 Changelog', value: 'changelog' },
            { name: '📢 Announcement', value: 'announcement' }
          )
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    // Check if user is a developer
    const appConfig = await db.getAppConfig();
    const devIds = appConfig?.devIds ? JSON.parse(appConfig.devIds) : [];
    
    if (!devIds.includes(interaction.user.id)) {
      return interaction.reply({ 
        content: '❌ Only developers can use this command.', 
        flags: MessageFlags.Ephemeral
      });
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'create') {
      const type = interaction.options.getString('type', true);
      
      // Create the initial modal to get title and content
      const modal = new ModalBuilder()
        .setCustomId(`changelog_${type}_step1_${interaction.user.id}`)
        .setTitle(type === 'changelog' ? '📝 Create Changelog' : '📢 Create Announcement');

      const titleInput = new TextInputBuilder()
        .setCustomId('changelog_title')
        .setLabel('Title')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g., Version 2.0 Released')
        .setRequired(true)
        .setMaxLength(100);

      const contentInput = new TextInputBuilder()
        .setCustomId('changelog_content')
        .setLabel(type === 'changelog' ? 'Changes' : 'Message')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder(type === 'changelog' 
          ? 'List the changes made...' 
          : 'Write your announcement...')
        .setRequired(true)
        .setMaxLength(2000);

      const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput);
      const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(contentInput);

      modal.addComponents(row1, row2);

      await interaction.showModal(modal);
      logger.debug(`Changelog modal shown for user ${interaction.user.id}`, {
        context: 'ChangelogCommand',
        type
      });
    }
  } catch (err) {
    logger.interactionError('Error in changelog command', interaction, err);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '❌ An error occurred while processing your request.',
        flags: MessageFlags.Ephemeral
      });
    }
  }
}
