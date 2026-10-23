import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('userinfo')
  .setDescription('Shows information about a user')
  .setDMPermission(false)
  .addUserOption((o) => o.setName('target').setDescription('User').setRequired(false));

function formatDate(d?: Date | null) {
  if (!d) return 'Unknown';
  return d.toUTCString();
}

function mapBadges(flags: string[] = []) {
  const badges: string[] = [];
  for (const f of flags) {
    const key = f.toLowerCase();
    if (key.includes('employee') || key.includes('staff')) badges.push('🛡️ Discord Staff');
    else if (key.includes('partner')) badges.push('🤝 Partnered Server Owner');
    else if (key.includes('hypesquad') || key.includes('house')) {
      if (key.includes('bravery')) badges.push('🔥 HypeSquad Bravery');
      else if (key.includes('brilliance')) badges.push('💡 HypeSquad Brilliance');
      else if (key.includes('balance')) badges.push('⚖️ HypeSquad Balance');
      else badges.push('🎉 HypeSquad');
    }
    else if (key.includes('bug') || key.includes('bughunter')) badges.push('🔎 Bug Hunter');
    else if (key.includes('early_supporter') || (key.includes('early') && key.includes('supporter'))) badges.push('🌟 Early Supporter');
    else if (key.includes('verified_developer') || key.includes('early_verified_developer')) badges.push('✅ Early Verified Bot Developer');
    else if (key.includes('verified_bot')) badges.push('🤖 Verified Bot');
    else if (key.includes('certified_moderator')) badges.push('🔰 Certified Moderator');
    else if (key.includes('team')) badges.push('👥 Team User');
    else if (key.includes('system')) badges.push('⚙️ System');
    else badges.push(f);
  }
  // dedupe and limit
  return Array.from(new Set(badges)).slice(0, 25);
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const targetUser = interaction.options.getUser('target') || interaction.user;
  const client = interaction.client as any;

  // fetch full user (to get flags) and try to fetch member in this guild for join/roles
  const fetchedUser = await client.users.fetch(targetUser.id).catch(() => targetUser as any);
  const member = interaction.guild ? await interaction.guild.members.fetch(targetUser.id).catch(() => null) : null;

  // try common places for flags
  let rawFlags: string[] = [];
  try {
    if (fetchedUser.flags?.toArray) rawFlags = fetchedUser.flags.toArray();
    else if ((fetchedUser as any).publicFlags?.toArray) rawFlags = (fetchedUser as any).publicFlags.toArray();
    else if (Array.isArray((fetchedUser as any).flags)) rawFlags = (fetchedUser as any).flags;
  } catch {
    rawFlags = [];
  }

  const badges = mapBadges(rawFlags);

  const embed = new EmbedBuilder()
    .setAuthor({ name: `${targetUser.tag}`, iconURL: targetUser.displayAvatarURL() })
    .setThumbnail(targetUser.displayAvatarURL())
    .setColor(0xf97316)
    .addFields(
      { name: 'Username:', value: `${targetUser.tag}`, inline: true },
      { name: 'ID:', value: `${targetUser.id}`, inline: true },
      { name: 'Bot?', value: `${targetUser.bot ? 'Yes' : 'No'}`, inline: true },
      { name: 'Account Created:', value: formatDate(targetUser.createdAt), inline: true },
      { name: 'Joined Server:', value: member ? formatDate(member.joinedAt) : 'Not in this server / unknown', inline: true },
      { name: 'Display Name:', value: member ? `${member.displayName}` : 'N/A', inline: true },
      { name: 'Top Role:', value: member ? `${member.roles.highest?.name ?? 'None'}` : 'N/A', inline: true },
      { name: 'Roles:', value: member ? member.roles.cache.filter(r => r.name !== '@everyone').map(r => r.name).slice(0, 20).join(', ') || 'None' : 'N/A', inline: false },
      { name: 'Badges:', value: badges.length ? badges.join(' • ') : 'None', inline: false }
    )
    .setFooter({ text: '\u00a9Copyright 2026 embrly.ca' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
