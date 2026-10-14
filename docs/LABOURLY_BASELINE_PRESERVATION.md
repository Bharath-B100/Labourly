# Labourly baseline preservation — 14 October 2026

> Privacy-safe checkpoint copy (14 October 2026): neutral test labels replace identifying names/record IDs; private free text and precise event timestamps are withheld where present. Technical findings, counts, states and historical test conclusions are unchanged. Full originals and label mapping are encrypted outside Git; referenced raw verification artifacts are intentionally not committed. Labels are documentation aliases, not executable database IDs.

**Result: verified local filesystem and database preservation PASS. No L1 implementation or Git checkpoint executed.**

## Backup

Location: `D:\Files\EDUCATION\NammaCrew-preservation\20261014-094158` (outside the working directory; new timestamped directory, no existing backup overwritten).

- `filesystem.zip.aesgcm`: **1,181 members**, **206,588,537 bytes**, SHA-256 `c8cbafc37c4fdd1b58a00810d8144ff14a5b90ba4447dc8fc16b3002c32019eb`.
- Every member was decrypted and independently SHA-256 checked. Re-reading selected source files found **zero changes during backup**. Git history bundle verified before encryption; Git HEAD/config/index metadata also retained.
- `retained-evidence.zip.aesgcm`: **67 additional ignored evidence files** verified, including production export/source maps, native bundle evidence, prior source snapshots and geographic source material. These are preserved even though they should not enter the baseline commit.
- Includes tracked and untracked source, all V1–V12 migrations, assets, documentation, local scripts/logs/evidence, environment files, generated native configuration and debug keystore. Existing debug APK and packaged backend JAR retained.
- Excludes reconstructible node_modules, build/Gradle/CMake caches, IDE state, SDK/JDK installations, downloaded installers/distributions, redundant compiled runtime copies and obsolete process IDs. `selection.json` lists the initial selection/exclusions; the supplemental manifest records evidence subsequently retained from that exclusion list.
- Credentials, signing material, source archives, database dump and globals are protected with **AES-256-GCM**; encryption key uses **Windows DPAPI CurrentUser**. Directory ACL restricted to this Windows user and SYSTEM. No credential/key/token values are in this report or the stage proposal.
- See `filesystem-manifest.json`, `filesystem-verification.json`, `retained-evidence-manifest.json`, `retained-evidence-verification.json` and `RECOVERY.md` in the backup folder.

**Recovery limits:** DPAPI recovery depends on this Windows user/profile and machine protection; this is not a password-portable archive. This backup is on the same D: volume, so it does not protect against loss of that disk. An approved off-device/recoverable-key copy remains recommended before major migration. No external release-signing key was found/provisioned by this project-local inventory; the included key is the Android debug key.

## Database backup and restore

The existing `nammacrew-db-1` started normally. No reset, schema migration, seed or application write was issued. Source remains running; an already-running application process was not restarted. Snapshot export, reads and pg_dump performed in read-only repeatable-read context; dump used the exported snapshot.

- V1–V12 all successful; source Flyway CRC32 checksums independently computed and matched the recorded values.
- Saved baseline: `docs/verification/notification-gate-protected.json`. Full-row equality for **3 bookings, 4 quotations and 3 booking-worker reservations**, including cancellation reason/actor/time, commercial terms and timestamps.
- Protected IDs: `TEST-RECORD-02`, `TEST-RECORD-04`, `TEST-RECORD-07`.
- Consistent custom-format PostgreSQL dump: `database.dump.aesgcm`; authenticated decryption matched original dump bytes. Plain dump SHA-256 `1f40eee0761b5c1235603e63e1e5bdc05b53286925212e4e172ca9f367a44cbe`; encrypted file SHA-256 `77fe9f4a7226d06778a374db85eb644bbadad5ad1ddb69669b6171629d2a6990`. Plain dump is **361,084 bytes** and was never written as a plaintext file.
- Cluster role definitions retained separately in encrypted `database-globals.sql.aesgcm` (may contain password hashes); they were not replayed over the original cluster.
- Restore container: `labourly-preservation-20261014-094158`; database `labourly_restore`. Same locally cached PostGIS image; no image download, no published ports, network disabled. Restored with `pg_restore --exit-on-error --single-transaction` into a newly created **template0** database.
- **All 71 non-system-schema tables match** by count and deterministic ordered row-content fingerprint. Public tables match the exported snapshot; source public fingerprints remained unchanged afterward. Restored Flyway history, extension versions and custom triggers match.
- PostgreSQL rewrote 16 CHECK definitions (varchar-array casting and associative AND parentheses). Raw text comparison initially failed; retained `constraint-differences.json`. Each difference matched an explicitly recognized equivalent expression shape and **531 read-only evaluation cases** passed. No constraint was disabled or altered to make this pass. All other constraints matched exactly.
- Initial restore failed because the image's default database already contained the `tiger` schema; transaction rolled back. Recovery used a separate empty template0 database, without dropping original or default databases. Initial error is encrypted and the initial failed comparison report retained.
- Final evidence: `database-verification.final.json` (**pass=true**), `database-table-fingerprints.json`; preliminary `database-verification.json` deliberately still records the initial raw-text mismatch.
- Restore container is now **stopped and retained**, not deleted. Original protected records match saved evidence before and after restore.

This validates backup/restoration, not new application regression or production security. Backend vulnerability assessment remains UNASSESSED.

## Git checkpoint proposal — NOT executed

Current branch `phase-4-development`; HEAD `93e3eb2c3fd192afaf69b32e70e8ae826e90f953`. Initial inventory **64 tracked modifications, 351 untracked files, 0 staged** (415 entries). L0 documents explain the increase from the earlier 346 untracked baseline. Git index, branch and HEAD unchanged by preservation.

**Exact proposed file list:** [proposed-stage-files.txt](D:/Files/EDUCATION/NammaCrew-preservation/20261014-094158/proposed-stage-files.txt) — **166 paths**, including this report. This is the allowlist for review, not a command executed.

Includes modified tracked source/configuration, previously untracked backend/mobile source and tests, V8–V12, required assets, location catalogue/provenance and technical/planning reports. Especially:
- `backend/src/main/resources/db/migration/V8__booking_cancellation.sql`
- `backend/src/main/resources/db/migration/V9__quotation_and_booking_history.sql`
- `backend/src/main/resources/db/migration/V10__canonical_locations_and_worker_coverage.sql`
- `backend/src/main/resources/db/migration/V11__draft_requirement_editing.sql`
- `backend/src/main/resources/db/migration/V12__in_app_notifications.sql`

**Exact held/untracked list:** [excluded-or-held-files.txt](D:/Files/EDUCATION/NammaCrew-preservation/20261014-094158/excluded-or-held-files.txt) — **250 paths**. Raw verification records/screenshots/logs, npm audit exports, generated output, .stitch designs, loose design assets and account guide remain preserved but held from this proposed commit for privacy/provenance review. Do not delete them.

Ignored files must remain excluded: real `.env` files, `.tools`, SDK/JDK/Gradle binaries, node_modules, generated Android/iOS output, signing keys, local runtime state, APK/JAR/database backups and secrets. Sanitized existing `.env.example` templates can remain versioned; never stage real environment values. Pattern scanning of the proposed set found no private-key/JWT/token signature matches; this is not proof that every secret/PII/license issue is absent. Human review of reports/assets and final diff remains required.

Proposed checkpoint message:
`chore: preserve verified NammaCrew Phase 4 baseline before Labourly transformation`

Proposed subsequent development branch:
`codex/labourly-l1-foundation`

After approval only: inspect the exact allowlist diff, checkpoint on the agreed current/baseline branch, then create the development branch from that reviewed checkpoint. No `git add`, commit, branch, switch, push or tag has been run.

## Reference and remaining approvals

At preservation time no identifiable actual Crewza 16-screen reference was available. Subsequently, on 14 October 2026, the user supplied the actual collage; it is now saved at `docs/reference/crewza/crewza-16-screens.png`. Source and saved SHA-256 match: `8f97dbb38d1051ba66576a7538e0f2a5be05d6e6e015ffde7e40998e31d061e9`, 1,796,992 bytes. All sixteen screens are reconciled in the updated gap analysis/design/planning documents. This new image and those subsequent planning edits are not claimed to be included in the earlier encrypted backup or its 166-path proposal.

The user subsequently authorized privacy-safe documentation cleanup and then a narrowly scoped cancellation-test fixture cleanup. Eleven reports were sanitized, with current originals, the original test and the reference verified in the supplemental encrypted archive `pre-checkpoint-20261014-100225.zip.aesgcm`. The original166-path proposal is historical; the final allowlist contains160paths after adding the reference and review report and holding eight unnecessary design files. The approved mock name/time and matching assertion were replaced with synthetic values; all8affected and110full mobile tests, TypeScript and lint passed (one existing lint warning). Protected records and migration history remain unchanged. See `LABOURLY_CHECKPOINT_REVIEW.md` for final staging checks, retained whitespace advisories and the authorized local checkpoint procedure. Adapted layouts and remaining product decisions still need approval. No application functionality, dependencies, branding, original database records or applied migrations changed. **STOP before L1.**
