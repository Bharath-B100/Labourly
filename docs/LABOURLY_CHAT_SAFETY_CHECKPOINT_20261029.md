# Chat safety and worker access checkpoint

## Completed

- Removed simulated voice/video connection timer, call overlays, duration counters and synthetic call-log sends from LabourlyLiveChat. Call controls now explain that no call service is connected. Historical messages were not deleted.
- Replaced misleading call claims in the worker profile and chat guidance with text-chat availability and an explicit calling limitation.
- Removed fabricated team members and verification labels from the team detail sheet. Actual server team name/size remain visible.
- Added the protected worker route `(worker)/chat`, hidden from the tab bar but reachable through worker Profile and worker booking details. Customer bookings retain the customer destination; worker bookings say Chat with customer.
- Chat query keys include account identity; local chat state remounts on account change and late thread-open responses are ignored for the previous account. Failed thread opening now displays an error instead of being silently swallowed.
- Hid Wallet from the profile menu. Direct wallet navigation still renders the existing unavailable screen.

## Verification

- Full mobile suite: 178 tests across 32 suites passed, exit 0 (`chat-safety-full.log`). Existing asynchronous act warnings remain.
- Additional worker route regression: 1 test passed. Its initial mock failed Jest hoisting validation; corrected the mock and reran successfully.
- Focused calling/cancellation regression: 12 tests passed. Tests assert call actions cannot create a simulated call or send fabricated call messages, and preserve team-detail behavior without invented members.
- Typecheck passed. Full lint: zero errors, one existing ProfileEditor effect-dependency warning (`chat-safety-lint.log`). Changed-file formatting passed.
- No backend or database changes in this checkpoint. No native acceptance or two-device chat delivery claimed. No APK build, commit, push or provider activation.

## Source changes in this checkpoint

`mobile/src/components/LabourlyLiveChat.tsx`, `mobile/src/components/LabourlyMyProfileScreen.tsx`, `mobile/src/app/(customer)/worker/[id].tsx`, `mobile/src/app/(customer)/booking/[id].tsx`, `mobile/src/app/(worker)/chat.tsx`, `mobile/src/app/(worker)/_layout.tsx`, `mobile/src/app/(worker)/profile.tsx`, `mobile/src/__tests__/labourly-in-app-call-and-chat.test.tsx`, `mobile/src/__tests__/labourly-my-profile.test.tsx`, `mobile/src/__tests__/worker-chat-route.test.tsx`.

The repository already contains extensive uncommitted work. Total Git diffs are not attributable entirely to this checkpoint.

## Remaining work

District-first/city-first discovery with explicit neighbouring-district and statewide expansion is next. It must not infer administrative boundaries solely from nearest-city coordinates, or treat workers outside declared service coverage as hireable. Genuine rates/languages/portfolio/reviews, future availability, accepted-booking-only worksite disclosure, project completion lifecycle, real voice/video and background push remain outstanding.

Chat still requires dedicated backend authorization/concurrency tests, native customer/worker delivery and account-switch verification, removal of the customer route's QueryClient-dependent fallback, bounded message history, and review of scripted assistant behavior. Do not describe this checkpoint as complete chat or product-launch acceptance.
