import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js'
import db from '../../lib/db'
import { emberlyApi } from '../../lib/emberlyApi'
import { ERROR_COLOR } from '../../lib/brand'
import { ACCENT, links, notLinkedReply, handleApiError } from './_helpers'

export const data = new SlashCommandBuilder()
  .setName('shorten')
  .setDescription('Shorten a URL via your Emberly account')
  .setDMPermission(true)
  .addStringOption((opt) =>
    opt.setName('url').setDescription('The URL to shorten').setRequired(true)
  )

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply()
  try {
    const linked = await db.prisma.linkedEmberlyAccount.findUnique({
      where: { discordId: interaction.user.id },
    })
    if (!linked) {
      await interaction.editReply(notLinkedReply())
      return
    }

    const url = interaction.options.getString('url', true).trim()
    if (!/^https?:\/\/\S+$/i.test(url)) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(ERROR_COLOR)
            .setDescription(
              "That doesn't look like a link. Include the `https://` part."
            ),
        ],
      })
      return
    }

    const res = await emberlyApi.shorten(linked.uploadToken, url)
    const { shortCode, targetUrl } = res.data
    const shortUrl = res.data.url ?? links.shortUrl(shortCode)

    const embed = new EmbedBuilder()
      .setColor(ACCENT)
      .setTitle('🔗 URL Shortened')
      .addFields(
        { name: 'Short URL', value: shortUrl, inline: false },
        {
          name: 'Original',
          value:
            targetUrl.length > 100 ? targetUrl.slice(0, 97) + '…' : targetUrl,
          inline: false,
        }
      )
      .setTimestamp()

    await interaction.editReply({ embeds: [embed] })
  } catch (err) {
    await interaction.editReply(handleApiError(err, interaction))
  }
}
