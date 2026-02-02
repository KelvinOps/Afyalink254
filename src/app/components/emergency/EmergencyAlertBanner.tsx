// app/components/emergency/EmergencyAlertBanner.tsx
'use client'

import { AlertTriangle } from 'lucide-react'

interface EmergencyAlertBannerProps {
  title: string
  message: string
}

export default function EmergencyAlertBanner({ title, message }: EmergencyAlertBannerProps) {
  return (
    <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-4 shadow-lg animate-pulse">
      <div className="container mx-auto">
        <div className="flex items-center justify-center space-x-3">
          <AlertTriangle className="h-5 w-5" />
          <p className="font-semibold text-lg text-center">
            <span className="font-bold">{title}</span> - {message}
          </p>
          <AlertTriangle className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}