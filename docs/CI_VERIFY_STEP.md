# Pending CI change — one step, blocked on a permission

`pnpm run verify` exists, passes, and can be run by anyone at any time. What is **not** yet wired is
CI running it automatically.

**Why it is not wired:** pushing a change to `.github/workflows/ci.yml` was rejected by GitHub:

```
refusing to allow a GitHub App to create or update workflow `.github/workflows/ci.yml`
without `workflows` permission
```

The agent's GitHub connection does not carry the `workflows` scope. This is an access limitation, not
a technical one.

**The exact change required**, appended to the `validate` job in `.github/workflows/ci.yml`, after the
existing `Build` step:

```yaml
      - name: Verify
        # Typecheck and build cannot detect a metadata regression, a locale
        # routing mistake, personal data leaking into an event or a support
        # report, or an authorization hole. These suites can.
        run: pnpm run verify
```

**Either** grant the connection the `workflows` permission and ask the agent to apply it, **or** paste
those four lines into the file on GitHub directly. Nothing else changes.

**Until then:** the suites are not automated. Run `pnpm run verify` before any deployment. It exits
non-zero on failure, so it can also be attached to a pre-push hook locally.
