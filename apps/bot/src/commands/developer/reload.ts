import { ChatInputCommandInteraction, SlashCommandBuilder, REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';
import db from '../../lib/db';

export const data = new SlashCommandBuilder()
  .setName('reload')
  .setDescription('Reload and register all slash commands (Developer only)')
  .setDMPermission(false);

export async function execute(interaction: ChatInputCommandInteraction) {
  const devIds = await db.getDevIds();
  
  if (!devIds.includes(interaction.user.id)) {
    return interaction.reply({ content: '❌ This command is for developers only.', flags: [64] });
  }

  await interaction.deferReply({ flags: [64] });

  try {
    const commands: any[] = [];
    const commandsPath = path.join(__dirname, '..');

    // Recursively load all command files
    function loadCommands(dir: string) {
      for (const file of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
          loadCommands(fullPath);
        } else if ((file.endsWith('.js') || file.endsWith('.ts')) && file !== 'reload.ts' && file !== 'clearcache.ts') {
          try {
            // Clear require cache
            delete require.cache[require.resolve(fullPath)];
            
            const cmd = require(fullPath);
            if (cmd.data) {
              commands.push(cmd.data.toJSON());
            }
          } catch (err) {
            console.error(`Failed to load command ${file}:`, err);
          }
        }
      }
    }

    loadCommands(commandsPath);

    const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN!);
    const clientId = interaction.client.application?.id ?? process.env.CLIENT_ID!;

    // Register to all configured guilds for instant updates (dev) OR globally (production)
    const guildIds = await db.getGuildIds();
    if (guildIds.length > 0) {
      for (const guildId of guildIds) {
        try {
          await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands }
          );
        } catch (err) {
          console.error(`Failed to reload commands in guild ${guildId}:`, err);
        }
      }
    } else {
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
    }

    await interaction.editReply({ 
      content: `✅ Successfully reloaded ${commands.length} slash commands${guildIds.length > 0 ? ` in ${guildIds.length} guild(s)` : ' globally'}\n\nCommands registered:\n${commands.map(c => `• /${c.name}`).join('\n')}` 
    });
  } catch (err) {
    console.error('Failed to reload commands:', err);
    await interaction.editReply({ content: '❌ Failed to reload commands.' });
  }
}
