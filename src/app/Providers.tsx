// /app/Providers.tsx - CORRECTED
'use client'

import { AuthProvider } from '@/app/contexts/AuthContext'
import { NotificationProvider } from '@/app/contexts/NotificationContext'
import { WebSocketProvider } from '@/app/contexts/WebSocketContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <NotificationProvider>
        <WebSocketProvider>
          {children}
        </WebSocketProvider>
      </NotificationProvider>
    </AuthProvider>
  )
}