import type { ReactNode } from "react";

// Ícones de traço fino (1,75 px) com pontas redondas, como nos mockups da direção Cahier.
const PATHS = {
  repeat: <path d="M20 11a8 8 0 0 0-14.5-4M4 4v3.5h3.5M4 13a8 8 0 0 0 14.5 4M20 20v-3.5h-3.5" />,
  book: (
    <>
      <path d="M12 6.8C10 5.2 7 4.6 3.8 5.2v12.6c3.2-.6 6.2 0 8.2 1.6 2-1.6 5-2.2 8.2-1.6V5.2C17 4.6 14 5.2 12 6.8z" />
      <path d="M12 6.8v12.6" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M9 21h6" />
    </>
  ),
  pencil: (
    <>
      <path d="M4 20l1-4.5L16.5 4a2 2 0 0 1 3 3L8 18.5 4 20z" />
      <path d="M14.5 6l3.5 3.5" />
    </>
  ),
  sparkle: (
    <>
      <path d="M11 4l1.8 5.2L18 11l-5.2 1.8L11 18l-1.8-5.2L4 11l5.2-1.8z" />
      <path d="M19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" />
    </>
  ),
  home: <path d="M4 11l8-7 8 7v8.5a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1V11z" />,
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  cards: (
    <>
      <rect x="3.5" y="8" width="13" height="12" rx="2" />
      <path d="M7.5 4.5h11a2 2 0 0 1 2 2V15" />
    </>
  ),
  chat: (
    <path d="M4 5.5h16a1 1 0 0 1 1 1V16a1 1 0 0 1-1 1h-8l-4.5 3.5V17H4a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1z" />
  ),
  check: <path d="M4.5 12.5l5 5 10-11" />,
  arrow: <path d="M4.5 12h15M13 5.5l6.5 6.5-6.5 6.5" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  flip: <path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18.5 3v4h-4M5.5 21v-4h4" />,
  volume: (
    <>
      <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z" />
      <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11" />
    </>
  ),
  play: (
    <path
      d="M8 5.5v13a.8.8 0 0 0 1.2.7l10.4-6.5a.8.8 0 0 0 0-1.4L9.2 4.8A.8.8 0 0 0 8 5.5z"
      fill="currentColor"
      stroke="none"
    />
  ),
  alert: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5.5M12 16.2v.3" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof PATHS;

type IconProps = { name: IconName; size?: number };

export function Icon({ name, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{ flex: "none" }}
    >
      {PATHS[name]}
    </svg>
  );
}
