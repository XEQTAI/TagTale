interface BrandMarkProps {
  size?: number
  className?: string
}

/**
 * Minimal TT monogram inspired by the brand kit.
 */
export default function BrandMark({ size = 44, className = '' }: BrandMarkProps) {
  const stroke = Math.max(2, Math.round(size * 0.08))
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      aria-label="TagTale mark"
      role="img"
    >
      <rect x="4" y="8" width="18" height={stroke} rx="1.5" fill="currentColor" />
      <rect x="26" y="8" width="18" height={stroke} rx="1.5" fill="currentColor" />
      <rect x="11" y="8" width={stroke} height="30" rx="1.5" fill="currentColor" />
      <rect x="33" y="8" width={stroke} height="30" rx="1.5" fill="currentColor" />
      <rect x="4" y="22" width="18" height={stroke} rx="1.5" fill="currentColor" />
      <rect x="26" y="22" width="18" height={stroke} rx="1.5" fill="currentColor" />
    </svg>
  )
}

