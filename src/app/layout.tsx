// app/layout.tsx 
import type { Metadata, Viewport } from 'next'
import { Inter, Poppins } from 'next/font/google'
import './globals.css'
import { Providers } from './Providers' 
import { WebSocketWrapper } from './components/WebSocketWrapper'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true, 
})

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  title: {
    default: 'National Emergency Healthcare System - Kenya',
    template: '%s | NEHS Kenya'
  },
  description: 'Comprehensive emergency healthcare coordination system',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
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
        <meta name="theme-color" content="#1e40af" />
      </head>
      <body className={`${inter.className} antialiased min-h-screen bg-white`}>
        <Providers>
          <WebSocketWrapper>
            <div className="page-transition">
              {children}
            </div>
          </WebSocketWrapper>
        </Providers>
      </body>
    </html>
  )
}