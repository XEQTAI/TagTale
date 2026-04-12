interface AvatarProps {
  username: string
  avatarUrl?: string | null
  size?: number
  className?: string
}

export default function Avatar({ username, avatarUrl, size = 40, className = '' }: AvatarProps) {
  const src = avatarUrl || `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(username)}`

  return (
    <img
      src={src}
      alt={username}
      width={size}
      height={size}
      className={`rounded-full bg-surface-2 border border-edge ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
