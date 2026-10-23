import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('roleinfo')
  .setDescription('Get information about a role')
  .setDMPermission(false)
  .addRoleOption(option =>
    option.setName('role')
      .setDescription('The role to get information about')
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const role = interaction.options.getRole('role', true);

  if (!interaction.guild) {
    return await interaction.reply({ content: '❌ This command can only be used in a server.', flags: [64] });
  }

  const guildRole = interaction.guild.roles.cache.get(role.id);
  if (!guildRole) {
    return await interaction.reply({ content: '❌ Role not found.', flags: [64] });
  }

  const memberCount = interaction.guild.members.cache.filter(m => m.roles.cache.has(guildRole.id)).size;
  const createdAt = Math.floor(guildRole.createdTimestamp / 1000);

  const embed = new EmbedBuilder()
    .setColor(guildRole.color || 0xf97316)
    .setTitle(`Role Information: ${guildRole.name}`)
    .addFields(
      { name: 'Role ID:', value: guildRole.id, inline: true },
      { name: 'Colour:', value: guildRole.hexColor, inline: true },
      { name: 'Position:', value: `${guildRole.position}`, inline: true },
      { name: 'Members:', value: `${memberCount}`, inline: true },
      { name: 'Mentionable:', value: guildRole.mentionable ? '✅ Yes' : '❌ No', inline: true },
      { name: 'Hoisted:', value: guildRole.hoist ? '✅ Yes' : '❌ No', inline: true },
      { name: 'Created At:', value: `<t:${createdAt}:F> (<t:${createdAt}:R>)`, inline: false }
    )
    .setTimestamp()
    .setFooter({ text: '\u00a9Copyright 2026 embrly.ca' });

  await interaction.reply({ embeds: [embed] });
}
