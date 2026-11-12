# Labourly production authentication and delivery plan — 2 November 2026

Status: Google sign-in direction accepted by owner; NOT integrated or activated. This document does not certify public readiness.

## Authentication decision

Google sign-in can replace SMS as the primary authentication method. Name and contact number may be collected during onboarding. A typed contact number is UNVERIFIED; it must not become a login identifier, recovery credential, KYC claim, or basis for merging accounts.

Current code has a NOT NULL UNIQUE users.phone login identity. Existing OTP login resolves users by that phone. Google identities therefore cannot safely be added by assigning arbitrary contact numbers to that column. Preserve historical user UUIDs, bookings and sessions.

Proposed additive schema, to be implemented and tested before deployment:

- Separate provider identity table with unique (provider, subject), linked to existing user UUID; use Google's stable sub, not email, as the identity.
- Permit new federated users without an OTP-verified login phone. Keep existing verified phone bindings for existing accounts.
- Store entered contact phone independently with explicit UNVERIFIED status; do not make this field an automatic identity-link key.
- Link Google to an existing account only from an authenticated existing session with fresh provider authentication. Do not merge on matching typed phone/email. Define a supported recovery process for existing OTP-only users before disabling OTP.
- Reuse AuthSession, JWT and refresh/logout mechanisms after trusted provider verification. Do not create a parallel mobile session store.

Backend verification must validate Google's signature against trusted keys, issuer, allowed audience, expiry, subject and login-flow nonce where used. OAuth must use approved platform client IDs/redirects and PKCE where applicable. Verify tokens on the backend over HTTPS. Never accept client-supplied user IDs, unsigned profile objects or arbitrary token issuers.

Required configuration: Google Cloud OAuth consent/app registration, Android client signing certificate identifiers, iOS client/bundle ID, backend/web client audience configuration, approved redirect URLs. Client IDs are public configuration, secrets must stay server-side. Credentials are not yet available; do not add a button that pretends to log in.

For iOS, Google's social login brings Apple guideline 4.8 into scope. Plan Sign in with Apple or an equivalent compliant privacy-preserving option; do not assume an exemption for this consumer marketplace.

Sources: https://developers.google.com/identity/sign-in/web/backend-auth and https://developer.apple.com/app-store/review/guidelines/#login-services .

## Device location verification boundary

Home/Find Jobs use currentSearchLocation: foreground permission, enabled location services, OS getCurrentPositionAsync, finite coordinate checks and a 15-second position timeout. Physical devices supply OS location; Android emulators may supply simulated coordinates. Expo does not turn a catalogue example city into a real GPS position.

Onboarding now reuses this bounded lookup. No nearest-city point is treated as proof of administrative state/district. User-selected catalogue locations are explicit search centres, not verified device boundaries. Physical-device proof remains pending; mocked tests only prove software behavior.

## Requested delivery scope and dependencies

| Area | Remaining implementation or acceptance |
|---|---|
| Google authentication | Additive schema/account-linking work, provider registration, client integration, replay/revocation/session tests, account recovery, iOS equivalent login |
| Discovery | Home manual/GPS precedence fixes in current checkpoint; database-backed trade/coverage regression and physical GPS acceptance pending |
| Requirements | Existing draft/publish/date validations; component tests run in current checkpoint; isolated database and real two-device network-failure verification needed |
| Quote acceptance | Existing requirement/worker locks and unique accepted-quote/booking indexes; concurrency integration rerun pending Docker |
| Chat | First-thread booking row lock added; isolated concurrent and participant-only delivery tests prepared. Bounded history, ambiguous-send idempotency, reporting/blocking/moderation remain open |
| Booking lifecycle | Define and implement authorized start/completion confirmation, conflict outcomes and support escalation; no automatic completion or historical-data rewrite |
| Notifications | Device token registration/revocation, permission handling, transactional outbox, retries/deduplication, FCM/APNs credentials, delivery tests. In-app notifications alone are insufficient |
| Support | Real support email and operator process required; reporting must reach a monitored queue with authorization and audit history |
| Privacy/deletion | Actual legal entity, privacy/terms, public website, retention decision and authenticated deletion workflow. No invented policy or deletion of historical acceptance records |
| Hosting/security | Approved provider/domain, HTTPS, secrets manager, database backup/restore, restricted admin, monitoring, reliable vulnerability scan |
| Release | Secure signing, Google/Apple platform configuration, standalone build, physical-device/two-account accessibility and session tests |

No production setup, SMS, Google login, push delivery or legal publication has been activated by this plan. Original database and migrations are preserved. External setup and policy decisions remain explicit gates rather than fabricated production values.

## 2 November setup update from owner

- Supplied business/product name: Labourly. Registered legal-entity details have not been independently established.
- Owner-supplied support email: labourly.work@gmail.com. Mailbox delivery and response operations have not been tested.
- Owner has no Apple Developer account.
- A Google project exists according to the owner, but the supplied credential was for Gemini, not OAuth login. The credential was not used or saved in project files; revocation was recommended. Its value is deliberately omitted.
- Google OAuth app/client registration and Firebase/FCM setup remain unverified. An AI API key does not satisfy either requirement.
