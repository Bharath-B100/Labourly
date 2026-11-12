# Wallet safety fix — review gate

The customer wallet now displays “Wallet and payments are not available yet”. Removed sample balance/transactions, local Add Money state mutation, financial callbacks and inactive financial controls. Retained Labourly palette, safe-area/scrollable layout, scalable text and accessible Back button (48-point minimum target).

Reviewed navigation: customer Profile, the reusable ProfileSettings entry, and the hidden customer wallet route. All resolve to the same unavailable component. Removed the wallet route's misleading transaction-history-to-bookings callback. No quotation, booking, cancellation or notification logic changed.

## Changed implementation files

- mobile/src/components/LabourlyWalletScreen.tsx
- mobile/src/app/(customer)/wallet.tsx
- mobile/src/__tests__/labourly-wallet.test.tsx

The previous wallet test asserted simulated payments. Replaced it with two safety tests covering component and direct-route rendering, no monetary/sample transaction display, no payment actions, and working Back navigation.

## Verification

- Full mobile Jest: 30 suites passed; 149 tests passed; 0 failed; 366.685 seconds. Includes both wallet safety tests and marketplace/session regressions.
- npm run typecheck: PASS, exit 0.
- npm run lint: PASS, exit 0.
- npm run format:check: PASS, exit 0, all matched files formatted.
- git diff --check: PASS. Git reported line-ending conversion notices only.
- Source search: removed wallet DEFAULT_TRANSACTIONS, initial balance/local balance mutation and onAddMoney hooks; no remaining matches for those implementation identifiers in mobile/src.

Jest emitted an act(...) warning from the unchanged Saved Workers test. It was not suppressed; the suite passed. The initial formatting command used the repository root rather than mobile and could not locate Prettier; corrected working directory and subsequent formatting/checks passed. npm warned about forwarding --watch=false; the actual executed test command was jest --runInBand and all suites ran.

## Limits and remaining risks

No emulator/native acceptance was performed. Existing installed APKs/bundles were not replaced and may still contain the previous UI until updated. Real payments, financial history and gateway integration remain unavailable; no SDK or credentials were added. The prior feature audit describes the pre-fix source and is historical evidence, superseded for wallet behavior by this report.

No Gradle, emulator, Docker or database services were run. No protected data, environment, dependencies, native experiments or APK artifacts were changed. Pre-existing package.json and untracked changes were preserved. No commit, push, tag or deployment. Ready for review of this focused wallet safety fix, not a production-release approval.
