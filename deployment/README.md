# Labourly production setup — operator runbook (not deployed)

## Current boundary

No hosting, Firebase or Expo account has been provisioned by this work. No domain, HTTPS endpoint, payment method or paid service is active. The Docker template and production Spring profile are preparation only, not a working deployment or security sign-off.

## Accounts owned by Labourly

1. Sign into the Google account owned by Labourly and create/select its Firebase project. Confirm the existing OAuth project first; do not scatter OAuth, Firebase and billing across unrelated projects unintentionally.
2. Register Android using the real package `in.nammacrew.mobile`, not the display name. Production OAuth must match the Play App Signing certificate. Debug and production certificates differ.
3. Create an Expo account owned by Labourly and link the existing application to an EAS project; retain project ID in configuration only after it exists. No invented IDs or service-account keys.
4. Configure FCM v1 credentials securely in EAS or the selected direct FCM backend. Never put private keys in mobile code, Git, screenshots or chat.
5. Select hosting and a budget, then provision PostgreSQL with PostGIS, encryption, access restrictions and a verified TLS certificate. Do not expose PostgreSQL publicly.

Account sign-in, MFA, provider terms and billing remain operator actions. Avoid enabling paid plans until costs and ownership are approved.

## Prepared hosting configuration

`backend/src/main/resources/application-production.yml` is opt-in. It requires DB connection/user/password, JWT secret and Google web client ID, disables API documentation, enables graceful shutdown, validates the schema and disables automatic migrations.

`deployment/compose.production.template.yaml` uses only a supplied prebuilt image, binds the API to loopback, drops Linux capabilities and uses a read-only filesystem. Supply an immutable reviewed image digest; the template's variable name/message is not cryptographic enforcement.

Put a managed HTTPS ingress or reverse proxy in front of port 8080. Configure its certificate renewal, rate limits, body-size limits and timeouts. Ensure direct backend access is private. Forwarded-header trust must be restricted to that ingress rather than trusted from arbitrary clients.

The production configuration guard rejects combined dev/test/production profiles, missing required settings, default database passwords, unverified PostgreSQL TLS and public OpenAPI exposure. JWT strength validation remains in JwtTokenProvider. These guards do not replace secret management, vulnerability scanning or penetration testing.

## Migration and rollback

- Never point test commands at the normal or production database.
- Back up the target database consistently and restore it into a separate environment before the first deployment.
- Review additive V16 (Google identity) and V17 (support requests), then apply migrations in a controlled release job; do not use Flyway clean.
- Validate applied checksums and constraints before starting the API.
- Production app startup does not run Flyway. Provision the required PostgreSQL extensions via an approved administrative migration job, not the runtime account.
- Keep the previous compatible image. Database rollback is forward-fix by default; Google users with null OTP phone cannot run safely under old NOT NULL assumptions.

## Backups and monitoring (still to implement and prove)

Use managed encrypted backups/PITR where available, with off-host copies, restricted access and defined retention. Establish recovery-time and recovery-point targets with the owner, then perform a timed restore rehearsal. Merely scheduling backup is not evidence of recoverability.

Monitor health, latency, error rates, database capacity, background job lag, push delivery failures and certificate expiry. Keep logs free of tokens, OTPs, message bodies, private request details and precise location. Configure an actual alert destination and test it.

## Push implementation remains outstanding

Implement authenticated installation-token registration and per-account ownership, rotation and logout cleanup; Android permission prompts and denied-permission behavior; user preferences; transactional notification outbox; fenced workers, retries, duplicate protection and invalid-token handling; minimal lock-screen payloads; authorized deep links after session recovery. Test physical-device foreground/background/terminated/lock-screen delivery and account switching. Never attach cancellation reasons or chat message contents to lock-screen alerts by default.

Do not describe a request to Expo/FCM as delivered until receipts and device observations support it. In-app notification delivery must remain independent of optional push failures.

## Support operation — simple initial process

An authorized ADMIN uses the admin Support page. Read open requests, save an IN_REVIEW response visible to the user, then resolve ordinary support requests after handling them. Review queue regularly; no notification email or response SLA is currently implemented. `labourly.work@gmail.com` is the owner's fallback contact, not a promise that an email was sent automatically.

Deletion requests cannot be resolved by this UI/API until an actual erasure/retention workflow is implemented. Do not manually delete bookings to simulate completion. Assign a real support operator and define escalation for safety issues and booking disputes before launch.

## Release acceptance

Use a standalone signed AAB and Play internal testing before public rollout. Test without Metro, with production-like HTTPS, Google login, expired/revoked sessions, permission denial, manual locations, both marketplace roles, concurrent acceptance, both users seeing the same booking, cancellation, support, chat and push. Test small screens, large fonts, TalkBack, slow/offline networks, reinstall and process recreation. Physical-device evidence is required; component tests are not a substitute.

Run complete backend/mobile/admin gates and a reliable dependency scan. Backend vulnerability status remains UNASSESSED until reliable advisory data is available. Do not upload debug-signed builds or expose development OTP.
