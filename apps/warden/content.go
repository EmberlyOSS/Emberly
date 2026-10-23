package main

import (
	"regexp"
	"sort"
	"strings"
)

const (
	brandColor   = 0xF97316
	successColor = 0x22C55E
	warningColor = 0xF59E0B
	dangerColor  = 0xEF4444

	siteURL         = "https://embrly.ca"
	docsURL         = "https://docs.embrly.ca/docs"
	statusURL       = "https://emberlystat.us"
	githubURL       = "https://github.com/EmberlyOSS/Emberly"
	pricingURL      = "https://embrly.ca/pricing"
	supportEmail    = "support@embrly.ca"
	billingEmail    = "billing@embrly.ca"
	linkedRolesURL  = "https://embrly.ca/api/discord/linked-roles"
	uploadsTabURL   = siteURL + "/me?tab=uploads"
	domainsPageURL  = siteURL + "/dashboard/domains"
	resendVerifyURL = siteURL + "/auth/resend-verification"
)

type DocPage struct {
	Key   string
	Title string
	Path  string
	Blurb string
}

func (d DocPage) URL() string {
	if d.Path == "" {
		return docsURL
	}
	return docsURL + "/" + d.Path
}

var docPages = []DocPage{
	{"getting-started", "Getting started", "getting-started", "What Emberly is and how to start"},
	{"quickstart", "Quickstart", "getting-started/quickstart", "Upload and share your first file"},
	{"faq", "FAQ", "getting-started/faq", "Answers to common questions"},
	{"plans", "Plans", "getting-started/plans-overview", "Plans, storage and upload limits"},
	{"files", "File management", "user-guide/file-management", "Visibility, passwords, expiry and more"},
	{"custom-domains", "Custom domains", "user-guide/custom-domains", "Serve uploads from your own domain"},
	{"url-shortener", "URL shortener", "user-guide/url-shortener", "Create and track short links"},
	{"paste", "Pastes", "user-guide/paste", "Share text and code snippets"},
	{"squads", "Teams and squads", "user-guide/teams-and-squads", "Share storage and files with a team"},
	{"nexium", "Nexium", "user-guide/nexium", "Talent discovery profiles and signals"},
	{"discord-perks", "Discord perks", "user-guide/discord-perks", "Booster rewards and linking Discord"},
	{"discord-bot", "Discord bot", "user-guide/discord-bot", "The Emberly app, linked roles and server rules"},
	{"account", "Account settings", "user-guide/account-settings", "Profile, security and notifications"},
	{"sharex", "ShareX", "integrations/sharex", "Upload from ShareX on Windows"},
	{"flameshot", "Flameshot", "integrations/flameshot", "Upload from Flameshot on Linux"},
	{"bash", "Bash scripting", "integrations/bash-scripting", "Upload from the command line"},
	{"powershell", "PowerShell", "integrations/powershell", "Upload from PowerShell"},
	{"python", "Python SDK", "integrations/python-sdk", "Use Emberly from Python"},
	{"webhooks", "Webhooks", "integrations/webhooks", "Get notified about uploads and events"},
	{"api", "API reference", "api", "Every endpoint, with examples"},
	{"security", "Security", "security", "Malware scanning, breach checks and more"},
	{"self-hosting", "Self-hosting", "self-hosting", "Run Emberly on your own server"},
	{"cloud-vs-self-hosted", "Cloud vs self-hosted", "self-hosting/cloud-vs-self-hosted", "What differs between the two"},
}

type FAQ struct {
	Key      string
	Question string
	Answer   string
	Docs     []string
	// Triggers decide when the bot answers on its own in support channels. Keep them specific:
	// a wrong automatic answer is worse than none.
	Triggers []*regexp.Regexp
}

func triggers(patterns ...string) []*regexp.Regexp {
	compiled := make([]*regexp.Regexp, len(patterns))
	for i, pattern := range patterns {
		compiled[i] = regexp.MustCompile("(?i)" + pattern)
	}
	return compiled
}

var faqs = []FAQ{
	{
		Key:      "domain-verification",
		Question: "My custom domain won't verify",
		Answer: "Add every DNS record shown on **[Dashboard → Domains](" + domainsPageURL + ")** exactly as listed, then press **Verify**. DNS changes can take a while to propagate.\n\n" +
			"Common gotchas:\n" +
			"• On Cloudflare, set the record to **DNS only** (grey cloud) until the domain is active\n" +
			"• A root domain (`example.com`) needs a DNS provider that supports CNAME flattening; a subdomain like `files.example.com` is easier\n" +
			"• Many providers add your domain to the record name for you. Enter `files`, not `files.example.com`",
		Docs: []string{"custom-domains"},
		Triggers: triggers(
			`domain.{0,40}(verif|pending|not work|fail|stuck|awaiting)`,
			`(verif|pending|cname).{0,40}domain`,
			`cname.{0,30}(fail|not found|pending|wrong|not work)`,
		),
	},
	{
		Key:      "uploaders",
		Question: "How do I set up ShareX or Flameshot?",
		Answer: "Open the **[Uploads tab](" + uploadsTabURL + ")** on your profile and download the config for your app (ShareX, Flameshot, Spectacle or a Bash script). " +
			"For ShareX, double-click the `.sxcu` file to import it. With your account linked, the Emberly bot's `/sharex` sends it to you privately.\n\n" +
			"The config contains your upload token. If you regenerate the token, download the config again.",
		Docs: []string{"sharex", "flameshot"},
		Triggers: triggers(
			`(sharex|flameshot|spectacle).{0,40}(set ?up|config|work|error|fail|upload|import)`,
			`(set ?up|configure|config|import).{0,30}(sharex|flameshot|spectacle)`,
			`\.sxcu`,
		),
	},
	{
		Key:      "tokens",
		Question: "Where do I find my upload token or API key?",
		Answer: "• **Upload token** (ShareX, Flameshot, the Emberly bot): **[Profile → Uploads](" + uploadsTabURL + ")**\n" +
			"• **API keys** (scripts and apps): **[Profile → API](" + siteURL + "/me?tab=api)**\n\n" +
			"Regenerating your upload token stops old configs working, so download them again afterwards. Never share either one: they act as you.",
		Docs: []string{"api"},
		Triggers: triggers(
			`(where|find|get|generate|regenerat|reset|create).{0,30}(upload.?token|api.?key)`,
			`(upload.?token|api.?key).{0,30}(invalid|not work|unauthori[sz]ed|401|expired)`,
		),
	},
	{
		Key:      "upload-size",
		Question: "My file is too big to upload",
		Answer: "Each plan has a maximum size for a single upload, shown on the [pricing page](" + pricingURL + "). " +
			"Uploads through the dashboard are split into chunks, so they handle large files better than some uploaders do.\n\n" +
			"If you regularly need more, you can request a higher limit from the [Applications page](" + siteURL + "/applications).",
		Docs: []string{"plans", "files"},
		Triggers: triggers(
			`(file|upload|video).{0,30}(too (big|large)|size limit|max(imum)? (file )?size|exceeds?)`,
			`\b413\b`,
			`(upload|size) limit`,
		),
	},
	{
		Key:      "verification-email",
		Question: "I didn't get my verification email",
		Answer: "Check your spam or junk folder first. If it isn't there, request a new one at **[" + resendVerifyURL + "](" + resendVerifyURL + ")**. " +
			"Codes expire, so use the most recent email.\n\n" +
			"Still nothing after a few minutes? Email " + supportEmail + " from the address you signed up with.",
		Docs: []string{"account"},
		Triggers: triggers(
			`(verif\w*|confirm\w*).{0,20}(email|code|link).{0,30}(not|never|didn'?t|haven'?t).{0,15}(get|receiv|arriv|come|show)`,
			`(didn'?t|never|not|haven'?t).{0,15}(get|got|receiv\w*).{0,30}(verif\w*|confirm\w*).{0,15}(email|code|link)`,
			`resend.{0,20}verif`,
		),
	},
	{
		Key:      "embeds",
		Question: "My upload doesn't embed properly in Discord",
		Answer: "Share the file's page link (`" + siteURL + "/abc12/file.png`), not a download link. Private and password-protected files never show a preview.\n\n" +
			"Check **Enable Rich Embeds** under **[Profile → Settings](" + siteURL + "/me?tab=settings)**. Discord caches previews, so after changing something, post the link again to see the new embed.",
		Docs: []string{"files"},
		Triggers: triggers(
			`embed.{0,40}(not|isn'?t|doesn'?t|won'?t|no longer).{0,15}(show|work|load|appear|display)`,
			`(image|video|preview|thumbnail).{0,30}(not|isn'?t|doesn'?t|won'?t).{0,15}(embed|show(ing)? (up )?in discord)`,
		),
	},
	{
		Key:      "link-bot",
		Question: "How do I link my Emberly account in Discord?",
		Answer: "Copy your upload token from the **[Uploads tab](" + uploadsTabURL + ")**, then run `/link token:<your token>` with the **Emberly** bot. The reply is private.\n\n" +
			"After that, `/profile`, `/files`, `/shorten`, `/domains`, `/squads` and `/sharex` work for you. For server roles based on your account, use `/roles`.",
		Docs: []string{"discord-bot"},
		Triggers: triggers(
			`(link|connect).{0,30}(account|emberly).{0,30}(bot|discord)`,
			`/link.{0,30}(not work|invalid|error|fail)`,
		),
	},
	{
		Key:      "linked-roles",
		Question: "How do I get roles for my Emberly account?",
		Answer: "Run `/roles` and press **Connect Emberly**, or open the server menu → **Linked Roles**. " +
			"Roles reflect your account when you connect, so connect again later to refresh them.",
		Docs: []string{"discord-bot"},
		Triggers: triggers(
			`linked.?roles?`,
			`(get|claim).{0,20}roles?.{0,30}(account|emberly)`,
		),
	},
	{
		Key:      "status",
		Question: "Is Emberly down?",
		Answer: "Live status, incidents and maintenance are on **[emberlystat.us](" + statusURL + ")**, or run `/status` here.\n\n" +
			"If the status page says everything is fine, tell us what you tried and what you saw (an error message or screenshot helps).",
		Triggers: triggers(
			`(is|emberly|site|website|embrly).{0,15}\b(down|offline)\b`,
			`\b(502|503|504)\b.{0,30}(error|bad gateway|gateway)`,
			`bad gateway`,
		),
	},
	{
		Key:      "billing",
		Question: "I have a billing question",
		Answer:   "Billing isn't handled in Discord, so please don't post payment details here. Email **" + billingEmail + "** from your account's address and the team will get back to you.",
		Docs:     []string{"plans"},
		Triggers: triggers(
			`\brefund`,
			`(charged|billed).{0,20}(twice|wrong|again|without)`,
			`(billing|payment|subscription).{0,20}(issue|problem|help|question|failed)`,
		),
	},
	{
		Key:      "self-hosting",
		Question: "Can I self-host Emberly?",
		Answer: "Yes. Emberly is open source and runs on your own server with PostgreSQL and local or S3 storage. " +
			"Some features (custom domains through Cloudflare, billing) are cloud-only.\n\n" +
			"Source: " + githubURL,
		Docs:     []string{"self-hosting", "cloud-vs-self-hosted"},
		Triggers: triggers(`self.?host`, `(docker|dokploy|compose).{0,30}(setup|install|deploy)`),
	},
	{
		Key:      "report",
		Question: "How do I report a bug or a security issue?",
		Answer: "**Bugs and feature requests:** open an issue at " + githubURL + "/issues\n" +
			"**Security vulnerabilities:** never post them publicly. Report them privately at " + githubURL + "/security/advisories/new",
	},
}

func findDoc(key string) (DocPage, bool) {
	for _, page := range docPages {
		if page.Key == key {
			return page, true
		}
	}
	return DocPage{}, false
}

func findFAQ(key string) (FAQ, bool) {
	for _, faq := range faqs {
		if faq.Key == key {
			return faq, true
		}
	}
	return FAQ{}, false
}

// matchFAQ returns the FAQ whose triggers match the message most often, if any match at all.
func matchFAQ(content string) (FAQ, bool) {
	best, bestScore := FAQ{}, 0
	for _, faq := range faqs {
		score := 0
		for _, trigger := range faq.Triggers {
			if trigger.MatchString(content) {
				score++
			}
		}
		if score > bestScore {
			best, bestScore = faq, score
		}
	}
	return best, bestScore > 0
}

type choice struct{ Name, Value string }

// rankChoices filters by a case-insensitive substring and puts prefix matches first, capped at
// Discord's 25-choice autocomplete limit.
func rankChoices(all []choice, query string) []choice {
	query = strings.ToLower(strings.TrimSpace(query))
	var prefix, contains []choice
	for _, c := range all {
		name := strings.ToLower(c.Name)
		switch {
		case query == "" || strings.HasPrefix(name, query):
			prefix = append(prefix, c)
		case strings.Contains(name, query) || strings.Contains(c.Value, query):
			contains = append(contains, c)
		}
	}
	sort.SliceStable(prefix, func(i, j int) bool { return prefix[i].Name < prefix[j].Name })
	ranked := append(prefix, contains...)
	if len(ranked) > 25 {
		ranked = ranked[:25]
	}
	return ranked
}
