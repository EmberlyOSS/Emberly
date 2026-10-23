import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, ChannelType } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('serverinfo')
  .setDescription('Shows detailed server information')
  .setDMPermission(false);

function formatDate(d: Date) {
  return d.toUTCString();
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const g = interaction.guild;
  if (!g) return interaction.reply({ content: 'Guild info not available.', flags: [64] });

  // Fetch fresh owner info
  const owner = await g.fetchOwner().catch(() => null);

  const rolesCount = g.roles.cache.size;
  const emojisCount = g.emojis.cache.size;
  const memberCount = g.memberCount ?? (await g.members.fetch()).size;

  const channels = g.channels.cache;
  const textChannels = channels.filter((c) => c.type === ChannelType.GuildText).size;
  const voiceChannels = channels.filter((c) => c.type === ChannelType.GuildVoice).size;
  const categories = channels.filter((c) => c.type === ChannelType.GuildCategory).size;

  const embed = new EmbedBuilder()
    .setTitle(`${g.name} — Server Info`)
    .setThumbnail(g.iconURL() ?? '')
    .setColor(0xf97316)
    .addFields(
      { name: 'Name:', value: `${g.name}`, inline: true },
      { name: 'ID:', value: `${g.id}`, inline: true },
      { name: 'Owner:', value: owner ? `${owner.user.tag} (${owner.id})` : 'Unknown', inline: true },
      { name: 'Members:', value: `${memberCount}`, inline: true },
      { name: 'Roles:', value: `${rolesCount}`, inline: true },
      { name: 'Emojis:', value: `${emojisCount}`, inline: true },
      { name: 'Channels:', value: `Text: ${textChannels} • Voice: ${voiceChannels} • Categories: ${categories}`, inline: false },
      { name: 'Boosts:', value: `${g.premiumSubscriptionCount ?? 0} (Tier: ${g.premiumTier ?? 'NONE'})`, inline: true },
      { name: 'Verification:', value: `${g.verificationLevel}`, inline: true },
      { name: 'Features:', value: `${g.features.length ? g.features.join(', ') : 'None'}`, inline: false },
      { name: 'Created:', value: formatDate(g.createdAt), inline: true }
    )
    .setFooter({ text: '\u00a9Copyright 2026 embrly.ca' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
