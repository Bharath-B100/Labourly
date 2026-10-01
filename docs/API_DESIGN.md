# API design — Phase 2 & 3

Implementation contract updated for Phase 3 (Marketplace Discovery & Matching). See PHASE_2_REPORT.md and PHASE_3_REPORT.md for execution evidence. No operational admin API is exposed yet.

## Authentication

| Method / path | Request | Success |
| --- | --- | --- |
| GET /actuator/health | None | 200 with status UP when backend/database are healthy; details hidden |
| POST /api/v1/auth/otp/request | {phone}, E.164 | 204, no OTP returned |
| POST /api/v1/auth/otp/verify | {phone, code}, six digits | 200 {accessToken, refreshToken} |
| POST /api/v1/auth/refresh | {refreshToken} | 200 replacement credential pair |
| POST /api/v1/auth/logout | {refreshToken} | 204, session revoked |

OTP lifetime is five minutes, maximum verification attempts three, request interval 60 seconds including after verification. Failed attempts persist. Phone transaction locks serialize requests/verification. Codes are logged only under dev without prod/production. Production SMS is unconfigured and requests fail closed with 503. No paid provider is enabled.

Access tokens use symmetric HS256, issuer nammacrew, user UUID subject, session UUID sid, issue time, expiry (15 minutes by default), and random JWT ID. Every authenticated request checks the current database session, account status and roles. Outside dev/test, JWT_SECRET must contain a base64 key of at least 32 cryptographically random bytes. Development without a supplied key generates an ephemeral key at startup.

Refresh credentials contain 32 random bytes encoded as URL-safe base64. Only SHA-256 hashes are persisted. Session lifetime is 30 days; rotation does not extend it. Rotation locks the session family. Reuse of an old token revokes the family; logout also invalidates associated access tokens. Credential DTO string representations are redacted. Clients must serialize concurrent refresh attempts and retry a protected request at most once.

## Identity and onboarding

All routes below require a Bearer access token. Ownership comes exclusively from authenticated identity. Unknown JSON fields, including client-supplied ownership IDs, are rejected.

| Method / path | Contract |
| --- | --- |
| GET /api/v1/users/me | Current id, phone, fullName, roles, onboardingState, onboardingStep |
| POST /api/v1/users/me/roles | {role}; initial CUSTOMER or WORKER only; no ADMIN or role switching |
| GET /api/v1/onboarding/catalogue | Backend-managed customer types, active trades and skills |
| GET /api/v1/onboarding or /api/v1/profile | Current {role, state, step, data} draft |
| PUT /api/v1/onboarding | {step, data} full snapshot; advance at most one step, validate prerequisites |
| POST /api/v1/onboarding/complete | Complete after valid review; returns current user |
| POST /api/v1/profile/customer | Full completed profile edit; CUSTOMER required |
| POST /api/v1/profile/worker | Full completed profile edit; WORKER required |

Profile data: fullName, customerType, optional companyName, workerType, optional profilePhotoUrl, tradeId, skillIds, experienceYears, state, district, city, postalCode, availability, conditional teamName/teamSize. Irrelevant fields may be null. Authenticated phone is read-only, not accepted as a profile field.

Customer types: HOMEOWNER, ARCHITECT, INTERIOR_DESIGNER, CONTRACTOR, BUILDER, COMPANY (Construction Company), SITE_ENGINEER, PROJECT_MANAGER, OTHER. Customer steps: details 0, location 1, review 2. Worker steps: details 0, trade/skills 1, location/availability 2, review 3. Initial trades: Carpenter, Electrician, Plumber. Skills must belong to the selected active trade. Worker type: INDIVIDUAL or TEAM; teams need a name and size 2–1000. Experience: 0–80 years. Availability: AVAILABLE, BUSY, UNAVAILABLE. Postal code: six digits. Optional photos use an HTTPS URL; upload/storage is not implemented.

## Marketplace (Phase 3)

| Method / path | Request | Success |
| --- | --- | --- |
| GET /api/v1/requirements | `page`, `size` | 200 Paginated requirements list for CUSTOMER |
| POST /api/v1/requirements | RequirementForm | 200 {id} for created requirement |
| GET /api/v1/requirements/{id} | | 200 RequirementView (CUSTOMER or WORKER) |
| GET /api/v1/requirements/{id}/matches | | 200 List of matched workers |
| PUT /api/v1/requirements/{id}/status | `status` string | 204 Status updated |
| GET /api/v1/marketplace/search | `tradeId`, `lat`, `lng`, `radiusKm`, `page`, `size` | 200 Paginated list of workers |
| GET /api/v1/opportunities | `page`, `size` | 200 Paginated opportunities for WORKER |
| GET /api/v1/opportunities/{id} | | 200 RequirementView |
| PUT /api/v1/availability | `status` string | 204 Worker availability updated |

Worker search results only include VERIFIED workers (e.g. APPROVED status) by default to prevent falsely displaying unverified workers.

## Errors and boundaries

RFC 9457 errors: 400 invalid input, 401 missing/invalid/expired authentication, 403 denied role/account, 409 invalid state, 429 OTP limits, 503 unavailable production OTP delivery. Credentials, SQL errors and stack traces are not response details. Admin routes, OpenAPI and Swagger require ADMIN even when documentation generation is enabled.

Mobile stores credentials in Expo SecureStore, shares one in-flight refresh, prevents recursive refresh, and loads identity/progress from the server. HTTP authentication uses bearer headers, not cookies; CSRF is disabled for this model. A future cookie-based design must revisit CSRF. Discovery, booking HTTP workflows and operational admin features remain outside Phase 2.
