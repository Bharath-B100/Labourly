# NammaCrew / Labourly Documentation

Welcome to the comprehensive documentation index for the NammaCrew / Labourly monorepo. This directory houses architectural specifications, database schemas, API contracts, verification reports, and reference design mockups.

---

## 📁 Repository Directory Structure

```
NammaCrew/
├── .github/                     # Continuous Integration workflows
├── .tools/                      # Repository dev-tools & quality checks
├── admin/                       # React 19 + Vite web administration portal
│   ├── src/                     # React admin source components and views
│   └── package.json             # Admin web dependencies & scripts
├── backend/                     # Spring Boot 3 + Java 21 modular monolith
│   ├── src/main/java/           # Domain modules (auth, booking, chat, marketplace, user)
│   ├── src/main/resources/      # Application configs & Flyway database migrations
│   ├── src/test/java/           # Testcontainers integration tests & unit suites
│   ├── pom.xml                  # Maven dependencies & build plugins
│   └── Dockerfile               # Backend container configuration
├── docs/                        # Architectural documentation, ADRs & reports
│   ├── artifacts/               # Verification snapshots & infrastructure inspects
│   ├── reference/               # Reference datasets, design mockups & specs
│   │   ├── crewza/              # Crewza 16-screen reference spec
│   │   ├── design-mockups/      # High-fidelity iOS design mockups & brand assets
│   │   └── location/            # LGD canonical district datasets & crosswalks
│   └── verification/            # Historical build/test verification records
├── mobile/                      # Expo React Native Android/iOS mobile application
│   ├── assets/                  # App icons, splash screens, hardhat branding, and mockups
│   │   ├── banners/             # Promotional & category hero banners
│   │   ├── labourly/            # Official Labourly wordmark, hardhat icons & mockups
│   │   └── profiles/            # Trade profile photos (mason, plumber, carpenter...)
│   ├── src/
│   │   ├── api/                 # Strongly-typed API clients (auth, chat, marketplace...)
│   │   ├── app/                 # Expo file-based routing ((customer), (worker), auth)
│   │   ├── auth/                # Session lifecycle & query cache isolation
│   │   ├── components/          # Reusable UI components & screen views (LabourlyLiveChat...)
│   │   ├── hooks/               # Custom hooks (e.g., location, push, state)
│   │   ├── location/            # Device GPS & district-level location resolver
│   │   └── __tests__/           # Comprehensive Jest test suites (32 suites, 175 tests)
│   ├── package.json             # Mobile dependencies & test runners
│   └── app.json                 # Expo project configuration
├── output/                      # Extracted design HTML prototypes & glass UI builds
├── patches/                     # Standalone bundling patches
├── scripts/                     # Local environment & validation scripts
├── .env.example                 # Environment variables template
├── compose.yaml                 # Docker Compose configuration (PostgreSQL/PostGIS, Redis)
└── README.md                    # Project overview & quickstart
```

---

## 📚 Core Architecture & Guides

| Document | Description |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | High-level system design, modular monolith boundaries, and mobile architecture |
| [API_DESIGN.md](API_DESIGN.md) | RESTful API specifications, endpoints, request/response models, and error handling |
| [DATABASE.md](DATABASE.md) | PostgreSQL / PostGIS schemas, migration invariants, and data integrity constraints |
| [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md) | Complete local development guide for Backend, Mobile, and Admin |
| [CLIENT_DEMO_GUIDE.md](CLIENT_DEMO_GUIDE.md) | Interactive demo walkthrough for client presentations |
| [DIRECTORY_STRUCTURE.txt](DIRECTORY_STRUCTURE.txt) | Machine-readable file tree of primary repository assets |

---

## 🎨 Reference & Design Assets

- **[reference/design-mockups/](reference/design-mockups/)**: Original iOS design screen references:
  - Home Dashboard, Labour Listing, Worker Profile, Chat Screen, Notifications, Wallet, Post Requirement, Select Schedule, and Brand Logos.
- **[reference/crewza/](reference/crewza/)**: Crewza 16-screen reference spec and layout comparisons.
- **[reference/location/](reference/location/)**: Government Local Government Directory (LGD) canonical district dataset, state crosswalks, and migration scripts.

---

## 🛡️ Architecture Decision Records (ADR) & Milestones

- **[ADR_P1_6_PRODUCTION_OTP_ARCHITECTURE.md](ADR_P1_6_PRODUCTION_OTP_ARCHITECTURE.md)**: Redis-backed state machine for phone OTP challenges, rate limiting, and fallback outbox.
- **[PHASE_1_REPORT.md](PHASE_1_REPORT.md)** to **[PHASE_4_REPORT.md](PHASE_4_REPORT.md)**: Sequential milestone delivery reports, audit checklists, and security sign-offs.

