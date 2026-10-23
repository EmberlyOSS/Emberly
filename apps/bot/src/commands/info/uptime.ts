import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('uptime')
  .setDescription('Shows bot uptime')
  .setDMPermission(false);

function formatUptime(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  const parts = [];
  if (d > 0) parts.push(`${d} day${d !== 1 ? 's' : ''}`);
  if (h > 0) parts.push(`${h} hour${h !== 1 ? 's' : ''}`);
  if (m > 0) parts.push(`${m} minute${m !== 1 ? 's' : ''}`);
  if (s > 0) parts.push(`${s} second${s !== 1 ? 's' : ''}`);
  
  return parts.join(', ') || '0 seconds';
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const client = interaction.client;
  const uptimeSeconds = Math.floor(process.uptime());
  const startTime = Date.now() - (uptimeSeconds * 1000);
  
  const embed = new EmbedBuilder()
    .setColor(0xf97316)
    .setTitle('⏱️ Bot Uptime')
    .setThumbnail(client.user?.displayAvatarURL() || '')
    .addFields(
      { name: '📊 Current Uptime:', value: formatUptime(uptimeSeconds), inline: false },
      { name: '🚀 Started At:', value: `<t:${Math.floor(startTime / 1000)}:F>`, inline: false },
      { name: '⏰ Running Since:', value: `<t:${Math.floor(startTime / 1000)}:R>`, inline: false }
    )
    .setFooter({ text: '\u00a9Copyright 2026 embrly.ca' })
    .setTimestamp();
  
  await interaction.reply({ embeds: [embed] });
}
