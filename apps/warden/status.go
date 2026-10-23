package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/bwmarrin/discordgo"
)

type statusSummary struct {
	Status struct {
		Indicator   string `json:"indicator"`
		Description string `json:"description"`
	} `json:"status"`
	Groups       []statusGroup       `json:"groups"`
	Components   []statusComponent   `json:"components"`
	Incidents    []statusIncident    `json:"incidents"`
	Maintenances []statusMaintenance `json:"maintenances"`
	GeneratedAt  string              `json:"generatedAt"`
}

type statusComponent struct {
	ID        string  `json:"id"`
	Name      string  `json:"name"`
	Status    string  `json:"status"`
	GroupID   *string `json:"groupId"`
	UptimePct float64 `json:"uptimePct"`
	Location  *string `json:"location"`
}

type statusGroup struct {
	ID         string            `json:"id"`
	Name       string            `json:"name"`
	Components []statusComponent `json:"components"`
	Children   []statusGroup     `json:"children"`
}

type incidentUpdate struct {
	Body      string `json:"body"`
	Status    string `json:"status"`
	CreatedAt string `json:"createdAt"`
}

type statusIncident struct {
	ID              string           `json:"id"`
	Name            string           `json:"name"`
	Status          string           `json:"status"`
	Impact          string           `json:"impact"`
	StartedAt       string           `json:"startedAt"`
	IncidentUpdates []incidentUpdate `json:"incidentUpdates"`
}

type statusMaintenance struct {
	ID             string `json:"id"`
	Name           string `json:"name"`
	Status         string `json:"status"`
	ScheduledStart string `json:"scheduledStart"`
	ScheduledEnd   string `json:"scheduledEnd"`
}

var httpClient = &http.Client{Timeout: 10 * time.Second}

func fetchStatus(ctx context.Context, url string) (statusSummary, error) {
	var summary statusSummary
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return summary, err
	}
	req.Header.Set("User-Agent", "emberly-mod-bot")
	res, err := httpClient.Do(req)
	if err != nil {
		return summary, err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return summary, fmt.Errorf("status API returned %s", res.Status)
	}
	return summary, json.NewDecoder(res.Body).Decode(&summary)
}

func (s statusSummary) maintenanceInProgress() bool {
	for _, maintenance := range s.Maintenances {
		if maintenance.Status == "IN_PROGRESS" {
			return true
		}
	}
	return false
}

// presence maps the platform status to the bot's online state and custom status text.
func (s statusSummary) presence() (onlineStatus, text string) {
	switch {
	case s.Status.Indicator == "CRITICAL" || s.Status.Indicator == "MAJOR":
		return string(discordgo.StatusDoNotDisturb), "🔴 " + s.Status.Description
	case s.Status.Indicator == "MINOR":
		return string(discordgo.StatusIdle), "🟡 " + s.Status.Description
	case s.maintenanceInProgress():
		return string(discordgo.StatusIdle), "🛠️ Maintenance in progress"
	default:
		return string(discordgo.StatusOnline), "🟢 All systems operational"
	}
}

func (s statusSummary) color() int {
	switch s.Status.Indicator {
	case "CRITICAL", "MAJOR":
		return dangerColor
	case "MINOR":
		return warningColor
	default:
		return successColor
	}
}

func (b *Bot) statusEmoji(s statusSummary) string {
	switch {
	case s.Status.Indicator == "CRITICAL" || s.Status.Indicator == "MAJOR":
		return b.emoji("ember_cross", "🔴")
	case s.Status.Indicator == "MINOR":
		return b.emoji("ember_warning", "🟡")
	case s.maintenanceInProgress():
		return b.emoji("ember_loading", "🛠️")
	default:
		return b.emoji("ember_check", "🟢")
	}
}

func setPresence(session *discordgo.Session, onlineStatus, text string) error {
	activity := &discordgo.Activity{Name: "Custom Status", Type: discordgo.ActivityTypeCustom, State: text}
	// Discord forgets presence when the gateway reconnects; storing it on Identify re-sends it.
	session.Identify.Presence = discordgo.GatewayStatusUpdate{Status: onlineStatus, Game: *activity}
	return session.UpdateStatusComplex(discordgo.UpdateStatusData{
		Status:     onlineStatus,
		Activities: []*discordgo.Activity{activity},
	})
}

// watchStatus keeps the presence in sync with the status page. It only calls Discord when the
// presence actually changes, since presence updates are rate limited.
func (b *Bot) watchStatus(ctx context.Context) {
	var lastStatus, lastText string
	update := func() {
		onlineStatus, text := string(discordgo.StatusOnline), "🔥 embrly.ca"
		summary, err := fetchStatus(ctx, b.cfg.StatusAPIURL)
		if err != nil {
			slog.Warn("status page unavailable, using fallback presence", "err", err)
		} else {
			onlineStatus, text = summary.presence()
		}
		if onlineStatus == lastStatus && text == lastText {
			return
		}
		if err := setPresence(b.session, onlineStatus, text); err != nil {
			slog.Warn("could not update presence", "err", err)
			return
		}
		lastStatus, lastText = onlineStatus, text
		slog.Info("presence updated", "status", onlineStatus, "text", text)
	}

	update()
	ticker := time.NewTicker(b.cfg.StatusPollInterval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			update()
		}
	}
}
