import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import db from '../../lib/db'
import { emberlyApi } from '../../lib/emberlyApi'
import { ACCENT, links, notLinkedReply, handleApiError } from './_helpers'

export const data = new SlashCommandBuilder()
  .setName('files')
  .setDescription('List your most recently uploaded files on Emberly')
  .setDMPermission(true)
  .addIntegerOption((opt) =>
    opt.setName('count').setDescription('How many files to show (default 5)').setMinValue(1).setMaxValue(10)
  )

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply()
  try {
    const linked = await db.prisma.linkedEmberlyAccount.findUnique({ where: { discordId: interaction.user.id } })
    if (!linked) { await interaction.editReply(notLinkedReply()); return }

    const count = interaction.options.getInteger('count') ?? 5
    const res = await emberlyApi.getFiles(linked.uploadToken, count)
    const files = res.data
    const total = res.pagination?.total ?? files.length

    if (files.length === 0) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(ACCENT)
            .setDescription(`You haven't uploaded any files yet. Upload one from your [dashboard](${links.dashboard}).`),
        ],
      })
      return
    }

    const embed = new EmbedBuilder()
      .setColor(ACCENT)
      .setTitle('📁 Your Recent Files')
      .setDescription(
        files
          .map((f, idx) => {
            const sizeMB = f.size.toFixed(2)
            const ts = Math.floor(new Date(f.uploadedAt).getTime() / 1000)
            const vis = f.visibility === 'PUBLIC' ? '🌐' : '🔒'
            const locked = f.hasPassword ? ' 🔑' : ''
            return (
              `**${idx + 1}.** ${vis} [${f.name}](${links.file(f.urlPath)})${locked}\n` +
              `  \`${sizeMB} MB\` · 👁️ ${f.views} · ⬇️ ${f.downloads} · <t:${ts}:R>`
            )
          })
          .join('\n\n')
      )
      .setFooter({ text: `Showing ${files.length} of ${total.toLocaleString()} · all files at ${links.dashboard}` })
      .setTimestamp()

    await interaction.editReply({ embeds: [embed] })
  } catch (err) {
    await interaction.editReply(handleApiError(err, interaction))
  }
}
