// src/components/dashboard/BedCapacityWidget.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Progress } from "../ui/progress"
import { cn } from "../../lib/utils"
import { Bed, AlertTriangle, CheckCircle } from "lucide-react"

const bedStatus = [
  {
    ward: "Emergency",
    total: 25,
    occupied: 22,
    available: 3,
    status: "critical"
  },
  {
    ward: "ICU",
    total: 15,
    occupied: 12,
    available: 3,
    status: "warning"
  },
  {
    ward: "Surgical",
    total: 40,
    occupied: 28,
    available: 12,
    status: "good"
  },
  {
    ward: "Pediatric",
    total: 30,
    occupied: 18,
    available: 12,
    status: "good"
  }
]

export function BedCapacityWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bed className="h-5 w-5" />
          Bed Capacity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {bedStatus.map((ward, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{ward.ward}</span>
                <div className="flex items-center gap-2">
                  {ward.status === "critical" && (
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                  )}
                  {ward.status === "warning" && (
                    <AlertTriangle className="h-3 w-3 text-yellow-500" />
                  )}
                  {ward.status === "good" && (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {ward.available}/{ward.total} available
                  </span>
                </div>
              </div>
              <Progress 
                value={(ward.occupied / ward.total) * 100}
                className={cn(
                  ward.status === "critical" && "bg-red-100 [&>div]:bg-red-600",
                  ward.status === "warning" && "bg-yellow-100 [&>div]:bg-yellow-600",
                  ward.status === "good" && "bg-green-100 [&>div]:bg-green-600"
                )}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}