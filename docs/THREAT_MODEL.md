# Threat model

## Scope and assets

Protect pasted messages, saved ciphertext, account identity, learning history, provider keys, database credentials and administrative generation access. Protect a learner from overconfident advice and misleading training content as well as conventional application attacks.

Trust boundaries are the browser-to-Worker API, Worker-to-Firebase JWKS, Worker-to-Google AI/Safe Browsing, Worker-to-Hyperdrive/PostgreSQL, and deployment/secrets administration. Browser content and all model output remain untrusted. A Firebase token is trusted only after cryptographic and claim verification.

## Controls and residual risk

| Threat | Implemented control | Residual risk / operational responsibility |
| --- | --- | --- |
| Prompt injection in pasted text | Data delimiters and explicit instructions, strict output schema, Zod validation, sanitisation, retry and heuristic fallback | Prompting cannot prove semantic correctness; the UI communicates uncertainty |
| XSS through user or model content | React text rendering, HTML stripping in validated output, CSP and security headers | Review any future HTML/Markdown renderer before use; Firebase origins must match deployment |
| SSRF through URL checks | No fetch of pasted URLs; only fixed Google API endpoints | Safe Browsing receives the candidate URL when configured; this is external processing |
| Forged identity / cross-user access | Firebase JWKS signature, issuer, audience and expiry verification; repository UID ownership checks | Compromised devices or valid stolen tokens remain an account risk |
| SQL injection | Drizzle parameterized queries and strict route validation | Keep database access limited and migrations reviewed |
| Excessive requests / provider cost | Request size limits, per-IP-hash and per-user counters, stricter AI routes, `429` with `Retry-After`, metadata cache and atomic 30-second generation leases | Production leases coordinate through the database; demo memory is per-isolate. Provider quotas and platform-level abuse controls remain necessary |
| Admin generation abuse | Constant-time admin-secret comparison and generation limits | Rotate the secret if exposed; do not put it in browser code |
| Sensitive data at rest | Raw text not persisted by default; optional AES-256-GCM encryption, fresh per-record IV and key version | Non-sensitive metadata and hashes still reveal some information; losing a key prevents recovery |
| Sensitive logs | Error messages avoid request bodies and credentials; IPs stored as salted hashes | Hosting and provider logs have separate policies; do not enable raw request logging |
| Cache disclosure | Repository caches expire after 24 hours and retain limited metadata, excluding raw input, quotes and full response prose; highlights are rebuilt from each request | Hashes and metadata can still disclose patterns; current-request memory and the browser response contain the input/output transiently |
| Misleading educational content | Reserved `.example` domains, fictional organisations, explicit seed/generated source labels, schema checks | Review generated samples before relying on them in teaching; synthetic validation is not expert review |
| Dependency compromise | Pinned lockfile, audit command, CI checks and secret scanning | A clean scan does not prove all dependencies are safe; patch supported versions regularly |

## Privacy and deletion

Pasted content goes to Google when model analysis is configured. The app does not access an inbox, read browser history, scan a device, or scrape Google account settings. Account checklist answers and privacy answers are user-reported.

Default analysis records contain a hash and limited result metadata, not the raw message or generated prose that could quote it. Explicit saved text requires the encryption secret. AES-256-GCM uses a fresh random IV for each record; the ciphertext includes a key version. Rotation is an operator task: retain old keys and migrate existing ciphertext deliberately. Do not assume replacing a secret re-encrypts old rows.

Data export is scoped to the current user. Encrypted saved text remains ciphertext in the export. `DELETE /api/me` removes the user's Sentinel records and clears the demo cookie; it does not delete the Google/Firebase identity or erase copies held by infrastructure backups or external providers. Independently define a backup retention policy for a live service.

## Demo boundaries

Demo sessions use a browser cookie and in-memory repository. Isolation prevents deliberately sharing one learner's progress with every demo visitor, but memory can disappear or vary between Worker isolates. Demo is not a durable user account, and its rate limits do not provide distributed abuse protection. Missing provider credentials produce visible deterministic fallback behavior; they are not hidden successful model calls.

## Verification and open deployment checks

Local verification on 2026-10-28 passed 40 automated tests, type checking, lint, the production build and smoke checks. The production dependency audit reported zero vulnerabilities. Tests cover strict schemas, known scam/benign inputs, injection strings, encryption round trips, rate limits, mocked token verification, ownership, grading and content consistency. Run the suite and inspect CI for the current commit; these results do not establish penetration-test coverage or empirical detector accuracy.

Before public use, verify the production origin/CSP, Firebase authorised domains, Google sign-in, actual Hyperdrive connectivity, provider failures, real account export/deletion, cron generation, secret rotation procedure and backup policy. Live-service tests require owner credentials and are not implied by local demo checks.
