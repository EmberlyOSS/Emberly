package main

import (
	"context"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"github.com/bwmarrin/discordgo"
)

func ptr[T any](v T) *T { return &v }

var (
	permManageMessages = int64(discordgo.PermissionManageMessages)
	permModerate       = int64(discordgo.PermissionModerateMembers)
	permKick           = int64(discordgo.PermissionKickMembers)
	permBan            = int64(discordgo.PermissionBanMembers)
)

func userOption(description string) *discordgo.ApplicationCommandOption {
	return &discordgo.ApplicationCommandOption{
		Type: discordgo.ApplicationCommandOptionUser, Name: "user", Description: description, Required: true,
	}
}

func reasonOption(required bool) *discordgo.ApplicationCommandOption {
	return &discordgo.ApplicationCommandOption{
		Type: discordgo.ApplicationCommandOptionString, Name: "reason", Description: "Why (shown in the mod log)",
		Required: required, MaxLength: 400,
	}
}

var commandDefinitions = []*discordgo.ApplicationCommand{
	{
		Name:        "docs",
		Description: "Link a Emberly docs page",
		Options: []*discordgo.ApplicationCommandOption{
			{Type: discordgo.ApplicationCommandOptionString, Name: "topic", Description: "What the docs page is about", Autocomplete: true},
			{Type: discordgo.ApplicationCommandOptionUser, Name: "for", Description: "Mention someone with the answer"},
		},
	},
	{
		Name:        "faq",
		Description: "Answer a common question",
		Options: []*discordgo.ApplicationCommandOption{
			{Type: discordgo.ApplicationCommandOptionString, Name: "question", Description: "Pick a question", Required: true, Autocomplete: true},
			{Type: discordgo.ApplicationCommandOptionUser, Name: "for", Description: "Mention someone with the answer"},
		},
	},
	{Name: "status", Description: "Current Emberly platform status"},
	{Name: "links", Description: "Useful Emberly links"},
	{Name: "roles", Description: "Get server roles based on your Emberly account"},
	{
		Name: "purge", Description: "Delete recent messages in this channel",
		DefaultMemberPermissions: &permManageMessages, DMPermission: ptr(false),
		Options: []*discordgo.ApplicationCommandOption{
			{Type: discordgo.ApplicationCommandOptionInteger, Name: "amount", Description: "How many messages to scan (1-100)", Required: true, MinValue: ptr(1.0), MaxValue: 100},
			{Type: discordgo.ApplicationCommandOptionUser, Name: "user", Description: "Only delete this user's messages"},
		},
	},
	{
		Name: "warn", Description: "Warn a member by DM and record it in the mod log",
		DefaultMemberPermissions: &permModerate, DMPermission: ptr(false),
		Options: []*discordgo.ApplicationCommandOption{userOption("Member to warn"), reasonOption(true)},
	},
	{
		Name: "timeout", Description: "Time a member out",
		DefaultMemberPermissions: &permModerate, DMPermission: ptr(false),
		Options: []*discordgo.ApplicationCommandOption{
			userOption("Member to time out"),
			{
				Type: discordgo.ApplicationCommandOptionString, Name: "duration", Description: "How long", Required: true,
				Choices: []*discordgo.ApplicationCommandOptionChoice{
					{Name: "10 minutes", Value: "10m"}, {Name: "1 hour", Value: "1h"}, {Name: "6 hours", Value: "6h"},
					{Name: "1 day", Value: "24h"}, {Name: "1 week", Value: "168h"},
				},
			},
			reasonOption(false),
		},
	},
	{
		Name: "untimeout", Description: "Remove a member's timeout",
		DefaultMemberPermissions: &permModerate, DMPermission: ptr(false),
		Options: []*discordgo.ApplicationCommandOption{userOption("Member to release"), reasonOption(false)},
	},
	{
		Name: "kick", Description: "Kick a member",
		DefaultMemberPermissions: &permKick, DMPermission: ptr(false),
		Options: []*discordgo.ApplicationCommandOption{userOption("Member to kick"), reasonOption(true)},
	},
	{
		Name: "ban", Description: "Ban a member",
		DefaultMemberPermissions: &permBan, DMPermission: ptr(false),
		Options: []*discordgo.ApplicationCommandOption{
			userOption("Member to ban"),
			reasonOption(true),
			{Type: discordgo.ApplicationCommandOptionInteger, Name: "delete_days", Description: "Delete their messages from the last N days (0-7)", MinValue: ptr(0.0), MaxValue: 7},
		},
	},
}

func (b *Bot) onInteraction(s *discordgo.Session, i *discordgo.InteractionCreate) {
	switch i.Type {
	case discordgo.InteractionApplicationCommandAutocomplete:
		b.autocomplete(s, i)
	case discordgo.InteractionApplicationCommand:
		data := i.ApplicationCommandData()
		handlers := map[string]func(*discordgo.Session, *discordgo.InteractionCreate, options){
			"docs": b.cmdDocs, "faq": b.cmdFAQ, "status": b.cmdStatus, "links": b.cmdLinks, "roles": b.cmdRoles,
			"purge": b.cmdPurge, "warn": b.cmdWarn, "timeout": b.cmdTimeout, "untimeout": b.cmdUntimeout,
			"kick": b.cmdKick, "ban": b.cmdBan,
		}
		if handler, ok := handlers[data.Name]; ok {
			handler(s, i, optionMap(data.Options))
		}
	}
}

type options map[string]*discordgo.ApplicationCommandInteractionDataOption

func optionMap(list []*discordgo.ApplicationCommandInteractionDataOption) options {
	m := options{}
	for _, option := range list {
		m[option.Name] = option
	}
	return m
}

func (o options) str(name string) string {
	if option, ok := o[name]; ok {
		return option.StringValue()
	}
	return ""
}

func (o options) int(name string, fallback int64) int64 {
	if option, ok := o[name]; ok {
		return option.IntValue()
	}
	return fallback
}

func (o options) user(s *discordgo.Session, name string) *discordgo.User {
	if option, ok := o[name]; ok {
		return option.UserValue(s)
	}
	return nil
}

func (b *Bot) autocomplete(s *discordgo.Session, i *discordgo.InteractionCreate) {
	data := i.ApplicationCommandData()
	var query string
	for _, option := range data.Options {
		if option.Focused {
			query = option.StringValue()
		}
	}

	var all []choice
	switch data.Name {
	case "docs":
		for _, page := range docPages {
			all = append(all, choice{page.Title, page.Key})
		}
	case "faq":
		for _, faq := range faqs {
			all = append(all, choice{faq.Question, faq.Key})
		}
	}

	ranked := rankChoices(all, query)
	choices := make([]*discordgo.ApplicationCommandOptionChoice, len(ranked))
	for idx, c := range ranked {
		choices[idx] = &discordgo.ApplicationCommandOptionChoice{Name: c.Name, Value: c.Value}
	}
	if err := s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionApplicationCommandAutocompleteResult,
		Data: &discordgo.InteractionResponseData{Choices: choices},
	}); err != nil {
		slog.Warn("autocomplete failed", "err", err)
	}
}

func respond(s *discordgo.Session, i *discordgo.InteractionCreate, content string, embed *discordgo.MessageEmbed, ephemeral bool) {
	data := &discordgo.InteractionResponseData{Content: content}
	if embed != nil {
		data.Embeds = []*discordgo.MessageEmbed{embed}
	}
	if ephemeral {
		data.Flags = discordgo.MessageFlagsEphemeral
	}
	// Only ping users mentioned in the content, never roles or @everyone.
	data.AllowedMentions = &discordgo.MessageAllowedMentions{Parse: []discordgo.AllowedMentionType{discordgo.AllowedMentionTypeUsers}}
	if err := s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseChannelMessageWithSource, Data: data,
	}); err != nil {
		slog.Warn("interaction response failed", "err", err)
	}
}

func respondError(s *discordgo.Session, i *discordgo.InteractionCreate, message string) {
	respond(s, i, "", &discordgo.MessageEmbed{Description: "❌ " + message, Color: dangerColor}, true)
}

func mentionFor(o options, s *discordgo.Session) string {
	if user := o.user(s, "for"); user != nil {
		return user.Mention()
	}
	return ""
}

func docsField(keys []string) *discordgo.MessageEmbedField {
	var lines []string
	for _, key := range keys {
		if page, ok := findDoc(key); ok {
			lines = append(lines, fmt.Sprintf("[%s](%s)", page.Title, page.URL()))
		}
	}
	if len(lines) == 0 {
		return nil
	}
	return &discordgo.MessageEmbedField{Name: "Read more", Value: strings.Join(lines, " · ")}
}

func faqEmbed(faq FAQ) *discordgo.MessageEmbed {
	embed := &discordgo.MessageEmbed{Title: faq.Question, Description: faq.Answer, Color: brandColor}
	if field := docsField(faq.Docs); field != nil {
		embed.Fields = []*discordgo.MessageEmbedField{field}
	}
	return embed
}

func (b *Bot) cmdDocs(s *discordgo.Session, i *discordgo.InteractionCreate, o options) {
	key := o.str("topic")
	if key == "" {
		var lines []string
		for _, k := range []string{"getting-started", "quickstart", "files", "custom-domains", "sharex", "squads", "discord-bot", "api", "self-hosting"} {
			page, _ := findDoc(k)
			lines = append(lines, fmt.Sprintf("• [%s](%s): %s", page.Title, page.URL(), page.Blurb))
		}
		respond(s, i, mentionFor(o, s), &discordgo.MessageEmbed{
			Title: b.emoji("ember_link", "📚") + " Emberly documentation", URL: docsURL, Color: brandColor,
			Description: strings.Join(lines, "\n") + "\n\nUse `/docs topic:` to link a specific page.",
		}, false)
		return
	}
	page, ok := findDoc(key)
	if !ok {
		respondError(s, i, "No docs page matches that. Pick one from the list as you type.")
		return
	}
	respond(s, i, mentionFor(o, s), &discordgo.MessageEmbed{
		Title: b.emoji("ember_link", "📚") + " " + page.Title, URL: page.URL(), Description: page.Blurb + "\n\n" + page.URL(), Color: brandColor,
	}, false)
}

func (b *Bot) cmdFAQ(s *discordgo.Session, i *discordgo.InteractionCreate, o options) {
	faq, ok := findFAQ(o.str("question"))
	if !ok {
		respondError(s, i, "No FAQ matches that. Pick one from the list as you type.")
		return
	}
	embed := faqEmbed(faq)
	embed.Title = b.emoji("ember", "💬") + " " + faq.Question
	respond(s, i, mentionFor(o, s), embed, false)
}

func (b *Bot) cmdStatus(s *discordgo.Session, i *discordgo.InteractionCreate, _ options) {
	ctx, cancel := context.WithTimeout(context.Background(), 2500*time.Millisecond)
	defer cancel()
	summary, err := fetchStatus(ctx, b.cfg.StatusAPIURL)
	if err != nil {
		respond(s, i, "", &discordgo.MessageEmbed{
			Title: "Emberly status", URL: statusURL, Color: warningColor,
			Description: "Couldn't reach the status page just now. Check " + statusURL,
		}, false)
		return
	}

	if err := s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseChannelMessageWithSource,
		Data: &discordgo.InteractionResponseData{
			Embeds:     []*discordgo.MessageEmbed{b.statusEmbed(summary)},
			Components: statusButtons(),
		},
	}); err != nil {
		slog.Warn("status response failed", "err", err)
	}
}

func (b *Bot) cmdLinks(s *discordgo.Session, i *discordgo.InteractionCreate, _ options) {
	respond(s, i, "", &discordgo.MessageEmbed{
		Title: b.emoji("ember", "🔥") + " Emberly links", Color: brandColor,
		Description: strings.Join([]string{
			"🏠 **Website & dashboard:** " + siteURL,
			"📚 **Docs:** " + docsURL,
			"📈 **Status:** " + statusURL,
			"💳 **Pricing:** " + pricingURL,
			"📝 **Changelog:** " + siteURL + "/changelogs",
			"💻 **GitHub:** " + githubURL,
			"✉️ **Support email:** " + supportEmail,
			"🔐 **Report a vulnerability:** " + githubURL + "/security/advisories/new",
		}, "\n"),
	}, false)
}

func truncate(text string, max int) string {
	if len(text) <= max {
		return text
	}
	return text[:max-1] + "…"
}
