package main

import (
	"errors"
	"os"
	"strings"
	"time"
)

type Config struct {
	Token              string
	GuildID            string
	ModLogChannelID    string
	EventLogChannelID  string
	SupportChannelIDs  map[string]bool
	AllowedInviteCodes map[string]bool
	StatusAPIURL       string
	StatusPollInterval time.Duration
}

func loadConfig() (Config, error) {
	cfg := Config{
		Token:              strings.TrimSpace(os.Getenv("DISCORD_TOKEN")),
		GuildID:            strings.TrimSpace(os.Getenv("DISCORD_GUILD_ID")),
		ModLogChannelID:    strings.TrimSpace(os.Getenv("MOD_LOG_CHANNEL_ID")),
		EventLogChannelID:  strings.TrimSpace(os.Getenv("EVENT_LOG_CHANNEL_ID")),
		SupportChannelIDs:  csvSet(os.Getenv("SUPPORT_CHANNEL_IDS")),
		AllowedInviteCodes: csvSet(envOr("ALLOWED_INVITE_CODES", "36spBmzZVB")),
		StatusAPIURL:       envOr("STATUS_API_URL", "https://emberlystat.us/api/status"),
		StatusPollInterval: time.Minute,
	}

	if cfg.Token == "" {
		return cfg, errors.New("DISCORD_TOKEN is required")
	}
	if raw := os.Getenv("STATUS_POLL_INTERVAL"); raw != "" {
		interval, err := time.ParseDuration(raw)
		if err != nil || interval < 15*time.Second {
			return cfg, errors.New("STATUS_POLL_INTERVAL must be a duration of at least 15s, e.g. 60s")
		}
		cfg.StatusPollInterval = interval
	}
	return cfg, nil
}

func envOr(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}

func csvSet(raw string) map[string]bool {
	set := map[string]bool{}
	for _, part := range strings.Split(raw, ",") {
		if part = strings.TrimSpace(part); part != "" {
			set[part] = true
		}
	}
	return set
}
