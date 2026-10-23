import { Client, Interaction, TextChannel, ChannelType, ActionRowBuilder, ChatInputCommandInteraction, StringSelectMenuInteraction, ChannelSelectMenuInteraction, ButtonInteraction, ModalSubmitInteraction, ChannelSelectMenuBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import db from '../lib/db';
import { logger } from '../lib/logger';
import { reportCommandError } from '../lib/errorReporter';
import { ExtendedClient } from '../types';
import { loadCategories } from '../commands/info/help';

type SupportedInteraction = ChatInputCommandInteraction | StringSelectMenuInteraction | ChannelSelectMenuInteraction | ButtonInteraction | ModalSubmitInteraction;

function isSupportedInteraction(interaction: Interaction): interaction is SupportedInteraction {
  return interaction.isChatInputCommand() || 
         interaction.isStringSelectMenu() || 
         interaction.isChannelSelectMenu() || 
         interaction.isButton() || 
         interaction.isModalSubmit();
}

export default async (client: ExtendedClient, interaction: Interaction) => {
  if (interaction.isAutocomplete()) {
    const cmd = client.commands?.get(interaction.commandName);
    await cmd?.autocomplete?.(interaction).catch((err) => {
      logger.debug('Autocomplete failed', { context: 'Autocomplete', error: err, commandName: interaction.commandName });
    });
    return;
  }

  if (!isSupportedInteraction(interaction)) return;

  try {
    if (interaction.isChatInputCommand()) {
      try {
        const cmd = client.commands?.get(interaction.commandName);
        if (!cmd) {
          logger.warn('Command not found', {
            context: 'CommandHandler',
            userId: interaction.user.id,
            commandName: interaction.commandName
          });
          return interaction.reply({ content: 'Command not found', flags: MessageFlags.Ephemeral });
        }
        
        logger.debug(`Executing command: ${interaction.commandName}`, {
          context: 'CommandHandler',
          userId: interaction.user.id
        });
        
        await cmd.execute(interaction);
        logger.commandExecuted(interaction.commandName, interaction.user.id, true);
      } catch (err) {
        logger.interactionError('Error executing command', interaction, err);
        logger.commandExecuted(interaction.commandName, interaction.user.id, false);
        
        if (!interaction.replied) {
          try {
            await interaction.reply({
              content: '❌ An error occurred while executing this command.',
              flags: MessageFlags.Ephemeral
            });
          } catch (replyErr) {
            logger.error('Failed to send command error reply', {
              context: 'CommandHandler',
              error: replyErr
            });
          }
        }
      }
    }
    
    if (interaction.isStringSelectMenu()) {
      try {
        // Handle /help category select menu
        if (interaction.customId === 'help_category_select') {
          const selected = interaction.values[0];
          const categories = loadCategories();
          const cmds = categories[selected];

          const embed = new EmbedBuilder()
            .setColor(0xf97316)
            .setTitle(`${selected}`)
            .setDescription(
              cmds
                ? cmds.map(c => `\`/${c.name}\` — ${c.description}`).join('\n')
                : 'No commands in this category.'
            )
            .setTimestamp()
            .setFooter({ text: '\u00a9Copyright 2026 embrly.ca' });

          await interaction.update({ embeds: [embed], components: interaction.message.components });
          return;
        }

      } catch (err) {
        logger.interactionError('Error in select menu handler', interaction, err);
      }
    }

    if (interaction.isChannelSelectMenu()) {
      try {
        if (interaction.customId.startsWith('changelog_channel_select_')) {
          const selectedChannelId = interaction.values[0];
          const customIdParts = interaction.customId.split('_');
          const type = customIdParts[3]; // 'changelog' or 'announcement'

          const guild = interaction.guild;
          if (!guild) {
            return interaction.reply({ content: '❌ Guild not found.', flags: MessageFlags.Ephemeral });
          }

          const channel = guild.channels.cache.get(selectedChannelId) as TextChannel;
          if (!channel || !channel.isTextBased()) {
            return interaction.reply({
              content: '❌ Selected channel is not a text channel.',
              flags: MessageFlags.Ephemeral
            });
          }

          // Extract title and content from the preview message.
          // Preview format: "📝 **title**\n\ncontent\n\n---\n*Posted by ...*"
          const messageContent = interaction.message.content;
          const icon = type === 'changelog' ? '📝' : '📢';
          const titleMatch = messageContent.match(/[📝📢] \*\*(.+?)\*\*/);
          const contentMatch = messageContent.match(/[📝📢] \*\*.+?\*\*\n\n([\s\S]+?)\n\n---\n\*Posted/);

          const title = titleMatch ? titleMatch[1] : 'Announcement';
          const content = contentMatch ? contentMatch[1].trim() : 'No content provided';

          const formattedMessage = `${icon} **${title}**\n\n${content}\n\n---\n*Posted by ${interaction.user.username} • <t:${Math.floor(Date.now() / 1000)}:f>*`;

          try {
            const sentMessage = await channel.send({ content: formattedMessage });

            const announcement = await db.createAnnouncement(
              guild.id,
              selectedChannelId,
              interaction.user.id,
              type,
              title,
              content,
              0
            );

            if (announcement) {
              await db.updateAnnouncementMessageId(announcement.id, sentMessage.id);
            }

            await interaction.reply({
              content: `✅ ${type === 'changelog' ? 'Changelog' : 'Announcement'} posted successfully to ${channel.toString()}!`,
              flags: MessageFlags.Ephemeral
            });

            logger.debug('Changelog/Announcement sent successfully', {
              context: 'ChangelogModalHandler',
              userId: interaction.user.id,
              type,
              channelId: selectedChannelId,
              announcementId: announcement?.id
            });
          } catch (sendErr) {
            logger.error('Failed to send announcement to channel', {
              context: 'ChangelogModalHandler',
              error: sendErr,
              channelId: selectedChannelId
            });
            if (!interaction.replied) {
              await interaction.reply({
                content: '❌ Failed to post announcement. Check the bot has permission to send messages there.',
                flags: MessageFlags.Ephemeral
              });
            }
          }
          return;
        }
      } catch (err) {
        logger.interactionError('Error in channel select menu handler', interaction, err);
        if (interaction.isRepliable() && !interaction.replied) {
          await interaction.reply({ content: '❌ An error occurred.', flags: MessageFlags.Ephemeral });
        }
      }
    }
    if (interaction.isModalSubmit()) {
      try {
        // Handle changelog/announcement creation modal submission
      if (interaction.customId.startsWith('changelog_') && interaction.customId.includes('_step1_')) {
        try {
          const parts = interaction.customId.split('_');
          const type = parts[1]; // 'changelog' or 'announcement'
          const userId = parts[3]; // User ID from customId
          
          if (interaction.user.id !== userId) {
            return interaction.reply({
              content: '❌ You are not authorized to submit this form.',
              flags: MessageFlags.Ephemeral
            });
          }

          const title = interaction.fields.getTextInputValue('changelog_title');
          const content = interaction.fields.getTextInputValue('changelog_content');
          const guild = interaction.guild;

          if (!guild) {
            logger.warn('Guild not found in modal interaction', {
              context: 'ChangelogModalHandler',
              userId: interaction.user.id
            });
            return interaction.reply({ content: '❌ Guild not found.', flags: MessageFlags.Ephemeral });
          }

          // Create channel select menu for the dev to choose where to post
          const ChannelSelect = new ChannelSelectMenuBuilder()
            .setCustomId(`changelog_channel_select_${type}_${title.substring(0, 20)}_${Date.now()}`)
            .setPlaceholder('Select channel to send announcement')
            .addChannelTypes(ChannelType.GuildText);

          const row = new ActionRowBuilder<any>().addComponents(ChannelSelect);

          // Create preview showing how it will look
          const icon = type === 'changelog' ? '📝' : '📢';
          const previewMessage = `${icon} **${title}**\n\n${content}\n\n---\n*Posted by ${interaction.user.username} • <t:${Math.floor(Date.now() / 1000)}:f>*`;

          await interaction.reply({
            content: `**${type === 'changelog' ? 'Changelog' : 'Announcement'} Preview:**\n\n${previewMessage}\n\n---\nPlease select the channel where you'd like to send this:`,
            components: [row],
            flags: MessageFlags.Ephemeral
          });

          logger.debug('Changelog modal submitted, waiting for channel selection', {
            context: 'ChangelogModalHandler',
            userId: interaction.user.id,
            type
          });
        } catch (err) {
          logger.interactionError('Error processing changelog modal', interaction, err);
          if (!interaction.replied) {
            try {
              await interaction.reply({
                content: '❌ An error occurred while processing your announcement.',
                flags: MessageFlags.Ephemeral
              });
            } catch (replyErr) {
              logger.error('Failed to send error reply', {
                context: 'ChangelogModalHandler',
                error: replyErr
              });
            }
          }
        }
        return;
      }
      } catch (err) {
        logger.interactionError('Error in modal submit handler', interaction, err);
      }
    }
  } catch (err) {
    logger.interactionError('Uncaught error in interaction handler', interaction, err);
    void reportCommandError(err, {
      command: (interaction as any).commandName ?? (interaction as any).customId,
      userId: interaction.user?.id,
      guildId: interaction.guild?.id ?? null,
    });
    if (interaction.isRepliable()) {
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: '❌ An unexpected error occurred.', flags: MessageFlags.Ephemeral });
        } else if (interaction.deferred && !interaction.replied) {
          await interaction.editReply({ content: '❌ An unexpected error occurred.' });
        } else {
          await interaction.followUp({ content: '❌ An unexpected error occurred.', flags: MessageFlags.Ephemeral });
        }
      } catch (replyErr) {
        logger.error('Failed to send final error reply', {
          context: 'InteractionHandler',
          error: replyErr
        });
      }
    }
  }
};
