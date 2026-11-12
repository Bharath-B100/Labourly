# Google sign-in implementation checkpoint — 2 November 2026

Status: backend foundation implemented and tested; native Google sign-in NOT COMPLETE. Not a production-release approval.

## Implemented

- Google RS256 signature verification against Google's fixed HTTPS JWKS endpoint using the existing JJWT dependency. Checks issuer, audience, expiry, issue time, subject and nonce. Token-controlled key URLs are never fetched. Verification failures do not issue sessions.
- Five-minute server-signed nonce challenges and transactional redemption prevent challenge replay. Challenge tokens cannot serve as access tokens.
- Google identities map by provider plus subject. Concurrent first logins serialize on that identity. Typed phone numbers and email addresses never automatically merge accounts.
- Existing OTP users can explicitly link Google after a recent authenticated login through the backend endpoint. Native linking UI remains pending.
- The existing Labourly access/refresh/logout session implementation is reused. New accounts receive no privileged roles.
- Separate, optional, explicitly unverified contact number field alongside the profile name. Saving contact information does not change the verified OTP login phone. Late save responses cannot update another signed-in account.
- Profile phone-verification labels distinguish actual OTP phone bindings from unverified contact details.

## API and migration

- POST `/api/v1/auth/google/challenge` returns `challenge` and `nonce`.
- POST `/api/v1/auth/google` accepts `idToken` and `challenge`; returns existing AuthTokens contract.
- POST `/api/v1/users/me/google` links an identity to the recently authenticated account; conflicts reject linking.
- PUT `/api/v1/users/me/contact` accepts an E.164 phone or null, returns UserView.
- UserView adds nullable contactPhone; Google-only users expose an empty login-phone string for compatibility.
- V16 permits null OTP phone for Google users and adds contact_phone, external_identities, google_login_redemptions and associated constraints/indexes. Existing phone bindings remain unique.
- V16 was exercised ONLY in disposable Testcontainers PostgreSQL databases. No original database migration, protected-record modification or normal backend restart occurred.
- Rollback is not a blind downgrade: once Google-only accounts exist, restoring the old NOT NULL phone requirement would fail. Preserve identities and use a forward compatibility fix.

## Verification

Backend command: `mvnw.cmd -o test -Dtest=GoogleTokenVerifierTest,GoogleAuthIT,OtpSecurityTest,MigrationIT,ChatConcurrencyIT,MarketplaceControllerIT,MarketplaceIT,QuotationConcurrencyIT,QuotationIT,ServiceCoverageIT -DfailIfNoTests=true`.

Result: **79 tests, 0 failures, 0 errors, 0 skipped**, Maven BUILD SUCCESS, 50.192 seconds. Evidence: `.tools/google-backend-regression.log` and Surefire reports. This is the selected regression set, not the entire backend suite.

Coverage includes real RSA signature rejection, invalid claims, challenge replay, stable identity mapping, existing-account linking conflicts, disabled accounts, concurrent first login, refresh/logout, migration upgrades, chat concurrency, quotation acceptance concurrency and geographic discovery.

Initial cryptographic unit run failed during eager Java HTTP-client loopback initialization, before assertions. HTTP-client creation is now lazy; the subsequent signature tests pass. Actual Google HTTP/JWKS traffic is NOT verified by mocked-provider integration tests.

Backend Spotless check passed after formatting only the selected changed Java files. An initial Windows command-line regex quoting failure did not execute formatting; the correctly quoted retry passed.

Mobile verification results are recorded below after completion. The first contact account-switch test timed out because its test helper awaited the deferred response before switching accounts. The test now switches the account in the mocked request before response resolution, retaining the isolation assertion.

## Exact files touched for this checkpoint

Backend:
- src/main/java/in/nammacrew/auth/GoogleAuthController.java (new)
- src/main/java/in/nammacrew/auth/GoogleAuthService.java (new)
- src/main/java/in/nammacrew/auth/GoogleTokenVerifier.java (new)
- src/main/java/in/nammacrew/auth/AuthService.java
- src/main/java/in/nammacrew/auth/JwtTokenProvider.java
- src/main/java/in/nammacrew/user/User.java
- src/main/java/in/nammacrew/user/UserView.java
- src/main/java/in/nammacrew/user/UserController.java
- src/main/java/in/nammacrew/user/ProfileService.java
- src/main/resources/db/migration/V16__google_identity.sql (new)
- src/test/java/in/nammacrew/auth/GoogleAuthIT.java (new)
- src/test/java/in/nammacrew/auth/GoogleTokenVerifierTest.java (new)
- src/test/java/in/nammacrew/auth/MigrationIT.java
- src/test/java/in/nammacrew/FoundationIT.java

Mobile:
- src/auth/session.ts
- src/app/(customer)/profile.tsx
- src/app/(worker)/profile.tsx
- src/components/ProfileSettings.tsx
- src/onboarding/ProfileEditor.tsx
- src/onboarding/ContactPhoneField.tsx (new)
- src/__tests__/contact-phone.test.tsx (new)

This report is new. Other working-tree changes predate this checkpoint and are preserved.

## Native blocker and remaining work

The official npm registry returned ECONNRESET, including a bounded attempt and HTTPS curl connectivity check. No TLS bypass, untrusted mirror or credential was used. The native Google sign-in module has NOT been installed, and no dependency or lockfile was changed for it. No inactive Google login button was added.

Next steps:
1. Restore official registry connectivity; install an Expo-compatible native Google sign-in module through Expo tooling after reviewing its exact package/version contract.
2. Connect Android native Google login and explicit existing-account linking to the challenge/login/link endpoints and existing session store. Handle cancellation, token errors, unavailable network and account switching.
3. Verify nonce semantics against the actual SDK, configuration, consent screen/test users, Android package and signing fingerprint. The existing application package is in.nammacrew.mobile; creating an OAuth client for in.labourly.mobile would not match this APK.
4. Build a new development APK; a Metro reload cannot add the missing native module. Test actual Google account login, cold-start restoration, logout, role onboarding and linking on a device.
5. Confirm the production Play signing certificate/client setup separately. iOS requires its own client configuration and Apple distribution setup, which are not supplied.
6. Test live JWKS retrieval, rotation/cache behavior, outages and bounded response-body handling. Add endpoint-level invalid-input/authorization tests and deployment-level abuse controls before public exposure.
7. Recheck linking freshness immediately at the transactional boundary and concurrent logout/link semantics before production approval.
8. Plan and approve deployment/migration separately; current running backend has not been replaced.

No OAuth client secret or Gemini credential is needed for this ID-token verification flow. Neither was saved or used. Previously shared secrets should be rotated in their provider consoles. No commits, pushes or deployment performed.

## Final mobile results

- Full Jest suite: **208 passed, 0 failed; 36 suites passed**, 49.418 seconds; exit 0. Evidence: `.tools/google-mobile-tests-complete.log`.
- TypeScript: PASS, exit 0 (`.tools/google-mobile-types-complete.log`).
- ESLint: PASS, exit 0, no lint warnings (`.tools/google-mobile-lint-complete.log`).
- Full mobile Prettier check: PASS, exit 0 (`.tools/google-mobile-format-complete.log`).
- Jest still reports a React act warning from the existing discovery test asynchronous query updates; it is not a failed test and has not been hidden.
- Contact regression cases: valid save without changing identity, invalid input without API request, network-failure retry, clearing optional contact, and late response/account-switch isolation.
- Native Google sign-in, real Google token issuance, current APK compatibility and production release: NOT VERIFIED / BLOCKED by the missing native integration and registry connectivity.
- `git diff --check` returned 0. Existing line-ending conversion notices are present. No staging or Git state changes were made.
