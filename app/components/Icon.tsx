"use client";
// Minimal 1.75px-stroke icon set — replaces emoji throughout the UI.
// Single source of truth for all iconography so the app reads as one system.

type IconProps = { size?: number; color?: string; strokeWidth?: number };

const base = (size = 18, strokeWidth = 1.75) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  strokeWidth,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export function IconHome({ size, color = "currentColor", strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} stroke={color}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H10v-6h4v6h3.5a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

export function IconSearch({ size, color = "currentColor", strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} stroke={color}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M20 20 15.2 15.2" />
    </svg>
  );
}

export function IconDroplet({ size, color = "currentColor", strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} stroke={color}>
      <path d="M12 3.5c3.2 4 6.5 7.6 6.5 11.2A6.5 6.5 0 0 1 5.5 14.7C5.5 11.1 8.8 7.5 12 3.5Z" />
    </svg>
  );
}

export function IconSend({ size, color = "currentColor", strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} stroke={color}>
      <path d="M4 12 20 4l-4.5 16-4.2-6.3L4 12Z" />
      <path d="M11.3 13.7 15.5 20" />
    </svg>
  );
}

export function IconUser({ size, color = "currentColor", strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} stroke={color}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5 20c0-3.6 3.1-6.4 7-6.4s7 2.8 7 6.4" />
    </svg>
  );
}

export function IconBot({ size, color = "currentColor", strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} stroke={color}>
      <rect x="4.5" y="8.5" width="15" height="10.5" rx="3" />
      <path d="M12 8.5V5" />
      <circle cx="12" cy="3.6" r="1.1" fill={color} stroke="none" />
      <path d="M8.5 13.5v1.4M15.5 13.5v1.4" />
      <path d="M2.5 12.5v3M21.5 12.5v3" />
    </svg>
  );
}

export function IconTrophy({ size, color = "currentColor", strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} stroke={color}>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5H4.5A2.5 2.5 0 0 0 5.8 9.6L7 10" />
      <path d="M17 5h2.5a2.5 2.5 0 0 1-1.3 4.6L17 10" />
      <path d="M12 14v3M9 20.5h6M9.5 20.5c0-2 .8-3 2.5-3.5 1.7.5 2.5 1.5 2.5 3.5" />
    </svg>
  );
}

export function IconGem({ size, color = "currentColor", strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} stroke={color}>
      <path d="M6 3h12l3 5-9 13L3 8l3-5Z" />
      <path d="M3 8h18M9 3l-2 5 5 13 5-13-2-5" />
    </svg>
  );
}

export function IconClock({ size, color = "currentColor", strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} stroke={color}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3.2 2" />
    </svg>
  );
}

export function IconRefresh({ size, color = "currentColor", strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} stroke={color}>
      <path d="M4 12a8 8 0 0 1 13.7-5.7L20 8.5" />
      <path d="M20 4v4.5h-4.5" />
      <path d="M20 12a8 8 0 0 1-13.7 5.7L4 15.5" />
      <path d="M4 20v-4.5h4.5" />
    </svg>
  );
}

export function IconCopy({ size, color = "currentColor", strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} stroke={color}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M6.5 15H5.5a2 2 0 0 1-2-2V5.5a2 2 0 0 1 2-2H15a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export function IconCheck({ size, color = "currentColor", strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} stroke={color}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.2 12.3l2.6 2.6 5-5.4" />
    </svg>
  );
}

export function IconLink({ size, color = "currentColor", strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} stroke={color}>
      <path d="M9.5 14.5 14.5 9.5" />
      <path d="M11 6.5 12.6 4.9a3.6 3.6 0 0 1 5.1 5.1L16 11.6" />
      <path d="M13 17.5 11.4 19.1a3.6 3.6 0 0 1-5.1-5.1L8 12.4" />
    </svg>
  );
}

export function IconArrowUpRight({ size, color = "currentColor", strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} stroke={color}>
      <path d="M7 17 17 7" />
      <path d="M9 7h8v8" />
    </svg>
  );
}

export function IconRocket({ size, color = "currentColor", strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} stroke={color}>
      <path d="M12 3c2.8 1.2 4.6 4.1 4.6 8.2 0 2-.5 3.8-1.3 5.2l-3.3 2.6-3.3-2.6c-.8-1.4-1.3-3.2-1.3-5.2C7.4 7.1 9.2 4.2 12 3Z" />
      <circle cx="12" cy="10.5" r="1.8" />
      <path d="M8.2 15.8 5.5 18.5M15.8 15.8l2.7 2.7M9.8 19l.7 2M13.5 19l-.7 2" />
    </svg>
  );
}

export function IconSparkle({ size, color = "currentColor", strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} stroke={color}>
      <path d="M12 3.5 13.4 9.1 19 10.5 13.4 11.9 12 17.5 10.6 11.9 5 10.5 10.6 9.1 12 3.5Z" />
      <path d="M19 15.5 19.6 17.9 22 18.5 19.6 19.1 19 21.5 18.4 19.1 16 18.5 18.4 17.9 19 15.5Z" />
    </svg>
  );
}
