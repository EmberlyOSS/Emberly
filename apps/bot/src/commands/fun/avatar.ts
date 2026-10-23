import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('avatar')
  .setDescription("Get a user's avatar")
  .setDMPermission(false)
  .addUserOption(option =>
    option.setName('user')
      .setDescription('The user to get the avatar of')
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('user') || interaction.user;
  const avatarURL = user.displayAvatarURL({ size: 4096 });

  const embed = new EmbedBuilder()
    .setColor(0xf97316)
    .setTitle(`${user.username}'s Avatar`)
    .setImage(avatarURL)
    .setTimestamp()
    .setFooter({ text: '\u00a9Copyright 2026 embrly.ca' });

  await interaction.reply({ embeds: [embed] });
}
