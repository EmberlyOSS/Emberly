import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import db from '../../lib/db'
import { emberlyApi } from '../../lib/emberlyApi'
import { ACCENT, links, storageBar, notLinkedReply, handleApiError } from './_helpers'

export const data = new SlashCommandBuilder()
  .setName('profile')
  .setDescription('View your Emberly profile and account overview')
  .setDMPermission(true)

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply()
  try {
    const linked = await db.prisma.linkedEmberlyAccount.findUnique({ where: { discordId: interaction.user.id } })
    if (!linked) { await interaction.editReply(notLinkedReply()); return }

    const [profileRes, analyticsRes] = await Promise.all([
      emberlyApi.getProfile(linked.uploadToken),
      emberlyApi.getAnalytics(linked.uploadToken),
    ])

    const profile = profileRes.data
    const stats = analyticsRes.basic
    const username = profile.vanityId ?? profile.urlId
    const storageUsedMB = stats.storageUsed
    const avatar = links.asset(profile.image)

    const embed = new EmbedBuilder()
      .setColor(ACCENT)
      .setTitle(`${profile.name ?? username}'s Emberly Profile`)
      .setURL(links.profile(username))
      .addFields(
        { name: '🆔 Username', value: `[${username}](${links.profile(username)})`, inline: true },
        { name: '📅 Member Since', value: `<t:${Math.floor(new Date(profile.createdAt).getTime() / 1000)}:D>`, inline: true },
        { name: '⭐ Plan', value: analyticsRes.plan ?? 'Free', inline: true },
        { name: '📁 Files', value: stats.totalFiles.toLocaleString(), inline: true },
        { name: '🔗 Short URLs', value: stats.totalUrls.toLocaleString(), inline: true },
        { name: '🌐 Domains', value: stats.domainsCount.toLocaleString(), inline: true },
        { name: '💾 Storage', value: storageBar(storageUsedMB, null), inline: false },
      )
      .setTimestamp()
    if (avatar) embed.setThumbnail(avatar)

    await interaction.editReply({ embeds: [embed] })
  } catch (err) {
    await interaction.editReply(handleApiError(err, interaction))
  }
}
