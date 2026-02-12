// src/components/dashboard/DashboardStats.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { 
  Users, 
  Ambulance, 
  Activity, 
  TrendingUp, 
  Clock
} from "lucide-react"
import { cn } from "../../lib/utils"


const stats = [
  {
    title: "Total Patients Today",
    value: "247",
    change: "+12%",
    trend: "up",
    icon: Users,
    description: "Patients served"
  },
  {
    title: "Active Emergencies",
    value: "8",
    change: "-2",
    trend: "down",
    icon: Ambulance,
    description: "Ongoing cases"
  },
  {
    title: "Avg Response Time",
    value: "4.2min",
    change: "-0.8min",
    trend: "down",
    icon: Clock,
    description: "Emergency response"
  },
  {
    title: "System Uptime",
    value: "99.98%",
    change: "+0.02%",
    trend: "up",
    icon: Activity,
    description: "This month"
  }
]

export function DashboardStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="flex items-center text-xs">
              <span className={cn(
                "flex items-center",
                stat.trend === "up" ? "text-green-600" : "text-red-600"
              )}>
                {stat.trend === "up" ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingUp className="h-3 w-3 mr-1 rotate-180" />
                )}
                {stat.change}
              </span>
              <span className="text-muted-foreground ml-1">{stat.description}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}