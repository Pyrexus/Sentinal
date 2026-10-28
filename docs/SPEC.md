# Sentinel product specification

Sentinel helps students and first-time internet users practise digital-safety decisions. Its outputs are assistance and education, not a definitive scam verdict or a certification of device security.

## Shipped surface

| Route | Purpose | Source and limits |
| --- | --- | --- |
| `/` | Safety Score, five sub-scores, XP, badges, streak and activity | Based on practice and self-reported habits; starts without invented progress |
| `/analyze` | Check pasted text or a URL, show risk signals and next steps | Maximum 4,000 characters; Gemini with deterministic fallback; no server-side visit to the pasted URL |
| `/radar` | Fictional scam-awareness feed with linked practice | Ten bundled seed patterns; validated daily generation when configured |
| `/lab` | Select suspicious phrases and submit a Safe/Scam judgement | Twenty bundled rounds; server grades responses and awards practice XP |
| `/privacy` | Twelve-question privacy review and action priorities | Rules-based exposure score; self-reported answers |
| `/protect` | Six account-hygiene steps with official Google links | Self-reported completion; no account scraping |
| `/learn` | Twelve lessons, practice interaction, three-question quizzes | Authored fictional educational content, not official financial advice |
| `/settings` | Export or delete the signed-in user's Sentinel data | Deletion does not delete the separate Google/Firebase identity |
| `/limitations` | Explain data use, source labels and product limits | Available within the product |

## Core interaction contracts

Analysis shows a bounded risk score, category, red flags, quoted indicators, explanation, practical next steps, confidence and a limitations note. The provider source is visible. Safe Browsing is a separate optional signal; a clean or unavailable result does not establish safety.

Radar cards must identify their fictional nature and whether they came from bundled seed content or model generation. They do not represent observed attacks, verified incidents or a live threat-intelligence feed.

Practice grades decisions against each teaching scenario. “Safe” means no intended scam indicators in that fictional example; it is not a promise about a real-world message with similar wording. Difficulty responds to prior practice where history exists.

## Runtime modes

With required production identity/storage configuration absent, Demo Mode uses an isolated browser session and temporary in-memory storage. A visible badge identifies it. State can disappear on reload of the Worker, deployment, or a different isolate; do not depend on demo persistence.

In real mode, Firebase Google sign-in identifies users and Hyperdrive connects to PostgreSQL. Guests can use Analyze with tighter rate limits. Radar, lessons and health are public read routes. A provider outage does not turn a real user into a demo identity.

## Explicit exclusions

No antivirus scan, device inspection, inbox access, real account audit, financial recovery guarantee, or empirical accuracy claim. Screenshot/QR-image input, certificates, push notifications, Hindi localisation and a public leaderboard are outside this build. Pasted URL analysis does not open the URL.

## Verification gates

Run type checking, automated tests, production build, dependency audit and secret scan. Exercise the local smoke test and browser flows. Live deployment, Firebase sign-in and paid/provider services require separate verification using the owner's real configuration. Exact setup commands are in README.
