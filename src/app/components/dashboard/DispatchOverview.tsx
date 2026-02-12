// src/components/dashboard/DispatchOverview.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { cn } from "../../lib/utils"
import { 
  Ambulance, 
  MapPin, 
  Clock,
  Radio,
} from "lucide-react"

const activeDispatches = [
  {
    id: 1,
    type: "Emergency",
    location: "Westlands, Nairobi",
    ambulance: "AMB-001",
    status: "en-route",
    eta: "3min",
    priority: "high"
  },
  {
    id: 2,
    type: "Transfer",
    location: "Kenyatta Hospital",
    ambulance: "AMB-012",
    status: "on-scene",
    eta: "0min",
    priority: "medium"
  },
  {
    id: 3,
    type: "Emergency",
    location: "CBD, Mombasa",
    ambulance: "AMB-023",
    status: "en-route",
    eta: "7min",
    priority: "high"
  }
]

export function DispatchOverview() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Radio className="h-5 w-5" />
          Active Dispatches
        </CardTitle>
        <Badge variant="outline" className="text-xs">
          {activeDispatches.length} Active
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activeDispatches.map((dispatch) => (
            <div
              key={dispatch.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center space-x-3">
                <div className={cn(
                  "flex-shrink-0 rounded-full p-2",
                  dispatch.priority === "high" ? "bg-red-100" : "bg-yellow-100"
                )}>
                  <Ambulance className={cn(
                    "h-4 w-4",
                    dispatch.priority === "high" ? "text-red-600" : "text-yellow-600"
                  )} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{dispatch.type}</p>
                    <Badge variant={dispatch.priority === "high" ? "destructive" : "outline"} className="text-xs">
                      {dispatch.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {dispatch.location}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Ambulance className="h-3 w-3" />
                    {dispatch.ambulance}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={
                  dispatch.status === "en-route" ? "default" :
                  dispatch.status === "on-scene" ? "secondary" : "outline"
                } className="text-xs mb-1">
                  {dispatch.status}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  ETA: {dispatch.eta}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}