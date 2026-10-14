# LABOURLY design system specification

14 October 2026 · L0 proposal only. No UI or token implementation. The supplied Crewza reference is now saved at `docs/reference/crewza/crewza-16-screens.png`; all sixteen screens are reconciled in the gap analysis. This specification adapts the reference hierarchy, not its identity or palette, and supersedes earlier black/gold/white-glass/teal preferences for future approved work.

## Color tokens — exact palette

| Token | Value | Use |
| --- | --- | --- |
| `brand.safety` | **#FFCC25** | Primary CTA fill, active navigation marker, selection emphasis |
| `ink.charcoal` | **#202326** | Text, icons, focus/control outlines, dark headers/secondary CTA |
| `surface.white` | **#FFFFFF** | Page/form/card backgrounds; text on charcoal |
| `surface.concrete` | **#E5E7EB** | Section fills, separators, skeletons, noninteractive tracks |

No blue, teal, red, green or additional grey brand tokens. Status must use text, icon and shape: check + “Confirmed”, clock + “Pending”, slash + “Cancelled”, exclamation + explicit error. Do not rely on color to distinguish them. Photos may contain natural colors; illustrations and interface chrome follow the palette. Approved brand illustrations must not reproduce Crewza identity.

Locally calculated sRGB contrast ratios: charcoal/white **15.79:1**, charcoal/yellow **10.46:1**, charcoal/concrete **12.75:1**, white/yellow **1.51:1**, concrete/white **1.24:1**. Thus use charcoal text on yellow; never white text on yellow. Concrete borders alone are insufficient to identify required controls on white: use a charcoal outline or other clearly contrasting boundary. Yellow selection/focus on white also needs a charcoal edge. These calculations are evidence for these solid pairs, not certification of an entire rendered screen.

Keep readable surfaces opaque initially. Do not carry forward decorative teal/yellow raster glass backgrounds or translucent text panels. Any future glass/motion treatment must retain the four source colors, measured resulting contrast, low-end Android performance and reduced-motion fallback; it is not necessary for L1.

## Type, spacing and shape

- The reference specifies Inter. Use the installed platform sans-serif initially; no font download/dependency is authorized. Adopting Inter requires license, glyph/language and performance review; exact typography fidelity is not claimed.
- Type scale in scalable units: display 32/40, screen title 24/32, section 20/28, body 16/24, supporting 14/20, label 14/20 with medium weight. Avoid smaller essential prices/status/actions. Weights 400/500/600/700 with platform availability checked.
- Layout spacing: 4, 8, 12, 16, 24, 32, 40, 48 dp. Page gutter 16dp compact / 24dp wider. Card gap16; related-field gap12; section gap24–32. Minimum interactive area48×48dp.
- Radii: controls12, cards16, sheets24 on top corners, avatars circular. Avoid pill styling on every rectangular data field. Borders1dp; focus outline2dp with offset; no low-contrast shadows as the only boundary.
- Neutral shadow uses charcoal only; elevation restrained. Typography supports font scaling up to200% without fixed-height clipping; line wrapping and vertically stacked actions instead of shrinking text.

## Component contracts

| Component | Specification and behavioral states |
| --- | --- |
| `AppButton` | Primary yellow/charcoal; secondary white/charcoal border; strong secondary charcoal/white; tertiary underlined/text action. 48dp min height, flexible label, optional trailing icon. Loading prevents duplicate submit and announces progress. Disabled grey fill/charcoal label plus disabled semantics; no opacity-only explanation. Destructive action uses explicit wording/confirmation, not red. |
| `FormField`, `PhoneField`, `OtpField` | Persistent visible label, helper/error text, appropriate keyboard/autofill, required indicator explained. Charcoal boundary on white; focus yellow accent with dark outline; error exclamation and text. Preserve values on recoverable failures; secrets not logged. |
| `SearchSelect`, `FilterSheet` | Searchable list with selected check/text, empty/loading/retry; Back cancels unconfirmed choices; Apply commits filters. State → District → City dependencies explicitly clear incompatible children. Keyboard/screen-reader selection supported. |
| `SurfaceCard`, `WorkerCard`, `ProjectCard` | White or concrete surface, charcoal hierarchy, one primary destination and separate accessible actions. Real data only; “No reviews yet” instead of sample stars; price basis/headcount/currency explicit. |
| `BottomNavigation` | At most five visible destinations per role; charcoal icon + label, selected yellow indicator with dark border. Safe-area padding, content inset so CTA/cards are not hidden. Accessible selected state; no gesture-only essential actions. |
| `ScreenHeader` | Safe-area-aware title, Back, optional bell; 48dp targets, long-title wrap. Back participates in existing unsaved-change guard. Brand header not repeated inside every content card. |
| `Icon` | Reuse installed icon family, 20–24dp visual /48dp target; consistent stroke weight, charcoal. Icon-only controls get labels; meaningful status always includes text. No emoji-as-critical-status. |
| `FormSection`, `StepHeader` | Group related inputs; announce validation summary and focus first invalid field. Save/Continue disabled only with clear reason; explicit backend success before navigation. |
| `ConfirmDialog`, `BottomSheet` | Focus containment and return, readable body, clear primary/secondary choices; Android Back dismissal policy documented. Dirty editor: Keep Editing / Discard Changes. No accidental form submit on dismissal. |
| `StatusBadge`, `TrustBadge` | Actual server state; text/icon/dark boundary. Trust badge includes meaning/source and expiry where applicable; synthetic review is never labelled real KYC. Cancellation reason visible only to participants. |
| `LoadingState`, `EmptyState`, `ErrorState` | Skeleton/label while loading, meaningful empty action, retry with preserved context. Separate empty from fetch failure; account switch clears previous data. Reduced-motion skeleton/static indicator; avoid endless decorative animation. |
| `PriceSummary`, `MoneyRow` | Agreed unit, quantity, currency, fee/tax breakdown once policy is approved. No hardcoded rates/balances; payment pending distinct from paid or booking confirmed. |
| `Calendar`, `MessageComposer` | Date selection also available as accessible agenda; message send/retry and attachment state explicit. Neither substitutes a UI-only control for server persistence. |

## Navigation proposal — approval required after reference review

The actual customer reference tabs are Home, Workers, Jobs, Chat, Profile. Recommended adaptation for D01 review: Home, Find Workers, Projects, Chat, Profile, with Post Requirement reachable from Home/Projects instead of occupying a sixth tab. This replaces the earlier proposed Post tab in the planning recommendation only; no route changes are authorized. Saved workers are reachable from Home/Find Workers; schedule selection from a requirement, operational calendar from Projects; notifications from the header; wallet from Home/Projects/Profile. Worker tabs remain a separate proposal: Home/Opportunities, Quotes, Calendar, Projects, Profile, with team/earnings/chat accessible from relevant hubs. Retain old route aliases during migration. All sixteen screens remain reachable.

Login/role/onboarding sit outside role tabs. Notification and deep-link routes must wait for authentication and role eligibility, fetch target authorization, then navigate. Shared resource screens receive IDs, not trusted cached objects. Unsaved guards apply to all supported removal paths, never the operating-system Home button.

## Screen-to-component mapping

| Screen | Reusable components |
| --- | --- |
| 1 Splash | SplashBrand, StartupBoundary |
| 2 Onboarding | IntroCarousel, PageIndicator, NextAction; separate persisted profile flow uses StepHeader, FormSection, SearchSelect, TradeSkillPicker, ReviewSummary |
| 3 Role selection | RoleChoiceCard, AppButton |
| 4 Sign in/up | AuthShell, PhoneField, OtpField, ErrorState |
| 5 Home | LocationHeader, NotificationBell, SearchField, TradeGrid, PromotionalCard, ProjectCard |
| 6 Labour listing | WorkerCard, ResultSummary, ListState, SaveToggle |
| 7 Smart filters | FilterSheet, SearchSelect, DateRange, RateRange, AvailabilityWindow, RateUnitChoice, RatingChoice, VerifiedToggle, AppliedFilterChips |
| 8 Worker profile | ProfileHeader, TrustBadge, PriceSummary, SkillTiles, LanguageList, ReviewList, SaveToggle, HireAction, CallAction |
| 9 Post requirement | FormSection, JobLocationPicker, DateRange, PublishReview, ConfirmDialog |
| 10 Calendar | SchedulePicker, CalendarGrid, PreferredTimeChoice, DurationStepper, ScheduleSummary; operational calendar also uses AgendaList, CapacityBadge, ConflictMessage |
| 11 Chat/call | ConversationRow, MessageList, JobContextCard, QuickReplies, Composer, CallConsentSheet; video control pending D07 |
| 12 Projects | LifecycleTabs, ProjectCard, FilledCapacity, Timeline, AssignmentRoster, AttendanceRow, StatusBadge |
| 13 Wallet | MoneyRow, PaymentSummary, Receipt, PayoutStatus, RefundState; balance/top-up/send/request/invoice controls pending D08 |
| 14 Notifications | NotificationBell, DateGroup, NotificationRow, UnreadIndicator, PreferenceToggle, ListState |
| 15 Saved workers | WorkerCard, SaveToggle, ListState |
| 16 Settings | ProfileHeader, SettingsRow, ConsentSummary, ConfirmDialog |

## Responsive/native acceptance

Test320/360/412dp widths, small-height devices, gesture/three-button system bars, keyboard open, display/font scaling and tablet widths600dp+. Single-column forms at compact widths; cap readable form width560dp on large screens; two-column result cards only when text remains readable. Scroll content behind no fixed footer; apply safe-area and keyboard insets. Use dimensions/breakpoints rather than absolute screenshot coordinates. Existing portrait configuration is not proof of tablet or landscape support; decide rotation separately.

TalkBack names/roles/states, focus order, reduced motion, 48dp targets, text contrast and large-font screenshots are acceptance gates. Validate every loading/error/empty/disabled state, not only happy-path renders. Use charcoal and text for low-contrast-disabled distinctions. UI snapshots supplement functional/native tests, never replace API behavior. No fonts/assets/native libraries selected or installed in L0.
