# CI recovery — 8 November 2026

Original run: https://github.com/Bharath-B100/Labourly/actions/runs/42460868047

The backend integration phase reported 156 tests, zero assertion failures,
one error and 29 skipped. ProductionAuthIT combined prod/dev profiles and failed
at the newer production configuration guard. The OTP-provider integration fixture
now uses a dedicated non-development profile, explicitly asserts that the real
ProductionOtpProvider is selected, and retains all HTTP 503, redaction and database
rollback assertions. It is not a production deployment/TLS acceptance test.
Guard unit coverage now checks both production aliases against both dev/test.
No production guard or authentication implementation was relaxed.

Admin passed its code checks and tests, then failed npm audit with 10 moderate
and 2 high findings. Targeted compatible patch updates: Vite 6.4.3 to 6.4.5 and
source-map-js 1.2.1 to 1.2.2. Audit after lockfile resolution: 10 moderate,
zero high, zero critical. Moderate findings remain unresolved.

Mobile was cancelled by matrix fail-fast, not a reported mobile assertion failure.
The matrix now uses fail-fast: false so both projects finish independently.
No check is disabled or allowed to fail silently.

Local validation: OTP/security unit tests 20 passed, zero failed/skipped;
backend Spotless passed. Admin tests 8 passed in 3 files; typecheck, lint,
formatting and build passed. Database integration was not run locally because
Docker was unavailable. The next CI run must confirm the integration fixture.

Original failed logs remain in ignored .tools/ci-128669669917.log and
.tools/ci-128669670045.log. npm update/audit-fix initially failed with an Arborist
edgesOut error; a separate temporary lockfile copy resolved targeted versions.
No broad forced dependency upgrade was used. Deployment remains blocked by the
separate release risks documented in DEVELOPMENT_CHECKPOINT_20261108.md.
