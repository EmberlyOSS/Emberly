import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import db from '../../lib/db'
import { emberlyApi } from '../../lib/emberlyApi'
import { ACCENT, SITE, storageBar, notLinkedReply, handleApiError } from './_helpers'

export const data = new SlashCommandBuilder()
  .setName('analytics')
  .setDescription('View your Emberly upload and sharing analytics')
  .setDMPermission(true)

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply()
  try {
    const linked = await db.prisma.linkedEmberlyAccount.findUnique({ where: { discordId: interaction.user.id } })
    if (!linked) { await interaction.editReply(notLinkedReply()); return }

    const res = await emberlyApi.getAnalytics(linked.uploadToken)
    const d = res
    const storageUsedMB = d.basic.storageUsed

    const recentList =
      d.recentUploads && d.recentUploads.length > 0
        ? d.recentUploads.map((f) => `• ${f.name} — ${f.views.toLocaleString()} views`).join('\n')
        : 'No files yet.'

    const embed = new EmbedBuilder()
      .setColor(ACCENT)
      .setTitle('📊 Your Emberly Analytics')
      .addFields(
        { name: '📁 Total Files', value: d.basic.totalFiles.toLocaleString(), inline: true },
        { name: '👁️ Total Views', value: d.basic.totalViews.toLocaleString(), inline: true },
        { name: '⬇️ Total Downloads', value: d.basic.totalDownloads.toLocaleString(), inline: true },
        { name: '🔗 Short URLs', value: d.basic.totalUrls.toLocaleString(), inline: true },
        { name: '🖱️ URL Clicks', value: d.basic.totalUrlClicks.toLocaleString(), inline: true },
        { name: '🌐 Domains', value: `${d.basic.verifiedDomains}/${d.basic.domainsCount} verified`, inline: true },
        { name: '💾 Storage', value: storageBar(storageUsedMB, null), inline: false },
        { name: '🕒 Recent Uploads', value: recentList, inline: false },
      )
      .setTimestamp()

    await interaction.editReply({ embeds: [embed] })
  } catch (err) {
    await interaction.editReply(handleApiError(err, interaction))
  }
}
