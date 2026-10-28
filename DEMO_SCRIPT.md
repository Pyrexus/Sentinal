# Two-minute Sentinel demo

## Before you start

Run the app and API, check the visible runtime/source labels, and use a browser session with synthetic data only. If credentials are absent, say **“This is Demo Mode; it uses temporary local progress and labelled fallback content.”** Do not imply that a local demo has verified production sign-in or live model calls.

Keep this fictional message ready:

> Bharat Trust Bank: KYC expires in 30 minutes. Your account will be BLOCKED. Update at bt-bank-kyc.example and share the OTP with our agent.

The `.example` address is deliberately reserved for examples. Do not replace it with a working suspicious link.

## Walkthrough

| Time | Action | What to say |
| --- | --- | --- |
| 0:00–0:15 | Open the dashboard and point to the command input | “Sentinel helps students pause, check and practise. This score tracks learning and self-reported habits; it does not scan your device.” |
| 0:15–0:50 | Paste the fictional KYC message into Analyze and submit | “We highlight the exact phrases behind the risk assessment, show confidence and give a practical next step. This source label tells you whether it came from the model or our basic rules.” |
| 0:50–1:10 | Open Scam Radar and expand a card | “These are explicitly fictional awareness examples, with a bundled fallback bank. A configured daily job can generate and validate new examples.” |
| 1:10–1:35 | Start its Phishing Lab round, select warning phrases and submit | “You practise the decision yourself. The server grades the round and explains the indicators before awarding XP.” |
| 1:35–1:50 | Open Protect or Privacy and make one real demo choice | “The action plan turns learning into a habit. Account checks are self-reported and link to official settings.” |
| 1:50–2:00 | Open Settings / limitations | “Raw messages are not saved by default. Saving is an encrypted opt-in, and users can export or delete their Sentinel data. We are clear about what this tool cannot prove.” |

Do not race an unavailable provider. If a model request falls back, point out the source label and continue. If the score starts at zero, explain that the product does not invent completed work.

## Ten likely judge questions

1. **Is this a definitive scam detector?** No. It supplies risk signals, uncertainty, education and safe verification steps. Neither a low score nor a clean reputation lookup proves that a message is safe.
2. **What is distinctive about Radar?** It connects a concise awareness pattern to an interactive practice round. Each item is fictional and source-labelled, so synthetic generation is not misrepresented as observed threat intelligence.
3. **What happens without API keys or when a provider fails?** Demo Mode uses temporary session-isolated storage. The analyzer has deterministic rules and the learning features have seed banks. In real mode, optional provider failure falls back without silently changing the authenticated user into a demo account.
4. **What does the AI actually do?** Configured Gemini requests produce structured analysis or fictional training content. Outputs must pass schema checks; scores and text are constrained. A rules-based result is labelled separately.
5. **How do you address prompt injection?** Pasted content is treated as untrusted data, with versioned instructions and JSON schemas, validation, sanitisation, bounded retries and fallback. These controls reduce risk; they do not prove the semantic correctness of every answer.
6. **Do you store the pasted message?** Not in the default persistent record or analysis cache. The repository cache holds limited metadata for 24 hours, and quoted highlights are rebuilt from the current request. Full input/output is transiently processed and returned to the browser. An explicit save request can store original text encrypted when the key is configured. Configured model analysis sends the input to Google.
7. **What does the Safety Score measure?** Practice and self-reported behaviors across five areas. It is not an account audit, device scan, certification or empirically calibrated likelihood of being attacked.
8. **How do you protect user accounts and data?** The Worker verifies Firebase tokens and scopes repository operations to the verified UID. It uses strict inputs, parameterized SQL, rate limits, security headers and encrypted optional sensitive storage. Live configuration still needs verification.
9. **What has been tested?** Forty local tests passed, along with type checking, lint, the build and smoke checks. The production dependency audit reported zero vulnerabilities. Ten screenshots were captured and the interface received visual checks. Show the current output; these results do not establish penetration testing, detector accuracy or live provider verification.
10. **What would you build next?** First validate production services, accessibility and retention procedures with real operator configuration, then evaluate the teaching content with users and domain reviewers. Image/QR input, localisation and other P2 features would follow evidence of usefulness rather than inflated scope.

## Screenshots and evidence

Ten screenshots have been captured using Microsoft Edge. To capture again, start the app and use the script with Edge installed (the default channel on Windows):

```powershell
npm run screenshots
```

If you have Google Chrome installed instead, set `$env:BROWSER_CHANNEL = 'chrome'` before running the command. Installing Playwright Chromium alone does not install the default `msedge` channel.

The capture script saves browser evidence in `docs/screenshots`. Capture at least dashboard, analyzer result, Radar, Lab, Privacy and Learn; include a mobile view when possible. Inspect images before submission. If browser capture is blocked, perform those same views manually and save six or more PNG files in that directory.

Before presenting, record the actual Git commit, public URL (if deployed), test command output and visible runtime mode. Complete the owner review section of `AI_USAGE.md` with actions the owner genuinely performed.
