# Labourly checkpoint privacy review — 14 October 2026

**Required regression and checkpoint privacy checks PASS. Local preservation checkpoint only; no L1 implementation or public-release approval.**

The user explicitly authorized replacing the identifying mock name/time in the required cancellation regression test and updating its matching assertion. This resolves the earlier fixture blocker without removing or weakening coverage. Production source, other fixtures, dependencies and migrations are unchanged by the privacy cleanup.

## Completed review and preservation

- Inspected the original 166-path proposal; confirmed every proposed file exists. The supplied Crewza reference is an additional candidate, SHA-256 `8f97dbb38d1051ba66576a7538e0f2a5be05d6e6e015ffde7e40998e31d061e9`, 1,796,992 bytes, matching the prior source audit. All16screen reconciliation remains in the gap analysis. Labourly palette remains #FFCC25 / #202326 / #FFFFFF / #E5E7EB; application branding is unchanged.
- Before sanitization, encrypted all167 candidate contents into `pre-checkpoint-20261014-100225.zip.aesgcm` in the existing external preservation directory. Authenticated decryption and every member SHA-256 passed. This supplements rather than overwrites the original filesystem/database backups.
- Eleven reports use neutral names and twelve stable documentation aliases for identifiers; private cancellation text, precise event timestamps and an acceptance GPS point are withheld. Original reports and alias mapping remain encrypted outside Git. Technical findings, counts, states and historical regression conclusions are preserved. These are privacy-reduced documentation copies, not an assertion that every retained schedule/amount is anonymized beyond possible linkage.
- Initial sensitive-pattern scan found no private-key/JWT/provider-token signatures in candidates. This is a bounded scan, not a new dependency-security assessment. Backend vulnerabilities remain UNASSESSED. Development-only OTP behavior is code, not a production credential; existing production profile exclusion remains intact. No auth configuration was changed.
- Final allowlist: **160 paths** in external `final-stage-files.txt` (166 original + reference + this report - eight exclusions). All backend/mobile/admin source and all12 migrations are already tracked or included in this checkpoint; literal relative imports resolve to included/tracked files. Production source, other tests, seed fixtures and migrations remain byte-identical to the pre-cleanup inventory. Only the approved cancellation fixture differs.
- Public LGD reference contact labels describe the government source, not customer data. Geographic place names are catalogue data, not identities. GeoNames attribution remains. The Crewza image is a user-supplied internal design reference, not a production brand asset or a claim of rights to redistribute its art. Public redistribution/asset provenance review remains a separate release concern.

## Fixture privacy resolution and fresh regression

`mobile/src/__tests__/cancellation-consistency.test.tsx`: the mock actor is now `Fictional Test Customer`; cancellation time is synthetic `2026-10-09T12:00:00Z`. Only two occurrences of the name (mock and assertion) and one timestamp changed. Byte comparison against the authenticated encrypted original confirms this exact scope. The timestamp assertion still computes the expected local display from the same mock timestamp. Status distinctions, CUSTOMER attribution, cancellation reason, historical ACCEPTED quote, missing legacy metadata and unaffected confirmed-booking assertions remain intact.

| Required gate | Actual result |
| --- | --- |
| Affected cancellation test (`npm test -- --runTestsByPath src/__tests__/cancellation-consistency.test.tsx`) | 8 passed, 0 failed, 0 skipped; 1 suite |
| Full mobile suite (`npm test`) | 110 passed, 0 failed, 0 skipped; 17 suites |
| `npm run typecheck` | Exit0 |
| `npm run lint` | Exit0; 0 errors, 1 existing unused-variable warning (`hasStartedFlight`, `LoginTransition.tsx:48`) |
| Protected booking/quotation/reservation comparison | Full-row equality to saved evidence; no writes |
| Candidate/privacy scan and import inventory | All160 paths reviewed; no protected IDs, private acceptance literals or secret signatures found; required source/migrations present |

Command logs and Jest JSON are retained outside Git as `checkpoint-mobile-{affected,full,typecheck,lint}.log`, `checkpoint-affected-results.json`, `checkpoint-mobile-results.json` and `checkpoint-mobile-gates.json` in the existing protected preservation directory. Backend/admin tests were not rerun: no application code changed, and their previous results are historical evidence only.

The complete staged diff was captured and authenticated in encrypted form, with all160 sections scanned including deleted lines; staged blob hashes were compared to reviewed working files. Structured location/lockfile JSON parsed successfully. The check covers checkpoint content and reproducibility, not a new comprehensive vulnerability assessment.

`git diff --cached --check` returns exit2 with **54 pre-existing whitespace findings** in `docs/BLACK_GOLD_UI.md` (extra final blank line) and the official `docs/reference/location/lgd-states.html` snapshot (trailing whitespace). Both files match their encrypted original bytes. Findings are retained in `staged-diff-check.txt`; no whitespace rules are disabled and neither file is rewritten. These formatting advisories are not privacy/security findings or failed application regressions. In particular the LGD source snapshot is retained exactly so its provenance hash remains reproducible.

## Excluded candidates — preserved unchanged

| Path | Reason |
| --- | --- |
| `admin/public/Dashboard.html` | Standalone static mockup not referenced by admin source; external asset/CDN provenance not established. |
| `mobile/assets/app-icon-1024.png` | Unused variant; no source/config reference. |
| `mobile/assets/hardhat-hero.png` | Unused design asset. |
| `mobile/assets/icon@2x.png` | Unused native-config variant; config uses explicit icon.png. |
| `mobile/assets/icon@3x.png` | Same reason. |
| `mobile/assets/logo-badge.png` | Unused badge variant. |
| `mobile/assets/logo-badge@2x.png` | Unused badge variant. |
| `mobile/assets/logo-badge@3x.png` | Unused badge variant. |

Earlier held raw acceptance evidence, account guide, audit exports, design downloads and loose assets remain outside the candidate. Real environment files, signing materials, dependencies, native build output, caches and tooling remain excluded. Nothing was deleted. Literal app references and automatic logo density variants remain available.

## Original database and Git

Read-only transactions confirmed all35 public application tables match the preserved source fingerprints; protected3bookings/4quotations/3reservations match saved full-row evidence. V1–V12 Flyway history matches the preserved baseline. Before/after schema constraints, triggers, extensions, migrations and application row fingerprints are unchanged during this task. This narrower fresh check supplements the earlier successful71-table restore comparison; it is not a new restore drill. No database writes, restarts or migrations were issued.

Checkpoint parent: `phase-4-development` at `93e3eb2c3fd192afaf69b32e70e8ae826e90f953`. Reviewed commit message: `chore: preserve verified NammaCrew Phase 4 baseline before Labourly transformation`. Create the local checkpoint only after final staged-tree verification, then switch to `codex/labourly-l1-foundation` at that same commit. This report is part of that commit and does not embed its own future hash. The resulting hash, tree, branch and remaining-file counts are recorded in the external execution receipt and final response. No push, tag or deployment is authorized.

## Remaining L1 decisions

Backend dependency vulnerabilities remain UNASSESSED; prior JavaScript advisory findings and outstanding native/product acceptance remain documented, not waived by this local preservation checkpoint. Public launch is not approved. Off-device backup/key recovery and asset redistribution rights also remain release/operations considerations.

Approve adapted Labourly layouts/navigation and font/illustration assets; customer categories and role switching; authentication methods/providers; direct hire and pricing/schedule units; team capacity; chat/voice/video policy; wallet/payment model and visible financial actions; KYC, lifecycle and operational ownership. The reference does not itself authorize provider installation, financial integration or L1 work. Public release remains separate from preservation.
