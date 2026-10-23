import { ChatInputCommandInteraction, SlashCommandBuilder, REST, Routes } from 'discord.js';
import db from '../../lib/db';

export const data = new SlashCommandBuilder()
  .setName('clearcache')
  .setDescription('Clear all slash commands (Developer only)')
  .setDMPermission(false);

export async function execute(interaction: ChatInputCommandInteraction) {
  const devIds = await db.getDevIds();
  
  if (!devIds.includes(interaction.user.id)) {
    return interaction.reply({ content: '❌ This command is for developers only.', flags: [64] });
  }

  await interaction.deferReply({ flags: [64] });

  try {
    const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN!);
    const clientId = interaction.client.application?.id ?? process.env.CLIENT_ID!;

    // Clear global commands
    await rest.put(Routes.applicationCommands(clientId), { body: [] });
    
    // Clear guild commands for all configured guilds
    const guildIds = await db.getGuildIds();
    for (const guildId of guildIds) {
      try {
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] });
      } catch (err) {
        console.error(`Failed to clear commands for guild ${guildId}:`, err);
      }
    }

    await interaction.editReply({ content: `✅ Successfully cleared all slash commands cache${guildIds.length > 0 ? ` from ${guildIds.length} guild(s)` : ''}` });
  } catch (err) {
    console.error('Failed to clear commands:', err);
    await interaction.editReply({ content: '❌ Failed to clear commands cache.' });
  }
}
