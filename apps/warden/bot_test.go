package main

import (
	"testing"
	"time"

	"github.com/bwmarrin/discordgo"
)

func TestMatchFAQ(t *testing.T) {
	cases := map[string]string{
		"my domain has been stuck on pending verification for an hour": "domain-verification",
		"the cname is not working for files.example.com":               "domain-verification",
		"how do I set up sharex with emberly?":                         "uploaders",
		"flameshot upload keeps failing":                               "uploaders",
		"where can I find my upload token?":                            "tokens",
		"my api key is invalid now":                                    "tokens",
		"this video is too big to upload":                              "upload-size",
		"getting a 413 when uploading":                                 "upload-size",
		"I didn't get the verification email":                          "verification-email",
		"verification code never arrived":                              "verification-email",
		"my embed is not showing in discord anymore":                   "embeds",
		"how do I link my account to the discord bot":                  "link-bot",
		"how do linked roles work here":                                "linked-roles",
		"how do I claim roles for my emberly account":                  "linked-roles",
		"is emberly down right now?":                                   "status",
		"getting 502 bad gateway on every page":                        "status",
		"I want a refund please":                                       "billing",
		"I got charged twice this month":                               "billing",
		"can I self host this?":                                        "self-hosting",
	}
	for message, want := range cases {
		faq, ok := matchFAQ(message)
		if !ok || faq.Key != want {
			t.Errorf("matchFAQ(%q) = %q, %v; want %q", message, faq.Key, ok, want)
		}
	}
}

func TestMatchFAQIgnoresUnrelatedChat(t *testing.T) {
	for _, message := range []string{
		"hey everyone, how is it going?",
		"just uploaded a cool screenshot",
		"thanks for the help earlier!",
		"what game are you all playing tonight",
		"the new dashboard looks great",
		"my internet went down for a bit lol",
		"I linked the video in general",
		"nice domain name",
	} {
		if faq, ok := matchFAQ(message); ok {
			t.Errorf("matchFAQ(%q) matched %q; want no match", message, faq.Key)
		}
	}
}

func TestMaliciousLink(t *testing.T) {
	if len(maliciousDomains) < 100 {
		t.Fatalf("domain list looks empty: %d entries", len(maliciousDomains))
	}
	for _, message := range []string{
		"free nitro at https://101nitro.com/claim",
		"go to xpro.gift now",
		"https://login.101nitro.com/x",
	} {
		if _, ok := maliciousLink(message); !ok {
			t.Errorf("maliciousLink(%q) missed", message)
		}
	}
	for _, message := range []string{
		"check https://embrly.ca/abc12/file.png",
		"https://not101nitro.com is fine",
		"see discord.com/channels/1/2",
		"version 2.7.1 is out",
	} {
		if domain, ok := maliciousLink(message); ok {
			t.Errorf("maliciousLink(%q) flagged %q", message, domain)
		}
	}
}

func TestEveryFAQDocExists(t *testing.T) {
	for _, faq := range faqs {
		for _, key := range faq.Docs {
			if _, ok := findDoc(key); !ok {
				t.Errorf("FAQ %q links unknown docs key %q", faq.Key, key)
			}
		}
	}
}

func TestRankChoices(t *testing.T) {
	all := []choice{{"Webhooks", "webhooks"}, {"Python SDK", "python"}, {"API reference", "api"}}
	got := rankChoices(all, "py")
	if len(got) != 1 || got[0].Value != "python" {
		t.Fatalf("rankChoices(py) = %v", got)
	}
	if got := rankChoices(all, ""); len(got) != 3 {
		t.Fatalf("empty query should return everything, got %v", got)
	}
}

func TestPresence(t *testing.T) {
	var summary statusSummary
	summary.Status.Indicator = "NONE"
	if status, _ := summary.presence(); status != string(discordgo.StatusOnline) {
		t.Errorf("operational presence = %s", status)
	}
	summary.Maintenances = append(summary.Maintenances, statusMaintenance{Status: "IN_PROGRESS"})
	if status, _ := summary.presence(); status != string(discordgo.StatusIdle) {
		t.Errorf("maintenance presence = %s", status)
	}
	summary.Status.Indicator = "MAJOR"
	if status, _ := summary.presence(); status != string(discordgo.StatusDoNotDisturb) {
		t.Errorf("major outage presence = %s", status)
	}
}

func TestSpamTracker(t *testing.T) {
	tracker := newSpamTracker()
	message := &discordgo.Message{Content: "FREE NITRO", ChannelID: "c"}
	for i := 1; i < spamRepeatLimit; i++ {
		message.ID = string(rune('a' + i))
		if tracker.record("u", message) != nil {
			t.Fatalf("flagged after only %d messages", i)
		}
	}
	if repeats := tracker.record("u", message); len(repeats) != spamRepeatLimit {
		t.Fatalf("expected %d repeats, got %d", spamRepeatLimit, len(repeats))
	}
}

func TestHighestRolePosition(t *testing.T) {
	roles := []*discordgo.Role{{ID: "admin", Position: 10}, {ID: "mod", Position: 5}, {ID: "member", Position: 3}}
	if got := highestRolePosition(roles, []string{"member", "mod"}); got != 5 {
		t.Errorf("highest of member+mod = %d, want 5", got)
	}
	if got := highestRolePosition(roles, nil); got != 0 {
		t.Errorf("no roles = %d, want 0", got)
	}
}

func TestFormatCount(t *testing.T) {
	for in, want := range map[float64]string{0: "0", 426: "426", 12398: "12,398", 1234567: "1,234,567"} {
		if got := formatCount(in); got != want {
			t.Errorf("formatCount(%v) = %q, want %q", in, got, want)
		}
	}
}

func TestExpectations(t *testing.T) {
	e := newExpectations()
	if e.consume("delete:1") {
		t.Fatal("unexpected key consumed")
	}
	e.expect("delete:1")
	if !e.consume("delete:1") {
		t.Fatal("expected key not consumed")
	}
	if e.consume("delete:1") {
		t.Fatal("key should only be consumed once")
	}
}

func TestDiffStrings(t *testing.T) {
	added, removed := diffStrings([]string{"a", "b"}, []string{"b", "c"})
	if len(added) != 1 || added[0] != "c" || len(removed) != 1 || removed[0] != "a" {
		t.Fatalf("added=%v removed=%v", added, removed)
	}
}

func TestCooldowns(t *testing.T) {
	c := newCooldowns()
	if !c.ready("k", time.Minute) || c.ready("k", time.Minute) {
		t.Fatal("cooldown should allow once, then block")
	}
}
