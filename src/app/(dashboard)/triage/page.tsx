'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Input } from '@/app/components/ui/input'
import { 
  Search,
  Plus,
  Filter,
  Users,
  Clock,
  AlertTriangle,
  Stethoscope,
  Loader2,
  ArrowUpDown
} from 'lucide-react'
import Link from 'next/link'

interface TriageEntry {
  id: string
  triageNumber: string
  patient: {
    id: string
    firstName: string
    lastName: string
    patientNumber: string
    dateOfBirth: string
    gender: string
  }
  triageLevel: string
  status: string
  chiefComplaint: string
  arrivalTime: string
  waitingTime: number
  department: {
    name: string
    type: string
  }
  assessedBy: {
    firstName: string
    lastName: string
  }
  vitalSigns: {
    bp?: string
    pulse?: number
    temp?: number
    respRate?: number
    o2Sat?: number
  }
}

// Define valid triage levels for type safety
type TriageLevel = 'IMMEDIATE' | 'URGENT' | 'LESS_URGENT' | 'NON_URGENT'

export default function TriageListPage() {
  const { user } = useAuth()
  const [triageEntries, setTriageEntries] = useState<TriageEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [sortBy, setSortBy] = useState('arrivalTime')

  useEffect(() => {
    fetchTriageEntries()
  }, [])

  const fetchTriageEntries = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/triage')
      const data = await response.json()

      if (response.ok) {
        setTriageEntries(data.triageEntries)
      } else {
        console.error('Error fetching triage entries:', data.error)
      }
    } catch (error) {
      console.error('Error fetching triage entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      WAITING: { variant: 'outline', label: 'Waiting' },
      IN_ASSESSMENT: { variant: 'secondary', label: 'In Assessment' },
      IN_TREATMENT: { variant: 'default', label: 'In Treatment' },
      AWAITING_ADMISSION: { variant: 'secondary', label: 'Awaiting Admission' },
      AWAITING_TRANSFER: { variant: 'outline', label: 'Awaiting Transfer' },
      ADMITTED: { variant: 'secondary', label: 'Admitted' },
      DISCHARGED: { variant: 'outline', label: 'Discharged' }
    }
    const config = statusConfig[status] || { variant: 'outline', label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
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

  const calculateAge = (dateOfBirth: string) => {
    const birthDate = new Date(dateOfBirth)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const filteredEntries = triageEntries.filter(entry => {
    const matchesSearch = searchTerm === '' || 
      entry.patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.triageNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.chiefComplaint.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter
    const matchesDepartment = departmentFilter === 'all' || entry.department.type === departmentFilter
    
    return matchesSearch && matchesStatus && matchesDepartment
  })

  const sortedEntries = [...filteredEntries].sort((a, b) => {
    switch (sortBy) {
      case 'arrivalTime':
        return new Date(b.arrivalTime).getTime() - new Date(a.arrivalTime).getTime()
      case 'waitingTime':
        return b.waitingTime - a.waitingTime
      case 'triageLevel':
        // Fixed: Use type-safe approach for triage level sorting
        const levelOrder: Record<TriageLevel, number> = { 
          IMMEDIATE: 1, 
          URGENT: 2, 
          LESS_URGENT: 3, 
          NON_URGENT: 4 
        }
        
        // Use type assertion for known triage levels, fallback for unknown values
        const aLevel = a.triageLevel as TriageLevel
        const bLevel = b.triageLevel as TriageLevel
        
        const aOrder = levelOrder[aLevel] || 5 // Default to lowest priority for unknown levels
        const bOrder = levelOrder[bLevel] || 5 // Default to lowest priority for unknown levels
        
        return aOrder - bOrder
      default:
        return 0
    }
  })

  const stats = {
    total: triageEntries.length,
    waiting: triageEntries.filter(e => e.status === 'WAITING').length,
    inAssessment: triageEntries.filter(e => e.status === 'IN_ASSESSMENT').length,
    immediate: triageEntries.filter(e => e.triageLevel === 'IMMEDIATE').length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Triage Management</h1>
          <p className="text-muted-foreground">
            Manage patient triage and prioritize emergency cases
          </p>
        </div>
        <Button asChild>
          <Link href="/triage/new">
            <Plus className="w-4 h-4 mr-2" />
            New Triage
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              In triage system
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Waiting</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.waiting}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting assessment
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Assessment</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inAssessment}</div>
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
            <div className="text-2xl font-bold">{stats.immediate}</div>
            <p className="text-xs text-muted-foreground">
              Critical priority
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Triage List</CardTitle>
          <CardDescription>
            Search and filter triage entries by status, department, or patient details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by patient name, triage number, or complaint..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-2 border rounded-md text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="WAITING">Waiting</option>
                <option value="IN_ASSESSMENT">In Assessment</option>
                <option value="IN_TREATMENT">In Treatment</option>
              </select>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="p-2 border rounded-md text-sm"
              >
                <option value="all">All Departments</option>
                <option value="ACCIDENT_EMERGENCY">Emergency</option>
                <option value="PEDIATRICS">Pediatrics</option>
                <option value="MATERNITY">Maternity</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="p-2 border rounded-md text-sm"
              >
                <option value="arrivalTime">Arrival Time</option>
                <option value="waitingTime">Waiting Time</option>
                <option value="triageLevel">Priority</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : sortedEntries.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No triage entries found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || departmentFilter !== 'all' 
                  ? 'Try adjusting your search criteria' 
                  : 'No patients currently in triage'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Link 
                          href={`/triage/${entry.id}`}
                          className="font-semibold hover:underline"
                        >
                          {entry.triageNumber}
                        </Link>
                        {getTriageBadge(entry.triageLevel)}
                        {getStatusBadge(entry.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Patient:</span>{' '}
                          {entry.patient.firstName} {entry.patient.lastName} ({calculateAge(entry.patient.dateOfBirth)}y)
                        </div>
                        <div>
                          <span className="font-medium">Complaint:</span> {entry.chiefComplaint}
                        </div>
                        <div>
                          <span className="font-medium">Department:</span> {entry.department.name}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>Waiting: {formatWaitingTime(entry.waitingTime)}</span>
                        </div>
                        <span>Arrived: {new Date(entry.arrivalTime).toLocaleTimeString()}</span>
                        {entry.assessedBy && (
                          <span>Assessed by: {entry.assessedBy.firstName} {entry.assessedBy.lastName}</span>
                        )}
                      </div>

                      {entry.vitalSigns && (
                        <div className="flex flex-wrap gap-4 mt-2 text-xs">
                          {entry.vitalSigns.bp && <span>BP: {entry.vitalSigns.bp}</span>}
                          {entry.vitalSigns.pulse && <span>Pulse: {entry.vitalSigns.pulse}</span>}
                          {entry.vitalSigns.temp && <span>Temp: {entry.vitalSigns.temp}°C</span>}
                          {entry.vitalSigns.o2Sat && <span>O2: {entry.vitalSigns.o2Sat}%</span>}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/triage/${entry.id}`}>
                        View
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/triage/${entry.id}/edit`}>
                        Edit
                      </Link>
                    </Button>
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