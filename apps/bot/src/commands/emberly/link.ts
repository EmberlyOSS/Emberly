import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags, SlashCommandBuilder } from 'discord.js'
import db from '../../lib/db'
import { emberlyApi, EmberlyAuthError } from '../../lib/emberlyApi'
import { ERROR_COLOR } from '../../lib/brand'
import { ACCENT, links, handleApiError } from './_helpers'

export const data = new SlashCommandBuilder()
  .setName('link')
  .setDescription('Link your Emberly account to Discord using your upload token')
  .setDMPermission(true)
  .addStringOption((opt) =>
    opt
      .setName('token')
      .setDescription('Your Emberly upload token (Profile → Uploads on the site)')
      .setRequired(true)
  )

export async function execute(interaction: ChatInputCommandInteraction) {
  // Always ephemeral — token must never appear in public channels
  await interaction.deferReply({ flags: MessageFlags.Ephemeral })

  const token = interaction.options.getString('token', true).trim()

  // Validate the token against the live API before storing
  let profile: Awaited<ReturnType<typeof emberlyApi.validateToken>>
  try {
    profile = await emberlyApi.validateToken(token)
  } catch (err) {
    // Only a rejected token is the user's mistake; outages get the usual error
    if (!(err instanceof EmberlyAuthError)) {
      await interaction.editReply(handleApiError(err, interaction))
      return
    }
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(ERROR_COLOR)
          .setTitle('Invalid token')
          .setDescription(
            `Emberly didn't accept that token. Copy it again from the **[Uploads tab](${links.uploadSettings})** on your profile. ` +
              'If you regenerated it recently, use the new one.'
          ),
      ],
    })
    return
  }

  const username = profile.data.vanityId ?? profile.data.urlId

  await db.prisma.linkedEmberlyAccount.upsert({
    where: { discordId: interaction.user.id },
    update: { uploadToken: token, linkedAt: new Date() },
    create: { discordId: interaction.user.id, uploadToken: token },
  })

  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(ACCENT)
        .setTitle('Account linked!')
        .setDescription(
          `Successfully linked to **[${username}](${links.profile(username)})**.\n\n` +
            'You can now use `/profile`, `/analytics`, `/files`, `/domains`, `/shorten`, `/sharex`, and `/squads`.\n\n' +
            '> Run `/unlink` at any time to remove the connection.'
        ),
    ],
  })
}
