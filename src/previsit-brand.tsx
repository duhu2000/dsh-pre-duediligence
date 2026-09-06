import type { CSSProperties } from "react"

/** 与企查查蓝 Mockup v1.1.0 共用的访前尽调线性建筑图标。 */
export const PREVISIT_LOGO_PATH = "M4 21h16M6 21V6l6-3 6 3v15M9 8h1m4 0h1M9 12h1m4 0h1M10 21v-5h4v5"

export function PrevisitLogo(props: { className?: string; size?: number; style?: CSSProperties }): JSX.Element {
  const size = props.size ?? 20
  return (
    <svg
      className={props.className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      aria-hidden="true"
      style={props.style}
    >
      <path d={PREVISIT_LOGO_PATH} />
    </svg>
  )
}
