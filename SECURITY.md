# Security policy

Sentinel is an educational risk-assistance project. It is not a malware scanner, a bank fraud decision system, or an emergency service.

## Reporting a vulnerability

Use the repository's **Security → Report a vulnerability** private-reporting flow if the owner has enabled it. If that option is unavailable, open an issue asking the maintainer to provide a private reporting channel **without including exploit details, credentials, or personal data**. The owner should enable GitHub private vulnerability reporting before accepting public reports.

Please include the affected version or commit, a minimal reproduction using synthetic data, expected and actual behavior, and the potential impact. Do not test against accounts or infrastructure you do not control. No response-time SLA or paid bounty is promised.

## Before a public deployment

- Configure the exact application origin, Firebase project, Hyperdrive database, encryption key, salted hashing secret, and admin generation secret.
- Run type checks, tests, production dependency audit, and the secret scan documented in README.
- Use a dedicated database identity with only the access the application needs. Keep provider keys in Worker secrets.
- Confirm Firebase authorised domains and Google sign-in settings, then test export and deletion with a disposable account.
- Review [the threat model](docs/THREAT_MODEL.md), including ephemeral demo storage, deletion scope, and limitations of generated output.

Never commit `.dev.vars`, `.env`, service-account files, database passwords, or real user messages. If a secret is exposed, revoke/rotate it; removing a line from the latest commit does not remove Git history.
