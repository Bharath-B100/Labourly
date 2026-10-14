# Yellow and teal glass UI

10 October 2026. Replaces the earlier white/blue glass direction.

Implemented the reference palette and glass treatment in the mobile application: sunflower yellow actions and selected tabs, deep teal text, pearl/mint background, reflective rounded cards, pill buttons with circular arrows, and adjoining glass navigation lenses. Shared controls also carry the theme into authentication, worker screens, details and profile flows.

The five customer pages retain their existing data and behavior. No fictional mockup content was inserted. Current coverage selection and draft-only time/budget fields remain as implemented, rather than exposing unsupported mockup features. Draft navigation guards, API calls, validation, loading/error behavior and reduced-motion support remain in place.

Glass is a native visual approximation using translucent surfaces, inset highlights, soft shadows, a static gradient asset and existing press animations. It does not implement live optical displacement or backdrop refraction. No new dependencies or native rebuild were needed.

Validation: TypeScript and lint passed. Mobile regression suite passed 87 tests across 15 suites. All five signed-in customer tabs were opened and visually inspected on the Android emulator against the local backend. The active-tab rectangular highlight found during inspection was corrected using the router's PlatformPressable with a rounded clipping boundary. Booking amount/basis spacing was also corrected. No jobs, profiles or bookings were submitted or modified during visual checks.

Native screenshots are stored under `docs/verification/yellow-teal-*.png`. These are actual emulator captures, not generated concepts. Physical-device, iOS, large-font and screen-reader validation remain unperformed.

Final checks after the navigation and price-label corrections: TypeScript and lint exited successfully; all 87 tests in 15 suites passed again. The discovery test emitted a React `act(...)` warning from an asynchronous query notification; it was not suppressed. No React Native JavaScript errors or Android fatal errors appeared in the scoped log inspection.
