# Security Policy

Thanks for helping keep Emberly and its users safe.

## Supported Versions

We provide security fixes for:

| Version          | Supported |
| ---------------- | --------- |
| `main` branch    | Yes       |
| `develop` branch | Yes       |
| 2.4.x            | Yes       |
| 2.3.x            | Yes       |
| < 2.2.x          | No        |

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
