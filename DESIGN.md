---
name: FleetTracker PRO
description: Real-time control center dashboard design system
colors:
  primary: "#6366f1"
  neutral-bg: "#020617"
  neutral-surface: "#0f172a"
  border: "#1e293b"
  accent-warning: "#f59e0b"
  accent-danger: "#ef4444"
  accent-success: "#10b981"
typography:
  display:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  button-primary-hover:
    backgroundColor: "#4f46e5"
---

# Design System: FleetTracker PRO

## 1. Overview

**Creative North Star: "The Midnight Radar"**

FleetTracker PRO is designed as a high-density, real-time command console for dark control room environments. It mimics the visual language of navigation radars and flight control panels, focusing on extreme legibility under dim ambient lighting.

The interface values utility and precision over decoration. It rejects unnecessary drop shadows, soft gradients, and glassmorphism in favor of a strict flat-border layout. Information is layered using solid neutral surfaces, stark border separations, and glowing neon accents that draw immediate focus to active telemetry and alert states.

**Key Characteristics:**
- High contrast, dark-drenched background theme (Slate-950).
- Grid structure separated by crisp, solid 1px borders (Slate-800).
- Pure-color status indicators (Green for active, Amber for warnings, Red for critical).
- Zero drop shadows or glowing card elevations; depth is communicated solely via flat-border nesting.

## 2. Colors

The color palette is built for extreme contrast in low-light environments, mapping specific hues to semantic operational states.

### Primary
- **Radar Indigo** (#6366f1): The primary accent color, used for active selections, map routes, and brand elements.

### Neutral
- **Midnight Void Background** (#020617): The deepest base background color.
- **Control Panel Surface** (#0f172a): Used for sidebars, map control cards, and panel containers.
- **Grid Divider** (#1e293b): Crisp 1px border lines defining structural divisions.
- **Signal White Ink** (#f8fafc): High contrast body text.
- **Subdued Slate Ink** (#94a3b8): Secondary muted label text.

### Accent
- **Telemetry Success Green** (#10b981): Used for active online statuses and geofence entry events.
- **Cautionary Alert Amber** (#f59e0b): Used for warning states and geofence exits.
- **Breach Alert Red** (#ef4444): Used for overspeeding violations and high-severity alarms.

**The Border Partition Rule.**
Depth is communicated through flat container nesting. Drop shadows are strictly prohibited. Borders must be solid 1px using the Grid Divider (#1e293b) to separate panels.

**The Accent Sparing Rule.**
Bright colors (Green, Amber, Red) must only be used for active markers or warnings. Background panels must remain dark and neutral to ensure alerts stand out instantly.

## 3. Typography

**Display Font:** Inter (with system-ui, sans-serif fallback)
**Body Font:** Inter (with system-ui, sans-serif fallback)
**Label/Mono Font:** ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace

**Character:** Highly readable geometric sans-serif optimized for display screens. Monospace styling is used for numerical readings, speeds, and coordinates to prevent text shifting during updates.

### Hierarchy
- **Display** (Bold, 1.25rem (20px), 1.2): Main header panel titles.
- **Headline** (SemiBold, 1rem (16px), 1.25): Container section headers.
- **Title** (Medium, 0.875rem (14px), 1.25): Vehicle titles and card headers.
- **Body** (Regular, 0.875rem (14px), 1.5): Standard copy.
- **Label** (Medium/Bold, 0.75rem (12px), 1.0): Secondary metadata, timestamps, and active status tags.
- **Telemetry Code** (Regular, 0.75rem (12px), 1.0): Telemetry logs, speeds, and geographic coordinates.

## 4. Elevation

The design system explicitly rejects shadows and ambient depths. The screen is a flat, clean workspace.

**The Flat Surface Rule.**
Surfaces are flat at rest. Depth is established purely through background color differences (e.g., Midnight Void #020617 against Control Panel Surface #0f172a) and solid 1px Grid Dividers.

## 5. Components

### Buttons
- **Shape:** Gently curved edges (8px radius).
- **Primary:** Radar Indigo (#6366f1) background with white text. Padding is exactly 6px vertical and 12px horizontal (6px 12px).
- **Hover / Focus:** Instant transition to dark indigo (#4f46e5). No easing animations.
- **Secondary / Ghost:** Dark background (#0f172a) with Slate-800 border and light text.

### Chips
- **Style:** Flat 1px border matching the text color with a 10% opacity background.
- **State:** Active statuses are Green (#10b981), Warning statuses are Amber (#f59e0b), and Alarm statuses are Red (#ef4444).

### Cards / Containers
- **Corner Style:** Gently curved edges (12px radius).
- **Background:** Solid Control Panel Surface (#0f172a).
- **Shadow Strategy:** Zero shadows allowed.
- **Border:** Solid 1px Grid Divider (#1e293b).
- **Internal Padding:** Large grid margins (16px) or compact metadata layouts (12px).

### Inputs / Fields
- **Style:** Dark base (#020617), solid 1px border (#1e293b), 8px corner radius.
- **Focus:** Border shifts to Radar Indigo (#6366f1) instantly. No outer glow.

### Navigation
- **Style:** Compact sidebar layout. Hover states instantly shift panel background from transparent to Slate-950/50.

## 6. Do's and Don'ts

### Do:
- **Do** use monospace fonts for telemetry readings, coordinates, and timestamps.
- **Do** separate panels with solid 1px borders of value `#1e293b`.
- **Do** pair colors with distinct icons (such as warning triangles or checkmarks) for alerts to maintain color-blind accessibility.

### Don't:
- **Don't** use drop shadows (`box-shadow`) on cards or buttons.
- **Don't** use gradients or glassmorphism on background elements.
- **Don't** use soft, low-contrast pastel colors for active statuses or alarms.
- **Don't** use large card border-radii exceeding 16px.
