'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { 
  RefreshCw,
  Clock,
  AlertTriangle,
  Users,
  Activity,
  Loader2
} from 'lucide-react'

interface QueueEntry {
  id: string
  triageNumber: string
  patient: {
    firstName: string
    lastName: string
    patientNumber: string
  }
  triageLevel: string
  status: string
  chiefComplaint: string
  arrivalTime: string
  waitingTime: number
  department: {
    name: string
  }
}

export default function QueueManagementPage() {
  const { user } = useAuth()
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    fetchQueue()
    let interval: NodeJS.Timeout
    
    if (autoRefresh) {
      interval = setInterval(fetchQueue, 30000) // Refresh every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  const fetchQueue = async () => {
    try {
      const response = await fetch('/api/triage/queue')
      const data = await response.json()

      if (response.ok) {
        setQueueEntries(data.queueEntries)
      } else {
        console.error('Error fetching queue:', data.error)
      }
    } catch (error) {
      console.error('Error fetching queue:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTriageBadge = (triageLevel: string) => {
    const triageConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      IMMEDIATE: { variant: 'destructive', label: 'Immediate' },
      URGENT: { variant: 'default', label: 'Urgent' },
      LESS_URGENT: { variant: 'secondary', label: 'Less Urgent' },
      NON_URGENT: { variant: 'outline', label: 'Non-Urgent' }
    }
    const config = triageConfig[triageLevel] || { variant: 'outline', label: triageLevel }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatWaitingTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const getWaitTimeColor = (minutes: number, triageLevel: string) => {
    if (triageLevel === 'IMMEDIATE' && minutes > 5) return 'text-red-600 font-semibold'
    if (triageLevel === 'URGENT' && minutes > 30) return 'text-orange-600 font-semibold'
    if (minutes > 120) return 'text-yellow-600 font-semibold'
    return 'text-muted-foreground'
  }

  const waitingPatients = queueEntries.filter(entry => entry.status === 'WAITING')
  const inAssessment = queueEntries.filter(entry => entry.status === 'IN_ASSESSMENT')

  const byPriority = {
    immediate: waitingPatients.filter(p => p.triageLevel === 'IMMEDIATE'),
    urgent: waitingPatients.filter(p => p.triageLevel === 'URGENT'),
    lessUrgent: waitingPatients.filter(p => p.triageLevel === 'LESS_URGENT'),
    nonUrgent: waitingPatients.filter(p => p.triageLevel === 'NON_URGENT')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live Queue Management</h1>
          <p className="text-muted-foreground">
            Real-time view of patient queue and waiting times
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchQueue}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="w-4 h-4 mr-2" />
            Auto-refresh {autoRefresh ? 'On' : 'Off'}
          </Button>
        </div>
      </div>

      {/* Queue Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Waiting</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{waitingPatients.length}</div>
            <p className="text-xs text-muted-foreground">
              Patients in queue
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Assessment</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inAssessment.length}</div>
            <p className="text-xs text-muted-foreground">
              Being assessed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Immediate Cases</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{byPriority.immediate.length}</div>
            <p className="text-xs text-muted-foreground">
              Critical priority
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Wait Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {waitingPatients.length > 0 
                ? formatWaitingTime(Math.round(waitingPatients.reduce((acc, p) => acc + p.waitingTime, 0) / waitingPatients.length))
                : '0m'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Average waiting time
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Immediate & Urgent Priority */}
        <Card>
          <CardHeader className="bg-red-50 border-b">
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertTriangle className="w-5 h-5" />
              High Priority (Immediate & Urgent)
            </CardTitle>
            <CardDescription className="text-red-700">
              {byPriority.immediate.length + byPriority.urgent.length} patients requiring immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : [...byPriority.immediate, ...byPriority.urgent].length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No high priority patients in queue
              </div>
            ) : (
              <div className="divide-y">
                {[...byPriority.immediate, ...byPriority.urgent].map((entry, index) => (
                  <div key={entry.id} className="p-4 hover:bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold">{entry.triageNumber}</span>
                        {getTriageBadge(entry.triageLevel)}
                      </div>
                      <div className={`flex items-center gap-1 ${getWaitTimeColor(entry.waitingTime, entry.triageLevel)}`}>
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">{formatWaitingTime(entry.waitingTime)}</span>
                      </div>
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">
                        {entry.patient.firstName} {entry.patient.lastName}
                      </div>
                      <div className="text-muted-foreground">
                        {entry.chiefComplaint}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Arrived: {new Date(entry.arrivalTime).toLocaleTimeString()} • {entry.department.name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Less Urgent & Non-Urgent Priority */}
        <Card>
          <CardHeader className="bg-yellow-50 border-b">
            <CardTitle className="flex items-center gap-2 text-yellow-900">
              <Clock className="w-5 h-5" />
              Standard Priority (Less & Non-Urgent)
            </CardTitle>
            <CardDescription className="text-yellow-700">
              {byPriority.lessUrgent.length + byPriority.nonUrgent.length} patients in standard queue
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : [...byPriority.lessUrgent, ...byPriority.nonUrgent].length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No standard priority patients in queue
              </div>
            ) : (
              <div className="divide-y">
                {[...byPriority.lessUrgent, ...byPriority.nonUrgent].map((entry, index) => (
                  <div key={entry.id} className="p-4 hover:bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold">{entry.triageNumber}</span>
                        {getTriageBadge(entry.triageLevel)}
                      </div>
                      <div className={`flex items-center gap-1 ${getWaitTimeColor(entry.waitingTime, entry.triageLevel)}`}>
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">{formatWaitingTime(entry.waitingTime)}</span>
                      </div>
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">
                        {entry.patient.firstName} {entry.patient.lastName}
                      </div>
                      <div className="text-muted-foreground">
                        {entry.chiefComplaint}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Arrived: {new Date(entry.arrivalTime).toLocaleTimeString()} • {entry.department.name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Currently in Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Currently in Assessment
          </CardTitle>
          <CardDescription>
            {inAssessment.length} patients being assessed by medical staff
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : inAssessment.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No patients currently in assessment
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {inAssessment.map(entry => (
                <div key={entry.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-semibold">{entry.triageNumber}</span>
                    {getTriageBadge(entry.triageLevel)}
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">
                      {entry.patient.firstName} {entry.patient.lastName}
                    </div>
                    <div className="text-muted-foreground">
                      {entry.chiefComplaint}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Department: {entry.department.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}