// ─── Basedrop design tokens ───
// Single source of truth for the dark "onchain reward layer" theme.
// Components import C / fonts instead of hardcoding hex values.

export const C = {
  bg: "#0A0A0F",          // app background (deep navy-black)
  surface: "#1A1A24",     // raised surface (cards, nav, inputs)
  surfaceHi: "#22222E",   // slightly lighter surface (hover, selected)
  accent: "#00E5A0",      // electric green — CTAs, active, success
  accentInk: "#05130D",   // dark text placed on top of accent
  accentDim: "rgba(0,229,160,0.12)", // accent tint fill
  text: "#F5F5F7",        // primary text
  textDim: "#8A8A9A",     // secondary text
  textFaint: "#5A5A6A",   // tertiary / hints
  danger: "#FF5470",      // errors, warnings, destructive
  dangerDim: "rgba(255,84,112,0.12)",
  hairline: "rgba(255,255,255,0.08)",       // thin dividers / borders
  hairlineStrong: "rgba(255,255,255,0.14)", // emphasized hairline
} as const;

// Font CSS variables (declared in app/layout.tsx via next/font).
export const FONT_DISPLAY = "var(--font-space-grotesk), sans-serif"; // headings + numbers
export const FONT_BODY = "var(--font-inter), sans-serif";            // body copy

// Reusable style fragments.
export const TNUM: React.CSSProperties = { fontVariantNumeric: "tabular-nums" };
