# Taylor Metal Purchasing Portal

Standalone ordering portal for configuring Taylor Metal panels, accessories, and flashings and producing purchasing summaries and PDFs directly in a browser.

## Standalone site

The production frontend is deployed through GitHub Pages at:

https://taylor-metal-products.github.io/taylor-metal-purchasing-portal-/

The site does not require ChatGPT. The Pages workflow builds the existing React portal from this repository and deploys it automatically whenever `main` changes.

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
- `npm run build:pages` — create the standalone GitHub Pages artifact in `pages-dist/`.
- `npm run preview:pages` — preview the Pages artifact locally.
- `npm run test:pages` — build the Pages artifact and run the regression suite.
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

The standalone site stores drafts and submitted orders in the browser's `localStorage` by default. Orders persist across refreshes and browser restarts on that device, but they are not automatically shared between employees or devices. PDF generation also runs entirely in the browser.

For shared company-wide order storage, deploy a protected API separately and set `VITE_ORDER_API_BASE_URL` only to its public API origin during the Pages build. The API must expose `GET /orders` and `POST /orders`, implement authentication/authorization, and allow the Pages origin through CORS. Never place database credentials, private API keys, or service secrets in a `VITE_` variable because Vite embeds those values in public browser JavaScript. The existing Cloudflare D1 route remains available for non-static deployments and can be adapted into that protected service.

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

## GitHub Pages deployment

1. In GitHub, open **Settings → Pages** and set **Source** to **GitHub Actions** once.
2. Merge the reviewed change to `main`.
3. `.github/workflows/deploy-pages.yml` installs dependencies, runs `npm run test:pages`, uploads `pages-dist`, and deploys it.
4. Confirm the **Deploy GitHub Pages** workflow succeeds under the repository's **Actions** tab.
5. Smoke-test the live Pages URL, including product configuration, draft save/load, finalization, and PDF download.

The configured Vite base path is `/taylor-metal-purchasing-portal-/`, matching this repository name. If the repository is renamed, update `base` in `vite.pages.config.ts`. Do not commit hosting credentials, `.env` files, database secrets, or downloaded production data.

## Release rule

Do not publish changes to pricing, product compatibility, calculations, saved-order handling, or generated output until the relevant automated checks and manual checklist entries pass. Create a Git checkpoint before every high-risk change.
