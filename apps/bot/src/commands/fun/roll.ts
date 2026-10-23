import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('roll')
  .setDescription('Roll a dice')
  .setDMPermission(false)
  .addIntegerOption(option =>
    option.setName('sides')
      .setDescription('Number of sides on the dice (default: 6)')
      .setMinValue(2)
      .setMaxValue(100)
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const sides = interaction.options.getInteger('sides') || 6;
  const result = Math.floor(Math.random() * sides) + 1;

  const embed = new EmbedBuilder()
    .setColor(0xf97316)
    .setTitle('🎲 Dice Roll')
    .setDescription(`You rolled a **${result}** on a ${sides}-sided dice!`)
    .setTimestamp()
    .setFooter({ text: '\u00a9Copyright 2026 embrly.ca' });

  await interaction.reply({ embeds: [embed] });
}
