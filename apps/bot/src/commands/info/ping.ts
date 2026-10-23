import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Check bot latency')
  .setDMPermission(false);

export async function execute(interaction: ChatInputCommandInteraction) {
  const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
  const apiLatency = (sent as any).createdTimestamp - interaction.createdTimestamp;
  const wsLatency = interaction.client.ws.ping ?? 0;
  
  const embed = new EmbedBuilder()
    .setColor(0xf97316)
    .setTitle('🏓 Pong!')
    .setThumbnail(interaction.client.user?.displayAvatarURL() || '')
    .addFields(
      { name: 'API Latency:', value: `${Math.round(apiLatency)}ms`, inline: true },
      { name: 'WebSocket Latency:', value: `${Math.round(wsLatency)}ms`, inline: true }
    )
    .setTimestamp()
    .setFooter({ text: '\u00a9Copyright 2026 embrly.ca' });

  await interaction.editReply({ content: '', embeds: [embed] });
}
