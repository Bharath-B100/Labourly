---
page: Customers
---
A detailed directory and management screen for NammaCrew Customers (clients who book workers).

**DESIGN SYSTEM (REQUIRED):**
# Design System: NammaCrew Admin Dashboard

## 1. Visual Theme & Atmosphere
A restrained, highly professional interface with confident asymmetric layouts and fluid spring-physics motion. The atmosphere is clinical yet warm — like a well-lit control room. Density is 6 (Daily App Balanced), Variance is 5 (Offset Asymmetric), and Motion is 6 (Fluid CSS).

## 2. Color Palette & Roles
- **Canvas White** (#F8FAFC) — Primary background surface (Slate-50)
- **Pure Surface** (#FFFFFF) — Card and container fill
- **Charcoal Ink** (#020617) — Primary text, Slate-950 depth
- **Muted Steel** (#64748B) — Secondary text, descriptions, metadata (Slate-500)
- **Whisper Border** (rgba(226,232,240,0.5)) — Card borders, 1px structural lines
- **Teal Accent** (#2DD4BF) — Single accent for CTAs, active states, focus rings (Teal-400)

## 3. Typography Rules
- **Display:** Satoshi — Track-tight, controlled scale, weight-driven hierarchy
- **Body:** Satoshi — Relaxed leading, 65ch max-width, neutral secondary color
- **Mono:** JetBrains Mono — For code, metadata, timestamps, high-density numbers
- **Banned:** Inter, generic system fonts for premium contexts. Serif fonts banned in dashboards.

## 4. Component Stylings
* **Buttons:** Flat, no outer glow. Tactile -1px translate on active. Teal Accent fill for primary, ghost/outline for secondary.
* **Cards:** Generously rounded corners (1.5rem). Diffused whisper shadow. Used only when elevation serves hierarchy. High-density: replace with border-top dividers.
* **Inputs:** Label above, error below. Focus ring in accent color. No floating labels.
* **Loaders:** Skeletal shimmer matching exact layout dimensions. No circular spinners.
* **Empty States:** Composed, illustrated compositions — not just "No data" text.

## 5. Layout Principles
Grid-first responsive architecture. Sidebar navigation on the left, main content area on the right.
Strict single-column collapse below 768px. Max-width containment for content area.
No flexbox percentage math. Generous internal padding (2rem to 3.5rem).

## 6. Motion & Interaction
Spring physics for all interactive elements. Staggered cascade reveals on list load.
Perpetual micro-loops on active dashboard components. Hardware-accelerated transforms only.

## 7. Anti-Patterns (Banned)
- No emojis
- No Inter font
- No pure black (#000000)
- No neon glows
- No 3-column equal grids
- No AI copywriting clichés
- No generic placeholder names
- No broken image links
- No fake numbers or statistics (use [metric] placeholder instead)
- No serif fonts

**Page Structure:**
1. Sidebar navigation with Customers active.
2. Header with "Customers" title, a search bar specifically for finding customers by ID or name, and an "Add Customer" primary CTA.
3. A large, well-structured data table or grid listing customers. Columns: Customer ID, Name, Contact, Active Bookings, Status (Active/Inactive), Action.
4. On the right side, an optional inspector panel (asymmetric split) showing details of the currently selected customer.
