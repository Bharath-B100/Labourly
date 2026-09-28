# API design

## Available now

`GET /actuator/health` returns `200 {"status":"UP"}` when the application and database are healthy, or a non-success status when unhealthy. Component details are hidden. No marketplace controller or administrative data endpoint is implemented.

All other requests require authentication. Authentication itself is intentionally not provisioned. `/api/v1/admin/**`, `/v3/api-docs/**`, and Swagger UI require ADMIN. `OPENAPI_ENABLED=true` enables generation, not public access. A later identity integration must issue verified roles and enforce ownership; no client-side role flag is trusted.

## Conventions for future endpoints

- Prefix business endpoints with `/api/v1`; use plural resource names.
- Return typed resource JSON directly. Collections use `{items, page, size, total}` with bounded page sizes.
- `201` + Location for creation, `200` for reads/updates, `204` for empty success.
- Use UUID identifiers and ISO 8601 instants with an explicit offset; store UTC.
- Validate request DTOs using Bean Validation and cross-field rules. Never bind JPA entities directly.
- Use `400` for malformed/invalid input, `401` for missing authentication, `403` for denied permission, `404` for absent or concealed resources, `409` for state/availability conflicts.
- Use RFC 9457 `application/problem+json` with `type`, `title`, `status`, and safe optional `detail`. Never return SQL errors, credentials, internal exception messages or stack traces.
- Booking writes need transactional ownership checks and idempotency handling before exposure.

Example authentication error actually supported by the security filter:

```json
{ "type": "about:blank", "title": "Authentication required", "status": 401 }
```

Planned resources are users/me, worker profiles, categories, requirements, booking requests, bookings and admin verification reviews. These names are design guidance, not available APIs. JWT/OTP provider, refresh-token policy, admin MFA, CORS allowlist and rate limits require design and implementation during the next approved phase. CSRF remains enabled in Phase 1; do not disable it casually when introducing cookie authentication.
