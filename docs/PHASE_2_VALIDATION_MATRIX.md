# Phase 2 independent validation — 29 September 2026

Status: **PHASE 2 NOT READY FOR SIGN-OFF**. This audit supersedes the earlier implementation summary. Phase 3 has not started and no stable tag has been created.

## Initial requirement matrix (before corrective implementation)

| Requirement | Implemented | Tested | Evidence | Gap |
| --- | --- | --- | --- | --- |
| V4 OTP / refresh schema | Partial | Not independently passed | V4__authentication_and_onboarding.sql | Missing attempt bounds, expiry checks and update triggers; no persisted profile drafts / full onboarding fields |
| Secure OTP generation and hashing | Yes in source | Pending | AuthService SecureRandom and BCrypt | No complete executable security suite |
| OTP attempts / throttling / reuse | Partial | Pending | AuthService transaction and repository reads | Failed attempts roll back; no concurrency locks; throttle bypass after success |
| Development OTP isolation | Partial | Pending | @Profile({dev,test}) | prod+dev can instantiate logging provider |
| JWT validation | Partial | Pending | JwtTokenProvider | Public hardcoded signing-secret fallback; missing lifecycle tests; claims must be robustly checked |
| Refresh lifecycle | Partial | Pending | AuthService.refreshToken | Rotation read is not locked; concurrent use can mint multiple replacements |
| Logout revocation | Partial | Pending | Backend logout vs mobile logout | Mobile removes local keys without revoking server token |
| Secure mobile credential storage | Yes in source | Pending | Expo SecureStore calls; no AsyncStorage/localStorage in auth sources | Separate writes can leave inconsistent pair; state hydrated from stale JWT claims |
| Concurrent 401 refresh | FAIL | Pending regression test | api/client.ts | Leading request subscribes after notification; waiters not rejected on failure; delayed 401 can rotate again |
| Server authorization | FAIL | Pending | ProfileController | No CUSTOMER/WORKER mutation guards; authenticated context supplies ownership but missing adversarial tests |
| Role escalation | Partial | Pending | UserController allowlist | Roles can be added repeatedly; identity DTO / current database authority required |
| Login and OTP UI | FAIL | Not validated | login.tsx, verify.tsx | /request-otp and /verify-otp differ from /otp/request and /otp/verify; incorrect request response shape; missing validation |
| Customer onboarding | FAIL | Not validated | onboarding.tsx | Missing full name, structured location, Other type, edit/resume flow |
| Worker onboarding | FAIL | Not validated | onboarding.tsx | Missing full name/photo/trades/skills/location/availability/team/review and persisted steps |
| Backend-authoritative recovery | FAIL | Not validated | session.ts, onboarding.tsx | State claim naming mismatch; no /users/me hydration or draft retrieval |
| Tests / migrations / booking regression | Pending | Baseline compilation running | AuthenticationIT source | Test calls nonexistent AuthController.OtpRequest; existing Phase 1 invariants must remain intact |
| Android native customer and worker E2E | Pending | Not validated for Phase 2 | Prior APK is Phase 1 only | SecureStore native module and complete new flows need real APK rebuild/install/tests |
| Security dependency audit | Pending | Prior network failures only | Phase 1 audit logs | Must obtain fresh results; cannot reuse historical counts |

Initial cleanup: restored mobile/package.json main to expo-router/entry and retired the temporary Phase 1 synthetic-session entry. No Phase 2 acceptance uses synthetic authenticated state.

## Corrective validation plan

Preserve V1–V4 migration checksums and add a forward migration for missing constraints and profile/draft fields. Correct auth transactions and locking, production fail-closed configuration, server authorization, mobile single-flight refresh, and complete backend-persisted onboarding. Add focused security and recovery tests before full regression and real-device flows. Record every failure and unexecuted check explicitly. Production SMS delivery remains unconfigured; no paid service will be enabled.

## Corrective validation update — 30 September 2026

The initial matrix above records defects before correction. The table below records current evidence; source presence alone does not establish native completion.

| Requirement | Implemented | Tested | Evidence | Gap |
| --- | --- | --- | --- | --- |
| OTP secure randomness / hash / no API code | Yes | PASS automated + source review | AuthenticationIT.otpIsSixDigitsHashedAndNotReturned; AuthService SecureRandom/BCrypt | Native OTP journey pending |
| Expiry / bad codes / attempt limit / throttle / invalidation / reuse | Yes | PASS automated | AuthenticationIT wrongAttemptsPersistAndLimitCannotBeBypassed, otpExpiryResendThrottleAndReuseAreEnforced, concurrent OTP tests | None in tested service contract |
| Development OTP unavailable in production | Yes | PASS automated | ProductionAuthIT plus conflicting-profile constructor/context test | Production SMS deliberately unconfigured |
| Access signature / malformed / expiry rejection | Yes | PASS automated | accessTokensRejectExpiredMalformedAndWrongSignatures | Native refresh observation pending |
| Random hashed refresh / expiry / rotation / revoke / replay / logout | Yes | PASS automated | Three refresh lifecycle/concurrency tests | Native session lifecycle pending |
| Credential persistence / no token logging | SecureStore only | PASS unit + static review | session.test.ts; phase2-credential-source-scan-20260930.txt; redacted AuthTokens | Real SecureStore APK check pending |
| Concurrent 401 / retry once / failure logout / no recursion | Yes | PASS automated | session.test.ts, 8 tests | Native network failures pending |
| Server ownership / cross-role mutation / ADMIN escalation | Yes | PASS automated | authorizationComesFromServerAndCannotEscalate; customer/worker adversarial profile tests | None in tested APIs |
| Customer fields / all nine types / edit / location | Yes | PASS API/component | customerFieldsPersistAndOwnershipCannotBeSupplied; customer component flow | Native E2E pending |
| Worker full form / trade / skills / team / location / review | Yes | PASS API/component | workerDraftResumesAfterLogoutAndRequiresReview; requiredWorkerFieldsAndSkillTradeRelationshipAreValidated | Native E2E pending; photo is HTTPS URL only |
| Draft/step recovery / backend-authoritative identity | Yes | PASS API/component | Worker logout/login draft test; stale cached draft recovery test; session restoration tests | Actual Android process restart pending |
| V1–V4 preserved; V5 forward correction | Yes | PASS | SHA-256 evidence; MigrationIT empty and upgrade tests | None |
| Java 21 / PostgreSQL/PostGIS / booking overlap/concurrency | Yes | PASS | clean verify: 33 tests, zero failures/errors/skips; FoundationIT includes 10 repeated concurrency invocations | None |
| Mobile final gates after SDK patch updates | Yes | PASS | 23/23 tests; typecheck/lint/format; Expo Doctor 21/21; install check; audit 3 moderate/0 high/0 critical | Known compatible-upstream dependency risk retained |
| Admin regression | Yes | PASS | 2/2 tests separate rerun; typecheck/build/lint/format; audit zero findings | Initial low-memory worker timeout retained |
| Phase 2 Android APK/install/launch/customer/worker E2E | Pending | PENDING USER VALIDATION | No new artifact/device evidence yet | Mandatory native work remains |
| Automated Maestro E2E | No runner available | DEFERRED | Official installation previously unavailable | Do not substitute component mocks |

### Acceptance table

| Requirement | Status | Evidence |
| --- | --- | --- |
| OTP security | PASS | AuthenticationIT + ProductionAuthIT |
| Access/refresh lifecycle | PASS | AuthenticationIT |
| Rotation/revocation | PASS | Concurrent and replay-family tests |
| Concurrent mobile 401 safety | PASS | session.test.ts |
| Role escalation prevention | PASS | Server authorization test |
| Profile ownership | PASS | Cross-role/client-ID adversarial tests |
| Full customer persistence | PASS | Real PostGIS profile integration test |
| Full worker persistence | PASS | Real PostGIS profile/skill/location integration test |
| Partial onboarding recovery | PENDING USER VALIDATION | API/component pass; native process restart not yet exercised |
| Session restoration | PENDING USER VALIDATION | Unit pass; native SecureStore/process restore not yet exercised |
| PostgreSQL/PostGIS | PASS | Final Java 21 clean verify |
| Phase 1 booking/concurrency | PASS | FoundationIT 12 tests |
| All quality gates | PASS | Postpatch mobile and final backend/admin logs; 3 known moderate findings retained |
| Real APK build/install/launch | PENDING USER VALIDATION | Pending Phase 2 build |
| Customer native E2E | PENDING USER VALIDATION | Not exercised |
| Worker native E2E | PENDING USER VALIDATION | Not exercised |
| No introduced unresolved high/critical dependency issue | PASS | Current npm audits: mobile high/critical 0; admin high/critical 0. Backend dependency scanner unavailable, source/security tests pass |

