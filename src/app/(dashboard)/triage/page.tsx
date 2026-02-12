'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Input } from '@/app/components/ui/input'
import { 
  Search,
  Plus,
  Users,
  Clock,
  AlertTriangle,
  Stethoscope,
  Loader2
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
  assessedBy?: {
    firstName: string
    lastName: string
  }
  vitalSigns?: {
    bp?: string
    pulse?: number
    temp?: number
    respRate?: number
    o2Sat?: number
  }
}

// Define valid triage levels for type safety
const VALID_TRIAGE_LEVELS = ['IMMEDIATE', 'URGENT', 'LESS_URGENT', 'NON_URGENT'] as const

export default function TriageListPage() {
  const [triageEntries, setTriageEntries] = useState<TriageEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
      setError(null)
      const response = await fetch('/api/triage')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch triage entries: ${response.status}`)
      }
      
      const data = await response.json()

      if (response.ok && data.triageEntries) {
        // Validate and transform data
        const validatedEntries = data.triageEntries.map((entry: TriageEntry & { triageLevel: string }) => ({
          id: entry.id || '',
          triageNumber: entry.triageNumber || 'UNKNOWN',
          patient: {
            id: entry.patient?.id || '',
            firstName: entry.patient?.firstName || 'Unknown',
            lastName: entry.patient?.lastName || '',
            patientNumber: entry.patient?.patientNumber || '',
            dateOfBirth: entry.patient?.dateOfBirth || new Date().toISOString(),
            gender: entry.patient?.gender || 'UNKNOWN'
          },
          triageLevel: VALID_TRIAGE_LEVELS.includes(entry.triageLevel as typeof VALID_TRIAGE_LEVELS[number])
            ? entry.triageLevel 
            : 'NON_URGENT',
          status: entry.status || 'WAITING',
          chiefComplaint: entry.chiefComplaint || 'No complaint recorded',
          arrivalTime: entry.arrivalTime || new Date().toISOString(),
          waitingTime: typeof entry.waitingTime === 'number' ? entry.waitingTime : 0,
          department: {
            name: entry.department?.name || 'Unknown Department',
            type: entry.department?.type || 'OTHER'
          },
          assessedBy: entry.assessedBy ? {
            firstName: entry.assessedBy.firstName || '',
            lastName: entry.assessedBy.lastName || ''
          } : undefined,
          vitalSigns: entry.vitalSigns || {}
        }))
        
        setTriageEntries(validatedEntries)
      } else {
        setTriageEntries([])
        setError('No triage entries found')
      }
    } catch (error) {
      console.error('Error fetching triage entries:', error)
      setError('Failed to load triage entries. Please try again.')
      setTriageEntries([])
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
    const config = statusConfig[status] || { variant: 'outline' as const, label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getTriageBadge = (triageLevel: string) => {
    const triageConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      IMMEDIATE: { variant: 'destructive', label: 'Immediate' },
      URGENT: { variant: 'default', label: 'Urgent' },
      LESS_URGENT: { variant: 'secondary', label: 'Less Urgent' },
      NON_URGENT: { variant: 'outline', label: 'Non-Urgent' }
    }
    const config = triageConfig[triageLevel] || { variant: 'outline' as const, label: triageLevel }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatWaitingTime = (minutes: number) => {
    if (minutes < 0) minutes = 0
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const calculateAge = (dateOfBirth: string) => {
    try {
      const birthDate = new Date(dateOfBirth)
      if (isNaN(birthDate.getTime())) return 0
      
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      return age
    } catch (error) {
      console.error('Error calculating age:', error)
      return 0
    }
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
        try {
          const aTime = new Date(a.arrivalTime).getTime()
          const bTime = new Date(b.arrivalTime).getTime()
          return bTime - aTime
        } catch {
          return 0
        }
      case 'waitingTime':
        return b.waitingTime - a.waitingTime
      case 'triageLevel':
        const levelOrder: Record<string, number> = { 
          IMMEDIATE: 1, 
          URGENT: 2, 
          LESS_URGENT: 3, 
          NON_URGENT: 4 
        }
        
        const aOrder = levelOrder[a.triageLevel] || 5
        const bOrder = levelOrder[b.triageLevel] || 5
        
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

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          {error}
        </div>
      )}

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

                      {entry.vitalSigns && Object.keys(entry.vitalSigns).length > 0 && (
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