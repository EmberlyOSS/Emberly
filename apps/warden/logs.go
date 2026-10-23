package main

import (
	"fmt"
	"log/slog"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/bwmarrin/discordgo"
)

const (
	newAccountAge     = 7 * 24 * time.Hour
	expectationWindow = 30 * time.Second
	logInfoColor      = 0x1FB5FF
	logMutedColor     = 0x8A94A6
)

// expectations remembers actions the bot just took itself (deleting a message, timing someone
// out) so the matching gateway event isn't logged a second time.
type expectations struct {
	mu   sync.Mutex
	keys map[string]time.Time
}

func newExpectations() *expectations { return &expectations{keys: map[string]time.Time{}} }

func (e *expectations) expect(key string) {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.keys[key] = time.Now().Add(expectationWindow)
	for k, until := range e.keys {
		if time.Now().After(until) {
			delete(e.keys, k)
		}
	}
}

// consume reports whether key was expected, and forgets it.
func (e *expectations) consume(key string) bool {
	e.mu.Lock()
	defer e.mu.Unlock()
	until, ok := e.keys[key]
	delete(e.keys, key)
	return ok && time.Now().Before(until)
}

func (b *Bot) eventLog(embed *discordgo.MessageEmbed) {
	channelID := b.cfg.EventLogChannelID
	if channelID == "" {
		channelID = b.cfg.ModLogChannelID
	}
	if channelID == "" {
		return
	}
	if embed.Timestamp == "" {
		embed.Timestamp = time.Now().Format(time.RFC3339)
	}
	if _, err := b.session.ChannelMessageSendEmbed(channelID, embed); err != nil {
		slog.Warn("could not write to event log", "err", err)
	}
}

func userLine(u *discordgo.User) string {
	if u == nil {
		return "Unknown user"
	}
	return fmt.Sprintf("%s · `%s` · `%s`", u.Mention(), u.Username, u.ID)
}

func userAuthor(u *discordgo.User) *discordgo.MessageEmbedAuthor {
	if u == nil {
		return nil
	}
	return &discordgo.MessageEmbedAuthor{Name: u.Username, IconURL: u.AvatarURL("64")}
}

func (b *Bot) roleNames(guildID string, ids []string) string {
	names := make([]string, 0, len(ids))
	for _, id := range ids {
		if role, err := b.session.State.Role(guildID, id); err == nil {
			names = append(names, role.Name)
		} else {
			names = append(names, "<@&"+id+">")
		}
	}
	sort.Strings(names)
	return strings.Join(names, ", ")
}

// ---- Members ------------------------------------------------------------------------------

func (b *Bot) onMemberJoin(s *discordgo.Session, m *discordgo.GuildMemberAdd) {
	created, _ := discordgo.SnowflakeTimestamp(m.User.ID)
	age := time.Since(created)

	title, color := "Member joined", successColor
	if m.User.Bot {
		title, color = "Bot added", logInfoColor
	}
	fields := []*discordgo.MessageEmbedField{
		{Name: "Account created", Value: fmt.Sprintf("<t:%d:R>", created.Unix()), Inline: true},
	}
	if !m.User.Bot && age < newAccountAge {
		color = warningColor
		fields = append(fields, &discordgo.MessageEmbedField{Name: "Heads up", Value: "New account (under 7 days old)", Inline: true})
	}
	if m.Pending {
		fields = append(fields, &discordgo.MessageEmbedField{Name: "Rules", Value: "Waiting to accept the server rules", Inline: true})
	}
	if guild, err := s.State.Guild(m.GuildID); err == nil && guild.MemberCount > 0 {
		fields = append(fields, &discordgo.MessageEmbedField{Name: "Members", Value: formatCount(float64(guild.MemberCount)), Inline: true})
	}

	b.eventLog(&discordgo.MessageEmbed{
		Title:       b.emoji("ember_check", "📥") + " " + title,
		Color:       color,
		Author:      userAuthor(m.User),
		Description: userLine(m.User),
		Thumbnail:   &discordgo.MessageEmbedThumbnail{URL: m.User.AvatarURL("128")},
		Fields:      fields,
	})
}

func (b *Bot) onMemberLeave(s *discordgo.Session, m *discordgo.GuildMemberRemove) {
	if b.expectations.consume("leave:" + m.User.ID) {
		return
	}
	embed := &discordgo.MessageEmbed{
		Title:       b.emoji("ember_cross", "📤") + " Member left",
		Color:       logMutedColor,
		Author:      userAuthor(m.User),
		Description: userLine(m.User),
	}
	if m.Member != nil && m.Member.JoinedAt.Unix() > 0 {
		embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{Name: "Joined", Value: fmt.Sprintf("<t:%d:R>", m.Member.JoinedAt.Unix()), Inline: true})
	}
	b.eventLog(embed)
}

func (b *Bot) onMemberUpdate(s *discordgo.Session, m *discordgo.GuildMemberUpdate) {
	before := m.BeforeUpdate
	if before == nil || m.User == nil {
		return
	}

	if before.Pending && !m.Pending {
		b.eventLog(&discordgo.MessageEmbed{
			Title: b.emoji("ember_check", "✅") + " Accepted the rules", Color: successColor,
			Author: userAuthor(m.User), Description: userLine(m.User),
		})
	}

	var changes []*discordgo.MessageEmbedField

	if before.Nick != m.Nick {
		changes = append(changes, &discordgo.MessageEmbedField{
			Name:  "Nickname",
			Value: fmt.Sprintf("%s → %s", orNone(before.Nick), orNone(m.Nick)),
		})
	}

	added, removed := diffStrings(before.Roles, m.Roles)
	if (len(added) > 0 || len(removed) > 0) && !b.expectations.consume("roles:"+m.User.ID) {
		if len(added) > 0 {
			changes = append(changes, &discordgo.MessageEmbedField{Name: "Roles added", Value: b.roleNames(m.GuildID, added), Inline: true})
		}
		if len(removed) > 0 {
			changes = append(changes, &discordgo.MessageEmbedField{Name: "Roles removed", Value: b.roleNames(m.GuildID, removed), Inline: true})
		}
	}

	timeoutBefore, timeoutNow := activeTimeout(before), activeTimeout(m.Member)
	if timeoutBefore != timeoutNow && !b.expectations.consume("timeout:"+m.User.ID) {
		value := "Removed"
		if timeoutNow {
			value = fmt.Sprintf("Until <t:%d:f>", m.CommunicationDisabledUntil.Unix())
		}
		changes = append(changes, &discordgo.MessageEmbedField{Name: "Timeout", Value: value})
	}

	if len(changes) == 0 {
		return
	}
	b.eventLog(&discordgo.MessageEmbed{
		Title:       b.emoji("ember_link", "✏️") + " Member updated",
		Color:       logInfoColor,
		Author:      userAuthor(m.User),
		Description: userLine(m.User),
		Fields:      changes,
	})
}

func activeTimeout(m *discordgo.Member) bool {
	return m != nil && m.CommunicationDisabledUntil != nil && m.CommunicationDisabledUntil.After(time.Now())
}

func diffStrings(before, after []string) (added, removed []string) {
	had := map[string]bool{}
	for _, v := range before {
		had[v] = true
	}
	has := map[string]bool{}
	for _, v := range after {
		has[v] = true
		if !had[v] {
			added = append(added, v)
		}
	}
	for _, v := range before {
		if !has[v] {
			removed = append(removed, v)
		}
	}
	return added, removed
}

func orNone(s string) string {
	if s == "" {
		return "*none*"
	}
	return "`" + s + "`"
}

func (b *Bot) onBanAdd(s *discordgo.Session, m *discordgo.GuildBanAdd) {
	if b.expectations.consume("ban:" + m.User.ID) {
		return
	}
	b.expectations.expect("leave:" + m.User.ID)
	b.eventLog(&discordgo.MessageEmbed{
		Title: b.emoji("ember_cross", "🔨") + " Member banned", Color: dangerColor,
		Author: userAuthor(m.User), Description: userLine(m.User) + "\nBanned outside the bot; check the audit log for who and why.",
	})
}

func (b *Bot) onBanRemove(s *discordgo.Session, m *discordgo.GuildBanRemove) {
	b.eventLog(&discordgo.MessageEmbed{
		Title: b.emoji("ember_check", "♻️") + " Member unbanned", Color: successColor,
		Author: userAuthor(m.User), Description: userLine(m.User),
	})
}

// ---- Messages -----------------------------------------------------------------------------

func (b *Bot) onMessageDelete(s *discordgo.Session, m *discordgo.MessageDelete) {
	if b.expectations.consume("delete:" + m.ID) {
		return
	}
	cached := m.BeforeDelete
	if cached != nil && cached.Author != nil && cached.Author.Bot {
		return
	}

	embed := &discordgo.MessageEmbed{
		Title:  b.emoji("ember_cross", "🗑️") + " Message deleted",
		Color:  dangerColor,
		Fields: []*discordgo.MessageEmbedField{{Name: "Channel", Value: "<#" + m.ChannelID + ">", Inline: true}},
	}
	if cached == nil {
		embed.Description = "*Sent before the bot started, so its content wasn't cached.*"
	} else {
		embed.Author = userAuthor(cached.Author)
		embed.Description = userLine(cached.Author)
		if cached.Content != "" {
			embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{Name: "Content", Value: truncate(cached.Content, embedFieldLimit)})
		}
		if len(cached.Attachments) > 0 {
			var names []string
			for _, attachment := range cached.Attachments {
				names = append(names, attachment.Filename)
			}
			embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{Name: "Attachments", Value: truncate(strings.Join(names, ", "), embedFieldLimit)})
		}
		embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{Name: "Sent", Value: fmt.Sprintf("<t:%d:R>", cached.Timestamp.Unix()), Inline: true})
	}
	b.eventLog(embed)
}

func (b *Bot) onMessageDeleteBulk(s *discordgo.Session, m *discordgo.MessageDeleteBulk) {
	if b.expectations.consume("bulk:" + m.ChannelID) {
		return
	}
	b.eventLog(&discordgo.MessageEmbed{
		Title:       b.emoji("ember_cross", "🗑️") + " Messages bulk deleted",
		Color:       dangerColor,
		Description: fmt.Sprintf("%d messages deleted in <#%s>", len(m.Messages), m.ChannelID),
	})
}

func (b *Bot) onMessageUpdate(s *discordgo.Session, m *discordgo.MessageUpdate) {
	before := m.BeforeUpdate
	// Discord also sends updates for link previews loading; only real text edits are logged.
	if before == nil || before.Author == nil || before.Author.Bot || m.GuildID == "" || before.Content == m.Content || m.Content == "" {
		return
	}
	b.eventLog(&discordgo.MessageEmbed{
		Title:       b.emoji("ember_link", "✏️") + " Message edited",
		URL:         fmt.Sprintf("https://discord.com/channels/%s/%s/%s", m.GuildID, m.ChannelID, m.ID),
		Color:       logInfoColor,
		Author:      userAuthor(before.Author),
		Description: userLine(before.Author),
		Fields: []*discordgo.MessageEmbedField{
			{Name: "Channel", Value: "<#" + m.ChannelID + ">", Inline: true},
			{Name: "Before", Value: truncate(before.Content, embedFieldLimit)},
			{Name: "After", Value: truncate(m.Content, embedFieldLimit)},
		},
	})
}

// ---- Server structure ---------------------------------------------------------------------

func channelLabel(c *discordgo.Channel) string {
	if c.Type == discordgo.ChannelTypeGuildCategory {
		return "Category **" + c.Name + "**"
	}
	return fmt.Sprintf("<#%s> (`%s`)", c.ID, c.Name)
}

func (b *Bot) onChannelCreate(s *discordgo.Session, c *discordgo.ChannelCreate) {
	if c.GuildID == "" {
		return
	}
	b.eventLog(&discordgo.MessageEmbed{Title: "📁 Channel created", Color: successColor, Description: channelLabel(c.Channel)})
}

func (b *Bot) onChannelDelete(s *discordgo.Session, c *discordgo.ChannelDelete) {
	if c.GuildID == "" {
		return
	}
	b.eventLog(&discordgo.MessageEmbed{Title: "📁 Channel deleted", Color: dangerColor, Description: "**#" + c.Name + "** (`" + c.ID + "`)"})
}

func (b *Bot) onThreadCreate(s *discordgo.Session, t *discordgo.ThreadCreate) {
	// NewlyCreated is false when Discord sends an existing thread because the bot was added to it.
	if !t.NewlyCreated {
		return
	}
	b.eventLog(&discordgo.MessageEmbed{
		Title: "🧵 Thread created", Color: logInfoColor,
		Description: fmt.Sprintf("<#%s> in <#%s> by <@%s>", t.ID, t.ParentID, t.OwnerID),
	})
}

func (b *Bot) onRoleCreate(s *discordgo.Session, r *discordgo.GuildRoleCreate) {
	b.roleCache.set(r.Role)
	b.eventLog(&discordgo.MessageEmbed{Title: "🏷️ Role created", Color: successColor, Description: fmt.Sprintf("<@&%s> (`%s`)", r.Role.ID, r.Role.Name)})
}

// roleNameCache keeps role names around so a deleted role can still be named in the log; the
// gateway event only carries the ID, and discordgo's state drops the role before handlers run.
type roleNameCache struct {
	mu    sync.Mutex
	names map[string]string
}

func (c *roleNameCache) set(roles ...*discordgo.Role) {
	c.mu.Lock()
	defer c.mu.Unlock()
	for _, role := range roles {
		c.names[role.ID] = role.Name
	}
}

func (c *roleNameCache) take(id string) string {
	c.mu.Lock()
	defer c.mu.Unlock()
	name, ok := c.names[id]
	delete(c.names, id)
	if !ok {
		return "`" + id + "`"
	}
	return "**" + name + "**"
}

func (b *Bot) onGuildCreate(s *discordgo.Session, g *discordgo.GuildCreate) {
	b.roleCache.set(g.Roles...)
}

func (b *Bot) onRoleUpdate(s *discordgo.Session, r *discordgo.GuildRoleUpdate) {
	b.roleCache.set(r.Role)
}

func (b *Bot) onRoleDelete(s *discordgo.Session, r *discordgo.GuildRoleDelete) {
	b.eventLog(&discordgo.MessageEmbed{Title: "🏷️ Role deleted", Color: dangerColor, Description: b.roleCache.take(r.RoleID)})
}

func (b *Bot) onInviteCreate(s *discordgo.Session, i *discordgo.InviteCreate) {
	uses := "unlimited uses"
	if i.MaxUses > 0 {
		uses = fmt.Sprintf("%d uses", i.MaxUses)
	}
	expires := "never expires"
	if i.MaxAge > 0 {
		expires = fmt.Sprintf("expires <t:%d:R>", time.Now().Add(time.Duration(i.MaxAge)*time.Second).Unix())
	}
	inviter := "unknown"
	if i.Inviter != nil {
		inviter = i.Inviter.Mention()
	}
	b.eventLog(&discordgo.MessageEmbed{
		Title: "🔗 Invite created", Color: logInfoColor,
		Description: fmt.Sprintf("`discord.gg/%s` for <#%s> by %s\n%s, %s", i.Code, i.ChannelID, inviter, uses, expires),
	})
}

func (b *Bot) onInviteDelete(s *discordgo.Session, i *discordgo.InviteDelete) {
	b.eventLog(&discordgo.MessageEmbed{Title: "🔗 Invite deleted", Color: logMutedColor, Description: "`discord.gg/" + i.Code + "`"})
}

// ---- Voice --------------------------------------------------------------------------------

func (b *Bot) onVoiceStateUpdate(s *discordgo.Session, v *discordgo.VoiceStateUpdate) {
	beforeChannel := ""
	if v.BeforeUpdate != nil {
		beforeChannel = v.BeforeUpdate.ChannelID
	}
	if beforeChannel == v.ChannelID {
		return // mute, deafen or stream changes
	}
	user := "<@" + v.UserID + ">"
	var title, description string
	switch {
	case beforeChannel == "":
		title, description = "🔊 Joined voice", fmt.Sprintf("%s joined <#%s>", user, v.ChannelID)
	case v.ChannelID == "":
		title, description = "🔇 Left voice", fmt.Sprintf("%s left <#%s>", user, beforeChannel)
	default:
		title, description = "🔀 Moved voice", fmt.Sprintf("%s moved <#%s> → <#%s>", user, beforeChannel, v.ChannelID)
	}
	b.eventLog(&discordgo.MessageEmbed{Title: title, Color: logMutedColor, Description: description})
}

func (b *Bot) registerLogHandlers() {
	for _, handler := range []any{
		b.onMemberJoin, b.onMemberLeave, b.onMemberUpdate, b.onBanAdd, b.onBanRemove,
		b.onMessageDelete, b.onMessageDeleteBulk, b.onMessageUpdate,
		b.onChannelCreate, b.onChannelDelete, b.onThreadCreate, b.onRoleCreate, b.onRoleDelete,
		b.onGuildCreate, b.onRoleUpdate,
		b.onInviteCreate, b.onInviteDelete, b.onVoiceStateUpdate,
	} {
		b.session.AddHandler(handler)
	}
}

// formatCount renders a whole number with thousands separators, e.g. 12,398.
func formatCount(n float64) string {
	digits := fmt.Sprintf("%.0f", n)
	var out strings.Builder
	for i, digit := range digits {
		if i > 0 && (len(digits)-i)%3 == 0 {
			out.WriteByte(',')
		}
		out.WriteRune(digit)
	}
	return out.String()
}
