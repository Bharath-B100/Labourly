# Expired quotation fix closure

Date: 1 November 2026

## Cause and correction
The worker form copied the requirement start date. Past-start OPEN requirements were still listed, although quotation submission correctly required a future start. The backend rule is preserved.

- Find Jobs now filters starts_at > CURRENT_TIMESTAMP before pagination. No requirement is deleted or automatically cancelled.
- Direct opportunity views explain expired or closed requirements and hide submission/editing. Submission rechecks time in case the job expires while the form is open.
- Existing submitted quotations retain withdrawal access and history. Published requirements cannot be edited; the explanation directs the customer to publish a new requirement with future dates.
- Synthetic future-job fixtures were corrected to use future starts. Integration assertions check expired and equal-to-now exclusion, future-job visibility, location filtering and retained records.
- An unrelated asynchronous chat regression assertion now waits for contact data rather than the earlier-rendered call button. No chat production behavior was changed.

## Verification
- Backend MarketplaceControllerIT, MarketplaceIT, ServiceCoverageIT: 32 passed, zero failures/errors/skips.
- Focused mobile quotations/API/cancellation: 25 passed in the preceding fix checkpoint.
- Final full mobile: 188 passed across 34 suites, exit 0. Initial full run: 187 passed, one asynchronous chat assertion failed; retained in expired-job-mobile.log. Existing act warnings remain.
- TypeScript and targeted ESLint: exit 0. Changed mobile formatting passed; targeted backend Spotless apply succeeded.
- Updated local backend packaged and started on 8084, health UP. Flyway validated 15 migrations; no migration necessary.
- Initial packaging failed because Windows held the running JAR. Stopped only the identified project backend, repackaged successfully and restarted the existing isolated configuration.
- Native quotation submission was not repeated on a live account. No production deployment or original database access. Regression SQL writes were confined to disposable test data; no protected bookings or historical quotes were changed.

## Files
- mobile/src/app/(worker)/opportunity/[id].tsx
- mobile/src/__tests__/quotes.test.tsx
- mobile/src/__tests__/labourly-in-app-call-and-chat.test.tsx
- backend/src/main/java/in/nammacrew/marketplace/MarketplaceDiscoveryService.java
- backend/src/test/java/in/nammacrew/marketplace/MarketplaceControllerIT.java

Logs are retained locally under .tools/expired-job-* and .tools/expired-final-*.
