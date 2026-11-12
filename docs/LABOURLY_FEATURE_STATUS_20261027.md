# Labourly — source-based feature status

Date: 2026-10-27. Scope: mobile, Spring Boot backend, admin source and existing reports. Current branch: `main`.

This is a static code audit, not fresh runtime acceptance. No emulator, services, database, dependencies or application code were changed. “Implemented” below means an implementation and API path exist; it does not certify production reliability. Historical test counts are not presented as newly executed results.

## Implemented foundations

| Area | Evidence / implemented behavior | Remaining qualification |
|---|---|---|
| Labourly identity and onboarding | Mobile launch/onboarding, customer categories, individual/team profile journeys and shared UI | Full reference parity and native accessibility still need acceptance |
| Authentication | AuthController/AuthService, OTP challenge, JWT, refresh sessions, logout | Production SMS adapter is not implemented |
| Profiles and roles | ProfileController/ProfileService, role-specific profile endpoints and customer/worker screens | Native dual-role/session acceptance must remain separate from source coverage |
| Discovery | MarketplaceDiscoveryController/Service and customer discover/home routes | Home location label remains a prompt; not a fully personalized location header |
| Geographic coverage | MatchingEngine, canonical location catalogue, ServiceCoverageController; radius/district/state/nationwide concepts | GPS coordinates alone cannot reliably establish canonical administrative boundaries; retain manual selection |
| Requirements | RequirementService/Controller and post/edit/details screens | Real draft/publish workflow exists; do not confuse reference calendar design with all scheduling features |
| Quotes and hiring | QuotationService/Controller; create, edit, withdraw, accept and reject paths | Preserve quote-based hiring; sample “Hire Now” is not an alternative instant-payment workflow |
| Booking protection | BookingService/State, reservation constraints and migrations | Existing state machine does not establish a complete customer/worker start/complete/dispute workflow |
| Cancellation | Participant checks, cancellation reason/actor/time, reservation release, history and notification paths | Full operational cancellation/refund/reposting policy is unfinished |
| In-app notifications | NotificationService/Controller, list/unread/read/read-all, mobile bell/list/routes | No background push delivery implementation identified |
| Saved workers | SavedWorkerController, persisted customer-scoped save/remove/list and mobile screens | Native account isolation and lifecycle regression still require reliable acceptance |
| Admin foundation | Vite UI with health, workers, opportunities and catalogue API calls | Not a complete operational administration system |

Migration source files V1–V13 are present, including authentication, marketplace discovery, quotations, cancellation, history, geographic coverage, draft editing, notifications and saved workers. Their presence is not a fresh database checksum verification.

## Important discrepancies and unfinished integrations

### Wallet is currently a reachable demo, not an integrated payment feature

`mobile/src/app/(customer)/wallet.tsx` renders `LabourlyWalletScreen` without financial data or provider callbacks. `mobile/src/components/LabourlyWalletScreen.tsx` defaults to a 12,450 balance and sample transactions. Its Add Money handler increments local state by 2,000. These are not real balances, deposits or payments. The Profile menu says “Unavailable”, but the destination still renders this demo behavior. Older documentation describing an entirely inactive wallet is therefore insufficient for the current source.

Before customer use, remove/gate the fabricated financial display and local balance mutation. A real implementation requires approved Razorpay/RazorpayX accounts and backend orders, verified webhooks, idempotency, payment/settlement records, refunds, reconciliation, access controls and integration testing. Installing an SDK or supplying keys alone will not complete it. Provider accounts and live financial activation remain unapproved.

### Production OTP needs implementation as well as configuration

`backend/src/main/java/in/nammacrew/auth/ProductionOtpProvider.java` explicitly throws HTTP 503 because the production SMS provider is unconfigured. The authentication/session framework exists, but real customer login requires an SMS provider adapter, approved credentials/configuration and delivery/security validation. Development OTP behavior is not production SMS.

### Chat and calls are not implemented domains

`mobile/src/app/(customer)/chat.tsx` intentionally passes `isUnavailable={true}`. No Spring WebSocket messaging or Agora RTC integration was identified in the inspected application dependencies/controllers. Text messaging needs conversation membership, persistence, authorized delivery, reconnect/history/unread handling and abuse controls. Private voice/video needs approved Agora setup, server-issued tokens, permissions and call lifecycle handling. Provider selection does not mean provider integration is complete.

### Notifications stop at the in-app inbox

No FCM/Expo push delivery, device-token lifecycle or transactional delivery outbox was identified. Add approved Firebase/EAS configuration, device registration/logout cleanup, permissions, retry/deduplication and background/terminated-device tests. Existing inbox APIs should remain the source of truth.

### Settings are partly informational placeholders

`LabourlyMyProfileScreen.tsx` displays notices for KYC, language, support, privacy and terms. English is the current language; phone access verification is not government identity verification. Short notices are not complete published policies or a working support/dispute service. Review the privacy notice’s phone-sharing claim against actual access rules before publication.

## Crewza screen reconciliation

| Screens | Current code status | Left out |
|---|---|---|
| 1–4 Splash, intro, role/category, authentication | Labourly implementation and OTP UI exist | Production SMS, final native startup/session/accessibility acceptance |
| 5 Home | Real trade catalogue, navigation, search entry and notification bell | Personalized location presentation and final visual parity |
| 6 Labour listing | Real worker discovery | Full reference interaction/layout polish and real data for any future ratings/pricing filters |
| 7 Smart filters | Location/trade/radius and availability-related discovery foundation | Full reference filter sheet; real review/rate/duration contracts before exposing those filters |
| 8 Worker profile | Server profile, skills/coverage, saved-worker and hiring paths | Real reviews/KYC; private calls pending |
| 9 Post requirement | Real draft creation, editing and publication | Remaining reference composition polish |
| 10 Schedule | Requirement dates and booking conflict protection | Full calendar/time/duration experience; hourly/weekly/monthly terms need product and API support |
| 11 Chat/call | Truthful unavailable route | Messaging backend and private voice/video |
| 12 Projects | Actual booking data and status presentation | Attendance, progress, completion confirmation, disputes and team capacity operations |
| 13 Wallet/payments | Reachable sample UI/local balance mutation | Entire financial integration; gate demo behavior first |
| 14 Notifications | Persisted in-app inbox | Background push and delivery reliability |
| 15 Saved workers | Persisted customer-scoped feature | Remaining native stability/accessibility acceptance |
| 16 Profile/settings | Real profile/edit/logout/role navigation; notices for other settings | Support, policies, localization, account deletion and genuine identity-verification workflows |

The current source mixes shared glass components with newer Labourly screen components; API completeness does not imply every screen matches the reference composition.

## Additional product work

- Genuine post-booking ratings/reviews with eligibility and moderation.
- Job start/completion, disputes, cancellation/reposting and team capacity rules. BookingState already includes IN_PROGRESS and COMPLETED; missing end-to-end product flows should extend that model rather than create a competing one.
- Operational admin authorization UX and real moderation, support and audit tools. SecurityConfig protects admin API paths, but that alone does not make the current dashboard an admin operations platform.
- User-facing privacy/terms, retention/account deletion and support contact flows, validated against real behavior.
- Release configuration, production service hosting, secrets management, monitoring, backup/restore procedures and reliable security scanning. Backend dependency vulnerability status remains UNASSESSED absent a reliable scan.
- Physical-device, TalkBack, large-font, account-isolation and standalone release-build acceptance. Historical combined Metro reload/Activity recreation root-race evidence remains a validation risk; do not equate development reload behavior with proven production failure or success.

## Recommended work order

1. Remove/gate misleading wallet demo behavior and reconcile documentation with reachable screens.
2. Finish dependable native startup/session validation and production OTP delivery.
3. Complete reference-aligned discovery/filter/profile/schedule UX using real API data; preserve existing quote/booking protections.
4. Implement real text chat and reliable background push.
5. Complete job lifecycle, support/disputes, reviews and operational administration.
6. Integrate payments/payouts and private calls only after provider/account/security approvals.
7. Complete security, privacy, release configuration and physical-device acceptance before public launch.

## Conclusion

Labourly has a substantial implemented marketplace core. It is not currently evidenced as ready for public launch. Several remaining items require full backend/mobile development, not simply package installation or credentials. No fresh tests or native checks were run for this source-only inventory.
