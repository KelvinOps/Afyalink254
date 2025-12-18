// src/components/dashboard/AlertsBanner.tsx
'use client'

import { AlertTriangle, X } from "lucide-react"
import { useState } from "react"
import { Button } from "../ui/button"
import { cn } from "../../lib/utils"

interface Alert {
  id: number
  type: "critical" | "warning" | "info"
  title: string
  message: string
  timestamp: string
}

const alerts: Alert[] = [
  {
    id: 1,
    type: "warning",
    title: "System Maintenance",
    message: "Scheduled maintenance tonight from 2:00 AM to 4:00 AM EAT",
    timestamp: "2 hours ago"
  },
  {
    id: 2,
    type: "info",
    title: "SHA System Update",
    message: "New SHA claim forms available. Please update your templates.",
    timestamp: "1 day ago"
  },
  {
    id: 3,
    type: "critical",
    title: "High Patient Volume",
    message: "Emergency departments experiencing higher than usual patient volume",
    timestamp: "3 hours ago"
  }
]

export function AlertsBanner() {
  const [dismissedAlerts, setDismissedAlerts] = useState<number[]>([])

  const visibleAlerts = alerts.filter(alert => !dismissedAlerts.includes(alert.id))

  if (visibleAlerts.length === 0) return null

  const dismissAlert = (id: number) => {
    setDismissedAlerts(prev => [...prev, id])
  }

  return (
    <div className="space-y-3">
      {visibleAlerts.map((alert) => (
        <div
          key={alert.id}
          className={cn(
            "flex items-start gap-3 rounded-lg border p-4",
            alert.type === "critical" && "border-red-200 bg-red-50",
            alert.type === "warning" && "border-yellow-200 bg-yellow-50",
            alert.type === "info" && "border-blue-200 bg-blue-50"
          )}
        >
          <div className={cn(
            "rounded-full p-1",
            alert.type === "critical" && "bg-red-100",
            alert.type === "warning" && "bg-yellow-100",
            alert.type === "info" && "bg-blue-100"
          )}>
            <AlertTriangle className={cn(
              "h-4 w-4",
              alert.type === "critical" && "text-red-600",
              alert.type === "warning" && "text-yellow-600",
              alert.type === "info" && "text-blue-600"
            )} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className={cn(
                "font-semibold",
                alert.type === "critical" && "text-red-900",
                alert.type === "warning" && "text-yellow-900",
                alert.type === "info" && "text-blue-900"
              )}>
                {alert.title}
              </h4>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => dismissAlert(alert.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <p className={cn(
              "text-sm mt-1",
              alert.type === "critical" && "text-red-700",
              alert.type === "warning" && "text-yellow-700",
              alert.type === "info" && "text-blue-700"
            )}>
              {alert.message}
            </p>
            <p className={cn(
              "text-xs mt-2",
              alert.type === "critical" && "text-red-600",
              alert.type === "warning" && "text-yellow-600",
              alert.type === "info" && "text-blue-600"
            )}>
              {alert.timestamp}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}