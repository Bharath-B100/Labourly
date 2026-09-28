# NammaCrew

An India-first construction workforce marketplace. **Phase 1 foundation; not a working booking product.** NammaCrew is a provisional development name pending legal and trademark clearance.

One repository contains an Android-first Expo application, a Spring Boot modular monolith, a React admin shell, and PostgreSQL/PostGIS schema. Login, discovery, booking APIs and verification operations are not implemented. Customer/worker routes remain protected; the public admin shell contains no administrative records.

- [Local setup and environment variables](docs/LOCAL_DEVELOPMENT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Database and booking invariants](docs/DATABASE.md)
- [API design](docs/API_DESIGN.md)
- [Phase 1 technical report](docs/PHASE_1_REPORT.md)
- [Day 1 business report](docs/DAILY_REPORT_DAY_1.md)
- [Final validation environment and blockers](docs/FINAL_VALIDATION_ENVIRONMENT.md)
- [Mobile dependency review](docs/DEPENDENCY_REVIEW.md)

## Quick start

1. Follow local prerequisites in the setup guide. No global installs are automated.
2. Copy `.env.example` to `.env` and choose a unique local database password.
3. Run `docker compose --profile app up --build` to start the database and Java 21 backend.
4. In `mobile/`, run `npm ci`, copy `.env.example` to `.env`, then `npm start`.
5. In `admin/`, run `npm ci`, then `npm run dev`.

Health is available at `http://localhost:8080/actuator/health`. All other backend resources require authentication; no authentication provider is provisioned in this phase. Do not expect Swagger or admin data to be publicly accessible.

## Quality gates

Run `npm run typecheck`, `npm run lint`, `npm run format:check`, and `npm test` inside both frontend folders. Run `npm run build` in admin and `npx expo export --platform android --platform web` in mobile. Backend: `./mvnw verify` (Windows: `.\mvnw.cmd verify`) requires Java and a working Docker engine for Testcontainers. CI targets Java 21.

Review Phase 1 before beginning Phase 2. No deployment, store publishing, paid service, or production data is included.
