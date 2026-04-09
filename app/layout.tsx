import type { Metadata, Viewport } from 'next'
import { ThemeProvider } from '@/components/ui/ThemeProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'TagTale — Stories travel with objects',
  description: 'Scan. Post. Follow the story of any physical object.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'TagTale' },
  other: { 'mobile-web-app-capable': 'yes' },
  icons: { icon: '/icon-192.png', apple: '/icon-192.png' },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F7F7F7' },
    { media: '(prefers-color-scheme: dark)',  color: '#0A0A0A' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js',{scope:'/'}));}`,
          }}
        />
      </body>
    </html>
  )
}
