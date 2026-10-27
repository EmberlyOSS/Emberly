# Security Policy

Thanks for helping keep Emberly and its users safe.

## Supported Versions

We provide security fixes for:

| Version                | Supported           |
| ---------------------- | ------------------- |
| `master` branch        | Yes                 |
| Latest minor release   | Yes                 |
| Previous minor release | Critical fixes only |
| Older releases         | No                  |

Self-hosted instances should run the latest release. The official Docker image is rebuilt for every release.

## Reporting a Vulnerability

Please do not open public GitHub issues for security vulnerabilities.

Report privately by emailing: security@nodebyte.co.uk

Use subject line: `[SECURITY] <short summary>`

Include:

- Affected component and version/commit
- Reproduction steps or proof of concept
- Impact and likely attack scenario
- Any suggested mitigation

If needed, include encrypted details and share a secure channel for follow-up.

## What to Expect

- Initial acknowledgment within 72 hours
- Triage and severity assessment
- A plan for fix and coordinated disclosure
- Credit in release notes if you want attribution

## Scope

In-scope:

- Remote code execution
- Auth bypass / privilege escalation
- Sensitive data exposure
- Injection vulnerabilities
- SSRF / major misconfiguration issues

Out-of-scope (unless chainable to significant impact):

- Missing best-practice headers only
- Self-XSS without escalation path
- Rate-limit bypass with no practical abuse impact

## Acknowledgements

Thank you to everyone who has reported security issues responsibly.

- **birb ([@parabirb](https://github.com/parabirb))**, whose audit of [Flare](https://github.com/FlintSH/Flare), the project Emberly was originally forked from, found issues that also affected Emberly: stored XSS through uploaded SVG and HTML files, unlimited file password guessing, and unthrottled OCR. Fixed in Emberly 3.2.1.
