// ─── Basedrop design tokens ───
// Every value is a CSS variable defined in app/globals.css, so the whole UI
// follows the system light/dark theme without any per-component logic.
//   accent (Base Blue) → actions only: buttons, links, nav, progress
//   money              → plain ink, heavy weight (no special money colour)
//   live / danger      → semantic state only

export const C = {
  bg: "var(--bd-bg)",
  surface: "var(--bd-card)",        // cards, inputs
  surfaceHi: "var(--bd-card-hi)",   // hover / selected / insets
  sunken: "var(--bd-sunken)",       // tracks, skeleton base

  accent: "var(--bd-blue)",
  accentInk: "#FFFFFF",
  accentDim: "var(--bd-blue-soft)",

  text: "var(--bd-ink)",
  textDim: "var(--bd-ink2)",
  textFaint: "var(--bd-ink3)",

  live: "var(--bd-live)",
  liveDim: "var(--bd-live-soft)",
  danger: "var(--bd-danger)",
  dangerDim: "var(--bd-danger-soft)",

  solid: "var(--bd-solid)",         // high-contrast chip / FAB
  solidInk: "var(--bd-solid-ink)",

  hairline: "var(--bd-line)",
  hairlineStrong: "var(--bd-line2)",
  shadowCard: "var(--bd-shadow)",
} as const;

export const FONT_BODY = "var(--font-geist), ui-sans-serif, system-ui, sans-serif";
export const FONT_DISPLAY = FONT_BODY;
export const FONT_MONO = "var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace";
export const FONT_SERIF = "var(--font-instrument-serif), Georgia, serif";

export const TNUM: React.CSSProperties = { fontVariantNumeric: "tabular-nums" };

// Exactly three radii: cards, controls, pills.
export const RADIUS = { card: 20, ctl: 14, pill: 999 } as const;
