import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import db from '../../lib/db'
import { emberlyApi } from '../../lib/emberlyApi'
import { ACCENT, links, clampField, notLinkedReply, handleApiError } from './_helpers'

export const data = new SlashCommandBuilder()
  .setName('domains')
  .setDescription('List your Emberly custom domains and their verification status')
  .setDMPermission(true)

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply()
  try {
    const linked = await db.prisma.linkedEmberlyAccount.findUnique({ where: { discordId: interaction.user.id } })
    if (!linked) { await interaction.editReply(notLinkedReply()); return }

    const { domains } = await emberlyApi.getDomains(linked.uploadToken)

    if (domains.length === 0) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(ACCENT)
            .setDescription(`No custom domains yet. Add one from your [dashboard](${links.domains}).`),
        ],
      })
      return
    }

    const embed = new EmbedBuilder()
      .setColor(ACCENT)
      .setTitle('🌐 Your Custom Domains')
      .setDescription(
        clampField(
          domains
            .map((d) => {
              const status = d.verified ? '✅ Verified' : `⏳ Pending (${d.cfStatus ?? 'propagating'})`
              const primary = d.isPrimary ? ' ⭐ Primary' : ''
              return `**${d.domain}**${primary}\n  ${status}`
            })
            .join('\n\n'),
          4096
        )
      )
      .setFooter({ text: `Manage at ${links.domains}` })
      .setTimestamp()

    await interaction.editReply({ embeds: [embed] })
  } catch (err) {
    await interaction.editReply(handleApiError(err, interaction))
  }
}
