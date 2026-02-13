'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/app/contexts/AuthContext'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { 
  Search, 
  ArrowLeft,
  User,
  Phone,
  IdCard,
  Shield,
  Loader2,
  AlertCircle,
  MapPin,
  Calendar,
  Filter,
  X
} from 'lucide-react'
import Link from 'next/link'

interface Patient {
  id: string
  patientNumber: string
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: string
  phone: string
  nationalId: string
  shaNumber: string
  currentStatus: string
  currentHospital?: {
    id: string
    name: string
    code: string
  }
  triageEntries: Array<{
    triageLevel: string
    status: string
    arrivalTime: string
  }>
}

interface SearchFilters {
  status: string
  hospital: string
  gender: string
}

export default function PatientSearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { hasPermission } = useAuth()
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    status: '',
    hospital: '',
    gender: ''
  })

  const handleSearchFromUrl = useCallback(async (query: string) => {
    setLoading(true)
    setError(null)
    setHasSearched(true)

    try {
      const params = new URLSearchParams({
        q: query,
        limit: '50'
      })

      // Add filters to params if they exist
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const response = await fetch(`/api/patients/search?${params}`)
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.patients) {
        setPatients(data.patients)
      } else {
        setPatients([])
      }
    } catch (err) {
      console.error('Search error:', err)
      setError(err instanceof Error ? err.message : 'Failed to search patients')
      setPatients([])
    } finally {
      setLoading(false)
    }
  }, [filters]) // Add filters as dependency

  // Load initial search from URL params
  useEffect(() => {
    const query = searchParams.get('q')
    if (query && query.length >= 2) {
      setSearchQuery(query)
      handleSearchFromUrl(query)
    }
  }, [searchParams, handleSearchFromUrl]) // Add handleSearchFromUrl to dependency array

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!searchQuery.trim()) {
      setError('Please enter a search term')
      return
    }

    if (searchQuery.trim().length < 2) {
      setError('Please enter at least 2 characters')
      return
    }

    // Update URL with search query
    const params = new URLSearchParams()
    params.set('q', searchQuery.trim())
    router.push(`/patients/search?${params.toString()}`)

    await handleSearchFromUrl(searchQuery.trim())
  }

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
  }

  const clearFilters = () => {
    setFilters({
      status: '',
      hospital: '',
      gender: ''
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      REGISTERED: { variant: 'outline', label: 'Registered' },
      IN_TRIAGE: { variant: 'secondary', label: 'In Triage' },
      IN_TREATMENT: { variant: 'default', label: 'In Treatment' },
      IN_SURGERY: { variant: 'default', label: 'In Surgery' },
      ADMITTED: { variant: 'secondary', label: 'Admitted' },
      IN_ICU: { variant: 'destructive', label: 'In ICU' },
      IN_TRANSFER: { variant: 'outline', label: 'In Transfer' },
      DISCHARGED: { variant: 'outline', label: 'Discharged' },
      DECEASED: { variant: 'destructive', label: 'Deceased' },
      ABSCONDED: { variant: 'outline', label: 'Absconded' }
    }

    const config = statusConfig[status] || { variant: 'outline', label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getTriageBadge = (triageLevel: string) => {
    const triageConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      IMMEDIATE: { variant: 'destructive', label: 'Immediate' },
      URGENT: { variant: 'default', label: 'Urgent' },
      LESS_URGENT: { variant: 'secondary', label: 'Less Urgent' },
      NON_URGENT: { variant: 'outline', label: 'Non-Urgent' },
      DECEASED: { variant: 'destructive', label: 'Deceased' }
    }

    const config = triageConfig[triageLevel] || { variant: 'outline', label: triageLevel }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const calculateAge = (dateOfBirth: string) => {
    try {
      const birthDate = new Date(dateOfBirth)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      
      return age
    } catch {
      return 'Unknown'
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return 'Invalid date'
    }
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== '')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/patients">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Advanced Patient Search</h1>
            <p className="text-muted-foreground">
              Search across all patient records in the national system
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                {Object.values(filters).filter(v => v).length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle>Search Patients</CardTitle>
          <CardDescription>
            Search by name, patient number, national ID, SHA number, or phone number
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Enter patient name, ID, phone, or patient number..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setError(null)
                    }}
                    className="pl-9"
                    disabled={loading}
                  />
                </div>
                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-sm mt-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}
              </div>
              <Button type="submit" disabled={loading || !searchQuery.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Filters</h3>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="flex items-center gap-1 text-muted-foreground"
                    >
                      <X className="w-3 h-3" />
                      Clear all
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="w-full p-2 border rounded-md text-sm"
                    >
                      <option value="">All Statuses</option>
                      <option value="REGISTERED">Registered</option>
                      <option value="IN_TRIAGE">In Triage</option>
                      <option value="IN_TREATMENT">In Treatment</option>
                      <option value="ADMITTED">Admitted</option>
                      <option value="DISCHARGED">Discharged</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Gender</label>
                    <select
                      value={filters.gender}
                      onChange={(e) => handleFilterChange('gender', e.target.value)}
                      className="w-full p-2 border rounded-md text-sm"
                    >
                      <option value="">All Genders</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Hospital</label>
                    <select
                      value={filters.hospital}
                      onChange={(e) => handleFilterChange('hospital', e.target.value)}
                      className="w-full p-2 border rounded-md text-sm"
                    >
                      <option value="">All Hospitals</option>
                      {/* In a real app, you would populate this from your hospitals data */}
                      <option value="hosp-001">Main County Hospital</option>
                      <option value="hosp-002">Regional Referral</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
            
            <div className="text-sm text-muted-foreground">
              <p>Search tips:</p>
              <ul className="list-disc list-inside space-y-1 mt-1">
                <li>Use at least 2 characters for better results</li>
                <li>Search by full name, partial name, or identification numbers</li>
                <li>Results are shown from across all healthcare facilities</li>
                <li>Use filters to narrow down your search results</li>
              </ul>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Search Results */}
      {hasSearched && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              {loading ? (
                "Searching patients across all facilities..."
              ) : patients.length > 0 ? (
                `Found ${patients.length} patient(s) matching your search`
              ) : (
                "No patients found matching your search criteria"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Searching patient records...</p>
                </div>
              </div>
            ) : patients.length === 0 ? (
              <div className="text-center py-12">
                <User className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No patients found</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {searchQuery ? 
                    'Try adjusting your search terms or filters. You can search by name, patient number, national ID, SHA number, or phone number.' : 
                    'Enter a search term to find patients across the national healthcare system.'
                  }
                </p>
                {searchQuery && (
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                    className="mt-4"
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {patients.map((patient) => (
                  <div
                    key={patient.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors group"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Link 
                            href={`/patients/${patient.id}`}
                            className="font-semibold hover:underline text-lg truncate"
                          >
                            {patient.firstName} {patient.lastName}
                          </Link>
                          {getStatusBadge(patient.currentStatus)}
                          {patient.triageEntries[0] && getTriageBadge(patient.triageEntries[0].triageLevel)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <IdCard className="w-4 h-4" />
                            <span className="font-medium">ID:</span>
                            <span>{patient.patientNumber}</span>
                          </div>
                          
                          {patient.nationalId && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">National ID:</span>
                              <span>{patient.nationalId}</span>
                            </div>
                          )}
                          
                          {patient.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              <span className="font-medium">Phone:</span>
                              <span>{patient.phone}</span>
                            </div>
                          )}
                          
                          {patient.shaNumber && (
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4" />
                              <span className="font-medium">SHA:</span>
                              <span>{patient.shaNumber}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Age: {calculateAge(patient.dateOfBirth)} years</span>
                          </div>
                          <span className="capitalize">{patient.gender.toLowerCase()}</span>
                          <span>DOB: {formatDate(patient.dateOfBirth)}</span>
                        </div>

                        {patient.currentHospital && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                            <MapPin className="w-3 h-3" />
                            <span>Facility: {patient.currentHospital.name} ({patient.currentHospital.code})</span>
                          </div>
                        )}

                        {patient.triageEntries[0] && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Last visit: {formatDate(patient.triageEntries[0].arrivalTime)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/patients/${patient.id}`}>
                          View Details
                        </Link>
                      </Button>
                      {hasPermission('patients.write') && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/patients/${patient.id}/edit`}>
                            Edit
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      {!hasSearched && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Search by Name</h3>
                  <p className="text-sm text-muted-foreground">Find patients by first or last name</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <IdCard className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Search by ID</h3>
                  <p className="text-sm text-muted-foreground">Find by patient number or national ID</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Phone className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Search by Contact</h3>
                  <p className="text-sm text-muted-foreground">Find by phone number or SHA number</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}