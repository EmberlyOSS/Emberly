import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('joke')
  .setDescription('Get a random joke')
  .setDMPermission(false);

export async function execute(interaction: ChatInputCommandInteraction) {
  const jokes = [
    { setup: "Why don't scientists trust atoms?", punchline: "Because they make up everything!" },
    { setup: "What do you call a bear with no teeth?", punchline: "A gummy bear!" },
    { setup: "Why did the scarecrow win an award?", punchline: "Because he was outstanding in his field!" },
    { setup: "What do you call fake spaghetti?", punchline: "An impasta!" },
    { setup: "Why don't eggs tell jokes?", punchline: "They'd crack each other up!" },
    { setup: "What do you call a sleeping bull?", punchline: "A bulldozer!" },
    { setup: "Why did the math book look so sad?", punchline: "Because it had too many problems!" },
    { setup: "What do you call a fish with no eyes?", punchline: "A fsh!" },
    { setup: "Why can't you hear a pterodactyl go to the bathroom?", punchline: "Because the P is silent!" },
    { setup: "What did one wall say to the other wall?", punchline: "I'll meet you at the corner!" },
    { setup: "Why did the cookie go to the doctor?", punchline: "Because it felt crumbly!" },
    { setup: "What do you call a boomerang that won't come back?", punchline: "A stick!" },
    { setup: "Why don't skeletons fight each other?", punchline: "They don't have the guts!" },
    { setup: "What's the best time to go to the dentist?", punchline: "Tooth-hurty!" },
    { setup: "Why did the bicycle fall over?", punchline: "Because it was two-tired!" }
  ];

  const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];

  const embed = new EmbedBuilder()
    .setColor(0xf97316)
    .setTitle('😄 Random Joke')
    .addFields(
      { name: 'Setup:', value: randomJoke.setup, inline: false },
      { name: 'Punchline:', value: randomJoke.punchline, inline: false }
    )
    .setTimestamp()
    .setFooter({ text: '\u00a9Copyright 2026 embrly.ca' });

  await interaction.reply({ embeds: [embed] });
}
