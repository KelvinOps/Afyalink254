// src/app/(auth)/layout.tsx
import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Login - AfyaLink254 Emergency System',
  description: 'Login to the national emergency healthcare system',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}