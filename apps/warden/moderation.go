package main

import (
	"fmt"
	"log/slog"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/bwmarrin/discordgo"
)

const (
	massMentionLimit   = 5
	spamRepeatLimit    = 4
	spamWindow         = 10 * time.Second
	autoTimeout        = 10 * time.Minute
	faqCooldown        = 10 * time.Minute
	bulkDeleteMaxAge   = 14 * 24 * time.Hour
	faqMinMessageChars = 12
)

var inviteRe = regexp.MustCompile(`(?i)(?:discord\.gg|discord(?:app)?\.com/invite)/([a-z0-9-]+)`)

// spamTracker remembers each user's recent messages to catch the same text posted repeatedly.
type spamTracker struct {
	mu     sync.Mutex
	recent map[string][]spamEntry
}

type spamEntry struct {
	content string
	at      time.Time
	id      string
	channel string
}

func newSpamTracker() *spamTracker { return &spamTracker{recent: map[string][]spamEntry{}} }

// record adds a message and returns the matching recent messages once the user has repeated it
// spamRepeatLimit times inside spamWindow.
func (t *spamTracker) record(userID string, m *discordgo.Message) []spamEntry {
	t.mu.Lock()
	defer t.mu.Unlock()
	now := time.Now()
	normalized := strings.ToLower(strings.TrimSpace(m.Content))

	kept := t.recent[userID][:0]
	for _, entry := range t.recent[userID] {
		if now.Sub(entry.at) < spamWindow {
			kept = append(kept, entry)
		}
	}
	kept = append(kept, spamEntry{normalized, now, m.ID, m.ChannelID})
	t.recent[userID] = kept

	var same []spamEntry
	for _, entry := range kept {
		if entry.content == normalized && normalized != "" {
			same = append(same, entry)
		}
	}
	if len(same) >= spamRepeatLimit {
		delete(t.recent, userID)
		return same
	}
	return nil
}

type cooldowns struct {
	mu    sync.Mutex
	until map[string]time.Time
}

func newCooldowns() *cooldowns { return &cooldowns{until: map[string]time.Time{}} }

// ready reports whether key is off cooldown and, if so, starts a new cooldown of d.
func (c *cooldowns) ready(key string, d time.Duration) bool {
	c.mu.Lock()
	defer c.mu.Unlock()
	if time.Now().Before(c.until[key]) {
		return false
	}
	c.until[key] = time.Now().Add(d)
	return true
}

func (b *Bot) isStaff(s *discordgo.Session, m *discordgo.Message) bool {
	perms, err := s.State.MessagePermissions(m)
	if err != nil {
		// Without cached roles we can't tell, so err on the side of not moderating.
		return true
	}
	return perms&(discordgo.PermissionManageMessages|discordgo.PermissionAdministrator) != 0
}

func (b *Bot) onMessage(s *discordgo.Session, m *discordgo.MessageCreate) {
	if m.Author == nil || m.Author.Bot || m.GuildID == "" {
		return
	}
	if b.isStaff(s, m.Message) {
		return
	}
	if b.automod(s, m.Message) {
		return
	}
	b.autoAnswer(s, m.Message)
}

// automod handles the message and returns true when it removed it.
func (b *Bot) automod(s *discordgo.Session, m *discordgo.Message) bool {
	if domain, ok := maliciousLink(m.Content); ok {
		b.deleteQuietly(s, m.ChannelID, m.ID)
		b.timeoutQuietly(s, m.GuildID, m.Author.ID, autoTimeout, "AutoMod: malicious link")
		b.notice(s, m.ChannelID, fmt.Sprintf("%s that link is on our list of scam and malware sites, so it was removed. You've been timed out for 10 minutes.", m.Author.Mention()))
		b.modLog(s, "Malicious link removed", dangerColor, m.Author, "AutoMod", fmt.Sprintf("Linked `%s` in <#%s>, timed out for 10 minutes:\n>>> %s", domain, m.ChannelID, truncate(m.Content, 800)))
		return true
	}

	for _, match := range inviteRe.FindAllStringSubmatch(m.Content, -1) {
		if b.cfg.AllowedInviteCodes[match[1]] {
			continue
		}
		b.deleteQuietly(s, m.ChannelID, m.ID)
		b.notice(s, m.ChannelID, fmt.Sprintf("%s invite links to other servers aren't allowed here.", m.Author.Mention()))
		b.modLog(s, "Invite link removed", dangerColor, m.Author, "AutoMod", fmt.Sprintf("In <#%s>:\n>>> %s", m.ChannelID, truncate(m.Content, 900)))
		return true
	}

	if m.MentionEveryone || len(m.Mentions) >= massMentionLimit {
		b.deleteQuietly(s, m.ChannelID, m.ID)
		b.timeoutQuietly(s, m.GuildID, m.Author.ID, autoTimeout, "AutoMod: mass mentions")
		b.notice(s, m.ChannelID, fmt.Sprintf("%s please don't mass-mention. You've been timed out for 10 minutes.", m.Author.Mention()))
		b.modLog(s, "Mass mention", dangerColor, m.Author, "AutoMod", fmt.Sprintf("%d mentions in <#%s>, timed out for 10 minutes", len(m.Mentions), m.ChannelID))
		return true
	}

	if repeats := b.spam.record(m.Author.ID, m); repeats != nil {
		for _, entry := range repeats {
			b.deleteQuietly(s, entry.channel, entry.id)
		}
		b.timeoutQuietly(s, m.GuildID, m.Author.ID, autoTimeout, "AutoMod: repeated messages")
		b.notice(s, m.ChannelID, fmt.Sprintf("%s slow down. You've been timed out for 10 minutes for repeating messages.", m.Author.Mention()))
		b.modLog(s, "Spam", dangerColor, m.Author, "AutoMod", fmt.Sprintf("Sent the same message %d times in %s, timed out for 10 minutes:\n>>> %s", len(repeats), spamWindow, truncate(m.Content, 600)))
		return true
	}
	return false
}

// autoAnswer replies with a matching FAQ in configured support channels, at most once per FAQ per
// channel every faqCooldown so a busy channel doesn't get the same answer repeatedly.
func (b *Bot) autoAnswer(s *discordgo.Session, m *discordgo.Message) {
	if !b.cfg.SupportChannelIDs[m.ChannelID] && !b.cfg.SupportChannelIDs[parentChannel(s, m.ChannelID)] {
		return
	}
	if len(m.Content) < faqMinMessageChars {
		return
	}
	faq, ok := matchFAQ(m.Content)
	if !ok || !b.cooldown.ready(m.ChannelID+":"+faq.Key, faqCooldown) {
		return
	}

	embed := faqEmbed(faq)
	embed.Title = b.emoji("ember_sparkles", "📬") + " " + faq.Question
	embed.Footer = &discordgo.MessageEmbedFooter{Text: "Automatic answer · if this doesn't help, the team will follow up"}
	_, err := s.ChannelMessageSendComplex(m.ChannelID, &discordgo.MessageSend{
		Embeds:          []*discordgo.MessageEmbed{embed},
		Reference:       m.Reference(),
		AllowedMentions: &discordgo.MessageAllowedMentions{},
	})
	if err != nil {
		slog.Warn("auto-answer failed", "err", err)
	}
}

// parentChannel returns the parent of a thread or forum post, so configuring a forum channel as a
// support channel covers every post in it.
func parentChannel(s *discordgo.Session, channelID string) string {
	if channel, err := s.State.Channel(channelID); err == nil {
		return channel.ParentID
	}
	return ""
}

func (b *Bot) deleteQuietly(s *discordgo.Session, channelID, messageID string) {
	b.expectations.expect("delete:" + messageID)
	if err := s.ChannelMessageDelete(channelID, messageID); err != nil {
		slog.Warn("could not delete message", "err", err)
	}
}

func (b *Bot) timeoutQuietly(s *discordgo.Session, guildID, userID string, d time.Duration, reason string) {
	until := time.Now().Add(d)
	b.expectations.expect("timeout:" + userID)
	if err := s.GuildMemberTimeout(guildID, userID, &until, discordgo.WithAuditLogReason(reason)); err != nil {
		slog.Warn("could not time out member", "err", err)
	}
}

// notice posts a short public message that removes itself, so AutoMod doesn't clutter channels.
func (b *Bot) notice(s *discordgo.Session, channelID, text string) {
	msg, err := s.ChannelMessageSendComplex(channelID, &discordgo.MessageSend{
		Content:         b.emoji("ember_warning", "⚠️") + " " + text,
		AllowedMentions: &discordgo.MessageAllowedMentions{Parse: []discordgo.AllowedMentionType{discordgo.AllowedMentionTypeUsers}},
	})
	if err != nil {
		return
	}
	time.AfterFunc(15*time.Second, func() { _ = s.ChannelMessageDelete(channelID, msg.ID) })
}

func (b *Bot) modLog(s *discordgo.Session, action string, color int, target *discordgo.User, moderator, details string) {
	if b.cfg.ModLogChannelID == "" {
		return
	}
	embed := &discordgo.MessageEmbed{
		Title:       action,
		Color:       color,
		Description: details,
		Timestamp:   time.Now().Format(time.RFC3339),
		Fields: []*discordgo.MessageEmbedField{
			{Name: "Member", Value: fmt.Sprintf("%s (`%s`)", target.Mention(), target.ID), Inline: true},
			{Name: "By", Value: moderator, Inline: true},
		},
	}
	if _, err := s.ChannelMessageSendEmbed(b.cfg.ModLogChannelID, embed); err != nil {
		slog.Warn("could not write to mod log", "err", err)
	}
}

func moderatorName(i *discordgo.InteractionCreate) string {
	if i.Member != nil && i.Member.User != nil {
		return i.Member.User.Mention()
	}
	return "unknown"
}

func (b *Bot) cmdPurge(s *discordgo.Session, i *discordgo.InteractionCreate, o options) {
	amount := int(o.int("amount", 10))
	target := o.user(s, "user")

	messages, err := s.ChannelMessages(i.ChannelID, amount, "", "", "")
	if err != nil {
		respondError(s, i, "Couldn't read this channel's messages.")
		return
	}
	var ids []string
	for _, message := range messages {
		if target != nil && message.Author.ID != target.ID {
			continue
		}
		// Discord's bulk delete rejects anything older than 14 days.
		if time.Since(message.Timestamp) < bulkDeleteMaxAge {
			ids = append(ids, message.ID)
		}
	}

	switch len(ids) {
	case 0:
		respondError(s, i, "Nothing to delete (messages older than 14 days can't be bulk deleted).")
		return
	case 1:
		b.expectations.expect("delete:" + ids[0])
		err = s.ChannelMessageDelete(i.ChannelID, ids[0])
	default:
		b.expectations.expect("bulk:" + i.ChannelID)
		err = s.ChannelMessagesBulkDelete(i.ChannelID, ids)
	}
	if err != nil {
		respondError(s, i, "Discord refused the delete: "+err.Error())
		return
	}

	respond(s, i, fmt.Sprintf("%s Deleted %d message(s).", b.emoji("ember_check", "✅"), len(ids)), nil, true)
	subject := i.Member.User
	if target != nil {
		subject = target
	}
	b.modLog(s, "Messages purged", warningColor, subject, moderatorName(i), fmt.Sprintf("Deleted %d message(s) in <#%s>", len(ids), i.ChannelID))
}

func (b *Bot) cmdWarn(s *discordgo.Session, i *discordgo.InteractionCreate, o options) {
	user, reason := o.user(s, "user"), o.str("reason")
	if block := b.moderationBlock(s, i, user); block != "" {
		respondError(s, i, block)
		return
	}
	dmSent := b.dm(s, user.ID, &discordgo.MessageEmbed{
		Title:       b.emoji("ember_warning", "⚠️") + " You received a warning in the Emberly server",
		Description: "**Reason:** " + reason + "\n\nPlease review the server rules. Further issues may lead to a timeout or ban.",
		Color:       warningColor,
	})
	note := ""
	if !dmSent {
		note = " Their DMs are closed, so they weren't notified."
	}
	respond(s, i, fmt.Sprintf("%s Warned %s.%s", b.emoji("ember_check", "✅"), user.Mention(), note), nil, true)
	b.modLog(s, "Warning", warningColor, user, moderatorName(i), "**Reason:** "+reason)
}

func (b *Bot) cmdTimeout(s *discordgo.Session, i *discordgo.InteractionCreate, o options) {
	user, reason := o.user(s, "user"), reasonOr(o.str("reason"))
	if block := b.moderationBlock(s, i, user); block != "" {
		respondError(s, i, block)
		return
	}
	d, err := time.ParseDuration(o.str("duration"))
	if err != nil {
		respondError(s, i, "Pick a duration from the list.")
		return
	}
	until := time.Now().Add(d)
	b.expectations.expect("timeout:" + user.ID)
	if err := s.GuildMemberTimeout(i.GuildID, user.ID, &until, discordgo.WithAuditLogReason(reason)); err != nil {
		respondError(s, i, "Couldn't time them out: "+err.Error())
		return
	}
	respond(s, i, fmt.Sprintf("%s Timed out %s until <t:%d:f>.", b.emoji("ember_check", "✅"), user.Mention(), until.Unix()), nil, true)
	b.modLog(s, "Timeout", warningColor, user, moderatorName(i), fmt.Sprintf("**Duration:** %s\n**Reason:** %s", d, reason))
}

func (b *Bot) cmdUntimeout(s *discordgo.Session, i *discordgo.InteractionCreate, o options) {
	user, reason := o.user(s, "user"), reasonOr(o.str("reason"))
	if block := b.moderationBlock(s, i, user); block != "" {
		respondError(s, i, block)
		return
	}
	b.expectations.expect("timeout:" + user.ID)
	if err := s.GuildMemberTimeout(i.GuildID, user.ID, nil, discordgo.WithAuditLogReason(reason)); err != nil {
		respondError(s, i, "Couldn't remove the timeout: "+err.Error())
		return
	}
	respond(s, i, fmt.Sprintf("%s Removed %s's timeout.", b.emoji("ember_check", "✅"), user.Mention()), nil, true)
	b.modLog(s, "Timeout removed", successColor, user, moderatorName(i), "**Reason:** "+reason)
}

func (b *Bot) cmdKick(s *discordgo.Session, i *discordgo.InteractionCreate, o options) {
	user, reason := o.user(s, "user"), o.str("reason")
	if block := b.moderationBlock(s, i, user); block != "" {
		respondError(s, i, block)
		return
	}
	b.dm(s, user.ID, &discordgo.MessageEmbed{Title: "You were kicked from the Emberly server", Description: "**Reason:** " + reason, Color: dangerColor})
	b.expectations.expect("leave:" + user.ID)
	if err := s.GuildMemberDeleteWithReason(i.GuildID, user.ID, reason); err != nil {
		respondError(s, i, "Couldn't kick them: "+err.Error())
		return
	}
	respond(s, i, fmt.Sprintf("%s Kicked %s.", b.emoji("ember_check", "✅"), user.Mention()), nil, true)
	b.modLog(s, "Kick", dangerColor, user, moderatorName(i), "**Reason:** "+reason)
}

func (b *Bot) cmdBan(s *discordgo.Session, i *discordgo.InteractionCreate, o options) {
	user, reason, days := o.user(s, "user"), o.str("reason"), int(o.int("delete_days", 0))
	if block := b.moderationBlock(s, i, user); block != "" {
		respondError(s, i, block)
		return
	}
	b.dm(s, user.ID, &discordgo.MessageEmbed{Title: "You were banned from the Emberly server", Description: "**Reason:** " + reason, Color: dangerColor})
	b.expectations.expect("ban:" + user.ID)
	b.expectations.expect("leave:" + user.ID)
	if err := s.GuildBanCreateWithReason(i.GuildID, user.ID, reason, days); err != nil {
		respondError(s, i, "Couldn't ban them: "+err.Error())
		return
	}
	respond(s, i, fmt.Sprintf("%s Banned %s.", b.emoji("ember_check", "✅"), user.Mention()), nil, true)
	b.modLog(s, "Ban", dangerColor, user, moderatorName(i), fmt.Sprintf("**Reason:** %s\n**Deleted messages from:** last %d day(s)", reason, days))
}

// dm sends a direct message and reports whether it was delivered (users can close their DMs).
func (b *Bot) dm(s *discordgo.Session, userID string, embed *discordgo.MessageEmbed) bool {
	channel, err := s.UserChannelCreate(userID)
	if err != nil {
		return false
	}
	_, err = s.ChannelMessageSendEmbed(channel.ID, embed)
	return err == nil
}

func reasonOr(reason string) string {
	if reason == "" {
		return "No reason given"
	}
	return reason
}

// highestRolePosition returns the position of the highest role in roleIDs (0 for @everyone only).
func highestRolePosition(guildRoles []*discordgo.Role, roleIDs []string) int {
	held := make(map[string]bool, len(roleIDs))
	for _, id := range roleIDs {
		held[id] = true
	}
	highest := 0
	for _, role := range guildRoles {
		if held[role.ID] && role.Position > highest {
			highest = role.Position
		}
	}
	return highest
}

// moderationBlock explains why the invoking moderator may not act on target, or returns "" when
// they may. Discord only checks the bot's own role, so without this a Moderator could use the bot
// to act on an Admin.
func (b *Bot) moderationBlock(s *discordgo.Session, i *discordgo.InteractionCreate, target *discordgo.User) string {
	if i.Member == nil || i.Member.User == nil {
		return "This command only works in the server."
	}
	if target.ID == i.Member.User.ID {
		return "You can't use this on yourself."
	}
	if target.ID == s.State.User.ID {
		return "I can't use this on myself."
	}

	guild, err := s.State.Guild(i.GuildID)
	if err != nil {
		if guild, err = s.Guild(i.GuildID); err != nil {
			return "Couldn't check the server's roles, try again in a moment."
		}
	}
	if target.ID == guild.OwnerID {
		return "That's the server owner."
	}
	if i.Member.User.ID == guild.OwnerID {
		return ""
	}

	member, err := s.GuildMember(i.GuildID, target.ID)
	if err != nil {
		// Not in the server (e.g. banning someone who already left): no roles to compare.
		return ""
	}
	if highestRolePosition(guild.Roles, member.Roles) >= highestRolePosition(guild.Roles, i.Member.Roles) {
		return target.Mention() + " has a role at or above yours, so you can't moderate them."
	}
	return ""
}
