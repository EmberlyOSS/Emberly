import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, version } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('botinfo')
  .setDescription('Shows detailed bot information')
  .setDMPermission(false);

function formatUptime(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${d}d ${h}h ${m}m ${s}s`;
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const client = interaction.client as any;

  const uptimeSeconds = Math.floor(process.uptime());
  const mem = process.memoryUsage();
  const rss = (mem.rss / 1024 / 1024).toFixed(2);
  const heapUsed = (mem.heapUsed / 1024 / 1024).toFixed(2);

  const embed = new EmbedBuilder()
    .setTitle('Bot Information')
    .setColor(0xf97316)
    .setThumbnail(client.user?.displayAvatarURL())
    .addFields(
      { name: 'Name:', value: `${client.user?.tag ?? 'Unknown'}`, inline: true },
      { name: 'ID:', value: `${client.user?.id ?? 'Unknown'}`, inline: true },
      { name: 'Uptime:', value: formatUptime(uptimeSeconds), inline: true },
      { name: 'Memory (RSS):', value: `${rss} MB`, inline: true },
      { name: 'Heap Used:', value: `${heapUsed} MB`, inline: true },
      { name: 'Node:', value: `${process.version}`, inline: true },
      { name: 'Discord.js:', value: version, inline: true },
      { name: 'Cached Users:', value: `${client.users.cache.size}`, inline: true },
      { name: 'Registered Commands:', value: `${client.commands?.size ?? 0}`, inline: true },
      { name: 'Ping:', value: `${Math.round(client.ws?.ping ?? 0)}ms`, inline: true }
    )
    .setFooter({ text: '\u00a9Copyright 2026 embrly.ca' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
