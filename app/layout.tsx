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
    { media: '(prefers-color-scheme: light)', color: '#050608' },
    { media: '(prefers-color-scheme: dark)',  color: '#050608' },
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
        {process.env.NODE_ENV === 'production' ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js',{scope:'/'}));}`,
            }}
          />
        ) : null}
      </body>
    </html>
  )
}
