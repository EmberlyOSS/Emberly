package main

import (
	"log/slog"

	"github.com/bwmarrin/discordgo"
)

// cmdRoles explains linked roles. The roles themselves belong to the Emberly app (the public bot):
// it registers the requirements with Discord, and embrly.ca runs the connect flow.
func (b *Bot) cmdRoles(s *discordgo.Session, i *discordgo.InteractionCreate, _ options) {
	embed := &discordgo.MessageEmbed{
		Title: b.emoji("ember_check", "✅") + " Get your Emberly roles",
		Color: brandColor,
		Description: "Connect your Emberly account to unlock roles based on how you use Emberly.\n\n" +
			"1. Press **Connect Emberly** and sign in to Emberly\n" +
			"2. Authorize Discord\n" +
			"3. Open the server menu → **Linked Roles** and claim the roles you qualify for\n\n" +
			"Roles reflect your account when you connect. Connect again any time to refresh them.",
		Fields: []*discordgo.MessageEmbedField{
			{Name: "What roles can check", Value: "• You have an Emberly account\n• Files you've uploaded\n• How long you've been on Emberly"},
		},
	}
	if err := s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseChannelMessageWithSource,
		Data: &discordgo.InteractionResponseData{
			Embeds: []*discordgo.MessageEmbed{embed},
			Flags:  discordgo.MessageFlagsEphemeral,
			Components: []discordgo.MessageComponent{discordgo.ActionsRow{Components: []discordgo.MessageComponent{
				discordgo.Button{Style: discordgo.LinkButton, Label: "Connect Emberly", URL: linkedRolesURL},
			}}},
		},
	}); err != nil {
		slog.Warn("roles response failed", "err", err)
	}
}
