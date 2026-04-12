const base = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '')
const extra = process.env.ALLOWED_ORIGINS?.split(',').map((s) => s.trim()).filter(Boolean) ?? []
const serverActionAllowedOrigins = [...new Set([...extra, base].filter(Boolean))]
if (process.env.NODE_ENV !== 'production') {
  const devPorts = ['3000', '3333']
  for (const port of devPorts) {
    const http = `http://localhost:${port}`
    const loop = `http://127.0.0.1:${port}`
    if (!serverActionAllowedOrigins.includes(http)) serverActionAllowedOrigins.push(http)
    if (!serverActionAllowedOrigins.includes(loop)) serverActionAllowedOrigins.push(loop)
  }
}

const imageRemotePatterns = [
  { protocol: 'https', hostname: 'api.dicebear.com' },
  { protocol: 'https', hostname: 'res.cloudinary.com' },
]
try {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl) {
    const host = new URL(supabaseUrl).hostname
    imageRemotePatterns.push({ protocol: 'https', hostname: host })
  }
} catch {
  /* invalid NEXT_PUBLIC_SUPABASE_URL at build time */
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [{ source: '/auth/callback', destination: '/login', permanent: true }]
  },
  images: {
    remotePatterns: imageRemotePatterns,
  },
  experimental: {
    serverActions: {
      allowedOrigins:
        serverActionAllowedOrigins.length > 0 ? serverActionAllowedOrigins : ['http://localhost:3333'],
    },
  },
}

export default nextConfig
