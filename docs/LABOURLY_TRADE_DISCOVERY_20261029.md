# Trade discovery correction — 29 October 2026

## Implemented

- Home trade identifiers flow to the shared discovery screen for Carpenter, Electrician, Plumber and other server catalogue trades.
- Home location pin/text/chevron now use a static horizontal layout, fixed icon slots, wrapping text and a 48dp minimum touch target. Confirmed on the existing emulator.
- Home forwards actual GPS coordinates rather than silently replacing them with the nearest catalogue city. Explicit city selection still forwards canonical city identifiers and centre coordinates. GPS-only searches do not infer administrative boundaries.
- Yellow/grey filter chips and compact worker rows use real profile, trade, experience and worker-reported availability. Removed fabricated 4.8 ratings, 120 reviews, daily prices and Available tomorrow claims. Missing profile photos use initials rather than another person's photo.
- All explicitly sends ALL to the backend. Available, Busy and Unavailable request the corresponding persisted status.
- Nearby now sends an explicit API flag. PostgreSQL applies registered-base radius filtering before count/pagination and orders by distance with deterministic identifier tie-breaking. Existing service-coverage eligibility remains mandatory. All retains broad service coverage, including workers serving multiple states.
- Nearby validates coordinates and radius (0–500 km). Missing registered bases cannot satisfy Nearby; this is not live worker tracking.
- Save hearts reuse the existing account-guarded, serialized SaveWorkerButton implementation, including retry, loading and failure states.

## Deliberate limitations — request not fully complete

No reviews/rating repository or API was found. Top Rated therefore displays an explicit unavailable state rather than sorting experience as though it were a rating. Existing verification records include SYNTHETIC_REVIEW; Verified does not represent these as genuine identity checks. No reliable next-available-date contract exists; busy/unavailable profiles explicitly say the next date was not provided. Booking conflict checks remain authoritative when hiring. These three domains require real data collection and backend contracts before the screenshot's promises can be delivered honestly.

## Verification and runtime

- Backend MarketplaceIT, MarketplaceControllerIT, ServiceCoverageIT: 32 passed, zero failures/errors/skips, Maven exit 0. New disposable-database test covers ALL, unavailable workers, radius filtering before pagination and invalid radius/status rejection. First run failed due to a missing mandatory field in the new synthetic fixture; corrected fixture and rerun passed. No schema changes.
- Full mobile Jest: 178 tests passed across 32 suites. Runner did not terminate because of an open-handle warning and was interrupted after results; this is not a clean process exit.
- Focused discovery, foundation and saved-workers suites: 32 passed across 3 suites, eventual exit 0; runner emitted the same shutdown-delay warning. Existing asynchronous act warnings remain.
- TypeScript passed. Changed-file lint and Prettier passed. Full lint earlier failed on unrelated newer LabourlyLiveChat ref-access errors and ProfileEditor warnings; no whole-project clean lint claim.
- Backend package built successfully. Replaced only the identified isolated backend on 8084. Existing isolated database already had V15; startup capped Flyway at V15, no new migration created. Health UP. No original development database accessed.
- Native evidence: `.tools/labourly-home-layout-20261029.png` confirms the Home location layout. `.tools/labourly-trade-20261029.png` shows Home Carpenter navigation, yellow discovery controls and real empty result at current GPS. This does not verify populated native cards, every filter interaction, ratings, verification or future availability.

## Changed source files

- mobile/src/app/(customer)/home.tsx
- mobile/src/app/(customer)/discover.tsx
- mobile/src/api/marketplace.ts
- mobile/src/components/WorkerCard.tsx
- mobile/src/components/SaveWorkerButton.tsx
- mobile/src/__tests__/discovery.test.tsx
- backend/src/main/java/in/nammacrew/marketplace/MarketplaceController.java
- backend/src/main/java/in/nammacrew/marketplace/MarketplaceDiscoveryService.java
- backend/src/test/java/in/nammacrew/marketplace/MarketplaceIT.java

No commit, push, APK rebuild, protected-record mutation, or payment/calling activation performed. Other concurrent working-tree changes were preserved.
