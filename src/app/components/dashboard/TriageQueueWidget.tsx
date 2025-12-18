// src/components/dashboard/TriageQueueWidget.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  User,
  ArrowRight
} from "lucide-react"
import { cn } from "../../lib/utils"

interface TriagePatient {
  id: number
  name: string
  age: number
  priority: "critical" | "urgent" | "standard"
  waitingTime: string
  condition: string
  status: "waiting" | "in-progress"
}

const triagePatients: TriagePatient[] = [
  {
    id: 1,
    name: "John Kamau",
    age: 45,
    priority: "critical",
    waitingTime: "5min",
    condition: "Chest pain",
    status: "waiting"
  },
  {
    id: 2,
    name: "Mary Wanjiku",
    age: 32,
    priority: "urgent",
    waitingTime: "12min",
    condition: "Difficulty breathing",
    status: "waiting"
  },
  {
    id: 3,
    name: "David Ochieng",
    age: 28,
    priority: "standard",
    waitingTime: "25min",
    condition: "Minor injury",
    status: "in-progress"
  },
  {
    id: 4,
    name: "Grace Auma",
    age: 67,
    priority: "urgent",
    waitingTime: "8min",
    condition: "High fever",
    status: "waiting"
  }
]

interface PriorityConfig {
  variant: "destructive" | "default" | "secondary"
  label: string
}

const priorityConfig: Record<string, PriorityConfig> = {
  critical: { variant: "destructive", label: "Critical" },
  urgent: { variant: "default", label: "Urgent" },
  standard: { variant: "secondary", label: "Standard" }
}

export function TriageQueueWidget() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Triage Queue
        </CardTitle>
        <Badge variant="destructive" className="text-xs">
          {triagePatients.filter(p => p.status === "waiting").length} Waiting
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {triagePatients.map((patient) => (
            <div
              key={patient.id}
              className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className={cn(
                  "flex-shrink-0 rounded-full p-2",
                  patient.priority === "critical" ? "bg-red-100" :
                  patient.priority === "urgent" ? "bg-blue-100" : "bg-gray-100"
                )}>
                  {patient.priority === "critical" ? (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  ) : patient.priority === "urgent" ? (
                    <Clock className="h-4 w-4 text-blue-600" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-gray-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{patient.name}</p>
                    <Badge 
                      variant={priorityConfig[patient.priority]?.variant || "secondary"} 
                      className="text-xs"
                    >
                      {priorityConfig[patient.priority]?.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {patient.age}y • {patient.condition}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Waiting</p>
                  <p className="text-sm font-medium">{patient.waitingTime}</p>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                  <a href={`/triage/${patient.id}`}>
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
        <Button variant="outline" className="w-full mt-4" asChild>
          <a href="/triage">
            View All Patients
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}