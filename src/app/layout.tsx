// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { WebSocketProvider } from './contexts/WebSocketContext'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'National Emergency Healthcare System - Kenya',
    template: '%s | NEHS Kenya'
  },
  description: 'Comprehensive emergency healthcare coordination system serving all 47 counties with real-time response capabilities and SHA/SHIF integration.',
  keywords: ['emergency', 'healthcare', 'kenya', 'ambulance', 'triage', 'SHA', 'SHIF', '999', '911'],
  authors: [{ name: 'Kenya Ministry of Health' }],
  creator: 'Kenya Ministry of Health',
  publisher: 'Kenya Ministry of Health',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    url: '/',
    title: 'National Emergency Healthcare System - Kenya',
    description: 'Emergency healthcare coordination system for Kenya',
    siteName: 'NEHS Kenya',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  twitter: {
    card: 'summary_large_image',
    title: 'National Emergency Healthcare System - Kenya',
    description: 'Emergency healthcare coordination system for Kenya',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#1e40af" />
        <meta name="emergent-care" content="true" />
      </head>
      <body className={`${inter.className} antialiased bg-background text-foreground min-h-screen flex flex-col`}>
        <AuthProvider>
          <NotificationProvider>
            <WebSocketProvider>
              <div className="flex-1 flex flex-col">
                {children}
              </div>
            </WebSocketProvider>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  )
}