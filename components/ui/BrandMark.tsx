interface BrandMarkProps {
  size?: number
  className?: string
}

/**
 * Dog tag with a simplified QR pattern (icon only — wordmark stays “TAGTALE”).
 */
export default function BrandMark({ size = 44, className = '' }: BrandMarkProps) {
  const sw = Math.max(1.05, size * 0.032)
  const holeR = size * 0.052
  const fs = sw * 0.75
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      aria-label="TagTale mark"
      role="img"
    >
      {/* Dog tag outline + hole */}
      <path
        d="M24 5.5 L11.5 12.5 V38.5 C11.5 40.8 13.4 42.5 15.8 42.5 H32.2 C34.6 42.5 36.5 40.8 36.5 38.5 V12.5 L24 5.5 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth={sw}
        strokeLinejoin="round"
      />
      <circle cx="24" cy="10.5" r={holeR} fill="none" stroke="currentColor" strokeWidth={sw} />
      <circle cx="24" cy="10.5" r={holeR * 0.42} fill="currentColor" />

      {/* Simplified QR modules (read as QR on a tag at small sizes) */}
      <g stroke="currentColor" fill="none" strokeWidth={fs}>
        {/* Corner finders: nested squares + center dot */}
        <rect x="14" y="16" width="7" height="7" />
        <rect x="15.5" y="17.5" width="4" height="4" />
        <rect x="27" y="16" width="7" height="7" />
        <rect x="28.5" y="17.5" width="4" height="4" />
        <rect x="14" y="29" width="7" height="7" />
        <rect x="15.5" y="30.5" width="4" height="4" />
      </g>
      <g fill="currentColor">
        <rect x="17" y="19" width="1.4" height="1.4" />
        <rect x="30" y="19" width="1.4" height="1.4" />
        <rect x="17" y="32" width="1.4" height="1.4" />
        {/* Bottom-right data block */}
        <rect x="25" y="29" width="1.5" height="1.5" />
        <rect x="27.5" y="29" width="1.5" height="1.5" />
        <rect x="30" y="29" width="1.5" height="1.5" />
        <rect x="32.5" y="29" width="1.5" height="1.5" />
        <rect x="25" y="31.5" width="1.5" height="1.5" />
        <rect x="28.5" y="31.5" width="1.5" height="1.5" />
        <rect x="32" y="31.5" width="1.5" height="1.5" />
        <rect x="25" y="34" width="1.5" height="1.5" />
        <rect x="28" y="34" width="1.5" height="1.5" />
        <rect x="31" y="34" width="1.5" height="1.5" />
        <rect x="34" y="34" width="1.5" height="1.5" />
        <rect x="25" y="36.5" width="1.5" height="1.5" />
        <rect x="28.5" y="36.5" width="1.5" height="1.5" />
        <rect x="32" y="36.5" width="1.5" height="1.5" />
      </g>
    </svg>
  )
}
