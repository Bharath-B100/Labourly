# White glass mobile theme

2026-10-09. Supersedes the black/gold visual direction in BLACK_GOLD_UI.md.

## Changes
- White translucent surfaces on a cool pearl background; dark slate typography and restrained blue-grey accents.
- Glossy highlight rims, soft shadows and rounded navigation capsules.
- Shared action buttons compress on press and spring back on release.
- Searchable dropdown panels fade and slide into view over 180 ms.
- Motion follows the device reduced-motion setting, starts conservatively disabled until that setting resolves, and stops on unmount.
- Existing navigation guards, permissions, APIs, data and dependency versions are preserved.

## Evidence and limitations
- TypeScript and lint pass after correcting animation value initialization.
- Mobile regression suite: 87 tests across 15 suites passed.
- Existing emulator displays the new welcome and login screens. Tapping Get Started navigated to login; no OTP was submitted.
- Screenshots: .tools/white-glass-preview.png and .tools/white-glass-login.png.
- Signed-in navigation and dropdown animation have not been manually exercised on this native session; automated dropdown selection, dismissal and disabled-state tests pass.
- Still reference images do not establish exact motion timing. The implemented animations are an interpretation.
- Glass is simulated with translucent layers and specular highlights, not native backdrop blur or optical refraction. No dependency installation or native APK rebuild was performed.

## Supplied pill component integration — 2026-10-10

The welcome screen uses `GlassStartButton.tsx`: responsive full width capped at 360 logical pixels, minimum 74-pixel touch height, wrapping label, dark circular chevron, reflective inner rim and press/hover spring feedback. Keyboard focus and disabled semantics are supported; the existing reduced-motion hook is reused. Get Started retains its login route.

This is a native adaptation of the supplied HTML/CSS reference. Browser SVG displacement filters, optical refraction, backdrop blur and the unrelated flower background are not imported into Android. Existing marketplace buttons remain unchanged. Native visual verification of this specific button remains pending because the emulator was on the session-loading screen.

Component validation: TypeScript passed; targeted lint and the queued mobile regression run remain pending under low-memory conditions. Do not treat the earlier 87-test result as validation of this new component.

## Welcome and phone login refinement — 2026-10-10

Welcome: removed duplicate app header and NC badge; added architectural illustration, customer/worker information card and a restrained white CTA. Phone login: removed NC badge, added heading hierarchy, glass form panel, country-code guidance and next-step information. Existing session redirects, normalization, OTP API and pending/error handling remain in place. Layouts scroll and text can wrap.

Formatting completed. Welcome TypeScript completed successfully; lint and regression processes are still pending under memory pressure. Login lint is pending. Native screenshot capture timed out; neither redesigned screen is claimed as visually verified.
