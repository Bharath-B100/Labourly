# NammaCrew client demo guide

Verified against local source and development database on 13 October 2026. This describes the Phase 4 development demo, not a production release.

## Explain the product

NammaCrew connects people who need construction work with workers who have the right trade, service coverage and available dates. Customers post requirements and compare quotations. Workers discover suitable opportunities and submit prices. Accepting a quotation creates a booking and reserves the worker's schedule. Both parties can track booking status and receive in-app notifications.

## Roles

| Role | Purpose | Current implementation |
| --- | --- | --- |
| Customer | Hire workers for a project | Phone sign-in, profile/onboarding, Find Workers, draft requirements, publishing, quotation comparison/acceptance, bookings, cancellation, in-app notifications |
| Worker | Find work and manage commitments | Profile, trade/skills, availability, service areas, opportunities, quotations, bookings, cancellation information and in-app notifications |
| Admin | Platform operations | Role exists in database; admin website is a navigation shell. Secure admin sign-in and working management screens are not implemented. No existing local ADMIN account was found. |

Customer types are profile categories, not separate permission roles: Homeowner, Architect, Interior Designer, Contractor, Builder, Construction Company, Site Engineer, Project Manager and Other. Workers can be Individual or Team. Carpenter/Electrician are trades, not login roles. Worker A/B/C/D/E are fixture labels, not access levels.

## Existing demo accounts

These six accounts were read directly from the existing database; all are ACTIVE. Enter the full phone number and request a code. The isolated **development** OTP is `123456`; this is not a production SMS login.

| Phone | Current display name | Role / demo purpose |
| --- | --- | --- |
| +919999999990 | Bharath Customer | Customer: post requirements, compare quotes, accept and view bookings |
| +919999999991 | Suresh Carpenter (Worker A) | Available worker; demonstrate Carpenter profile and existing confirmed bookings. AVAILABLE does not override date conflicts or geographic eligibility. |
| +919999999992 | Worker B (Electrician, In) | Available Electrician; demonstrate trade-specific matching |
| +919999999993 | Worker C (Carpenter, Unavail) | Unavailable Carpenter; demonstrate availability filtering |
| +919999999994 | Worker D (Carpenter, Out) | Available Carpenter; original outside-Bengaluru coverage fixture. Matching always depends on current coverage and job location. |
| +919999999995 | Worker E (Carpenter, In) | Available Carpenter; second quotation candidate and existing cancellation-history example |

Other disposable automated-test accounts may exist. They are not the main client demo identities. Sign out from Profile before switching accounts; do not clear app storage or reinstall it.

## Suggested presentation

1. Introduce the Customer and Worker sides and phone onboarding.
2. As Bharath Customer, show Find Workers and GPS/manual State–City selection. Explain that GPS alone does not establish verified state/district boundaries.
3. Show a draft requirement's trade, location, dates, worker count and explicit save/publish controls. Avoid publishing or changing existing acceptance fixtures during a presentation.
4. As a worker, show service coverage (local radius, districts, states or nationwide), availability and suitable opportunities. Eligibility also checks account/profile state, trade, visibility and schedule.
5. Show My Quotes and customer quotation comparison. Explain that acceptance selects a winner and creates one booking; conflicting confirmed dates are rejected.
6. Show existing confirmed bookings read-only. Show Worker E's cancelled booking and its cancellation reason, actor and timestamp. An accepted quote is historical; the current booking can later be CANCELLED.
7. Show notification bells/inboxes for work available, quote received/accepted/rejected and booking cancelled. Notifications are account-specific and link to authorized screens.
8. Show the admin preview only as the planned operations navigation, clearly labelled unfinished.

Preserve Suresh's October 8–10 and October 15–17 confirmed bookings and Worker E's October 22–23 cancelled booking, together with all related quotation/cancellation history. Use separately approved disposable records for a live accept/cancel demonstration.

## What each running component does

| Component | Address | Responsibility |
| --- | --- | --- |
| Android app | Medium_Phone_API_36.1 emulator | Customer and worker user experience |
| Metro | http://127.0.0.1:8083 | Development JavaScript delivery to the installed app; not the business API |
| Spring Boot / Java 21 | http://127.0.0.1:8080 | Authentication, authorization, matching, quotations, bookings and notifications |
| Health | http://127.0.0.1:8080/actuator/health | Backend health indicator |
| PostgreSQL + PostGIS | Local Docker database, port 5432 | Persistent records, geographic matching and booking constraints |
| Admin preview | http://127.0.0.1:5173 | React/Vite operations shell, no real administration yet |

The emulator uses `http://10.0.2.2:8080` to reach the host backend. Phone localhost would point to the phone itself.

## Be clear about readiness

Implemented demo capabilities are not equivalent to public launch readiness. Real background/lock-screen push delivery is NOT IMPLEMENTED. The admin dashboard is a shell. Backend dependency vulnerability assessment is UNASSESSED. Remaining native notification failure/retry and account-switch race checks are documented separately. Do not advertise payments, live tracking, production SMS delivery or fully operational admin tools without separate implementation evidence. No Phase 5 or public-release approval is implied by this demo.
