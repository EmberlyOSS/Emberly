import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('8ball')
  .setDescription('Ask the magic 8-ball a question')
  .setDMPermission(false)
  .addStringOption(option =>
    option.setName('question')
      .setDescription('Your question for the magic 8-ball')
      .setMinLength(1)
      .setMaxLength(200)
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const question = interaction.options.getString('question', true);

  const responses = [
    '🎱 It is certain.',
    '🎱 It is decidedly so.',
    '🎱 Without a doubt.',
    '🎱 Yes definitely.',
    '🎱 You may rely on it.',
    '🎱 As I see it, yes.',
    '🎱 Most likely.',
    '🎱 Outlook good.',
    '🎱 Yes.',
    '🎱 Signs point to yes.',
    '🎱 Reply hazy, try again.',
    '🎱 Ask again later.',
    '🎱 Better not tell you now.',
    '🎱 Cannot predict now.',
    '🎱 Concentrate and ask again.',
    "🎱 Don't count on it.",
    '🎱 My reply is no.',
    '🎱 My sources say no.',
    '🎱 Outlook not so good.',
    '🎱 Very doubtful.'
  ];

  const answer = responses[Math.floor(Math.random() * responses.length)];

  const embed = new EmbedBuilder()
    .setColor(0xf97316)
    .setTitle('🎱 Magic 8-Ball')
    .addFields(
      { name: 'Question:', value: question, inline: false },
      { name: 'Answer:', value: answer, inline: false }
    )
    .setTimestamp()
    .setFooter({ text: '\u00a9Copyright 2026 embrly.ca' });

  await interaction.reply({ embeds: [embed] });
}
