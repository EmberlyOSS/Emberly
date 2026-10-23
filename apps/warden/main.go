package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"sync"
	"syscall"

	"github.com/bwmarrin/discordgo"
)

type Bot struct {
	cfg     Config
	session *discordgo.Session

	emojiMu sync.RWMutex
	emojis  map[string]string

	spam         *spamTracker
	cooldown     *cooldowns
	expectations *expectations
	roleCache    *roleNameCache
}

func main() {
	slog.SetDefault(slog.New(slog.NewTextHandler(os.Stdout, nil)))

	cfg, err := loadConfig()
	if err != nil {
		slog.Error("invalid configuration", "err", err)
		os.Exit(1)
	}

	session, err := discordgo.New("Bot " + cfg.Token)
	if err != nil {
		slog.Error("could not create Discord session", "err", err)
		os.Exit(1)
	}
	// Message Content and Server Members are privileged intents: enable both under
	// Bot → Privileged Gateway Intents, or Discord refuses the connection.
	session.Identify.Intents = discordgo.IntentsGuilds | discordgo.IntentsGuildMessages | discordgo.IntentMessageContent |
		discordgo.IntentsGuildMembers | discordgo.IntentGuildModeration | discordgo.IntentsGuildInvites |
		discordgo.IntentsGuildVoiceStates
	// Cached messages let the event log show what a deleted or edited message said.
	session.State.MaxMessageCount = 500

	bot := &Bot{cfg: cfg, session: session, emojis: map[string]string{}, spam: newSpamTracker(), cooldown: newCooldowns(), expectations: newExpectations(), roleCache: &roleNameCache{names: map[string]string{}}}
	session.AddHandler(bot.onReady)
	session.AddHandler(bot.onInteraction)
	session.AddHandler(bot.onMessage)
	bot.registerLogHandlers()

	if err := session.Open(); err != nil {
		slog.Error("could not connect to Discord", "err", err)
		os.Exit(1)
	}
	defer session.Close()

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	if err := bot.loadEmojis(); err != nil {
		slog.Warn("could not load application emojis, using Unicode fallbacks", "err", err)
	}
	if err := bot.registerCommands(); err != nil {
		slog.Error("could not register slash commands", "err", err)
		os.Exit(1)
	}
	go bot.watchStatus(ctx)

	slog.Info("Warden is running")
	<-ctx.Done()
	slog.Info("shutting down")
}

func (b *Bot) onReady(_ *discordgo.Session, r *discordgo.Ready) {
	slog.Info("connected", "user", r.User.Username, "guilds", len(r.Guilds))
}

// registerCommands overwrites the command set so removed commands disappear too. Guild commands
// update instantly, so set DISCORD_GUILD_ID for the Emberly server; global ones can take an hour.
func (b *Bot) registerCommands() error {
	_, err := b.session.ApplicationCommandBulkOverwrite(b.session.State.User.ID, b.cfg.GuildID, commandDefinitions)
	if err == nil {
		slog.Info("slash commands registered", "count", len(commandDefinitions), "guild", b.cfg.GuildID)
	}
	return err
}

type applicationEmoji struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Animated bool   `json:"animated"`
}

// loadEmojis fetches the emojis uploaded to the application itself (Developer Portal → Emojis),
// which the bot can use in every server without them being uploaded there.
func (b *Bot) loadEmojis() error {
	body, err := b.session.RequestWithBucketID(
		http.MethodGet,
		discordgo.EndpointApplication(b.session.State.User.ID)+"/emojis",
		nil,
		discordgo.EndpointApplication(""),
	)
	if err != nil {
		return err
	}
	var response struct {
		Items []applicationEmoji `json:"items"`
	}
	if err := json.Unmarshal(body, &response); err != nil {
		return err
	}

	emojis := make(map[string]string, len(response.Items))
	for _, emoji := range response.Items {
		prefix := ""
		if emoji.Animated {
			prefix = "a"
		}
		emojis[emoji.Name] = fmt.Sprintf("<%s:%s:%s>", prefix, emoji.Name, emoji.ID)
	}

	b.emojiMu.Lock()
	b.emojis = emojis
	b.emojiMu.Unlock()
	slog.Info("application emojis loaded", "count", len(emojis))
	return nil
}

// emoji returns the application emoji called name, or fallback if it isn't uploaded.
func (b *Bot) emoji(name, fallback string) string {
	b.emojiMu.RLock()
	defer b.emojiMu.RUnlock()
	if value, ok := b.emojis[name]; ok {
		return value
	}
	return fallback
}
