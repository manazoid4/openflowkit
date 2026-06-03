# QA / Deploy Risk Review

Date: 2026-06-03

Scope: package/build configuration, Vercel readiness for the Vite React app, and obvious deploy risks. No app source files were changed.

## Verification

- `npm run build` passes.
- Build output is generated in `dist`.
- `npm ci --dry-run` passes.
- `npm test` fails because Vitest finds no test files.

## Vercel Readiness

- `vercel.json` is aligned with a Vite static app:
  - `buildCommand`: `npm run build`
  - `outputDirectory`: `dist`
  - `framework`: `vite`
- `vite.config.ts` also sets `build.outDir` to `dist`.
- `dist/index.html` references root-relative built assets under `/assets/...`, which is suitable for Vercel static hosting.

## Risks

1. Production deploy workflow does not run tests.
   - `.github/workflows/vercel-production.yml` runs `npm run build` but not `npm test`.
   - Current `npm test` exits non-zero because no test files exist, so adding it now would block deploys until either tests are added or the script is made explicit about no-test behavior.

2. Vercel CLI version is not pinned.
   - The production workflow installs `vercel@latest`, which can change deploy behavior without a repository change.

3. Vercel project linking is implicit.
   - There is no committed `.vercel/project.json`.
   - The production workflow uses `vercel pull`, `vercel build`, and `vercel deploy`, but does not expose `VERCEL_ORG_ID` or `VERCEL_PROJECT_ID`.
   - In CI, this can fail or become dependent on prior linking state instead of explicit project identity.

4. `npm test` exists but has no matching tests.
   - This creates a false QA surface: contributors may assume there is a deployable test gate, but the command currently fails and is not wired into CI.

5. Runtime product surface is demo/static.
   - The app builds successfully, but visible content uses hardcoded demo data and placeholder-style external linking.
   - This is acceptable for a marketing/static preview, but not for a production product workflow.

## Recommended Fixes

1. Add at least one focused unit test for `src/core/refine.ts`, then wire `npm test` into both CI and production deploy before `vercel build --prod`.

2. Pin the Vercel CLI in `.github/workflows/vercel-production.yml`, for example `vercel@<known-good-version>`, instead of `vercel@latest`.

3. Make CI project identity explicit for Vercel deploys:
   - Add `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, and `VERCEL_TOKEN` as GitHub Actions secrets.
   - Keep `.vercel/project.json` uncommitted unless the team intentionally wants to commit non-secret project metadata.

4. Add `--yes` to non-interactive Vercel CLI commands where supported to reduce CI prompt risk.

5. Replace placeholder/demo outbound links before production launch.
