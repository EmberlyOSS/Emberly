/**
 * Emberly's legal documents, served statically from /legal.
 *
 * These are plain-language starting points written for Emberly Cloud
 * (operated by NodeByte LTD, British Columbia, Canada). They are not legal
 * advice — have them reviewed by a lawyer before relying on them, and bump
 * `updatedAt` whenever a document's substance changes.
 */

export interface LegalDocument {
  slug: string
  title: string
  summary: string
  /** ISO date (YYYY-MM-DD) the document last changed */
  updatedAt: string
  /** Markdown */
  content: string
}

const COMPANY = 'NodeByte LTD'
const SITE = 'embrly.ca'
const SUPPORT = 'support@embrly.ca'
const SECURITY = 'security@embrly.ca'

const terms: LegalDocument = {
  slug: 'terms',
  title: 'Terms of Service',
  summary:
    'The agreement between you and Emberly: your account, your content, what you may and may not do, and our responsibilities.',
  updatedAt: '2026-10-23',
  content: `
These Terms of Service ("Terms") govern your use of Emberly, including the website at ${SITE}, the dashboard, our APIs and any related services (together, the "Service"). The Service is operated by ${COMPANY} ("Emberly", "we", "us"). By creating an account or using the Service you agree to these Terms. If you don't agree, don't use the Service.

## 1. Eligibility and accounts

- You must be at least 13 years old, or the minimum age required to consent to data processing in your country if that is higher.
- You're responsible for your account, for keeping your password and API keys secret, and for everything that happens under your account. Tell us promptly at ${SUPPORT} if you think your account has been compromised.
- You must give accurate information when you sign up and keep it up to date.
- If you use Emberly on behalf of an organisation, you confirm you're authorised to accept these Terms for it.

## 2. Your content

"Your content" means the files, pastes, links, profile information and anything else you upload or create on the Service.

- **You own your content.** We don't claim any ownership of it.
- **Licence to run the Service.** You grant us a worldwide, non-exclusive, royalty-free licence to store, copy, process, transmit and display your content only as needed to operate, secure and improve the Service — for example to host your files, generate previews and embeds, extract text for search, and scan for malware. This licence ends when you delete the content, except for copies in backups, which expire on their normal schedule.
- **Visibility is your choice.** Content you make public, or share a link to, can be viewed and downloaded by anyone with that link. You're responsible for choosing the right visibility, password and expiry settings.
- **You're responsible for your content.** You confirm you have the rights needed to upload and share it, and that it complies with these Terms and our [Acceptable Use Policy](/legal/acceptable-use).

## 3. Acceptable use

You must follow our [Acceptable Use Policy](/legal/acceptable-use), which forms part of these Terms. In short: no illegal content, no malware, no abuse of other people or of our infrastructure.

## 4. Custom domains, integrations and third-party services

- If you connect a custom domain, you confirm you control it. You're responsible for its DNS configuration.
- If you give us a third-party credential to perform a one-time action (for example a Cloudflare API token to create DNS records), we use it only for that action and don't store it.
- The Service links to and integrates with third-party services (such as Discord, GitHub and Cloudflare). Their own terms apply to your use of them.

## 5. Plans, limits and payment

- Accounts come with storage, upload-size and custom-domain limits shown in your dashboard. We may change default limits with reasonable notice.
- Where paid plans or add-ons are offered, prices and billing periods are shown before you buy. Payments are processed by Stripe. Subscriptions renew automatically until cancelled; you can cancel at any time from your billing settings, and cancellation takes effect at the end of the current billing period.
- Except where required by law, payments are non-refundable. If something went wrong, contact ${SUPPORT} and we'll look at it in good faith.
- When Emberly is running free of charge, extra limits may be granted through a request on the [Applications](/applications) page at our discretion.

## 6. Open source

Emberly's source code is published under the AGPL-3.0 licence. That licence governs your use of the code. These Terms govern your use of the hosted Service that we operate.

## 7. Suspension and termination

- You can stop using the Service and delete your account at any time.
- We may suspend or terminate accounts, or remove content, that violate these Terms, that create legal risk for us, or that threaten the security or stability of the Service. Where reasonable we'll tell you why and give you a chance to respond; you can appeal through the [Applications](/applications) page.
- After termination, your content may be deleted. Download anything you want to keep before closing your account.

## 8. Availability and changes to the Service

We work to keep Emberly fast and available, but we don't guarantee it will be uninterrupted or error-free. We may add, change or remove features. **Emberly is not a backup service — keep your own copies of anything important.**

## 9. Disclaimers

To the maximum extent permitted by law, the Service is provided "as is" and "as available", without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose and non-infringement.

## 10. Limitation of liability

To the maximum extent permitted by law, ${COMPANY} will not be liable for any indirect, incidental, special, consequential or punitive damages, or for lost profits, data or goodwill. Our total liability for any claim relating to the Service is limited to the greater of (a) the amount you paid us in the 12 months before the claim arose and (b) CAD $50. Some jurisdictions don't allow these limitations, so they may not apply to you in full.

## 11. Indemnity

You agree to indemnify ${COMPANY} against claims, losses and costs (including reasonable legal fees) arising from your content or your breach of these Terms.

## 12. Governing law

These Terms are governed by the laws of the Province of British Columbia and the federal laws of Canada that apply there. The courts of British Columbia have exclusive jurisdiction, except where consumer protection law where you live gives you the right to bring proceedings locally.

## 13. Changes to these Terms

We may update these Terms. If a change is material, we'll give at least 14 days' notice by email or in the dashboard before it takes effect. Continuing to use the Service after that means you accept the updated Terms.

## 14. Contact

Questions about these Terms: ${SUPPORT}.
`,
}

const privacy: LegalDocument = {
  slug: 'privacy',
  title: 'Privacy Policy',
  summary:
    'What personal information Emberly collects, why, who we share it with, how long we keep it, and the choices and rights you have.',
  updatedAt: '2026-10-23',
  content: `
This Privacy Policy explains how ${COMPANY} ("Emberly", "we", "us") handles personal information when you use Emberly at ${SITE} and its related services. We follow Canada's Personal Information Protection and Electronic Documents Act (PIPEDA) and British Columbia's Personal Information Protection Act (PIPA), and we honour the rights of people in the EU/UK under the GDPR.

**The short version:** we collect what we need to run the Service, we don't sell your data, we don't use advertising trackers, and you can export or delete your data.

## 1. What we collect

**Information you give us**
- Account details: username, email address, password (stored only as a hash), and optional profile information such as your name, avatar, bio and links.
- Your content: files, pastes, short links, custom domains and squad (team) data.
- Messages you send us, such as support requests, reports and applications.
- Billing details, if you buy a paid plan. Card details are handled by Stripe; we never see or store your full card number.

**Information collected automatically**
- Security and session data: IP address, browser user agent and sign-in times, used to keep your account secure and to detect abuse.
- Usage counts on your content, such as file views, downloads and short-link clicks. These are stored as totals, not as a per-visitor history.
- Error reports when something breaks, which may include technical details about your browser and the request.

**Information from third parties**
- If you sign in with Discord or GitHub, we receive your account ID, username, email and avatar from that provider. If you connect Discord, we may also check server membership and roles to apply community perks.

## 2. How we use it

- To provide the Service: store and deliver your content, generate previews and embeds, extract text from images so you can search them, and run custom domains.
- To keep the Service safe: scan uploads for known malware, check new passwords against known data breaches, prevent spam and abuse, and enforce our Terms.
- To communicate with you: account, security and service emails, and — only if you opt in — product updates.
- To process payments, where applicable.
- To understand and fix problems with the Service.

We rely on our contract with you, our legitimate interests in running a secure service, your consent where we ask for it (for example optional emails), and legal obligations.

## 3. Who we share it with

We don't sell or rent your personal information. We share it only with service providers that help us run Emberly, under agreements that require them to protect it:

| Provider | Purpose |
| --- | --- |
| Object storage providers (such as Vultr, Akamai/Linode and OVHcloud) | Storing uploaded files |
| Cloudflare | DNS, custom domains, TLS certificates and network protection |
| Stripe | Payment processing |
| Resend or our email provider | Sending account and service emails |
| VirusTotal | Malware checks. **Only a file's cryptographic hash is sent, never the file itself** |
| Have I Been Pwned | Password breach checks, using an anonymous range lookup that sends only a short hash prefix |
| Sentry | Error monitoring |
| Discord and GitHub | Sign-in and community features you choose to connect |

We may also disclose information if required by law, to respond to valid legal process, to protect the rights and safety of our users or the public, or as part of a merger or acquisition (in which case this policy will continue to apply).

Content you make public, and your public profile, is visible to anyone.

## 4. International transfers

We and our providers may process data in Canada, the United States, the European Union and other countries. Where data leaves your country, we rely on appropriate safeguards such as contractual protections.

## 5. How long we keep it

- Account information: for as long as your account exists.
- Your content: until you delete it, it expires, or your account is deleted.
- Security logs: up to 12 months.
- Billing records: as long as required for tax and accounting law (typically 7 years).
- Backups: deleted data may remain in encrypted backups for up to 30 days.

## 6. Your rights and choices

You can:
- Access, correct and update your information from your [account settings](/me).
- Export your data from the Data section of your account settings.
- Delete your account and its content.
- Opt out of non-essential emails at any time.
- Withdraw consent where we rely on it.
- If you're in the EU/UK: object to or restrict processing, and complain to your data protection authority.
- If you're in Canada: complain to the Office of the Privacy Commissioner of Canada or the Office of the Information and Privacy Commissioner for British Columbia.

To make a request we can't handle through the dashboard, email ${SUPPORT}. We'll respond within 30 days.

## 7. Cookies

We use a small number of essential cookies and local storage to keep you signed in and remember your preferences. We don't use advertising cookies or third-party analytics. See our [Cookie Policy](/legal/cookies).

## 8. Security

We protect your data with encryption in transit, hashed passwords, access controls and malware scanning. No service is perfectly secure; if you find a vulnerability, please see our [Security Policy](/legal/security).

## 9. Children

Emberly isn't intended for children under 13 (or the minimum age in your country). If you believe a child has given us personal information, contact us and we'll delete it.

## 10. Changes

We'll post updates here and change the date at the top. If a change is material, we'll notify you by email or in the dashboard.

## 11. Contact

Privacy questions and requests: ${SUPPORT}. Postal enquiries can be arranged on request.
`,
}

const acceptableUse: LegalDocument = {
  slug: 'acceptable-use',
  title: 'Acceptable Use Policy',
  summary:
    'What you can and can’t host or do on Emberly, and how we enforce it.',
  updatedAt: '2026-10-23',
  content: `
This policy is part of our [Terms of Service](/legal/terms). It applies to everything you upload, link to or do on Emberly.

## You must not use Emberly to

**Host or share illegal or harmful content**
- Child sexual abuse material, or any sexualised content involving minors. We report this to the authorities and terminate the account immediately.
- Content that infringes someone else's copyright, trademark or other rights. See our [Copyright Policy](/legal/copyright).
- Non-consensual intimate imagery, doxxing, or other people's private information shared without their consent.
- Content that promotes terrorism or violent extremism, or that incites violence.
- Content that is illegal in Canada or in the place you're accessing the Service from.

**Harm people**
- Harass, threaten, bully or impersonate others.
- Run scams, fraud or deceptive schemes.

**Harm systems**
- Upload or distribute malware, ransomware or other malicious code, or use Emberly as command-and-control infrastructure.
- Host phishing pages or use short links to disguise malicious destinations.
- Probe, scan or test the security of Emberly without following our [Security Policy](/legal/security).
- Interfere with the Service, bypass rate limits or quotas, or access accounts or data that aren't yours.

**Abuse the platform**
- Send spam, including unsolicited messages that use Emberly links.
- Use Emberly as a general-purpose CDN or bulk file mirror for unrelated sites, or as a backup target for large automated jobs, without our agreement.
- Create accounts in bulk or by automated means, or resell the Service without permission.

## Enforcement

We may remove content, limit features, or suspend or terminate accounts that break this policy, depending on how serious the violation is. Where appropriate we'll warn you first. We may report illegal activity to law enforcement.

## Reporting

Use the report button on any file or profile, or email ${SUPPORT}. For security issues, see our [Security Policy](/legal/security). If you think we've made a mistake about your account, you can appeal through the [Applications](/applications) page.
`,
}

const cookies: LegalDocument = {
  slug: 'cookies',
  title: 'Cookie Policy',
  summary:
    'The small number of cookies and browser storage Emberly uses, and why. No advertising or tracking cookies.',
  updatedAt: '2026-10-23',
  content: `
Emberly uses cookies and similar browser storage only where they're needed for the Service to work or to remember your choices. **We don't use advertising cookies, cross-site tracking or third-party analytics.**

## Essential cookies

| Name | Purpose | Duration |
| --- | --- | --- |
| \`next-auth.session-token\` (or \`__Secure-\` variant) | Keeps you signed in | Up to 30 days |
| \`next-auth.csrf-token\` | Protects sign-in forms against cross-site request forgery | Session |
| \`next-auth.callback-url\` | Returns you to the right page after signing in | Session |

These are required for the Service to function, so they can't be switched off. They're only set by ${SITE}.

## Local storage

We store a few preferences in your browser's local storage, such as whether theme effects are enabled. This data never leaves your device.

## Third parties

- **Stripe** may set its own cookies on checkout and billing pages to prevent fraud.
- Pages you visit through a custom domain or an embedded third-party service are subject to that service's cookies.

## Managing cookies

You can block or delete cookies in your browser settings. If you block essential cookies, you won't be able to sign in.

Questions: ${SUPPORT}.
`,
}

const copyright: LegalDocument = {
  slug: 'copyright',
  title: 'Copyright Policy',
  summary:
    'How to report content that infringes your copyright, and how to respond if your content was reported.',
  updatedAt: '2026-10-23',
  content: `
We respect intellectual property rights and expect our users to do the same. This policy covers notices under Canada's *Copyright Act* and the U.S. *Digital Millennium Copyright Act* (DMCA).

## Reporting infringement

If you believe content on Emberly infringes your copyright, send a notice to ${SUPPORT} with the subject **"Copyright notice"**. Include:

1. Your name and contact details (address, email and phone number).
2. A description of the copyrighted work.
3. The exact Emberly URL(s) of the content you believe is infringing.
4. A statement that you have a good-faith belief the use isn't authorised by the owner, its agent or the law.
5. A statement that the information in your notice is accurate and, under penalty of perjury, that you are the owner or authorised to act for the owner.
6. Your physical or electronic signature.

We'll review valid notices promptly. Where appropriate we'll remove or disable access to the content and let the uploader know. Under Canada's notice-and-notice regime, we may also forward your notice to the user concerned.

## Counter-notices

If your content was removed and you believe that was a mistake or that you have the right to use it, send a counter-notice to ${SUPPORT} with:

1. Your name, address, email and phone number.
2. The URL of the removed content.
3. A statement, under penalty of perjury, that you have a good-faith belief the content was removed by mistake or misidentification.
4. Your consent to the jurisdiction of the courts of British Columbia (or, if you're in the U.S., your local federal district court), and that you'll accept service of process from the person who sent the original notice.
5. Your physical or electronic signature.

We may restore the content unless the original complainant tells us they've started legal proceedings.

## Repeat infringers

We terminate the accounts of users who repeatedly infringe copyright.

## Misuse

Knowingly sending a false notice or counter-notice can make you liable for damages. If you're not sure whether something infringes your rights, consider getting legal advice first.
`,
}

const security: LegalDocument = {
  slug: 'security',
  title: 'Security Policy',
  summary:
    'How we protect Emberly, and how to responsibly report a security vulnerability.',
  updatedAt: '2026-10-23',
  content: `
## How we protect Emberly

- All traffic is encrypted in transit with TLS.
- Passwords are hashed and checked against known data breaches when they're set.
- Uploads are checked against known malware before they become publicly accessible.
- Access to production systems is limited to the people who need it.
- API keys and third-party credentials are never shown back in full, and one-time credentials you give us (such as a Cloudflare token for DNS setup) are never stored.
- Emberly is open source, so our code can be reviewed by anyone.

## Reporting a vulnerability

If you believe you've found a security vulnerability in Emberly, please email **${SECURITY}** with:

- A description of the issue and its impact.
- Steps to reproduce it, or a proof of concept.
- Any relevant URLs, accounts or request details.

We'll acknowledge your report within 3 business days and keep you updated while we investigate and fix it.

## Guidelines for researchers

We won't take legal action against good-faith research that follows these rules:

- Only test against accounts and data you own, or that you have explicit permission to access.
- Don't access, modify or delete other users' data. If you hit someone else's data by accident, stop and tell us.
- Don't run denial-of-service tests, spam or social-engineering attacks, or physically test our facilities.
- Give us reasonable time to fix the issue before disclosing it publicly.

## Out of scope

- Reports from automated scanners without a demonstrated impact.
- Missing best-practice headers or settings without a practical exploit.
- Issues in third-party services we use; please report those to the provider.
- Vulnerabilities in self-hosted Emberly instances run by others. Report those to the instance operator, or to us via GitHub if the issue is in the Emberly code itself.

Thank you for helping keep Emberly and its users safe.
`,
}

export const LEGAL_DOCUMENTS: LegalDocument[] = [
  terms,
  privacy,
  acceptableUse,
  cookies,
  copyright,
  security,
]

export function getLegalDocument(slug: string): LegalDocument | null {
  return LEGAL_DOCUMENTS.find((d) => d.slug === slug.toLowerCase()) ?? null
}
