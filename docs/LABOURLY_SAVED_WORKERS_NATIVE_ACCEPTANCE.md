# Saved Workers native acceptance gate

Updated 2026-10-16. Branch: `codex/labourly-l1-foundation`.

**Core flow verified; full native acceptance remains incomplete.** No commit, push, deployment or new major domain.

## Actual native results

| Scenario | Result | Evidence |
| --- | --- | --- |
| Isolated customer OTP login | PASS | Fictional customer home rendered |
| Real backend discovery/profile | PASS | Bengaluru Carpenter search returned fixture; profile showed real skills, experience and location |
| Save visual state | PASS | Save worker changed to Remove from saved workers |
| Profile → Saved Workers | PASS | Correct worker appeared with real server data |
| App restart persistence | PASS | Force-stop/reopen restored session and saved worker |
| Remove/empty state | PASS | Removal refreshed list to No saved workers yet |
| Repeated actions | PARTIAL | Duplicate PUT/DELETE passed via API; native save/remove cycle passed. Rapid native repetition and mutation failure recovery not exercised |
| Customer switching | PASS | Second customer saw empty list while first customer retained saved entry |
| Hidden worker | PASS | Fresh list displayed generic unavailable message without worker details; removal worked and database confirmed it |
| Loading/network/retry | PASS | Stopped only isolated backend; observed loading, error, Retry; restarted backend and Retry restored empty state |
| 320dp / 200% font | PARTIAL | Profile/list actions and scrolling worked; several bottom-tab labels truncate |
| TalkBack/physical device | PENDING | No enabled accessibility service; no physical-device testing |

Hidden-worker setup and duplicate HTTP requests were controlled fixture/API operations in the disposable database, not claimed as native actions.

## Recovery and findings

- Corrected persistent React Native development Settings to `10.0.2.2:8083`. Previous `localhost:8083` required absent port forwarding. Change Bundle Location alone is transient in the installed implementation. No data reset.
- Metro delivered 2,029 modules; Android logs recorded Running main and current app rendered. Compilation alone was not counted as native success.
- Developer-warning overlay covered tabs; dismissing it restored navigation.
- Reload combined with display changes reproduced Attempted to navigate before mounting the Root Layout, plus a multiple-linking warning. Clean restart recovered. Root cause remains unconfirmed; retain for focused investigation, not marked fixed.
- At 320dp/200% font, Home/Workers/Profile labels truncate. Full accessible labels exist in hierarchy, but TalkBack is unverified.
- Existing dropdown glyphs contain malformed text in `mobile/src/components/ui.tsx`; recorded UI defect, not silently fixed during acceptance.

No application source changed in this continuation. Only disposable saved-worker/visibility fixtures changed. Fixture visibility and original emulator density 420/font scale 1.0 restored.

## Verification

- Focused backend: **25 passed** (4 unit + 21 integration), zero failures/errors/skips. Maven verify and Spotless passed. Preserved session evidence; no unnecessary rerun with unchanged backend.
- Fresh Saved Workers mobile: **3 passed**. Typecheck, lint and formatting passed again.
- Prior full-suite baseline: backend 97, mobile 128, admin 2. These are earlier results, not fresh full-suite runs.
- Original database read-only comparison repeated after native tests: protected bookings, quotations and reservations unchanged; V1–V13 successful with matching source checksums.
- Isolated backend healthy on 8084, Metro on 8083, emulator online.
- Backend dependency vulnerabilities remain UNASSESSED.

## Private evidence

Ignored `.tools/saved-native/` holds screenshots/XML/logs outside Git:

- `discovery-result`, `worker-profile-native`, `worker-saved-native`, `saved-list-native`.
- `saved-after-restart`, `removed-empty`, `account1-empty`.
- `hidden-large-font.xml`, `large-scroll.xml`, `hidden-removed.xml`, `large-empty-settled`, `hidden-removal-db.log`.
- `network-loading`, `network-timeout-result`, `network-retry-recovered`.
- `reload-runtime.log`, `persistent-restart.log`, `accessibility-runtime.log`, `metro-continuation.log`.
- `backend-tests.log`, `mobile-recheck.log`, `typecheck-recheck.log`, `lint-recheck.log`, `format-recheck.log`, `repeat-api.log`, `protected-final.json`.

Screenshots precede UI dumps; transitions may produce mismatched frames. Use settled captures with XML/logs. Do not stage private evidence indiscriminately.

## Remaining review gate

Reference differences: initial avatars rather than portraits, different heart placement/card density, and no fabricated ratings or prices. Labourly branding and real server data retained.

Pending: rapid repeated native save/remove, save-mutation failure recovery, TalkBack, large-font tab readability, and reload/display-recreation navigation investigation.

App remains on the isolated backend via local `mobile/.env` at `10.0.2.2:8084`. Original environment is preserved in `.tools/saved-native/mobile-env.original`; disposable resources retained for review. Protected account environment was not modified.

**Core Saved Workers demonstrated; complete native acceptance is NOT yet PASS. STOP for review.**
