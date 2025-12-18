// src/components/dashboard/QuickActions.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { 
  Ambulance, 
  Stethoscope, 
  UserPlus, 
  FileText, 
  Video,
  Truck,
  Plus
} from "lucide-react"
import { useAuth } from "../../contexts/AuthContext"

const quickActions = [
  {
    name: "New Dispatch",
    icon: Ambulance,
    href: "/dispatch/new",
    permission: "dispatch.write",
    color: "text-red-600"
  },
  {
    name: "Quick Triage",
    icon: Stethoscope,
    href: "/triage/new",
    permission: "triage.write",
    color: "text-blue-600"
  },
  {
    name: "New Patient",
    icon: UserPlus,
    href: "/patients/new",
    permission: "patients.write",
    color: "text-green-600"
  },
  {
    name: "SHA Claim",
    icon: FileText,
    href: "/sha-claims/new",
    permission: "claims.write",
    color: "text-purple-600"
  },
  {
    name: "Telemedicine",
    icon: Video,
    href: "/telemedicine/sessions/new",
    permission: "telemedicine.write",
    color: "text-orange-600"
  },
  {
    name: "Transfer",
    icon: Truck,
    href: "/transfers/new",
    permission: "transfers.write",
    color: "text-cyan-600"
  }
]

export function QuickActions() {
  const { hasPermission } = useAuth()

  const filteredActions = quickActions.filter(action => 
    hasPermission(action.permission)
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {filteredActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-auto flex-col gap-2 py-4 px-2 hover:bg-accent hover:text-accent-foreground"
              asChild
            >
              <a href={action.href}>
                <action.icon className={`h-5 w-5 ${action.color}`} />
                <span className="text-xs font-medium text-center leading-tight">
                  {action.name}
                </span>
              </a>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}