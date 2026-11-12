# P1.5 — production OTP security and integration plan

Date: 2026-10-27. Status: design/review gate; production SMS NOT enabled.

## Scope and outcome

Audited AuthService, AuthController, OtpChallenge/repository, OtpProvider implementations, JwtTokenProvider, refresh/session logic, SecurityConfig, existing migration definitions and authentication test source. No accounts or credentials were used. Production code was not changed: the existing expiry, per-challenge attempt and production-profile controls behaved as implemented; the missing distributed abuse/delivery controls need approved storage/deployment decisions. Adding an arbitrary in-memory limiter would not provide a reliable multi-instance production guarantee.

Added only:

- `backend/src/test/java/in/nammacrew/auth/OtpSecurityTest.java`
- `docs/LABOURLY_P1_5_PRODUCTION_OTP_PLAN_20261027.md`

No schema, migration, API, mobile, dependency or production configuration changes. Existing working-tree changes were preserved. No Docker, database, Android build, emulator, real SMS, registration, payment, commit, push, tag or deployment.

## Ranked findings

Severity describes impact and launch priority; findings are not a claim of exploitation.

| Severity | Finding and evidence | Required action |
|---|---|---|
| High — launch blocker | No IP/device/global or rolling per-phone budget in inspected auth path. requestOtp only checks latest challenge age. Different numbers bypass per-phone cooldown; a resend after 60 seconds starts a fresh three-attempt budget. | Approve shared atomic request/verification quotas, trusted proxy policy, spend caps and alerting before enabling SMS. Device IDs are spoofable signals, not authorization. |
| High — launch blocker | Provider call runs inside requestOtp's transaction and phone advisory lock. Provider acceptance followed by timeout/DB rollback can deliver an unusable code; rollback also removes cooldown evidence. | Approve durable delivery/idempotency design and bounded provider I/O. Do not blindly retry ambiguous sends or switch providers. |
| High — configuration-dependent | Development provider logs codes/phones and accepts a fixed bypass. It is excluded when prod/production is active, but deploying dev alone publicly would still be unsafe. | Deployment profile allowlist, fail-fast secret/config validation, restricted dev environment and log retention. Tested profile isolation does not validate an actual deployment. |
| Medium — current availability exposure | Public request endpoint can consume database/advisory-lock/BCrypt work for many syntactically valid numbers, including when production delivery ultimately returns 503. No global admission control was found. | Reject overload before expensive work; protect both request and verification endpoints with reviewed shared controls. |
| Medium — policy gap | API validates general international syntax, not Indian mobile eligibility. Current controller requires canonical plus-prefixed digits; mobile does convenience normalization. No country spend allowlist exists. | Approve India-only launch policy; preserve canonical API contract, validate +91 mobile destinations at the delivery boundary if approved. Do not silently reinterpret existing stored numbers. |
| Medium — operational gap | No provider delivery IDs, authenticated callback endpoint, delivery-state persistence, reconciliation or OTP retention cleanup identified. Expired rows are rejected but retained. | Approve retention, minimal delivery metadata, callback authentication and deletion schedules. Never mark authentication successful from a delivery receipt. |
| Blocked feature, fail-closed | ProductionOtpProvider always throws HTTP 503; it does not send SMS. | Implement only after provider, DLT, budget, security and deployment approvals. Do not replace with success or fake delivery. |

No production-profile fixed-code authentication bypass was found. No new JWT/refresh defect was demonstrated in this scope. Backend dependency vulnerabilities remain UNASSESSED; this is not a vulnerability scan.

## Existing security contract

- Six-digit code from SecureRandom; BCrypt hash stored. Database bounds protect attempt count and expiry ordering. Short OTP entropy still demands online abuse limits and protection of database backups.
- Five-minute validity; expired or verified challenge rejected. Latest challenge selected, so resend makes previous codes ineffective even if still within their original lifetime.
- Sixty-second per-phone resend cooldown, including exactly-60-second boundary; phone advisory transaction lock serializes requests/verifications. Distributed transaction behavior is source-reviewed, not tested here.
- Three wrong attempts per challenge. AuthFailure does not roll back verification attempts; successful challenge is single-use. Malformed codes fail without comparison. This is not a rolling account lockout.
- API accepts `+[1-9][0-9]{7,14}`; no proof of allocation or SMS capability. Mobile strips common formatting and prefixes +91 for its supported Indian ten-digit format. Server does not perform that convenience normalization.
- JWT: HS256 signature, issuer, UUID identity/session, expiry checks; default access lifetime 15 minutes, allowed 1–60. Non-development startup requires JWT_SECRET. Server checks session revocation, account status and current roles rather than trusting client roles.
- Refresh: 32 random bytes, stored SHA-256 hash, rotation, family locking and reuse revocation; session expiry 30 days. Logout revokes the session. Lost rotation responses can require reauthentication; no replay grace is introduced.
- Production profile expressions exclude the development provider even for prod+dev or production+dev. Test-only profiles depend on test fixtures; no production bypass should be supplied for them.

## Tests executed — no external services

Java 21.0.12.1; cached Maven dependencies, offline mode. Command from repository root:

```text
backend/mvnw.cmd -o -f backend/pom.xml test -Dtest=OtpSecurityTest,SecurityTest,BookingStateTest
```

The actual invocation also included a scoped Spotless apply goal before test. Surefire ran only the explicitly listed classes; the integration-test lifecycle was not invoked.

| Test class | Passed | Failed/errors/skipped | What it establishes |
|---|---:|---|---|
| OtpSecurityTest | 15 | 0 / 0 / 0 | Seven default/production/mixed profile combinations; constructor guard; no production fixed-code bypass; missing production JWT secret; isolated dev selection; hashing/expiry; cooldown and boundary; invalid phone; used/expired challenge; attempt cap; provider failure propagation |
| SecurityTest | 3 | 0 / 0 / 0 | MockMvc authorization: anonymous protected mutations/admin/docs denied; customer admin access denied |
| BookingStateTest | 1 | 0 / 0 / 0 | Existing pure state-machine regression |
| **Total** | **19** | **0 / 0 / 0** | Maven BUILD SUCCESS |

OtpSecurityTest uses mocked repositories/JdbcTemplate and a provider-only Spring context, not Boot auto-configuration or a database. BCrypt cost 4 is test-only; production encoder configuration was untouched. SecurityTest uses an in-process MVC test slice, not a network server.

Mocked tests establish control flow and in-memory attempt updates, not transactional persistence, advisory-lock concurrency or rollback. AuthenticationIT and ProductionAuthIT are **NOT RUN**, as are all PostgreSQL/Testcontainers integration tests. ProductionAuthIT remains necessary to prove full HTTP/profile wiring and rollback in an isolated database later.

Warnings: existing @MockBean deprecations during compilation; Mockito/Byte Buddy dynamic-agent and JVM class-sharing warnings. No warning suppression or JDK/dependency changes. A scoped formatting command initially matched no file; an attempted glob was rejected because Spotless expects a regex. The corrected `-DspotlessFiles=.*OtpSecurityTest.java` formatted the new test and passed. Full backend Spotless check is recorded below. No unrelated source was reformatted.

## Provider options and evidence

These are evaluation candidates, not an activated provider or a reliability ranking. No provider account was opened and no test SMS was sent.

| Candidate | Fit / integration | Open due diligence |
|---|---|---|
| MSG91 domestic SMS | India SMS API and customizable delivery webhooks; can transport Labourly-generated codes while retaining the existing verifier | Confirm DLT onboarding, selected route/template category, callback security, message-id/idempotency support, retention, support SLA and carrier delivery performance |
| Twilio Programmable Messaging | Replaceable HTTP adapter with message lifecycle callbacks and documented callback signature validation | Confirm eligible Indian domestic route, DLT/sender setup, contracted pricing, data handling and carrier performance; do not substitute Twilio Verify without redesign approval |

MSG91's published India-to-India page lists ₹0.25/SMS for a 5,000-message pack and ₹0.18/SMS for 30,000; the displayed 30,000 example adds 18% GST. These are published examples, not a Labourly quote or a guarantee for the chosen OTP route. Obtain a current written quote including DLT/operator fees, taxes, failed-send billing, minimum commitments and segment/Unicode costs. [MSG91 pricing](https://msg91.com/in/pricing/sms).

Twilio offers published India pricing, but no account-specific domestic quote or comparable landed price was established in this review. [Twilio India pricing](https://www.twilio.com/en-us/sms/pricing/in). Compare effective cost per successful verification, not only per submitted message: segments × sends/resends × billed attempt rate, plus recurring and regulatory charges.

Delivery receipts distinguish provider acceptance from later delivery/failure; neither proves the user read the OTP. MSG91 supports request/report events and custom correlation fields/headers; its reviewed page does not establish signed payload authentication. Require an approved secret-header/signature mechanism and replay controls; if unavailable, use authenticated server-to-provider status reconciliation rather than trusting public callbacks. [MSG91 webhook documentation](https://msg91.com/help/webhook-new/how-to-receive-sms-delivery-reports-via-webhook-new).

Twilio documents status changes and recommends SDK signature validation. Use its exact signed request validation scheme, accounting for reverse-proxy URL handling; do not implement an assumed generic HMAC scheme. [Status callbacks](https://www.twilio.com/docs/messaging/guides/outbound-message-status-in-status-callbacks), [Message resource/security guidance](https://www.twilio.com/docs/messaging/api/message-resource).

### Indian DLT and template preparation

TRAI sender guidance covers principal-entity registration, registered headers/content templates, and PE/header/content identifiers supplied with messages. Its indexed official guidance was available; direct page fetch timed out. Confirm current operator requirements before activation. [TRAI advice to senders](https://www.trai.gov.in/advice-to-senders).

Do not label every login OTP “transactional” automatically: choose the operator-approved service/transactional category for Labourly's actual use case. Confirm PE–telemarketer chain and route eligibility with the chosen provider/operator. Keep promotional material out of login messages and match approved fixed text/variables. [Twilio India guidelines](https://www.twilio.com/en-us/guidelines/in/sms), [Airtel DLT help](https://www.airtel.in/business/commercial-communication/help).

Proposed template for registration review only: “Your Labourly login code is {code}. Valid for 5 minutes. Do not share this code.” Final text, sender, category and variables require approval; this draft is not a registered template. Never bypass registration with unapproved routing.

## Replaceable adapter design — proposed, not implemented

Retain existing mobile endpoints and OtpProvider verification contract. Keep OTP generation/hash/verification inside Labourly. Separate a delivery transport behind an internal interface:

```text
SmsDeliveryAdapter.send(deliveryId, canonicalPhone, templateKey, code, expiresAt)
  -> accepted(providerMessageId) | rejected(safeReason) | unknown(correlationId)
SmsDeliveryAdapter.verifyCallback(rawRequest) -> authenticated delivery event
```

Use typed outcomes; do not interpret provider HTTP 200 alone as acceptance. No raw provider response or secret should reach the app. SMS transport must never mint tokens, grant roles or validate codes. The current public OTP request response remains a success acknowledgement, never a delivery guarantee.

### Transaction and outage strategy

Recommended durable design requires approval for additive schema and secret configuration:

1. Atomically reserve phone/request quota and persist a challenge plus a bounded delivery job before outbound I/O; preserve latest-challenge semantics.
2. Delivery outside the phone transaction, with short connect/total timeouts, bounded concurrency and circuit breaker. Recheck expiry/current challenge before sending. A crash must not erase the send budget.
3. Stable delivery ID across retries. Persist provider ID/outcome and deduplicate callbacks. Only retry definitely-unsent, retryable failures; reconcile ambiguous acceptance before retry/fallback.
4. A durable asynchronous job needs recoverable code material: never pretend the BCrypt hash can reconstruct the SMS code. If approved, store only short-lived encrypted delivery payload with separately managed key, access restrictions and prompt deletion after send/expiry. Never log or retain plaintext OTP in an outbox. Alternatively approve a different synchronous state machine and its crash limitations.
5. An authenticated receipt changes delivery metadata only, never challenge verification or expiry. Ignore duplicates/out-of-order events and never revive an old challenge.
6. Fail closed on outage: bounded retry/cooldown and safe error to the client. No development bypass, no fake success, no automatic paid fallback. A secondary provider requires separately approved accounts, DLT mapping, deduplication and budget.

Acceptance targets must be agreed before selection: measure p50/p95 delivery and verification completion across major Indian carriers/regions, delayed/out-of-order SMS, provider timeouts, rejection, callbacks and outage recovery. No empirical reliability figures are available from this task.

### Abuse controls proposal

Use shared atomic limits for canonical phone, trusted client IP, device risk signal and system-wide send/spend budgets. Protect verify as well as request; count rejected/failed delivery attempts without retaining OTP plaintext. Decide rolling limits/retention and recovery windows with expected launch traffic, rather than silently imposing arbitrary caps. Avoid permanent victim-account lockout that attackers can trigger. Apply gateway admission limits before DB/BCrypt work, enforce application-level phone limits across replicas, and fail closed for new SMS sends when quota storage is unavailable. Do not trust arbitrary X-Forwarded-For headers; trusted proxy topology needs deployment approval. Device identifiers are resettable/spoofable and must be privacy-minimized.

## Configuration and approval checklist

Proposed settings, not added to production configuration: selected provider and enable flag (default off), API endpoint allowlist, server-only credential secret reference, DLT PE ID/header/template mapping, callback validation secret reference, connect/request timeouts, quota budgets, spend circuit breaker, retention and encryption-key reference if durable delivery is approved.

Required approvals before implementation/activation:

1. Provider shortlist/selection, contract, price and permitted Indian route; entity/DLT/header/template/chain registration.
2. Distributed rate-limit storage and trusted proxy deployment, rollout policy and exact limits.
3. Additive delivery-state/outbox schema and encrypted-payload retention/key management, or an explicitly accepted alternative.
4. Secret provisioning, production profile allowlist, callback hosting and monitoring; no secrets in Git or mobile EXPO_PUBLIC variables.
5. Isolated PostgreSQL integration acceptance and later approved real SMS carrier tests with synthetic/consenting numbers and a cost cap.

**Production SMS remains BLOCKED.** No further code change is proposed as safe to activate within this task's schema/deployment restrictions. Request approval for the above design choices before implementation; stop at this review gate.

Final formatting verification: backend/mvnw.cmd -o spotless:check (from backend) — PASS; 73 Java files checked, zero needing changes. Test artifacts are available locally in backend/target/surefire-reports (generated, not staged).
