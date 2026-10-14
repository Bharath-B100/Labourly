# Mobile black-and-gold glass theme

Updated 2026-10-09.

## Scope

Customer and worker navigation, authentication, profile/onboarding, discovery, requirements and draft editing, quotations, bookings/cancellation, location and service-area selectors share a charcoal, cream and warm-gold palette. Semantic red/green/blue states remain distinct and labelled.

Theme tokens live in `mobile/tailwind.config.js`. Shared buttons, inputs, searchable dropdowns and empty/loading states live in `mobile/src/components/ui.tsx`. Navigation headers/status bars and screen-specific cards were updated to suit the dark background. Existing navigation, form submissions and marketplace rules were preserved.

Glass styling uses translucent surfaces, fine gold borders, rounded corners and soft shadows. It does not use native backdrop blur. No new dependencies or APK rebuild were required to display these JavaScript/style changes through Metro.

## Validation

- PASS: 87 mobile tests across 15 suites.
- PASS: final TypeScript, lint and Prettier checks (source and Tailwind configuration).
- PASS: emulator displayed the gold primary button, translucent outlined card, secondary button and cream typography on the session-error screen.
- BLOCKED: authenticated native visual review. The session could not be restored; localhost:8080 refused the health connection during verification. Backend startup and data were not changed for this theme task.
- Not claimed: complete native acceptance or production release readiness.

No database records, booking history, dependencies or backend source were intentionally changed by this theme update.

