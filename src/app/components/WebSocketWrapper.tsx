// /app/components/WebSocketWrapper.tsx
'use client'

import { WebSocketProvider } from '@/app/contexts/WebSocketContext'
import { usePathname } from 'next/navigation'

export function WebSocketWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Only enable WebSocket on dashboard pages to improve performance
  const isDashboard = pathname?.startsWith('/dashboard')
  
  if (isDashboard) {
    return <WebSocketProvider>{children}</WebSocketProvider>
  }
  
  return <>{children}</>
}