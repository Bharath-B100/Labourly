# Labourly support contact and isolated verification — 2 November 2026

## Owner setup received

Product/business name supplied: Labourly. Support email supplied: labourly.work@gmail.com. This does not independently verify a registered legal entity or mailbox delivery. Apple Developer account is not available. Google OAuth clients are not configured by this checkpoint.

The owner supplied a Gemini credential while discussing sign-in. It was not used, tested, copied into source, or saved in reports. Revocation was recommended. Google sign-in requires OAuth configuration, not a Gemini API key.

## Support change

`mobile/src/components/LabourlyMyProfileScreen.tsx` now displays the owner-supplied support email and opens a mailto composer only on a deliberate user tap. It does not send email automatically, prefill personal account data, or claim that a ticket was created. If no mail application opens, the address remains selectable with explicit fallback guidance.

Removed fabricated 24/7 helpline, toll-free number, unsupported immediate-response promise and old support@nammacrew.in address. Removed the scripted assistant's presentation as a support channel from this modal. No invented response SLA replaces them. A mailbox is not a moderation, reporting, deletion or ticket-management backend; those remain separate launch requirements.

Regression tests added in `mobile/src/__tests__/labourly-my-profile.test.tsx` cover composer success, no email handler, correct address, absence of fabricated helpline and no false sent-status claim. Focused result: 5 passed, exit 0. Mobile typecheck/lint/formatting: PASS, exit 0.

Native email application handling and actual mailbox delivery: NOT TESTED. No email was sent by this work.

## PostgreSQL integration evidence

Docker 29.5.3 was available after the owner's reply. Prepared selection ran with explicit disposable Testcontainers JDBC URLs and ContainerDatabaseDriver. Existing development databases were not queried or migrated.

| Test class | Passed |
|---|---:|
| ChatConcurrencyIT | 2 |
| MarketplaceControllerIT | 3 |
| MarketplaceIT | 5 |
| QuotationConcurrencyIT | 4 |
| QuotationIT | 6 |
| ServiceCoverageIT | 24 |
| Total | **44** |

0 failures/errors/skips; Maven exit 0; 46.172 seconds. V1–V15 validated/applied in disposable databases. Evidence: `.tools/launch-isolated-integration-20261102.log` and Surefire reports. New chat tests confirm simultaneous first opens return one thread and messages are readable by both booking participants while outsiders are rejected. These are backend results, not two-device native UI proof.

No original database writes, migrations, protected-record changes, server restart, commit, push, deployment, Apple enrollment, Google credential setup or paid-service activation occurred. Testcontainers created/removed its own disposable resources as part of the authorized tests; no unrelated Docker cleanup was performed.

## Changed files

- mobile/src/components/LabourlyMyProfileScreen.tsx
- mobile/src/__tests__/labourly-my-profile.test.tsx
- docs/LABOURLY_GOOGLE_LOGIN_AND_PRODUCTION_PLAN_20261102.md (owner setup status)
- docs/LABOURLY_LOCATION_CHAT_HARDENING_20261102.md (new integration evidence)
- This report.

## Next authentication setup

Use Google Cloud's Google Auth Platform (Branding, Audience and Clients) for Sign in with Google. Retain package identifier in.nammacrew.mobile. Android OAuth registration needs the appropriate signing-certificate fingerprint; backend token audience needs the corresponding web/server client ID. Do not use a debug certificate as production signing evidence. Register iOS client/platform details when the iOS release is prepared. Client IDs are shareable configuration; private client secrets, signing keys and service-account credentials must not be pasted into chat or bundled into the mobile app.

Official guide: https://support.google.com/cloud/answer/15544987?hl=en .

Public launch remains BLOCKED on the outstanding authentication implementation/setup, push, lifecycle/moderation, privacy/deletion, infrastructure/security and physical-device release gates described in the production plan.

Final full mobile regression after the support change: **203 passed / 35 suites**, 0 failures, exit 0, 61.465 seconds. Local log: `.tools/support-contact-full-mobile-20261102.log`. Component success does not establish installed-device email handling or production authentication.
