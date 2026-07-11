# BioEdu Platform — Design System

> **Version:** 1.0  
> **Platform:** Biology Education Web App (Teacher Admin + Student Portal)  
> **Color Theme:** Black · Red · White  
> **Last Updated:** June 2026

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Color Palette](#2-color-palette)
3. [Typography](#3-typography)
4. [Spacing System](#4-spacing-system)
5. [Border Radius](#5-border-radius)
6. [Elevation & Shadows](#6-elevation--shadows)
7. [Iconography](#7-iconography)
8. [Motion & Animation](#8-motion--animation)
9. [Components](#9-components)
   - [Navigation](#91-navigation)
   - [Buttons](#92-buttons)
   - [Badges & Tags](#93-badges--tags)
   - [Form Elements](#94-form-elements)
   - [Cards](#95-cards)
   - [Data Tables](#96-data-tables)
   - [Alerts & Notifications](#97-alerts--notifications)
10. [Page Layout Patterns](#10-page-layout-patterns)
11. [Role-Based Design](#11-role-based-design)
12. [AI Feature Language](#12-ai-feature-language)
13. [Responsive Design](#13-responsive-design)
14. [Accessibility](#14-accessibility)
15. [CSS Custom Properties Reference](#15-css-custom-properties-reference)

---

## 1. Design Philosophy

The BioEdu platform follows a **Scholarly Editorial** aesthetic — combining the authority of academic publishing with the clarity and efficiency of a modern SaaS product. Every design decision is guided by five principles:

| Principle | Description |
|-----------|-------------|
| **Calm & Soothing** | Warm cream backgrounds, generous whitespace, and restrained motion prevent eye fatigue during long study sessions |
| **Clear Hierarchy** | DM Serif Display headings provide strong visual anchors; DM Sans body text ensures effortless reading |
| **Role Clarity** | Teacher (admin) and student interfaces use distinct visual weight to prevent confusion |
| **AI Distinction** | AI-powered features carry a dedicated visual language — instantly recognizable without being intrusive |
| **Accessible by Default** | All color combinations meet WCAG AA contrast requirements; interaction states are always visible |

---

## 2. Color Palette

### 2.1 Brand Colors

The three brand pillars — Black, Red, and White — are expanded into full shade scales for nuanced use across all UI contexts.

### 2.2 Black / Gray Scale — Primary

Used for navigation, headings, body text, borders, and structural UI elements.

| Token | Hex | Usage |
|-------|-----|-------|
| `--gray-900` | `#0A0A0A` | Nav background, hero sections, primary CTAs |
| `--gray-800` | `#1A1A1A` | Section headings, strong labels |
| `--gray-700` | `#2D2D2D` | Sub-headings, emphasized body text |
| `--gray-600` | `#444444` | Body text, form labels |
| `--gray-500` | `#5C5C5C` | Secondary body text |
| `--gray-400` | `#767676` | Placeholder text, muted labels |
| `--gray-300` | `#999999` | Disabled text, tertiary info |
| `--gray-200` | `#C4C4C4` | Dividers, skeleton loaders |
| `--gray-100` | `#E0E0E0` | Borders, input outlines |
| `--gray-50` | `#F4F4F4` | Card backgrounds, hover states |
| `--white` | `#FFFFFF` | Card surfaces, modal backgrounds |
| `--off-white` | `#FAF9F7` | Slightly warm white for text areas |
| `--cream` | `#F5F2EE` | **Page background** — primary soothing base |

### 2.3 Red Scale — Accent

Used for calls to action, AI features, highlights, alerts, and brand accents.

| Token | Hex | Usage |
|-------|-----|-------|
| `--red-900` | `#1A0202` | Deepest red — rarely used directly |
| `--red-800` | `#3B0505` | Teacher/admin role badge |
| `--red-700` | `#5C0808` | Danger text on light backgrounds |
| `--red-600` | `#7E0B0B` | Danger icon color |
| `--red-500` | `#A51212` | **Primary accent** — links, active states |
| `--red-400` | `#C41F1F` | **CTA background** — primary buttons |
| `--red-300` | `#D94040` | Nav brand accent, live badge dot |
| `--red-200` | `#E87272` | Hover states on red elements |
| `--red-100` | `#F4B3B3` | Red border on light surface |
| `--red-50` | `#FBE8E8` | Red tinted backgrounds, danger cards |

### 2.4 Semantic / Status Colors

| Status | Background | Border | Text | Usage |
|--------|-----------|--------|------|-------|
| **Success** | `#E8F5E9` | `#C8E6C9` | `#2E7D32` | Submission confirmed, resource uploaded |
| **Warning** | `#FFFBF0` | `#FDE68A` | `#92400E` | Deadline approaching, attendance low |
| **Danger** | `#FBE8E8` | `#F4B3B3` | `#7E0B0B` | Errors, critical alerts |
| **Info** | `#F4F4F4` | `#E0E0E0` | `#444444` | Neutral system messages |

### 2.5 Color Usage Rules

- **Never** use pure `#000000` as a text color — use `--gray-900` (`#0A0A0A`) instead
- **Page backgrounds** always use `--cream` (`#F5F2EE`) — not pure white — to reduce eye strain
- **Red is an accent, not a primary** — black carries the dominant visual weight; red punctuates it
- **AI features** use a dark background (`--gray-900`) with red at reduced opacity (`rgba(196,31,31,0.2)`) for a distinctive, intelligent appearance
- All text on colored backgrounds must meet **4.5:1 contrast ratio** minimum

---

## 3. Typography

### 3.1 Font Stack

| Role | Family | Weights | CDN |
|------|---------|---------|-----|
| **Display & Headings** | DM Serif Display | 400 (Regular), 400 Italic | Google Fonts |
| **Body & UI** | DM Sans | 300 (Light), 400, 500 (Medium), 600 | Google Fonts |
| **Code & Data** | JetBrains Mono | 400, 500 | Google Fonts |

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
```

### 3.2 Type Scale

| Token | Font | Size | Weight | Line Height | Usage |
|-------|------|------|--------|-------------|-------|
| `--text-display` | DM Serif Display | 48px | 400 | 1.05 | Hero sections, landing pages |
| `--text-h1` | DM Serif Display | 36px | 400 | 1.1 | Page titles |
| `--text-h2` | DM Serif Display | 28px | 400 | 1.15 | Section headings |
| `--text-h3` | DM Serif Display | 22px | 400 | 1.2 | Card headings, module titles |
| `--text-h4` | DM Sans | 18px | 500 | 1.3 | Sub-section titles |
| `--text-body-lg` | DM Sans | 16px | 300 | 1.75 | Long-form reading content |
| `--text-body` | DM Sans | 14px | 300 | 1.7 | General body text |
| `--text-body-sm` | DM Sans | 13px | 400 | 1.6 | UI labels, descriptions |
| `--text-caption` | DM Sans | 12px | 400 | 1.5 | Metadata, timestamps |
| `--text-label` | DM Sans | 11px | 600 | 1.4 | Uppercase section labels |
| `--text-mono` | JetBrains Mono | 12px | 400 | 1.6 | Code, IDs, data values |

### 3.3 Typography Rules

- **Headings** use DM Serif Display — italic variant is used for emphasis and brand moments (e.g. "Bio*Edu*")
- **Body text** uses DM Sans Light (300) for a calm, easy-reading feel
- **UI labels** use DM Sans Medium (500–600) for clarity at small sizes
- **Letter spacing** on uppercase labels: `0.08em` to `0.12em`
- **Never** use font weight above 600 in the UI — keeps the interface feeling refined, not heavy

---

## 4. Spacing System

All spacing is based on a **4px base unit**. Prefer multiples of 4 throughout the UI.

| Token | Value | Common Usage |
|-------|-------|-------------|
| `--space-1` | `4px` | Icon padding, tight inline gaps |
| `--space-2` | `8px` | Inline element gaps, badge padding |
| `--space-3` | `12px` | Form element internal padding |
| `--space-4` | `16px` | Card internal padding (compact), list item gaps |
| `--space-5` | `20px` | Card internal padding (standard) |
| `--space-6` | `24px` | Section internal spacing |
| `--space-8` | `32px` | Between major UI blocks |
| `--space-10` | `40px` | Page section gaps |
| `--space-12` | `48px` | Hero internal padding |
| `--space-16` | `64px` | Between page-level sections |

### 4.1 Layout Gutters

| Breakpoint | Page Gutter | Content Max-Width |
|-----------|-------------|-------------------|
| Mobile (`< 640px`) | `16px` | `100%` |
| Tablet (`640–1024px`) | `24px` | `100%` |
| Desktop (`> 1024px`) | `40px` | `1200px` |

---

## 5. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | `4px` | Badges, small tags, code blocks |
| `--radius-md` | `8px` | Buttons, inputs, small cards |
| `--radius-lg` | `12px` | Standard cards, dropdowns, modals |
| `--radius-xl` | `16px` | Hero cards, feature panels |
| `--radius-2xl` | `24px` | Large sections, hero containers |
| `--radius-pill` | `9999px` | Pills, toggle switches, rounded badges |
| `--radius-circle` | `50%` | Avatars, icon buttons |

---

## 6. Elevation & Shadows

Shadows are used sparingly — only to communicate interactive state or floating layers.

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-none` | `none` | Default flat surfaces |
| `--shadow-sm` | `0 1px 4px rgba(0,0,0,0.06)` | Subtle card lift on hover |
| `--shadow-md` | `0 4px 16px rgba(0,0,0,0.08)` | Standard card elevation |
| `--shadow-lg` | `0 8px 32px rgba(0,0,0,0.10)` | Dropdowns, popovers |
| `--shadow-xl` | `0 16px 48px rgba(0,0,0,0.12)` | Modals, dialogs |
| `--shadow-focus` | `0 0 0 3px rgba(196,31,31,0.2)` | Red focus ring for accessibility |

**Rule:** Cards should default to `border: 1px solid --gray-100` with no shadow. Shadow is added **only on hover** (`--shadow-md`) to communicate interactivity.

---

## 7. Iconography

**Icon Library:** [Tabler Icons](https://tabler.io/icons) — Outline style only

```html
<!-- Include via CDN -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css">

<!-- Usage -->
<i class="ti ti-sparkles" aria-hidden="true"></i>
```

### 7.1 Icon Size Scale

| Context | Size |
|---------|------|
| Inline with body text | `14px` |
| Button icon | `16px` |
| Card icon | `18–20px` |
| Feature/section icon | `24px` |
| Empty state illustration | `48px` |

### 7.2 Core Icon Set

| Icon | Tabler Class | Usage |
|------|-------------|-------|
| AI / Sparkles | `ti-sparkles` | All AI features |
| Upload | `ti-upload` | Resource upload (teacher) |
| Books | `ti-books` | Resources section |
| Users | `ti-users` | Student management |
| Calendar | `ti-calendar` | Class scheduling |
| Chart Bar | `ti-chart-bar` | Analytics, progress |
| Video | `ti-video` | Live classes |
| File Text | `ti-file-text` | Notes, PDFs |
| Bell | `ti-bell` | Notifications |
| Lock | `ti-lock` | Access control |
| Dashboard | `ti-layout-dashboard` | Admin dashboard |
| Search | `ti-search` | Search functionality |
| Settings | `ti-settings` | Settings pages |
| Download | `ti-download` | Download resource |

### 7.3 Icon Rules

- Always add `aria-hidden="true"` to decorative icons
- Icon-only buttons must have an `aria-label` attribute
- Never use filled variants (e.g. `ti-heart-filled`) — outline only
- Icons inherit color from their parent element

---

## 8. Motion & Animation

Motion should feel **calm and purposeful** — never playful or distracting. This is an educational tool where focus is paramount.

### 8.1 Duration Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-instant` | `50ms` | Checkbox toggles, immediate feedback |
| `--duration-fast` | `100ms` | Button press, ripple effects |
| `--duration-base` | `180ms` | Hover states, color transitions |
| `--duration-slow` | `300ms` | Modal open, drawer slide, accordion |
| `--duration-page` | `450ms` | Page transitions, section reveals |

### 8.2 Easing Functions

| Token | Value | Usage |
|-------|-------|-------|
| `--ease-linear` | `linear` | Loading bars, progress |
| `--ease-out` | `cubic-bezier(0.0, 0, 0.2, 1)` | Elements appearing (modals, toasts) |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Elements disappearing |
| `--ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Accordion, tab transitions |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Micro-interactions, button press |

### 8.3 Animation Rules

- **Hover transitions** default to `180ms ease-out`
- **Page-level animations** use `450ms ease-out` with staggered children (`50ms` delay increments)
- **Never animate layout properties** (`width`, `height`, `padding`) — use `transform` and `opacity` only
- Always include `@media (prefers-reduced-motion: reduce)` to disable animations for users with motion sensitivity

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 9. Components

### 9.1 Navigation

The primary navigation is a full-width dark bar (`--gray-900`) that establishes platform identity immediately.

**Anatomy:**
- **Left:** Brand logotype — `Bio` in white DM Serif Display + `Edu` in `--red-300` italic
- **Center:** Navigation links with active state (white text + subtle white-tinted background)
- **Right:** User role indicator + avatar circle

**States:**
- Default link: `color: rgba(255,255,255,0.5)`
- Hover link: `color: rgba(255,255,255,0.85)` + `background: rgba(255,255,255,0.06)`
- Active link: `color: white` + `background: rgba(255,255,255,0.10)`

**Navigation Items (Teacher):** Dashboard · Resources · Students · Classes · AI Tutor  
**Navigation Items (Student):** Home · My Resources · My Classes · AI Tutor

---

### 9.2 Buttons

Buttons use DM Sans Medium (500), `font-size: 13px`, with `8px` border radius.

#### Primary Button
```css
background: #0A0A0A;
color: white;
padding: 10px 20px;
border-radius: 8px;
/* Hover: background transitions to --red-500 */
```

#### Secondary Button (Outlined)
```css
background: transparent;
color: #0A0A0A;
border: 1.5px solid #0A0A0A;
padding: 9px 18px;
border-radius: 8px;
/* Hover: background #0A0A0A, color white */
```

#### Danger Button
```css
background: #A51212;
color: white;
padding: 10px 20px;
border-radius: 8px;
```

#### Ghost / AI Button
```css
background: transparent;
color: #A51212;
border: 1.5px solid #F4B3B3;
padding: 9px 18px;
border-radius: 8px;
/* Hover: background --red-50 */
```

#### Button Sizes

| Size | Padding | Font Size | Radius |
|------|---------|-----------|--------|
| Large | `12px 24px` | `14px` | `10px` |
| Default | `10px 20px` | `13px` | `8px` |
| Small | `7px 14px` | `12px` | `6px` |
| Icon | `9px` | — | `8px` |

---

### 9.3 Badges & Tags

```css
/* Base badge */
padding: 3px 10px;
border-radius: 20px;  /* pill */
font-size: 11px;
font-weight: 600;
letter-spacing: 0.04em;
```

| Variant | Background | Text | Border | Usage |
|---------|-----------|------|--------|-------|
| Default | `#F4F4F4` | `#5C5C5C` | none | File type, grade level |
| Black | `#0A0A0A` | `white` | none | Admin role, featured |
| Red | `#FBE8E8` | `#5C0808` | `#F4B3B3` | Live class, active alerts |
| Teacher | `#3B0505` | `white` | none | Teacher role identifier |
| AI | `linear-gradient(135°, #3B0505, #0A0A0A)` | `white` | none | AI-generated content |
| Success | `#E8F5E9` | `#1B5E20` | `#C8E6C9` | Submitted, completed |
| Warning | `#FFFBF0` | `#92400E` | `#FDE68A` | Due soon, at risk |

---

### 9.4 Form Elements

All form elements share a common base style:

```css
font-family: 'DM Sans', sans-serif;
font-size: 13px;
padding: 9px 12px;
border: 1.5px solid #E0E0E0;
border-radius: 8px;
background: white;
color: #0A0A0A;
transition: border-color 180ms ease;

/* Focus */
border-color: #0A0A0A;
outline: none;
```

**Input types:** text, email, password, select, textarea, file upload  
**States:** default · hover (`border: --gray-300`) · focus (`border: --gray-900`) · error (`border: --red-400`) · disabled (`opacity: 0.5, cursor: not-allowed`)

**Form layout rule:** Labels are always placed **above** the field, never inside (placeholder text is supplementary only). Labels use `11px`, `font-weight: 600`, uppercase, `--gray-600`.

---

### 9.5 Cards

Three distinct card types for different content contexts:

#### Resource Card (Light)
Standard card for PDF notes, videos, quiz links.
```
background: white
border: 1px solid #E0E0E0
border-radius: 14px
padding: 18px
transition: box-shadow 200ms
hover: box-shadow --shadow-md
```
Contains: Icon chip · File type badge · Title · Metadata row · Action buttons

#### Class Card (Dark)
Used for live or scheduled classes — dark treatment signals urgency/importance.
```
background: #0A0A0A
border: 1px solid rgba(255,255,255,0.08)
border-radius: 14px
padding: 18px
```
Contains: Icon (red-tinted) · Live badge · Class name · Time/date · Join button

#### AI Feature Card
Used for AI tutor prompts, summaries, and suggestions.
```
background: #0A0A0A
border: 1px solid rgba(196,31,31,0.25)
border-radius: 14px
padding: 20px
```
Contains: AI badge (with sparkles icon) · Serif heading · Subdued description · Mono-style prompt example

---

### 9.6 Data Tables

Used in the teacher admin for student rosters, resource lists, and attendance records.

```css
/* Table header */
font-size: 10px;
font-weight: 600;
letter-spacing: 0.10em;
text-transform: uppercase;
color: #767676;
border-bottom: 1.5px solid #E0E0E0;
padding: 9px 12px;

/* Table row */
border-bottom: 1px solid #F4F4F4;
font-size: 12px;
color: #444444;
padding: 10px 12px;

/* Row hover */
background: #F4F4F4;
```

Table headers always include a contextual action area (search + add button). Student name cells include an avatar circle with initials. Progress values use an inline bar rather than a percentage alone.

---

### 9.7 Alerts & Notifications

Four semantic variants, all sharing a base structure:

```
display: flex
align-items: flex-start
gap: 10px
padding: 12px 14px
border-radius: 10px
font-size: 12px
```

| Variant | Background | Border | Icon Color | Title Color |
|---------|-----------|--------|-----------|-------------|
| Info | `#F4F4F4` | `#E0E0E0` | `#444444` | `#2D2D2D` |
| Success | `#E8F5E9` | `#C8E6C9` | `#2E7D32` | `#1B5E20` |
| Warning | `#FFFBF0` | `#FDE68A` | `#92400E` | `#92400E` |
| Danger | `#FBE8E8` | `#F4B3B3` | `#7E0B0B` | `#5C0808` |

Alert icons use Tabler outline icons at `15px`. Alert body text is `11px` in the gray-500 range.

---

## 10. Page Layout Patterns

### 10.1 Admin Dashboard (Teacher)

```
┌─────────────────────────────────────────────────┐
│  Navigation Bar (full-width, gray-900)          │
├──────────┬──────────────────────────────────────┤
│          │  Stat Cards Row (3–4 columns)         │
│ Sidebar  ├──────────────────────────────────────┤
│ (220px)  │  Main Content Area                    │
│          │  (Resource grid / Student table)      │
│          │                                       │
└──────────┴──────────────────────────────────────┘
```

- Sidebar: `background: white`, `border-right: 1px solid --gray-100`
- Content area: `background: --cream`
- Sidebar collapses to icon-only at `< 1024px`

### 10.2 Student Resource View

```
┌──────────────────────────────────────────────────┐
│  Navigation Bar                                  │
├──────────────────────────────────────────────────┤
│  Page Header (title + filter bar)                │
├──────────────────────────────────────────────────┤
│  Resource Grid (auto-fill, min 280px per card)   │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐        │
│  │ Card │  │ Card │  │ Card │  │ Card │        │
│  └──────┘  └──────┘  └──────┘  └──────┘        │
└──────────────────────────────────────────────────┘
```

### 10.3 Mobile Layout

- Single column, full-width cards
- Nav collapses to hamburger menu with bottom sheet drawer
- AI tutor accessible via floating action button (bottom-right)
- Touch targets minimum `44×44px`

---

## 11. Role-Based Design

### Teacher / Admin
- Access to upload forms, student management tables, class creation
- Sees "Admin" badge (`--gray-900` bg) in navigation
- Primary CTA color: `--gray-900` (black) for upload/add actions
- Red accent used for destructive actions (delete, archive)

### Student
- Read-only resource browsing, class joining, AI tutor access
- Sees "Student" badge (`--gray-50` bg, `--gray-500` text)
- Primary CTA color: `--red-400` (red) for joining classes and submitting work
- No access to admin routes; redirect to 404 or login if accessed

---

## 12. AI Feature Language

AI features are visually distinct from standard UI through a consistent dark + red system:

### Visual Rules
- **Background:** Always `--gray-900` (never white or cream)
- **Border:** `1px solid rgba(196, 31, 31, 0.25)` — a subtle red glow
- **AI Badge:** Dark red background (`rgba(196,31,31,0.2)`), red-200 text, sparkles icon prefix
- **Prompt display:** JetBrains Mono, slightly dimmed white (`rgba(255,255,255,0.6)`)
- **Heading:** DM Serif Display, white, italic emphasis

### AI Feature Types

| Feature | Location | Description |
|---------|---------|-------------|
| AI Tutor | Student sidebar + dedicated page | Q&A on biology topics |
| Lecture Summarizer | Teacher post-class | Auto-summarizes uploaded notes |
| Quiz Generator | Teacher resources panel | Generates quizzes from PDF content |
| Student Insight | Teacher dashboard | Flags at-risk students based on engagement |
| Smart Search | Global search bar | Semantic search across all resources |

---

## 13. Responsive Design

### Breakpoints

| Token | Value | Target |
|-------|-------|--------|
| `--bp-xs` | `360px` | Smallest phones |
| `--bp-sm` | `640px` | Mobile landscape / large phones |
| `--bp-md` | `768px` | Tablets (portrait) |
| `--bp-lg` | `1024px` | Tablets (landscape) / small laptops |
| `--bp-xl` | `1280px` | Desktop |
| `--bp-2xl` | `1536px` | Large desktop |

### Grid System

- Base: 4-column grid (mobile)
- Tablet: 8-column grid
- Desktop: 12-column grid
- Column gap: `16px` (mobile) / `24px` (desktop)
- All layout grids use `CSS Grid` with `auto-fit` and `minmax()` for fluid responsiveness

### Component Responsiveness Rules

| Component | Mobile | Tablet | Desktop |
|-----------|--------|--------|---------|
| Navigation | Hamburger + drawer | Hamburger + drawer | Full horizontal bar |
| Resource cards | 1 column | 2 columns | 3–4 columns |
| Student table | Card list view | Simplified table | Full table with all columns |
| Stat cards | 2 columns | 2–3 columns | 4 columns |
| Sidebar | Hidden (drawer) | Icon-only | Full width (220px) |

---

## 14. Accessibility

### Color Contrast

All text/background combinations must meet **WCAG 2.1 AA** minimum (4.5:1 for body text, 3:1 for large text):

| Text | Background | Ratio | Status |
|------|-----------|-------|--------|
| `--gray-900` on `--cream` | `#0A0A0A` on `#F5F2EE` | 18.4:1 | ✅ AAA |
| `--gray-600` on `white` | `#444444` on `#FFFFFF` | 9.7:1 | ✅ AAA |
| `white` on `--gray-900` | `#FFFFFF` on `#0A0A0A` | 19.6:1 | ✅ AAA |
| `--red-700` on `--red-50` | `#5C0808` on `#FBE8E8` | 7.2:1 | ✅ AAA |
| `white` on `--red-500` | `#FFFFFF` on `#A51212` | 5.1:1 | ✅ AA |

### Focus Management

- All interactive elements have a visible focus ring: `box-shadow: 0 0 0 3px rgba(196,31,31,0.25)`
- Focus order follows logical reading order (left-to-right, top-to-bottom)
- Modal dialogs trap focus until dismissed
- Skip-to-content link available at top of every page

### Semantic HTML

- Navigation uses `<nav>` with `aria-label`
- Main content wrapped in `<main>`
- Headings follow proper hierarchy (h1 → h2 → h3)
- Icons use `aria-hidden="true"` or `aria-label` where functional
- Status badges use `role="status"` where appropriate
- Form inputs always paired with `<label>` elements

---

## 15. CSS Custom Properties Reference

```css
:root {
  /* === COLORS: GRAY SCALE === */
  --gray-900: #0A0A0A;
  --gray-800: #1A1A1A;
  --gray-700: #2D2D2D;
  --gray-600: #444444;
  --gray-500: #5C5C5C;
  --gray-400: #767676;
  --gray-300: #999999;
  --gray-200: #C4C4C4;
  --gray-100: #E0E0E0;
  --gray-50:  #F4F4F4;
  --white:     #FFFFFF;
  --off-white: #FAF9F7;
  --cream:     #F5F2EE;

  /* === COLORS: RED SCALE === */
  --red-900: #1A0202;
  --red-800: #3B0505;
  --red-700: #5C0808;
  --red-600: #7E0B0B;
  --red-500: #A51212;
  --red-400: #C41F1F;
  --red-300: #D94040;
  --red-200: #E87272;
  --red-100: #F4B3B3;
  --red-50:  #FBE8E8;

  /* === COLORS: SEMANTIC === */
  --color-success-bg:   #E8F5E9;
  --color-success-border: #C8E6C9;
  --color-success-text: #2E7D32;
  --color-warning-bg:   #FFFBF0;
  --color-warning-border: #FDE68A;
  --color-warning-text: #92400E;
  --color-danger-bg:    #FBE8E8;
  --color-danger-border: #F4B3B3;
  --color-danger-text:  #7E0B0B;

  /* === TYPOGRAPHY === */
  --font-serif: 'DM Serif Display', Georgia, serif;
  --font-sans:  'DM Sans', system-ui, sans-serif;
  --font-mono:  'JetBrains Mono', 'Courier New', monospace;

  /* === SPACING === */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* === BORDER RADIUS === */
  --radius-sm:     4px;
  --radius-md:     8px;
  --radius-lg:     12px;
  --radius-xl:     16px;
  --radius-2xl:    24px;
  --radius-pill:   9999px;
  --radius-circle: 50%;

  /* === SHADOWS === */
  --shadow-none: none;
  --shadow-sm:   0 1px 4px rgba(0, 0, 0, 0.06);
  --shadow-md:   0 4px 16px rgba(0, 0, 0, 0.08);
  --shadow-lg:   0 8px 32px rgba(0, 0, 0, 0.10);
  --shadow-xl:   0 16px 48px rgba(0, 0, 0, 0.12);
  --shadow-focus: 0 0 0 3px rgba(196, 31, 31, 0.20);

  /* === MOTION === */
  --duration-instant: 50ms;
  --duration-fast:    100ms;
  --duration-base:    180ms;
  --duration-slow:    300ms;
  --duration-page:    450ms;

  --ease-linear:   linear;
  --ease-out:      cubic-bezier(0.0, 0, 0.2, 1);
  --ease-in:       cubic-bezier(0.4, 0, 1, 1);
  --ease-in-out:   cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1);

  /* === LAYOUT === */
  --content-max-width: 1200px;
  --sidebar-width:     220px;
  --nav-height:        56px;
  --bp-sm:  640px;
  --bp-md:  768px;
  --bp-lg:  1024px;
  --bp-xl:  1280px;
  --bp-2xl: 1536px;
}
```

---

*BioEdu Design System — maintained by the platform team. All components and tokens should be implemented using these values as the single source of truth.*
