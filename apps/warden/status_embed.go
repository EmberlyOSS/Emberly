package main

import (
	"fmt"
	"strings"
	"time"

	"github.com/bwmarrin/discordgo"
)

const embedFieldLimit = 1024

type componentLook struct {
	emojiName, fallback, label string
}

var componentLooks = map[string]componentLook{
	"OPERATIONAL":          {"ember_check", "🟢", "Operational"},
	"DEGRADED_PERFORMANCE": {"ember_warning", "🟡", "Degraded"},
	"PARTIAL_OUTAGE":       {"", "🟠", "Partial outage"},
	"MAJOR_OUTAGE":         {"ember_cross", "🔴", "Major outage"},
	"UNDER_MAINTENANCE":    {"ember_loading", "🛠️", "Maintenance"},
}

func (b *Bot) componentEmoji(status string) (emoji, label string) {
	look, ok := componentLooks[status]
	if !ok {
		return "⚪", strings.ToLower(strings.ReplaceAll(status, "_", " "))
	}
	if look.emojiName == "" {
		return look.fallback, look.label
	}
	return b.emoji(look.emojiName, look.fallback), look.label
}

func (b *Bot) componentLine(c statusComponent) string {
	emoji, label := b.componentEmoji(c.Status)
	line := emoji + " " + c.Name
	if c.Location != nil && *c.Location != "" {
		line += " `" + *c.Location + "`"
	}
	if c.Status != "OPERATIONAL" {
		line += " · **" + label + "**"
	}
	return line
}

// groupLines flattens a group and its subgroups, indenting subgroup components under their name.
func (b *Bot) groupLines(group statusGroup, depth int) []string {
	indent := strings.Repeat("　", depth)
	var lines []string
	for _, component := range group.Components {
		lines = append(lines, indent+b.componentLine(component))
	}
	for _, child := range group.Children {
		lines = append(lines, indent+"**"+child.Name+"**")
		lines = append(lines, b.groupLines(child, depth+1)...)
	}
	return lines
}

func discordTime(iso, style string) string {
	t, err := time.Parse(time.RFC3339, iso)
	if err != nil {
		return iso
	}
	return fmt.Sprintf("<t:%d:%s>", t.Unix(), style)
}

func humanize(status string) string {
	status = strings.ToLower(strings.ReplaceAll(status, "_", " "))
	if status == "" {
		return status
	}
	return strings.ToUpper(status[:1]) + status[1:]
}

func latestUpdate(incident statusIncident) (incidentUpdate, bool) {
	var latest incidentUpdate
	found := false
	for _, update := range incident.IncidentUpdates {
		if !found || update.CreatedAt > latest.CreatedAt {
			latest, found = update, true
		}
	}
	return latest, found
}

func averageUptime(components []statusComponent) (float64, bool) {
	var total float64
	var count int
	for _, component := range components {
		if component.UptimePct > 0 {
			total += component.UptimePct
			count++
		}
	}
	if count == 0 {
		return 0, false
	}
	return total / float64(count), true
}

func (b *Bot) statusEmbed(summary statusSummary) *discordgo.MessageEmbed {
	description := "**" + summary.Status.Description + "**"
	if uptime, ok := averageUptime(summary.Components); ok {
		description += fmt.Sprintf("\n30-day uptime: **%.2f%%**", uptime)
	}

	embed := &discordgo.MessageEmbed{
		Title:       b.statusEmoji(summary) + " Emberly status",
		URL:         statusURL,
		Color:       summary.color(),
		Description: description,
		Footer:      &discordgo.MessageEmbedFooter{Text: "emberlystat.us"},
	}
	if summary.GeneratedAt != "" {
		embed.Timestamp = summary.GeneratedAt
	}

	for _, incident := range summary.Incidents {
		value := fmt.Sprintf("**%s** · started %s", humanize(incident.Status), discordTime(incident.StartedAt, "R"))
		if update, ok := latestUpdate(incident); ok && update.Body != "" {
			value += "\n> " + truncate(strings.ReplaceAll(update.Body, "\n", " "), 300)
		}
		embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{
			Name:  b.emoji("ember_cross", "🔴") + " " + incident.Name,
			Value: truncate(value, embedFieldLimit),
		})
	}

	for _, maintenance := range summary.Maintenances {
		var value string
		if maintenance.Status == "IN_PROGRESS" {
			value = fmt.Sprintf("**In progress** · ends %s", discordTime(maintenance.ScheduledEnd, "R"))
		} else {
			value = fmt.Sprintf("**Scheduled** · %s to %s", discordTime(maintenance.ScheduledStart, "f"), discordTime(maintenance.ScheduledEnd, "t"))
		}
		embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{
			Name:  b.emoji("ember_loading", "🛠️") + " " + maintenance.Name,
			Value: value,
		})
	}

	grouped := map[string]bool{}
	var collect func(statusGroup)
	collect = func(group statusGroup) {
		for _, component := range group.Components {
			grouped[component.ID] = true
		}
		for _, child := range group.Children {
			collect(child)
		}
	}
	for _, group := range summary.Groups {
		collect(group)
		if lines := b.groupLines(group, 0); len(lines) > 0 {
			embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{
				Name:  group.Name,
				Value: truncate(strings.Join(lines, "\n"), embedFieldLimit),
			})
		}
	}

	var ungrouped []string
	for _, component := range summary.Components {
		if !grouped[component.ID] {
			ungrouped = append(ungrouped, b.componentLine(component))
		}
	}
	if len(ungrouped) > 0 {
		embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{
			Name:  "Other services",
			Value: truncate(strings.Join(ungrouped, "\n"), embedFieldLimit),
		})
	}

	// Discord allows 25 fields per embed.
	if len(embed.Fields) > 25 {
		embed.Fields = embed.Fields[:25]
	}
	return embed
}

func statusButtons() []discordgo.MessageComponent {
	return []discordgo.MessageComponent{
		discordgo.ActionsRow{Components: []discordgo.MessageComponent{
			discordgo.Button{Style: discordgo.LinkButton, Label: "Status page", URL: statusURL},
			discordgo.Button{Style: discordgo.LinkButton, Label: "Incident history", URL: statusURL + "/incidents"},
		}},
	}
}
