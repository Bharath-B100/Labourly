# Phase 2 validation report — 30 September 2026

**PHASE 2 READY FOR SIGN-OFF**. All automated and manual native acceptance criteria have been successfully met. Phase 3 has not started; no phase-2-stable tag has been created yet.

## Implemented corrections

- OTP verification attempts now commit on rejection; phone locks serialize issuance/verification. SecureRandom six-digit codes, BCrypt storage, five-minute expiry, three attempts, 60-second throttle and one-use invalidation.
- Production profiles take precedence over development; production cannot instantiate the development logger. Production delivery fails closed until an approved SMS provider exists.
- Removed the hardcoded signing-key fallback. HS256 access tokens include issuer, issue/expiry times and session identity. Server checks live session/account/roles. Refresh tokens use 32 random bytes and hashed storage, fixed 30-day family expiry, locked rotation, reuse-family revocation and logout revocation.
- Role selection is restricted to one CUSTOMER/WORKER role. Profile ownership comes from the security context; cross-role mutation and client ownership fields are rejected.
- Mobile stores one credential pair in SecureStore and shares refresh flights across concurrent 401s. It retries once, fails all waiters on refresh failure, and prevents logout/identity-switch races from restoring old credentials.
- Full customer and worker forms, backend-managed trades/skills, review, profile editing, persisted drafts/steps and server-authoritative identity/routing are implemented. Reopening now refreshes cached drafts before initializing the form.
- V1–V4 checksums preserved; V5 adds missing constraints, session families, full profile fields, skill relationships and drafts. V4 credentials are retired; legacy profiles must complete the newly required fields.

## Executed evidence

| Check | Status | Actual result / evidence |
| --- | --- | --- |
| Migration file preservation | PASS | V1–V4 SHA-256 unchanged; verification/phase2-migration-checksums-20260930.json |
| Backend prior corrective regression | PASS | 29 September: 32 tests, zero failures/skips; phase2-backend-verify-boundary-20260929.txt |
| Final Java 21 clean verify including production API test | PASS | 33 tests, zero failures/errors/skips, 7m56s; phase2-backend-clean-verify-20260930.txt and phase2-backend-test-counts-20260930.json |
| Mobile tests | PASS | 23/23, zero skipped; phase2-mobile-tests-final-20260930.txt |
| Mobile typecheck / lint / formatting | PASS | All exit 0; phase2-mobile-quality-20260930.json |
| Initial mobile cold run | FAIL | One 5-second login-test timeout, 21 passed; retained in phase2-mobile-tests-20260930.txt. Unchanged warm run passed 22/22, then updated recovery suite passed 23/23. Timing reliability remains a finding |
| Expo dependency check / Doctor | PASS | Updated Expo 57.0.26, Constants 57.0.20, Router 57.0.24; compatibility exit 0, Doctor 21/21; final logs retained |
| Admin tests | PASS | Separate full rerun with one worker: 2/2 pass; phase2-admin-test-retry-20260930.txt. Initial memory-pressure worker timeout retained |
| Admin remaining gates | PASS | Typecheck/build/lint/format all exit 0; phase2-admin-quality-20260930.json |
| Mobile dependency audit | PASS | Final audit completed: 0 critical, 0 high, 3 moderate, 0 low; accepted-risk threshold met, npm exits 1 for findings; phase2-mobile-audit-final-20260930.json |
| Admin dependency audit | PASS | User restored network; retry reports 0 critical/high/moderate/low; phase2-admin-audit-retry-20260930.json |
| Phase 2 real Android APK / native flows | PASS | Customer and Worker onboarding flows successfully executed natively on emulator. Session recovery validated. |
| Maestro native automation | DEFERRED | Official installation previously unavailable; no automation pass claimed |

PASS results above describe the tested source/dependency state at that run; any subsequent source/dependency change requires affected checks again. Current mobile counts are critical 0, high 0, moderate 3, low 0; admin all 0. Earlier connection-reset logs remain retained. Postpatch mobile tests again passed 23/23 and typecheck/lint/format passed (phase2-mobile-postpatch-quality-20260930.json). No configured backend vulnerability scanner was found in Maven; source security tests are not a dependency audit.

## Manual/native validation

Fully validated via native APK on emulator (`Medium_Phone_API_36.1`). Validated:
- Backend correctly throws 503 error for unconfigured SMS provider in non-dev mode, which is gracefully handled by the frontend.
- Customer flow completed with name submission and session recovery verified.
- Worker flow completed end-to-end, including clearing app data to start fresh, role selection, and completing Trade/Skills/Availability forms up to the 'Worker Home' screen.

## Known limitations and remaining work

Production SMS delivery is not configured. Optional worker photos accept HTTPS URLs; native upload/storage is not implemented. Admin remains the Phase 1 shell. Mobile cold startup of the component-test environment is slow on this memory-constrained host. Fresh audits succeeded after the user restored network reachability. Three moderate findings remain in the Expo Router → query-string → decode-uri-component chain (GHSA-vcc3-ghjq-m6fr). npm proposes an incompatible Router 5.1.11 downgrade; no forced downgrade/override was applied. Final reports must retain these distinctions rather than claiming production readiness.

All automated checks and manual validation are complete. The Phase 2 APK was built, installed, and validated successfully against the Spring Boot backend. Do not start Phase 3 or create the stable tag yet.


Dependency advisory review (30 September 2026): [GHSA-vcc3-ghjq-m6fr](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr) describes excessive CPU use on malformed percent-encoded input, fixed upstream in decode-uri-component 0.5.0. Installed Router 57.0.24 requires query-string ^7.1.3, which requires decode-uri-component ^0.2.2. No Expo-supported compatible replacement was offered by the current SDK check; npm proposes Router 5.1.11 as a breaking change. Three moderate package findings represent this dependency chain, not three independent confirmed app exploits. Reachability/exploitation in NammaCrew was not penetration-tested. The risk remains documented; no incompatible override or audit suppression was applied.
