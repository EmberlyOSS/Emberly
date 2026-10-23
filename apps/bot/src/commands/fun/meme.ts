import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('meme')
  .setDescription('Get a random meme quote')
  .setDMPermission(false);

export async function execute(interaction: ChatInputCommandInteraction) {
  const memes = [
    "That's what she said! 😏",
    "I'm not lazy, I'm on energy-saving mode. 💤",
    "404 Error: Motivation not found. 🔍",
    "I put the 'Pro' in procrastination. ⏰",
    "I'm not arguing, I'm just explaining why I'm right. 💬",
    "Ctrl+Alt+Delete your problems. 🖥️",
    "When nothing goes right, go left. ⬅️",
    "I'm not weird, I'm limited edition. ✨",
    "Coffee: Because adulting is hard. ☕",
    "I'm not short, I'm fun-sized! 🎈",
    "Sarcasm is my love language. 💕",
    "I'm not clumsy, the floor just hates me. 🤕",
    "Life is short. Smile while you still have teeth. 😁",
    "I'm on a seafood diet. I see food and I eat it. 🍕",
    "I'm not a complete idiot, some parts are missing. 🧩"
  ];

  const randomMeme = memes[Math.floor(Math.random() * memes.length)];

  const embed = new EmbedBuilder()
    .setColor(0xf97316)
    .setTitle('😂 Random Meme')
    .setDescription(randomMeme)
    .setTimestamp()
    .setFooter({ text: '\u00a9Copyright 2026 embrly.ca' });

  await interaction.reply({ embeds: [embed] });
}
