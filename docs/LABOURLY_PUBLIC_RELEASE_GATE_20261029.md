# Labourly public release gate — 29 October 2026

**Decision: NOT READY for public release.** This is a focused checkpoint, not a completed release audit. A same-day deadline does not close external setup or verification gaps.

## Changes in this checkpoint

- `backend/src/main/java/in/nammacrew/chat/ChatService.java`: authorize booking access before both existing-thread lookup and new-thread creation. Previously the existing-thread service path skipped this check. The controller subsequently checked thread participation, so this finding is service-layer hardening, not evidence of a demonstrated HTTP data leak. Formatting normalized this class.
- `backend/src/test/java/in/nammacrew/chat/ChatAuthorizationTest.java`: three database-free regressions cover unauthorized existing-thread access, authorized reuse without writes, and creation using booking participants.
- `backend/src/main/java/in/nammacrew/chat/ChatDTOs.java`: formatting only.
- This report. Existing staged and unstaged changes remain preserved; branch inspected as `main`.

## Verification

Java 21, offline Maven: `./mvnw.cmd -o test -Dtest=ChatAuthorizationTest,OtpSecurityTest -DfailIfNoTests=true`.

- ChatAuthorizationTest: **3 passed**, 0 failures/errors/skips.
- OtpSecurityTest: **15 passed**, 0 failures/errors/skips.
- Total: **18 passed**, Maven exit **0**, 43.480 seconds.
- Focused Spotless apply and check passed (exit 0). Check result is retained in `.tools/release-chat-format-check.log`.
- Mockito dynamic-agent warnings remain; they did not fail tests.
- No database or native tests executed in this checkpoint. Unit tests do not prove concurrent thread creation, two-device delivery, production deployment, or lifecycle stability.
- Prior mobile evidence: 178 tests passed plus a separately executed worker-route test. Not represented as a fresh full-mobile run here; no mobile source changed in this checkpoint.

Private/local logs: `.tools/release-auth-chat-tests.log`, `.tools/release-chat-format.log`, `.tools/release-chat-format-check.log`.

## Public-release blockers and required next actions

1. **Production login:** ProductionOtpProvider still returns HTTP 503 while unconfigured. Development OTP must never be substituted for public authentication. Confirm SMS provider/DLT setup, then implement approved delivery, failure handling and abuse controls with integration evidence.
2. **Release signing/build:** local Android release configuration uses `signingConfigs.debug`. Establish secure release signing/Play App Signing and validate a release AAB on supported real devices. Do not upload the development APK as a production release.
3. **Privacy and account deletion:** profile explicitly says published privacy policy is unavailable. The inspected source search found no account-deletion endpoint. Implement a verified deletion-request flow with documented lawful retention, a public web request path, and accurate Data safety declarations. Do not erase protected historical records as part of preparation.
4. **Production infrastructure:** HTTPS backend URL, secrets custody, backups/restore, monitoring and production configuration remain unverified. Existing isolated development backend is not evidence of a production deployment.
5. **Native acceptance/security:** release-mode session restoration, customer/worker isolation, actual two-device booking/chat updates and supported-device lifecycle behavior need evidence. Backend dependency vulnerability status remains UNASSESSED pending reliable scanning.
6. **Product gaps:** district-first discovery/explicit wider-area fallback, full worker-profile data and truthful availability need closure against requested scope. Do not fabricate ratings, reviews, prices or verification.
7. **Notifications:** in-app notifications exist; background push remains unimplemented and is a requested pre-launch requirement.
8. **Communications/payments:** text-chat creation concurrency and operational limits require testing; private voice/video remain unavailable pending Agora setup. Wallet/payments must remain unavailable; Razorpay/RazorpayX must not be activated without approved accounts/configuration. These can be deferred only with a truthful reduced launch scope.

## Store policy sources checked

- [Google Play account deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en): account-creating apps need an in-app deletion-request path and an external web resource.
- [Google Play User Data policy](https://support.google.com/googleplay/android-developer/answer/10144311?hl=en): privacy disclosure and user-data requirements.

No commit, push, deployment, SMS activation, native build, migration, database operation or protected-record modification was performed in this checkpoint. A public release is not approved by this report.

## Owner setup confirmation

The owner confirmed that no production HTTPS backend/domain, approved SMS/DLT account, or public privacy-policy/account-deletion website is available. These are confirmed missing prerequisites, not merely unverified settings. Hosting/provider procurement and legal/business policy details require owner input; no accounts or paid services have been created.
