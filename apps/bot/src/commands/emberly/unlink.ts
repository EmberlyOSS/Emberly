import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags, SlashCommandBuilder } from 'discord.js'
import db from '../../lib/db'
import { ACCENT } from './_helpers'

export const data = new SlashCommandBuilder()
  .setName('unlink')
  .setDescription('Unlink your Emberly account from Discord')
  .setDMPermission(true)

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral })

  const existing = await db.prisma.linkedEmberlyAccount.findUnique({
    where: { discordId: interaction.user.id },
  })

  if (!existing) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xff5555)
          .setTitle('Not linked')
          .setDescription("You don't have an Emberly account linked to this Discord account."),
      ],
    })
    return
  }

  await db.prisma.linkedEmberlyAccount.delete({ where: { discordId: interaction.user.id } })

  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(ACCENT)
        .setTitle('Account unlinked')
        .setDescription(
          'Your Emberly account has been disconnected. Run `/link` to reconnect.'
        ),
    ],
  })
}
