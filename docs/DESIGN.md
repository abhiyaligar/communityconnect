---
name: Secure Professional
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45464d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#0b1c30'
  on-tertiary-container: '#75859d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  container-max: 1280px
  gutter: 24px
---

## Brand & Style
The design system is engineered to project absolute reliability, security, and institutional trust. Targeting community leaders and members who prioritize privacy and authentic connection, the aesthetic balances the authority of traditional finance with the efficiency of modern SaaS.

The visual style is **Corporate / Modern** with a focus on structural clarity. It utilizes a disciplined layout, high-contrast functional elements, and a clean, systematic approach to information density. The emotional response is one of safety and order, achieved through a "less but better" philosophy that avoids decorative clutter in favor of meaningful utility.

## Colors
The palette is anchored by **Deep Navy (#0F172A)**, used for primary branding, headers, and high-level navigation to establish authority. **Emerald Green (#10B981)** is strictly reserved for "Verified" statuses, success indicators, and positive actions, serving as a signature "trust signal" across the platform.

The background system uses a tiered approach of **Slate Grays**:
- **Base:** #F8FAFC (Neutral Background)
- **Muted Surface:** #F1F5F9 (Secondary sections)
- **Border/Stroke:** #E2E8F0 (Subtle containment)
- **Secondary Text:** #64748B (Metadata and labels)
- **Primary Text:** #0F172A (Headlines and body)

## Typography
**Inter** is the sole typeface for this design system, chosen for its exceptional legibility and systematic appearance. 

- **Weight Usage:** Use *SemiBold (600)* for headlines to ensure they stand out against dense data. Use *Medium (500)* for labels and interactive components like buttons.
- **Readability:** Body text is set with a generous 1.5x line height to prevent reader fatigue in long-form community discussions.
- **Hierarchy:** Capitalization is used sparingly for `label-sm` (all-caps) to denote status badges or secondary navigation categories.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy for desktop to maintain a sense of controlled, structured information. The primary content container is capped at 1280px.

- **Grid:** A 12-column system is used for desktop (24px gutter), collapsing to a 4-column system for mobile (16px gutter).
- **Rhythm:** An 8px linear scale governs all spacing. Vertical rhythm is strictly enforced—margins between sections should typically be `xxl` (48px) to provide "breathing room" that signals a premium, organized experience.
- **Alignment:** All forms and data cards must align to the left vertical axis of the grid to maintain a strong "line of sight" for the user.

## Elevation & Depth
Depth in this design system is communicated through **Tonal Layers** and **Ambient Shadows**.

1.  **Level 0 (Base):** #F8FAFC. The main canvas.
2.  **Level 1 (Cards/Surfaces):** White (#FFFFFF) with a thin 1px stroke (#E2E8F0). This is the primary container for member profiles and posts.
3.  **Level 2 (Interactive/Floating):** Used for dropdowns and modals. These utilize a highly diffused, low-opacity shadow: `0px 10px 15px -3px rgba(15, 23, 42, 0.08)`.

Shadows are never harsh; they are tinted with the Deep Navy primary color at very low opacity to maintain a cohesive color temperature.

## Shapes
The design system uses a **Rounded** shape language to soften the professional aesthetic and make the platform feel more approachable and modern.

- **Components:** Standard buttons, input fields, and small cards use a 0.5rem (8px) radius.
- **Large Containers:** Profile headers and main content cards use a 1rem (16px) radius.
- **Badges:** Success/Verified badges use a fully rounded (pill) shape to distinguish them from interactive buttons.

## Components
- **Buttons:** 
    - *Primary:* Deep Navy background, white text. High contrast.
    - *Secondary:* White background, Slate Gray border, Deep Navy text.
    - *Success:* Emerald Green background (used only for "Verify" or "Confirm" actions).
- **Status Badges:** 
    - *Verified:* Emerald Green background (10% opacity) with Emerald Green text and a checkmark icon.
    - *Pending:* Amber (#F59E0B) text and light background.
    - *Unverified:* Slate Gray text and background.
- **Member Profile Cards:** Structured data containers with 24px internal padding. Uses `title-lg` for names and `label-md` for metadata. Profile images are always circular with a 2px white border and subtle shadow.
- **Input Fields:** 1px solid border (#E2E8F0). On focus, the border transitions to Deep Navy with a 2px "halo" (shadow) of the primary color at 5% opacity.
- **Navigation:** A persistent sidebar (desktop) or bottom bar (mobile) using Deep Navy icons on a Slate 50 background to indicate the active state.