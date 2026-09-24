# Taylor Metal Purchasing Portal

Internal ordering portal for configuring Taylor Metal panels, accessories, and flashings and producing purchasing summaries in browser, PDF, and Excel formats.

## Engineering start points

- [Architecture and business rules](docs/ARCHITECTURE_AND_BUSINESS_RULES.md)
- [Panel configuration ownership](docs/PANEL_CONFIGURATION.md)
- [Engineering decisions](docs/DECISIONS.md)
- [Known risks](docs/RISK_REGISTER.md)
- [QA and release checklist](docs/QA_RELEASE_CHECKLIST.md)
- [Change and rollback process](docs/CHANGE_PROCESS.md)

The portal uses proportional review: visual-only edits receive lightweight verification, while material rules, calculations, saved-order compatibility, generated documents, authentication, and deployment require deeper evidence and a rollback checkpoint.

## Source of truth

`app/panel-config.ts` owns panel IDs, display names, material/finish availability, gauges or thicknesses, colors, coil requirements, and panel preview mappings. UI controls and generated outputs must consume this configuration rather than duplicate those rules.

## Commands

- `npm run dev` — start the local development server.
- `npm run build` — build and validate the deployable artifact.
- `npm test` — build, validate, and run the portal regression tests.
- `npm run lint` — run ESLint.
- `npm run validate:artifact` — validate an existing Sites artifact.

Node.js 22.13 or newer is required. The build helpers run in a Bash-compatible environment.

## Clone and local setup

```powershell
git clone https://github.com/Taylor-Metal-Products/taylor-metal-purchasing-portal-.git
cd taylor-metal-purchasing-portal-
npm ci
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

The portal uses the configured Cloudflare D1 `DB` binding for persistent orders. Local development uses the D1 simulation supplied by the Vite/Cloudflare plugin. `.openai/hosting.json` declares the binding name but contains no credentials. No environment variable is required for normal local development. Never commit `.env` files, tokens, API keys, passwords, or downloaded production data.

## Continue development in Codex

1. Clone the repository on the developer’s computer.
2. Open Codex and select the cloned repository folder as the project/workspace.
3. Read this README and the files in `docs/` before changing business rules.
4. Run `npm ci`, `npm test`, and `npm run lint` to establish a clean baseline.
5. Create a branch for the change:

```powershell
git switch -c feature/short-description
```

6. Make and test the change. Keep panel compatibility in `app/panel-config.ts` and order persistence changes compatible with existing stored payloads.
7. Review and commit only intended source files:

```powershell
git status --short
git add <intended-files>
git commit -m "feat: describe the change"
git push -u origin feature/short-description
```

8. Open a GitHub pull request for review before merging into `main`.

Repository access is managed in GitHub under **Settings → Collaborators and teams → Add people**. Enter the coworker’s exact GitHub username; do not infer it from an email address.

## Deployment

Production is hosted through the existing Sites project identified in `.openai/hosting.json`.

1. Merge the reviewed change to `main`.
2. Run `npm test` and `npm run lint` against the exact commit being released.
3. Build and package that exact commit through the managed Sites workflow.
4. Save and deploy the resulting version to the existing Sites project.
5. Confirm the deployment reports success, then smoke-test order save/load/edit/finalize and PDF generation on the live URL.

Do not create a second Sites project for this repository. Do not place hosting credentials in Git, the README, or shell scripts.

## Release rule

Do not publish changes to pricing, product compatibility, calculations, saved-order handling, or generated output until the relevant automated checks and manual checklist entries pass. Create a Git checkpoint before every high-risk change.
