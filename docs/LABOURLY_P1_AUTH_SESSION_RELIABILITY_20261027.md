# P1 authentication and session reliability — review gate

Date: 2026-10-27. Repository: D:\Files\EDUCATION\NammaCrew. Source audit and mocked mobile regression only. No native, database or external SMS acceptance is claimed.

## Scope and preservation

Inspected mobile login/verification, credentials, API client/HTTP transport, session store, root/auth route guards, role routing, cache isolation and existing tests. Inspected backend AuthController, AuthService, JwtTokenProvider, OtpProvider implementations, OtpChallenge, RefreshToken, SecurityConfig, profile authorization and authentication integration-test source.

Changed only:

- mobile/src/api/client.ts
- mobile/src/auth/session.ts
- mobile/src/__tests__/session.test.ts
- This report.

Existing wallet work and other working-tree changes were preserved. No backend code, API contract, migration, account, marketplace domain, production configuration, dependency, native source or APK was changed. No Gradle, emulator, Docker or database service was run. No commit, push, tag or deployment.

## Demonstrated defects and focused corrections

### 1. Temporary refresh failures destroyed the saved session

Previously refresh() cleared credentials for every exception, including an offline fetch, HTTP 429 and HTTP 503. Three new tests reproduced deletion of otherwise retryable credentials.

Correction: clear the matching credentials only for refresh credential rejection (HTTP 400, 401 or 403 under the current API contract). Transport, throttling, server and malformed-response failures propagate without claiming authentication succeeded or deleting credentials. Existing one-flight refresh, conditional token replacement and one-retry limits remain intact. A later successful request can retry refresh.

Limitation: if the server rotates a refresh token but its response is lost, retrying that token can trigger the existing server-side replay protection and require login. This client fix does not weaken token-family revocation or pretend to solve ambiguous delivery. Durable recovery would require an explicitly reviewed protocol change.

### 2. Account-generation checks missed successful and decoded responses

Previously the API client checked account changes only along the 401 retry path. A delayed HTTP 200 from the old account could return after new credentials were stored. A retried HTTP 200 could also return after logout. Both scenarios failed new tests. An additional test demonstrated that account changes during asynchronous JSON decoding still returned the previous account's data.

Correction: use the existing credential epoch before sending, after receiving initial/retried responses, and after decoding apiJson results. Old-generation results reject with “Session changed”; they are not replayed under the new identity. No competing session store was introduced. Requests already received by the server are not undone; server authorization remains authoritative. These tests demonstrate the stale-result hazard, not a claim of observed production data leakage.

### 3. Logout waited for the server before clearing local credentials

Previously logout retained credentials during remote revocation and unconditionally deleted credentials in finally. A subsequent login could therefore be erased by an older logout completing. The new pending-logout test reproduced retained local credentials before the fix.

Correction: check that the account generation has not changed while reading credentials, clear local credentials through the existing serialized store/listener path, then revoke the captured server session. No late finally deletion remains. Tests verify immediate local removal, preservation of a subsequent login and local sign-out even when remote revocation fails. Remote errors are still reported by the logout promise; they are not converted into successful revocation.

## Existing protections confirmed through source and mobile tests

| Area | Implementation and evidence | Limits |
|---|---|---|
| Secure persistence | One schema-validated SecureStore credential record; serialized writes; conditional refresh-token replacement; old separate keys removed on clear | Actual OS storage/keychain behavior not exercised; storage I/O failure and corrupted-record recovery need device-level validation |
| Access tokens | Backend HS256 signature, issuer, timestamps/expiry and UUID checks; default access lifetime 15 minutes, permitted range 1–60 | No live backend JWT execution this task |
| Refresh tokens | 32 random bytes, SHA-256 hashes in DB, rotation and session-family lock; reused token revokes family; 30-day session lifetime | Transactional/concurrency behavior reviewed in source/tests, not rerun against PostgreSQL |
| Mobile refresh | Shared flight for same refresh token; delayed old-token 401 reuses completed rotation; exactly one retry; second 401 clears credentials | Does not make offline requests succeed |
| Restoration | Reads credentials then authoritative /users/me; schema validates identity/roles/onboarding; restoration counter rejects superseded attempts | No native cold start performed |
| Routing | Root Stack stays mounted; protected groups require completed onboarding and authorized role; homeRoute sends incomplete accounts to onboarding | Dual-role default home is customer; last-used-role persistence is not implemented or claimed |
| Authorization | Backend derives authorities from current user/session; suspended/deactivated users denied; role-specific profile edits checked server-side | No privilege changes or live cross-role tests performed |
| Cache isolation | Account observer clears private query cache on identity change; session tests now reject late responses | Native account switching remains a separate acceptance gate |
| Logout | Local credential listener clears session; server revokes the token's session family | Offline revocation cannot be guaranteed; some profile callers catch logout failures without surfacing remote-revocation status |
| Unauthorized responses | Initial 401 may refresh once; refresh rejection and second 401 sign out; ordinary resource 403 does not destroy credentials | Access denial is not treated as successful access |

signIn stores credentials and delegates to loadSession. Identity-load failures are represented in session.error rather than thrown by signIn; the root/home error UI provides retry and sign-out. The verification animation can mark itself ready despite that error state. This was not changed without a demonstrated component/native failure. No authenticated session is fabricated from token payloads alone.

## Verification results

### Reproduction before fixes

- Existing session baseline: 8/8 passed.
- Added initial six cases: 8 passed, 6 failed, confirming temporary-refresh deletion, delayed response acceptance and pending logout behavior.
- After initial fixes: 14/14 passed.
- Added JSON decoding race: 18 passed, 1 failed; then corrected the result boundary.

### Final verification

- Focused run: session.test.ts, api.test.ts, foundation.test.tsx, root-mount.test.tsx, labourly-foundation.test.tsx and onboarding.test.tsx — **48 passed, 0 failed; 6 suites; 18.459 seconds**.
- Session-specific coverage within that run: **19 tests**, including concurrent rotation, late 401 reuse, definitive refresh failure, nonrecursive retry, logout during rotation, account changes, restoration, offline/429/503 refresh, delayed successful responses/JSON, offline logout, expired credentials, absent credentials and resource 403.
- Full `npm test`: **160 passed, 0 failed; 30 suites; 53.719 seconds**. No skipped tests reported.
- `npm run typecheck`: PASS, exit 0.
- `npm run format:check`: PASS, exit 0.
- `npm run lint`: PASS, exit 0.
- `git diff --check`: PASS; line-ending conversion notices only.

Full regression emitted two act(...) warnings from unchanged DiscoverContent tests. They were not suppressed. The intentionally failing pre-fix logout test left a deferred request pending and emitted an open-handle warning; final focused/full runs exited normally. An initial test-append command used the wrong relative path and wrote nothing; the corrected command added the cases before reproduction. No failed check has been counted as a pass.

Backend integration tests were NOT RUN because database/Docker services are prohibited. Their source covers OTP hash/limits/reuse/concurrency, expired and forged JWTs, refresh replay/concurrency, logout, server authorization, profile ownership and dual-role isolation. These are coverage inventory, not fresh passing results.

## Production OTP readiness

### Provider contract

OtpProvider.sendOtp(phone, otpCode) is the current delivery interface. Default verifyOtp compares the submitted code with the BCrypt hash. Keep challenge generation, expiry, attempts and verification on the existing server path; a provider-owned verification scheme would require an explicit design review. ProductionOtpProvider currently always throws 503. No real SMS credentials or adapter exist in this change.

### Current enforced rules

- Six digits generated by SecureRandom; BCrypt hash stored, not plaintext.
- Expiry: five minutes. Verified/expired challenges rejected. Latest challenge selected; resend replaces the effective challenge.
- Resend cooldown: 60 seconds per phone, serialized by PostgreSQL advisory transaction lock.
- Verification: maximum three attempts per challenge. Attempts persist on AuthFailure via noRollbackFor; successful verification marks the challenge used.
- Mobile normalization strips spaces/parentheses/hyphens and prefixes +91 for Indian-format ten-digit numbers starting 6–9. Both sides require an international plus-prefixed 8–15 digit shape. Backend validates rather than normalizes. This is syntactic validation, not proof that the number is allocated or SMS-capable.

### Required before real SMS launch

1. Select/approve the SMS provider, sender/template/account requirements and budget; implement the adapter with bounded delivery timeouts and sanitized errors. Do not expose codes or credentials in logs.
2. Add reviewed abuse controls beyond per-phone cooldown: per-IP/device/global quotas, rolling phone limits, resend/verification abuse monitoring, cost caps and protection against many-number attacks. No general distributed rate limiter or CAPTCHA integration was identified in inspected backend code. Resend currently creates a fresh challenge/attempt budget after the cooldown.
3. Define delivery failure semantics. requestOtp invokes the provider inside its database transaction; an exception rolls back the challenge. Ambiguous provider acceptance/timeouts may still deliver a code for a rolled-back challenge. Avoid blind retries and specify deduplication/recovery. Database locks must not be held indefinitely by provider calls.
4. Inject provider credentials server-side through approved secret configuration, never EXPO_PUBLIC variables or Git. Existing JWT_SECRET is required outside dev/test, Base64 decoded and checked by the signing library. Plan rotation/deployment controls; no production secret values were read or changed here.
5. Keep HTTPS production API configuration, server clock and session revocation observability verified before release. Current mobile fallback URL is local HTTP development configuration, not a production endpoint.
6. Validate actual SMS delivery, expiry/resend/attempt races, temporary provider failures, abuse controls and no sensitive logging in an isolated acceptance environment.

### Development/production separation

DevelopmentOtpProvider is restricted to `dev & !prod & !production`, with a constructor guard. It logs development codes/phone numbers and accepts a fixed development override; therefore dev-only deployments must remain isolated. ProductionOtpProvider is selected for production profiles, including mixed prod/dev. JwtTokenProvider refuses an absent secret outside dev/test; development without a key generates a process-local key, so backend restarts can invalidate access signatures and require refresh. Existing production-profile tests cover exclusion of the development provider, but were not executed here.

## Remaining risks and recommendation

The demonstrated mobile reliability defects are fixed and regression-tested. This is not production authentication sign-off: SMS delivery/abuse protection remain incomplete; backend vulnerabilities remain UNASSESSED; actual SecureStore failure/recovery, HTTPS configuration, cold-start/session behavior and live transactional auth require separate authorized verification. No schema, native or third-party change was needed for these fixes.

Recommendation: approve review of this focused P1 mobile hardening change; keep production OTP and public-release gates blocked pending the work above. Stop at the review gate.
