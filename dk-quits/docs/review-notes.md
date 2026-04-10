# Review Notes (2026-04-10)

## High-priority issues found

1. **Database credentials were hardcoded in source control** (`lib/db.ts`).
   - Impact: Secret exposure risk and difficult environment management.
   - Fix applied: Switched to environment variables with startup validation.

2. **Build safety checks were disabled** (`next.config.mjs`).
   - Impact: Deployments could succeed even with TypeScript or ESLint failures.
   - Fix applied: Removed `ignoreDuringBuilds` and `ignoreBuildErrors` overrides.

3. **Duplicate Next.js config files** (`next.config.ts` and `next.config.mjs`).
   - Impact: Configuration ambiguity and surprising runtime behavior.
   - Fix applied: Removed duplicate `next.config.ts`; kept one source of truth.

## Additional suggestions to take this to the next level

1. **Replace localStorage-only session model with server-backed auth**
   - Current model allows easy user spoofing by editing browser storage.
   - Consider NextAuth/Auth.js with secure HTTP-only cookies.

2. **Add server-side validation/rate limiting for auth actions**
   - Add stronger password policy and login throttling to reduce brute-force risk.

3. **Add observability**
   - Add structured logs + error tracking (Sentry) for action failures and DB errors.

4. **Add automated quality gates in CI**
   - Run `npm run lint`, `npm run build`, and smoke tests on pull requests.

5. **Add basic test coverage**
   - Unit-test phase/timer logic and integration-test server actions.

6. **Use migrations and seed strategy consistently**
   - There are duplicate-looking script files (`08/09` views + sample data naming). Consolidate and version them clearly.
