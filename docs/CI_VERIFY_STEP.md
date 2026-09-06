# CI verification contract

The `validate` job on `pull_request` and `push` to `main` runs the same
critical verification developers are expected to trust locally:

1. `pnpm run typecheck`
2. `pnpm test`
3. `pnpm run build`
4. `pnpm run verify`
5. Guardian static asset integrity

`pnpm test` runs the LENA package tests. CI uses Node 24, which is required
for the `--experimental-strip-types` suite.

`pnpm run verify` runs the architecture suites in `tools/verify-all.mjs`.
The admin-authorization suite reports SKIPPED when no API is listening on
`127.0.0.1:8080`. That skip is intentional: CI must not turn a missing
database into a false pass, and it must not fail the public contract because
a private API is absent.

Guardian browser + visual remains a `pull_request` job after `validate`.
Do not refresh visual baselines unless the rendered result is the intended
canonical UI.
