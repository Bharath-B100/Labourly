# Defect 10 — Edit Draft unsaved changes

> Privacy-safe checkpoint copy (14 October 2026): neutral test labels replace identifying names/record IDs; private free text and precise event timestamps are withheld where present. Technical findings, counts, states and historical test conclusions are unchanged. Full originals and label mapping are encrypted outside Git; referenced raw verification artifacts are intentionally not committed. Labels are documentation aliases, not executable database IDs.

Validated 2026-10-08 on phase-4-development. No Phase 5, commits, tags, pushes, dependency upgrades, database reset or application-data reset.

## 1. Root cause

Edit Draft reuses the Post route directly inside the customer Tabs navigator. The old beforeRemove handler only guarded removal of that route. Tab switches and tab-history Back do not necessarily remove it. At the navigation root Android Back could also leave the application without a removal event. Tabs retained the component and its unsaved useState title, making a later visit appear changed even without a database write. The earlier mocked beforeRemove test did not exercise this actual navigation hierarchy.

The fix uses the installed Expo 57 APIs (expo-router and expo-router/react-navigation). A shared guard handles tab/root navigator state transitions, usePreventRemove handles route removal, and one focus-scoped hardware Back listener handles Android Back including the root case. The editor's header Back uses the same guard. A single pending-dialog flag avoids repeated confirmations; Keep Editing preserves fields, while Discard Changes allows the original navigation and remounts the editor. Leaving the tab also resets its retained form, so reopening reloads persisted values. Android Home is not intercepted.

## 2. Persistence diagnosis — no changed title currently stored

Protected draft: TEST-RECORD-08.

- Stored title: Phase 4 Competing Quotes Test 2 (exact original).
- Status: DRAFT.
- edit_version: 1.
- updated_at: [event timestamp retained in encrypted evidence] / [local event timestamp withheld].
- created_at: [event timestamp retained in encrypted evidence].

The earlier readiness snapshot was version 0; a save occurred before this investigation, but the observed replacement title is not present. Current canonical location is CITY_CENTRE (earlier snapshot was legacy). These facts do not identify who initiated the earlier save or prove that a title never changed transiently: there is no per-field draft title audit trail in the inspected flow. No attribution to the user or agent is inferred.

Field handlers only update React state. There is no autosave or navigation-triggered API write. The sole mobile draft mutation is PUT /api/v1/requirements/{id}/draft inside the explicit Save handler. Loading uses GET. The backend edit service increments edit_version and updates updated_at in its transactional update; ownership, DRAFT-only and expected-version checks remain unchanged. Navigation and discard never submit the form. The old retained component state is a credible explanation for the apparent title change; it is not evidence of persistence.

After successful Save, the form baseline advances, the guard permits navigation, and Details receives the same ID with a refresh token. Save errors leave edits and dirty protection intact. No create API is used for an existing draft.

## 3. Files changed for this defect

- mobile/src/navigation/DraftNavigationGuard.tsx — shared confirmation, focus lifecycle, hardware Back and removal protection.
- mobile/src/app/(customer)/_layout.tsx — intercept tab actions that leave/replace the active editor.
- mobile/src/app/_layout.tsx — shared guard provider and parent stack navigation interception.
- mobile/src/app/(customer)/post.tsx — dirty comparison, discard/remount, clean reload on leaving, header Back and saved baseline.
- mobile/src/__tests__/draft-editor.test.tsx — eight editor cases replacing the two earlier cases.
- docs/DEFECT_10_UNSAVED_CHANGES.md and verification evidence.

No backend source, migration, protected fixture or worker data was changed. Git diffs also include earlier uncommitted work; the list above describes this defect's changes only.

## 4. Automated validation

| Check | Result | Evidence in docs/verification |
|---|---|---|
| Mobile regression | PASS: 14 suites, 76 tests | defect10-mobile-tests.log |
| TypeScript | PASS | defect10-mobile-types.log |
| Lint | PASS | defect10-mobile-lint.log |
| Formatting | PASS | defect10-mobile-format.log |
| Java 21 offline Maven verify | PASS: 4 unit + 65 integration = 69, zero failures/errors/skips | defect10-backend-verify.log |
| Backend formatting | PASS within verify | defect10-backend-verify.log |
| Flyway/PostGIS, authorization, stale updates, same ID/no duplicates, quotation/concurrency regressions | PASS in isolated integration database | defect10-backend-verify.log |

Editor tests cover unchanged values, title dirty/reverted state, hardware Back, duplicate-prompt suppression, Keep Editing, Discard, reload of saved values, tab exit, header/removal action, explicit PUT with same ID/version, no POST/duplicate creation, no mutation without Save, missing location and stale-save failure. Navigation hooks are mocked in these component tests; the actual Android paths were exercised separately below.

Initial TypeScript errors in router optional-state typing and test indexing were corrected; final results above are the rerun. An initial formatter invocation from the repository root attempted npm metadata access and failed ECONNRESET; formatting was then run successfully through the already installed local Prettier binary. No package was installed or registry/security setting changed.

## 5. Native Android verification — PASS for exercised flows

Existing emulator-5554 reported device. Existing development APK consumed the updated JavaScript from Metro; no rebuild or session reset was needed.

Created one isolated, unpublished test draft under the existing customer:
TEST-RECORD-05 — Defect 10 isolated navigation test.
It is intentionally retained for inspection, DRAFT/version 0, with no quotations or booking actions performed.

Actual interactions:

1. Opened isolated Edit Draft and appended UNSAVED to the title.
2. Android Back dismissed the input keyboard; the next Back displayed the confirmation (defect10-native-back-warning.png).
3. Tapped Keep Editing; the changed title remained on the form (defect10-native-keep.png).
4. Pressed Back again and tapped Discard Changes; returned to Requirement Details (defect10-native-discard.png).
5. Reopened the draft; original title restored (defect10-native-reopen.png).
6. Appended TABTEST and selected Find Workers. Confirmation appeared; Keep Editing stayed in the editor. Repeated tab exit with Discard navigated to Find Workers (defect10-native-tab-warning.png, defect10-native-tab-discard.png).
7. Reopened, appended HEADER and pressed the editor header Back. Confirmation appeared, then Discard left (defect10-native-header-warning.png).
8. Read-only database query confirmed the isolated draft's original title and edit_version 0; updated_at still equals created_at. No typed suffix was persisted (defect10-persistence.txt).

The protected draft, confirmed booking, accepted quotation and Worker A/C/E profiles/service locations were compared before/after: every field is unchanged during this task (defect10-protected-preservation.json). The prior version-1 protected draft was not reverted.

## 6. Remaining limitations

No blocker remains for the tested Defect 10 Android Back/header/tab/discard flows. Arbitrary parent-stack removal is covered by the navigation guard and component callback test, but every possible deep link/reset/iOS gesture has not been manually exercised. OS termination/Home is intentionally outside navigation blocking. This does not declare all Phase 4 acceptance complete.

Official references consulted: [Expo SDK 57 Router](https://docs.expo.dev/versions/v57.0.0/sdk/router/) and [React Navigation usePreventRemove](https://reactnavigation.org/docs/use-prevent-remove/). Installed Expo Router source/types were also inspected; no external @react-navigation dependency was added.

### Final runtime recheck

During Fast Refresh after navigation-provider changes, repeated clean-form Back checks were inconsistent. The app process was restarted without clearing data; after session/form loading completed, clean Android Back returned to Details without a warning (defect10-native-clean-back.png). Clean navigation is deferred until the native Back callback completes. On the fully loaded final runtime, the entire edit → Back → Keep Editing → Back → Discard → reopen sequence was repeated with FINALCHECK; the original title was restored (defect10-native-final-warning.png, defect10-native-final-keep.png, defect10-native-final-reopen.png/xml). Temporary diagnostic instrumentation was removed. Final mobile rerun again passed 76 tests, TypeScript, lint and formatting. Protected records were compared again and remained unchanged. Use the restarted app, rather than a retained pre-change Fast Refresh session, for acceptance.
