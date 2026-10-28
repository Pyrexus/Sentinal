# AI usage and originality declaration

## Tools and roles

- Codex coding agents assisted with implementation, fictional training content, documentation, tests, and review. Work was split across application integration, backend security/storage, the React interface, and content/documentation.
- The product integrates Gemini 2.5 Flash for risk explanations and fictional awareness/training content when `GEMINI_API_KEY` is configured. The code validates its responses before use.
- Without a working provider, the analyzer uses a deterministic rules engine and training uses bundled seed content. The UI labels the source; a fallback is not presented as model output.
- No use of Gemini in Antigravity or another deployment assistant is claimed. Owner: add such use here only if it actually occurred.

## Prompt and iteration approach

The owner supplied the Sentinel product brief: a digital-safety copilot for Indian students, a single Cloudflare Worker, a fully usable demo, fictional training examples, and privacy/security requirements. The resumed session recovered this brief and verified that previous runner failures had left the repository empty.

Implementation was then divided into modules with shared interfaces. Agents created the files, connected the routes and screens, and used automated checks to find integration errors. The runtime prompts in `apps/api/ai/prompts.ts` treat pasted content as untrusted data, constrain the output schema, and require calibrated language.

## What was verified

Local verification on 2026-10-28 passed 40 tests, type checking, lint, the production build and smoke checks. The production dependency audit reported zero vulnerabilities and Git history passed secret scanning. Ten screenshots were captured with Microsoft Edge and used for visual review. Cloudflare CLI authentication and a deployment dry run were checked; live Firebase, Railway/Hyperdrive and Gemini behavior has not been verified with real credentials. A passing local test is evidence for the cases it exercises, not proof of security or model accuracy.

No owner review, production deployment, accuracy benchmark, user study, or expert endorsement is invented here.

## Corrections and limitations

- The earlier session's shell and file-write failures prevented saving its draft. The resumed work checked the actual filesystem before claiming files or commits existed.
- Integration work must distinguish seed samples from generated samples and keep answer keys out of ungraded lesson/lab responses.
- Analyzer storage is designed to retain non-sensitive metadata by default; saving original text is an explicit encrypted opt-in.
- Review found that Hono error handling discarded required response headers. The implementation was corrected and regression tests were added.
- Visual review found a nested-SVG styling problem in the score ring. The CSS was corrected and the rendered interface was checked again.
- Dependency audit findings were addressed by updating affected dependencies; the resulting production audit reported zero vulnerabilities.
- Analysis caching was revised to persist only limited metadata for 24 hours. Quoted highlights are rebuilt from the current request, and an atomic database lease coordinates generation across production instances.
- Owner: add specific review findings and corrections you personally observed before submitting.

## Original work and dependencies

The application code and fictional educational examples were created for this project with coding-agent assistance. The seed bank is authored project content, not a feed of observed incidents. It must not be described as independently human-written without qualification.

Open-source dependencies supply framework, UI, chart, database and validation functionality; their own licenses apply. Google and Cloudflare services are integrations, not original algorithms created by this project. The repository's original code is MIT-licensed.

## Owner review record — complete before submission

- Name and date: **[owner to complete]**
- Features you personally exercised: **[owner to complete]**
- Source files or design decisions you reviewed: **[owner to complete]**
- Issues found and changes requested: **[owner to complete]**
- Deployment commands you ran and resulting public URL: **[owner to complete]**
- Any additional AI tools and how they were used: **[owner to complete]**
