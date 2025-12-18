// src/app/(dashboard)/patients/[id]/claims/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Input } from '@/app/components/ui/input'
import { 
  ArrowLeft,
  Shield,
  Search,
  Filter,
  Download,
  User,
  Calendar,
  DollarSign,
  FileText,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'

interface Patient {
  id: string
  patientNumber: string
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: string
  shaNumber: string
  shaStatus: string
  contributionStatus: string
}

interface SHAClaim {
  id: string
  claimNumber: string
  serviceDate: string
  serviceType: string
  visitType: string
  diagnosis: string
  totalAmount: number
  shaApprovedAmount: number
  patientCopay: number
  patientPaidAmount: number
  outstandingBalance: number
  status: string
  submittedAt: string
  approvedAt: string
  paidAt: string
  rejectionReason: string
  hospital: {
    id: string
    name: string
    code: string
  }
}

export default function PatientClaimsPage() {
  const params = useParams()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [claims, setClaims] = useState<SHAClaim[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const patientId = params.id as string

  useEffect(() => {
    const fetchPatientClaims = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/patients/${patientId}`)
        const data = await response.json()

        if (response.ok) {
          setPatient(data)
          setClaims(data.shaClaims || [])
        } else {
          console.error('Error fetching patient claims:', data.error)
        }
      } catch (error) {
        console.error('Error fetching patient claims:', error)
      } finally {
        setLoading(false)
      }
    }

    if (patientId) {
      fetchPatientClaims()
    }
  }, [patientId])

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = searchTerm === '' || 
      claim.claimNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.hospital.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === '' || claim.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      DRAFT: { variant: 'outline', label: 'Draft' },
      SUBMITTED: { variant: 'secondary', label: 'Submitted' },
      RECEIVED: { variant: 'secondary', label: 'Received' },
      IN_REVIEW: { variant: 'secondary', label: 'In Review' },
      APPROVED: { variant: 'default', label: 'Approved' },
      PARTIALLY_APPROVED: { variant: 'secondary', label: 'Partially Approved' },
      REJECTED: { variant: 'destructive', label: 'Rejected' },
      PAID: { variant: 'default', label: 'Paid' },
      RESUBMITTED: { variant: 'secondary', label: 'Resubmitted' }
    }

    const config = statusConfig[status] || { variant: 'outline', label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount)
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

  // Calculate statistics
  const totalClaims = claims.length
  const totalAmount = claims.reduce((sum, claim) => sum + claim.totalAmount, 0)
  const totalApproved = claims.reduce((sum, claim) => sum + (claim.shaApprovedAmount || 0), 0)
  const totalPaid = claims.reduce((sum, claim) => sum + (claim.patientPaidAmount || 0), 0)
  const pendingClaims = claims.filter(claim => 
    ['SUBMITTED', 'RECEIVED', 'IN_REVIEW', 'RESUBMITTED'].includes(claim.status)
  ).length

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="text-center py-8">
        <User className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Patient not found</h3>
        <p className="text-muted-foreground">
          The patient you're looking for doesn't exist.
        </p>
        <Button asChild className="mt-4">
          <Link href="/patients">
            Back to Patients
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/patients/${patientId}`}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              SHA Claims: {patient.firstName} {patient.lastName}
            </h1>
            <p className="text-muted-foreground">
              {patient.patientNumber} • {patient.shaNumber || 'No SHA Number'} • {calculateAge(patient.dateOfBirth)} years
            </p>
          </div>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Claims
        </Button>
      </div>

      {/* SHA Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            SHA Insurance Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">SHA Number</div>
              <div className="text-lg font-semibold">
                {patient.shaNumber || 'Not Registered'}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Status</div>
              <Badge variant={patient.shaStatus === 'REGISTERED' ? 'default' : 'outline'}>
                {patient.shaStatus.replace('_', ' ')}
              </Badge>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Contribution</div>
              <Badge variant={patient.contributionStatus === 'UP_TO_DATE' ? 'default' : 'outline'}>
                {patient.contributionStatus.replace('_', ' ')}
              </Badge>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Total Claims</div>
              <div className="text-lg font-semibold">{totalClaims}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Claims Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Claims Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
            <p className="text-xs text-muted-foreground">
              All submitted claims
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SHA Approved</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalApproved)}</div>
            <p className="text-xs text-muted-foreground">
              Approved by SHA
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patient Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPaid)}</div>
            <p className="text-xs text-muted-foreground">
              Copayments made
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Claims</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingClaims}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting processing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search Claims</CardTitle>
          <CardDescription>
            Filter claims by status, hospital, or claim number
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by claim number, diagnosis, or hospital..."
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
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">All Status</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="APPROVED">Approved</option>
                <option value="PAID">Paid</option>
                <option value="REJECTED">Rejected</option>
              </select>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('')
                }}
              >
                <Filter className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Claims List */}
      <Card>
        <CardHeader>
          <CardTitle>SHA Claims History</CardTitle>
          <CardDescription>
            {filteredClaims.length} of {claims.length} claims found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredClaims.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No claims found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter ? 'Try adjusting your search criteria' : 'No SHA claims recorded for this patient'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredClaims.map((claim) => (
                <div key={claim.id} className="border rounded-lg p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{claim.claimNumber}</h3>
                        {getStatusBadge(claim.status)}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Service: {formatDate(claim.serviceDate)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          <span>{claim.hospital.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>Type: {claim.serviceType.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>Visit: {claim.visitType.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Financial Summary</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Total Amount:</span>
                          <span className="font-medium">{formatCurrency(claim.totalAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>SHA Approved:</span>
                          <span className="font-medium text-green-600">
                            {formatCurrency(claim.shaApprovedAmount || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Patient Copay:</span>
                          <span className="font-medium">{formatCurrency(claim.patientCopay)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Outstanding:</span>
                          <span className="font-medium text-red-600">
                            {formatCurrency(claim.outstandingBalance)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm mb-2">Diagnosis</h4>
                      <p className="text-sm">{claim.diagnosis}</p>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm mb-2">Timeline</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Submitted:</span>
                          <span>{formatDate(claim.submittedAt)}</span>
                        </div>
                        {claim.approvedAt && (
                          <div className="flex justify-between">
                            <span>Approved:</span>
                            <span>{formatDate(claim.approvedAt)}</span>
                          </div>
                        )}
                        {claim.paidAt && (
                          <div className="flex justify-between">
                            <span>Paid:</span>
                            <span>{formatDate(claim.paidAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {claim.rejectionReason && (
                      <div>
                        <h4 className="font-medium text-sm mb-2 text-red-600">Rejection Reason</h4>
                        <p className="text-sm text-red-600">{claim.rejectionReason}</p>
                      </div>
                    )}
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