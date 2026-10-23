import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('List available commands')
  .setDMPermission(false);

export const CATEGORY_LABELS: Record<string, string> = {
  emberly:    '🔗 Emberly',
  levels:     '⭐ Levels',
  info:       'ℹ️ Information',
  fun:        '🎉 Fun',
  developer:  '👨‍💻 Developer',
};

const HIDDEN_CATEGORIES = new Set(['developer']);

export function loadCategories(): Record<string, { name: string; description: string }[]> {
  const commandsPath = path.join(__dirname, '..');
  const categories: Record<string, { name: string; description: string }[]> = {};

  for (const folder of fs.readdirSync(commandsPath)) {
    const folderPath = path.join(commandsPath, folder);
    if (!fs.statSync(folderPath).isDirectory()) continue;
    if (HIDDEN_CATEGORIES.has(folder)) continue;

    const label = CATEGORY_LABELS[folder] ?? folder;
    categories[label] = [];

    for (const file of fs.readdirSync(folderPath)) {
      if ((!file.endsWith('.ts') && !file.endsWith('.js')) || file.startsWith('_')) continue;
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const cmd = require(path.join(folderPath, file));
        if (cmd.data?.name) {
          categories[label].push({ name: cmd.data.name, description: cmd.data.description ?? 'No description' });
        }
      } catch {
        // skip
      }
    }

    if (categories[label].length === 0) delete categories[label];
  }

  return categories;
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const categories = loadCategories();
  const categoryKeys = Object.keys(categories);

  const select = new StringSelectMenuBuilder()
    .setCustomId('help_category_select')
    .setPlaceholder('Choose a category…')
    .addOptions(
      categoryKeys.map(label =>
        new StringSelectMenuOptionBuilder()
          .setLabel(label)
          .setValue(label)
      )
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

  const embed = new EmbedBuilder()
    .setColor(0xf97316)
    .setTitle('📚 Bot Commands')
    .setDescription(`Select a category below to browse commands.\n\n**Categories:** ${categoryKeys.join(' · ')}`)
    .setThumbnail(interaction.client.user?.displayAvatarURL() || '')
    .setTimestamp()
    .setFooter({ text: `\u00a9Copyright 2026 embrly.ca` });

  await interaction.reply({ embeds: [embed], components: [row] });
}
