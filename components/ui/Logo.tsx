interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  inverted?: boolean   // white text on dark bg
}

const sizes = {
  sm: 'text-base tracking-[0.2em]',
  md: 'text-xl tracking-[0.24em]',
  lg: 'text-3xl tracking-[0.28em]',
  xl: 'text-5xl tracking-[0.33em]',
}

export default function Logo({ size = 'md', className = '', inverted = false }: LogoProps) {
  const color = inverted ? 'text-white' : 'text-ink'
  return (
    <span
      className={`font-sans uppercase select-none leading-none ${sizes[size]} ${color} ${className}`}
      aria-label="TagTale"
    >
      <span className="font-medium">TAGTALE</span>
    </span>
  )
}
