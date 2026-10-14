# Geographic correction backend activation

2026-10-08, branch `phase-4-development`. Result: PASS. Native acceptance remains separate.

- Verified old listener PID 14308 belonged to this project: Java 21, `.tools/backend-defect11-runtime/backend.jar`, dev profile, seeding disabled.
- Requested normal JVM exit through a locally compiled Attach API helper targeting only that PID. Spring logged graceful shutdown complete and Hikari/JPA resource closure. No unrelated process was terminated.
- Copied the verified Maven artifact to `.tools/backend-geographic-runtime/backend.jar` and started **PID 8448**, Java **21.0.12.1**, existing `.env` database configuration, `dev`, `nammacrew.dev.seed=false`, address **127.0.0.1:8080**.
- Startup succeeded in **35.108 seconds**. Database pool connected. Flyway validated **11 migrations**, current version **11**, schema up to date; **no migration applied**.
- Host health: UP. Emulator `emulator-5554` reached **http://10.0.2.2:8080/actuator/health**, HTTP **200**, `{"status":"UP"}`. This proves emulator network access, not the separately scheduled native acceptance flow.
- Running process command line identifies the corrected runtime JAR. Its ServiceCoverage and QuotationService classes match the verified build byte-for-byte; the coverage class contains the catalogue target-city predicate and worker locking introduced by the correction. JAR SHA-256: `f27c7a7c95fbe9a5a7d3845310b90e42afd7980c982298301373715004a225a9`.
- All bookings, quotations and reservations compared equal before/after restart. Requirements, worker profiles and coverage also equal the correction's saved snapshot. No requirement publication, database reset, volume change, app-data reset or protected booking mutation occurred.

## Actual nationwide rule

Nationwide, state and district coverage require catalogue-consistent city/state identifiers and coordinates. GPS-only jobs have no verified administrative identity and therefore cannot match nationwide-only coverage. Explicit radius coverage, or applicable legacy radius coverage, can still match GPS by distance. A worker with nationwide AND radius coverage can qualify through radius. Multiple selected states remain additive and independent of home state.

This aligns with the documented conservative matching contract: do not claim an arbitrary GPS point is in India or assign invented boundaries. It does **not** fully satisfy the broader expectation that a nationwide worker sees every genuinely Indian GPS job. Until trustworthy administrative/country boundaries are available, the customer must select and confirm a catalogue city to include those workers; that substitutes approximate city-centre coordinates. No rule was changed during activation.

## Evidence

- `verification/geographic-activation-process.json`
- `verification/geographic-activation-artifact.json`
- `verification/geographic-activation-startup.txt`
- `verification/geographic-activation-emulator-health.txt`
- `verification/geographic-activation-preservation.json`

Backend activation complete. No push, tag, Phase 5 or native acceptance performed.
