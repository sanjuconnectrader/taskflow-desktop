# TaskFlow Desktop

Secure Electron shell around a **locally bundled** TaskFlow Next.js export. Windows NSIS installer first; macOS DMG and Linux AppImage configurations are included for builds on their respective platforms.

## Run on Windows

1. Install Node.js 22.14+ and clone `taskflow-web` beside this repository as `../frontend`.
2. Start the shared TaskFlow API locally or deploy it with HTTPS. In `frontend/.env.local`, set `NEXT_PUBLIC_API_URL` to that same API origin. Include `taskflow://app` in backend CORS origins.
3. In `frontend`, `npm ci` then `npm run build`.
4. Here: `npm ci`, `npm run assets`, `npm start`.

If frontend is elsewhere, set `FRONTEND_OUT` to its absolute `out` path before copying. On Windows PowerShell use `npm.cmd` if required.

## Installer

```text
npm test
npm run test:smoke
npm run build:win
```

Result: `release/TaskFlow-1.0.0-Setup.exe`. Run it and follow the installer prompts. The API remains a separate service; no database or backend secrets ship with the installer. For distribution rebuild the UI against the production HTTPS API first.

Code signing is optional for local builds and requires your certificate for trusted distribution. Set `CSC_LINK` and `CSC_KEY_PASSWORD` locally, or the matching Windows secrets documented in DEPLOYMENT.md. Unsigned installers can produce Windows publisher warnings. There is no auto-update service in this version.

## Security and layout

- `src/main.cjs`: local secure asset protocol, window lifecycle/state, safe external links, application menu and credential IPC.
- `src/preload.cjs`: only `getSession` and `setSession`, with context isolation and renderer sandboxing.
- `src/paths.cjs`: path-safe static asset resolution; traversal rejection tests.
- `scripts/copy-web.cjs`: copies the shared export into ignored `web/`.
- `assets/`: tracked TaskFlow installer/application icons.
- `tests/`: asset traversal and bounded startup smoke checks.

Node integration is disabled. Native permissions are denied by default. External HTTPS links open in the OS browser and renderer navigation remains inside `taskflow://app`. Sessions use `safeStorage` (DPAPI on Windows), never plaintext renderer storage. The Linux storage backend must provide an encrypted secret service before login persistence is trusted; validate that backend when adding Linux distribution.

## GitHub Releases

See [DEPLOYMENT.md](DEPLOYMENT.md). The tag workflow runs Windows CI, checks out the reviewed frontend SHA with a read-only credential, tests/builds it, performs startup smoke testing, packages NSIS and uploads the `.exe` to GitHub Releases after the production environment gate. Configure `FRONTEND_REF`, `API_PUBLIC_URL`, secrets and approval rules before tagging. Private releases remain accessible only to users with repository access.
