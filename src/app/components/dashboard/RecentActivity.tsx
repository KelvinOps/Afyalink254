// src/components/dashboard/RecentActivity.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { 
  Ambulance, 
  Stethoscope, 
  User, 
  FileText, 
  CheckCircle,
  Clock,
  AlertTriangle
} from "lucide-react"
import { Badge } from "../ui/badge"
import { cn } from "../../lib/utils"

const activities = [
  {
    type: "dispatch",
    title: "New emergency dispatch",
    description: "Cardiac arrest reported at City Mall",
    time: "2 minutes ago",
    icon: Ambulance,
    status: "critical",
    user: "Dr. Kamau"
  },
  {
    type: "triage",
    title: "Patient triaged",
    description: "John Doe - Priority Level 2",
    time: "5 minutes ago",
    icon: Stethoscope,
    status: "completed",
    user: "Nurse Wanjiku"
  },
  {
    type: "admission",
    title: "Patient admitted",
    description: "Jane Smith to Ward 4B",
    time: "12 minutes ago",
    icon: User,
    status: "completed",
    user: "Dr. Otieno"
  },
  {
    type: "claim",
    title: "SHA claim submitted",
    description: "Claim #SH-2024-001234",
    time: "25 minutes ago",
    icon: FileText,
    status: "pending",
    user: "Admin User"
  },
  {
    type: "transfer",
    title: "Patient transfer initiated",
    description: "From Nairobi Hospital to Aga Khan",
    time: "38 minutes ago",
    icon: Ambulance,
    status: "in-progress",
    user: "Dispatch Team"
  }
]

const statusConfig = {
  critical: { variant: "destructive", label: "Critical" },
  completed: { variant: "secondary", label: "Completed" },
  pending: { variant: "outline", label: "Pending" },
  "in-progress": { variant: "default", label: "In Progress" }
}

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-start space-x-4">
              <div className={cn(
                "flex-shrink-0 rounded-full p-2",
                activity.status === "critical" ? "bg-red-100" :
                activity.status === "completed" ? "bg-green-100" :
                activity.status === "in-progress" ? "bg-blue-100" : "bg-gray-100"
              )}>
                <activity.icon className={cn(
                  "h-4 w-4",
                  activity.status === "critical" ? "text-red-600" :
                  activity.status === "completed" ? "text-green-600" :
                  activity.status === "in-progress" ? "text-blue-600" : "text-gray-600"
                )} />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <Badge variant={statusConfig[activity.status as keyof typeof statusConfig]?.variant as any}>
                    {statusConfig[activity.status as keyof typeof statusConfig]?.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{activity.description}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>By {activity.user}</span>
                  <span>{activity.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}