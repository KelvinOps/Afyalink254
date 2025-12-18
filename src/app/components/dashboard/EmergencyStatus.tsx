// src/components/dashboard/EmergencyStatus.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { 
  AlertTriangle, 
  MapPin, 
  Clock,
  Users,
  Ambulance
} from "lucide-react"

const emergencies = [
  {
    id: 1,
    type: "Mass Casualty",
    location: "City Mall, Nairobi",
    severity: "critical",
    patients: 12,
    responders: 4,
    time: "15 minutes ago"
  },
  {
    id: 2,
    type: "Road Accident",
    location: "Mombasa Road",
    severity: "high",
    patients: 3,
    responders: 2,
    time: "8 minutes ago"
  }
]

export function EmergencyStatus() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          Active Emergencies
        </CardTitle>
        <Badge variant="destructive" className="text-xs">
          {emergencies.length} Active
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {emergencies.map((emergency) => (
            <div
              key={emergency.id}
              className="rounded-lg border border-red-200 bg-red-50 p-4"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-red-900">{emergency.type}</h4>
                    <Badge variant="destructive" className="text-xs">
                      {emergency.severity}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-red-700">
                    <MapPin className="h-3 w-3" />
                    {emergency.location}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-red-600">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {emergency.patients} patients
                    </div>
                    <div className="flex items-center gap-1">
                      <Ambulance className="h-3 w-3" />
                      {emergency.responders} teams
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {emergency.time}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}