import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, ChannelType } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('channelinfo')
  .setDescription('Get information about a channel')
  .setDMPermission(false)
  .addChannelOption(option =>
    option.setName('channel')
      .setDescription('The channel to get information about')
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const channel = interaction.options.getChannel('channel') || interaction.channel;

  if (!channel || !interaction.guild) {
    return await interaction.reply({ content: '❌ Channel not found.', flags: [64] });
  }

  const guildChannel = interaction.guild.channels.cache.get(channel.id);
  if (!guildChannel) {
    return await interaction.reply({ content: '❌ Channel not found in this server.', flags: [64] });
  }

  const createdAt = Math.floor((guildChannel.createdTimestamp || Date.now()) / 1000);
  
  let channelType = 'Unknown';
  switch (guildChannel.type) {
    case ChannelType.GuildText:
      channelType = '💬 Text Channel';
      break;
    case ChannelType.GuildVoice:
      channelType = '🔊 Voice Channel';
      break;
    case ChannelType.GuildCategory:
      channelType = '📁 Category';
      break;
    case ChannelType.GuildAnnouncement:
      channelType = '📢 Announcement Channel';
      break;
    case ChannelType.GuildStageVoice:
      channelType = '🎙️ Stage Channel';
      break;
    case ChannelType.GuildForum:
      channelType = '💭 Forum Channel';
      break;
    default:
      channelType = `Type ${guildChannel.type}`;
  }

  const embed = new EmbedBuilder()
    .setColor(0xf97316)
    .setTitle(`Channel Information: ${guildChannel.name}`)
    .addFields(
      { name: 'Channel ID:', value: guildChannel.id, inline: true },
      { name: 'Type:', value: channelType, inline: true },
      { name: 'Created At:', value: `<t:${createdAt}:F> (<t:${createdAt}:R>)`, inline: false }
    )
    .setTimestamp()
    .setFooter({ text: '\u00a9Copyright 2026 embrly.ca' });

  // Add position if available
  if ('position' in guildChannel && typeof guildChannel.position === 'number') {
    embed.addFields({ name: 'Position:', value: `${guildChannel.position}`, inline: true });
  }

  // Add text channel specific info
  if ('topic' in guildChannel && guildChannel.topic) {
    embed.addFields({ name: 'Topic:', value: guildChannel.topic, inline: false });
  }

  if ('nsfw' in guildChannel) {
    embed.addFields({ name: 'NSFW:', value: guildChannel.nsfw ? '🔞 Yes' : '✅ No', inline: true });
  }

  // Add voice channel specific info
  if ('userLimit' in guildChannel && guildChannel.userLimit) {
    embed.addFields({ name: 'User Limit:', value: `${guildChannel.userLimit}`, inline: true });
  }

  if ('bitrate' in guildChannel && guildChannel.bitrate) {
    embed.addFields({ name: 'Bitrate:', value: `${guildChannel.bitrate / 1000}kbps`, inline: true });
  }

  // Add category info
  if ('parent' in guildChannel && guildChannel.parent) {
    embed.addFields({ name: 'Category:', value: guildChannel.parent.name, inline: true });
  }

  await interaction.reply({ embeds: [embed] });
}
