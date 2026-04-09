/**
 * TagTale word-mark — no icon, just type.
 * "Tag" light weight, "Tale" bold. Monochrome, theme-aware.
 */
interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  inverted?: boolean   // white text on dark bg
}

const sizes = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-3xl',
  xl: 'text-5xl',
}

export default function Logo({ size = 'md', className = '', inverted = false }: LogoProps) {
  const color = inverted ? 'text-white' : 'text-ink'
  return (
    <span
      className={`font-sans tracking-tight select-none leading-none ${sizes[size]} ${color} ${className}`}
      aria-label="TagTale"
    >
      <span className="font-light">Tag</span>
      <span className="font-bold">Tale</span>
    </span>
  )
}
