import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import db from '../../lib/db'
import { emberlyApi } from '../../lib/emberlyApi'
import { ACCENT, links, storageBar, clampField, notLinkedReply, handleApiError } from './_helpers'

export const data = new SlashCommandBuilder()
  .setName('squads')
  .setDescription('View the Nexium squads you own or are a member of')
  .setDMPermission(true)

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply()
  try {
    const linked = await db.prisma.linkedEmberlyAccount.findUnique({ where: { discordId: interaction.user.id } })
    if (!linked) { await interaction.editReply(notLinkedReply()); return }

    const res = await emberlyApi.getSquads(linked.uploadToken)
    const squads = res.data.squads

    if (squads.length === 0) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(ACCENT)
            .setDescription(
              `You're not in any Nexium squads yet. Find one on [Discovery](${links.discovery}) or create your own from your [dashboard](${links.squads}).`
            ),
        ],
      })
      return
    }

    const owned = squads.filter((s) => s.myRole === 'OWNER')
    const member = squads.filter((s) => s.myRole !== 'OWNER')

    const embed = new EmbedBuilder().setColor(ACCENT).setTitle('⚔️ Your Nexium Squads')

    if (owned.length > 0) {
      embed.addFields({
        name: '👑 Owned',
        value: clampField(
          owned
            .map((s) => {
              const usedMB = s.storageUsed
              const storage = storageBar(usedMB, s.storageQuotaMB)
              return (
                `**[${s.name}](${links.squad(s.id)})**${s.isVerified ? ' ✅' : ''}\n` +
                `  ${s.tagline ?? 'No tagline'} · ${s._count.members}/${s.maxSize} members\n` +
                `  💾 ${storage}`
              )
            })
            .join('\n\n')
        ),
        inline: false,
      })
    }

    if (member.length > 0) {
      embed.addFields({
        name: '🛡️ Member Of',
        value: clampField(
          member
            .map(
              (s) =>
                `**[${s.name}](${links.squad(s.id)})**${s.isVerified ? ' ✅' : ''} — \`${s.myRole}\`\n` +
                `  ${s.tagline ?? 'No tagline'} · ${s._count.members}/${s.maxSize} members`
            )
            .join('\n\n')
        ),
        inline: false,
      })
    }

    embed.setFooter({ text: `Manage your squads at ${links.squads}` }).setTimestamp()

    await interaction.editReply({ embeds: [embed] })
  } catch (err) {
    await interaction.editReply(handleApiError(err, interaction))
  }
}
