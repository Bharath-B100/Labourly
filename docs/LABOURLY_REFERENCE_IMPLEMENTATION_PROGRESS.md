# Labourly reference implementation progress

Updated 16 October 2026. The user has requested all sixteen reference screens
and their real functionality, expanding beyond the original L1-only scope.
Labourly retains its approved yellow/charcoal/white/grey palette, existing package
identifiers, working OTP authentication and quote-to-book contract. The reference
is a layout specification, not sample production data.

## Latest delivered source increment

Saved Workers now has customer-owned backend persistence, idempotent save/remove,
paginated ID retrieval, profile save controls and a customer Profile menu entry.
The screen resolves profiles through the existing authorization-protected API;
saved status never bypasses profile visibility, geographic or booking eligibility.
Unavailable profiles can still be removed. Requests and caches are account-scoped.
Migration V13 adds only the saved-worker table and index. Applied V1–V12 are unchanged.

The admin navigation shell is renamed Labourly and uses the approved palette.
It remains explicitly an unauthenticated navigation shell; administrative data
and management operations are not claimed implemented.

## All sixteen screens retained in scope

| Reference screen | Current implementation / remaining work |
|---|---|
| Splash | Labourly native assets integrated; release timing verification pending |
| Intro onboarding | Working carousel; full accessibility acceptance pending |
| Category selection | Contractor/Engineer/Architect connected to existing profile categories |
| Sign in/up | Working OTP; social/password login not introduced without account-linking contract |
| Home | Server catalogue trade grid and working search/post/jobs navigation |
| Worker list | Real location-based worker search; further reference layout refinement pending |
| Filters | Trade, location and radius; rating/rate filters require genuine review/rate contracts |
| Worker profile | Real server data, quotation-based hire path, new saved control |
| Post requirement | Existing draft/publish/location flow retained; reference refinement pending |
| Schedule calendar | Existing date booking checks; full calendar/preferred-time UX pending |
| Chat/call | User requires text plus private voice/video; backend/provider integration pending |
| Projects | Existing jobs/quotes/bookings/cancellation; capacity/progress presentation pending |
| Wallet/payments | User selected gateway collection and worker payouts; provider selection precedes integration |
| Notifications | Real in-app notifications; background delivery remains pending |
| Saved workers | New source implementation; regression and activation evidence below |
| Profile/settings | Role-aware profile editing, switching and logout; support/legal/language domains incomplete |

No fake balances, review stars, availability, KYC badges or inactive call/payment
controls are added. External provider accounts, credentials and paid services
have not been created. Payment gateway selection and private voice/video provider
selection remain explicit integration decisions. Protected records must remain
unchanged in each increment. Native verification is distinct from API tests.

## Evidence

- Mobile full suite: 128 passing assertions in 19 suites; final run uses
  `--detectOpenHandles`, evidence `.tools/l1-final/saved-workers-mobile-final.*`.
- Admin: 2 tests passed; build/typecheck, lint and formatting passed.
- Backend full regression and migration validation: see
  `.tools/l1-final/saved-workers-backend-final.log` for final result.
- Before activation, protected booking/quotation/reservation comparison passed:
  `.tools/l1-final/pre-v13-protected.json`.
- Initial regression exposed expected latest-migration version assertions (12
  versus new 13). Those assertions now expect 13 while retaining prior upgrade
  data checks. New mobile tests initially reset an accessibility promise mock;
  scoped mock resets corrected this without changing production behavior. An
  admin branding typo was fixed rather than weakening its assertion.

The full sixteen-screen product is not complete. No release readiness, native
Saved Workers acceptance, payment processing or calling capability is claimed.

Final increment verification: backend **97/97** (4 unit + 93 integration), mobile
**128/128**, admin **2/2**, zero failing/skipped tests. Mobile typecheck, lint and
formatting pass; admin build/typecheck, lint and formatting pass; backend Spotless
and package pass. V13 has been applied normally by the updated local backend;
8080 health is UP. Post-activation protected records match and all V1–V13 source
checksums match (`post-v13-protected.json`). A process-local development signing
key was rotated during restart; login/refresh may be required. No protected
account data was changed. Native Saved Workers interaction remains unexecuted.

User decisions recorded: gateway payments (provider to be chosen before
integration), and text plus private voice/video communications. No external
provider or paid-service approval is inferred from these scope decisions.
