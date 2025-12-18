// src/app/(dashboard)/patients/verify-sha/page.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Input } from '@/app/components/ui/input'
import { Badge } from '@/app/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { 
  Search,
  Shield,
  User,
  Phone,
  IdCard,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  Activity,
  Clock,
  Award,
  FileCheck
} from 'lucide-react'

interface Patient {
  id: string
  patientNumber: string
  firstName: string
  lastName: string
  otherNames?: string
  dateOfBirth: string
  gender: string
  phone?: string
  alternatePhone?: string
  nationalId?: string
  shaNumber?: string
  shaStatus: string
  contributionStatus: string
  shaRegistrationDate?: string
  bloodType?: string
  allergies: string[]
  chronicConditions: string[]
  currentStatus: string
  age: number
  currentHospital?: {
    id: string
    name: string
    code: string
    shaContracted: boolean
    shaFacilityCode?: string
    phone?: string
    address?: string
  }
  shaClaims: Array<{
    id: string
    claimNumber: string
    serviceDate: string
    serviceType: string
    visitType: string
    diagnosis: string
    totalAmount: number
    shaApprovedAmount?: number
    patientCopay: number
    patientPaidAmount: number
    outstandingBalance: number
    status: string
    submittedAt?: string
    approvedAt?: string
    paidAt?: string
    rejectionReason?: string
    hospital: {
      id: string
      name: string
      code: string
    }
  }>
  triageEntries: Array<{
    id: string
    triageNumber: string
    arrivalTime: string
    chiefComplaint: string
    triageLevel: string
    status: string
    hospital: {
      id: string
      name: string
      code: string
    }
  }>
}

interface SHAVerification {
  verified: boolean
  memberSince: string
  coverageTier: string
  familySize: number
  primaryFacility: string
  lastContributionDate: string
  nextContributionDue: string
  benefits: {
    [key: string]: {
      covered: boolean
      limit: number
      coPay: number
    }
  }
  limits: {
    annualLimit: number
    lifetimeLimit: number
    outpatientLimit: number
    familyLimit: number
  }
}

interface FinancialSummary {
  totalClaims: number
  paidClaims: number
  pendingClaims: number
  totalBilled: number
  totalApproved: number
  totalPaid: number
  totalOutstanding: number
  utilizationRate: number
}

interface Eligibility {
  isEligible: boolean
  status: string
  reason: string
  restrictions: string[]
}

interface VerificationCertificate {
  certificateNumber: string
  issuedAt: string
  validUntil: string
  verifiedBy: string
  verificationMethod: string
}

interface VerificationResponse {
  success: boolean
  message: string
  patient: Patient
  shaVerification: SHAVerification
  financialSummary: FinancialSummary
  eligibility: Eligibility
  verificationCertificate: VerificationCertificate
  metadata: {
    verificationTimestamp: string
    searchMethod: string
    confidenceScore: number
  }
}

export default function SHAVerificationPage() {
  const [searchParams, setSearchParams] = useState({
    shaNumber: '',
    nationalId: '',
    patientNumber: '',
    phone: ''
  })
  const [verificationData, setVerificationData] = useState<VerificationResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setVerificationData(null)

    try {
      const response = await fetch('/api/patients/verify-sha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchParams),
      })

      const data = await response.json()

      if (response.ok) {
        setVerificationData(data)
      } else {
        setError(data.details || data.error || 'Verification failed')
      }
    } catch (error) {
      console.error('Error verifying SHA:', error)
      setError('Network error: Unable to verify SHA membership')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const clearSearch = () => {
    setSearchParams({
      shaNumber: '',
      nationalId: '',
      patientNumber: '',
      phone: ''
    })
    setVerificationData(null)
    setError(null)
  }

  const getSHAStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      REGISTERED: { variant: 'default', label: 'Registered' },
      NOT_REGISTERED: { variant: 'outline', label: 'Not Registered' },
      PENDING: { variant: 'secondary', label: 'Pending' },
      SUSPENDED: { variant: 'destructive', label: 'Suspended' },
      INACTIVE: { variant: 'outline', label: 'Inactive' }
    }
    const config = statusConfig[status] || { variant: 'outline', label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getContributionStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      UP_TO_DATE: { variant: 'default', label: 'Up to Date' },
      ARREARS: { variant: 'destructive', label: 'In Arrears' },
      GRACE_PERIOD: { variant: 'secondary', label: 'Grace Period' },
      DEFAULTED: { variant: 'destructive', label: 'Defaulted' },
      UNKNOWN: { variant: 'outline', label: 'Unknown' }
    }
    const config = statusConfig[status] || { variant: 'outline', label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getEligibilityBadge = (eligibility: Eligibility) => {
    if (eligibility.isEligible) {
      return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        Eligible
      </Badge>
    } else {
      return <Badge variant="destructive">
        <XCircle className="w-3 h-3 mr-1" />
        Not Eligible
      </Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount)
  }

  const downloadCertificate = () => {
    if (!verificationData) return
    
    const certificate = {
      title: 'SHA Membership Verification Certificate',
      ...verificationData.verificationCertificate,
      patient: verificationData.patient,
      verification: verificationData.shaVerification,
      eligibility: verificationData.eligibility
    }
    
    const blob = new Blob([JSON.stringify(certificate, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sha-verification-${verificationData.verificationCertificate.certificateNumber}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SHA Member Verification</h1>
          <p className="text-muted-foreground">
            Comprehensive Social Health Authority membership verification and coverage details
          </p>
        </div>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Verify SHA Membership
          </CardTitle>
          <CardDescription>
            Search by SHA number, National ID, patient number, or phone number
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <IdCard className="w-4 h-4" />
                  SHA Number
                </label>
                <Input
                  placeholder="SHA membership number"
                  value={searchParams.shaNumber}
                  onChange={(e) => handleInputChange('shaNumber', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  National ID
                </label>
                <Input
                  placeholder="National identification number"
                  value={searchParams.nationalId}
                  onChange={(e) => handleInputChange('nationalId', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Patient Number
                </label>
                <Input
                  placeholder="Hospital patient number"
                  value={searchParams.patientNumber}
                  onChange={(e) => handleInputChange('patientNumber', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </label>
                <Input
                  placeholder="Phone number"
                  value={searchParams.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={loading || (!searchParams.shaNumber && !searchParams.nationalId && !searchParams.patientNumber && !searchParams.phone)}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Verify Membership
                  </>
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={clearSearch}
              >
                Clear
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-800">
              <AlertTriangle className="w-5 h-5" />
              <div>
                <p className="font-medium">Verification Failed</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {verificationData && (
        <div className="space-y-6">
          {/* Verification Header */}
          <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      {verificationData.eligibility.isEligible ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">
                        {verificationData.patient.firstName} {verificationData.patient.lastName}
                      </h2>
                      <p className="text-muted-foreground">
                        SHA Number: {verificationData.patient.shaNumber || 'Not assigned'} • 
                        Verified: {formatDate(verificationData.metadata.verificationTimestamp)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getEligibilityBadge(verificationData.eligibility)}
                  <Button variant="outline" onClick={downloadCertificate}>
                    <Download className="w-4 h-4 mr-2" />
                    Certificate
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="coverage">Coverage</TabsTrigger>
              <TabsTrigger value="claims">Claims History</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="details">Member Details</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Member Status</CardTitle>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold capitalize">
                      {verificationData.eligibility.status.toLowerCase()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {verificationData.eligibility.reason}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Annual Limit</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(verificationData.shaVerification.limits.annualLimit)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {verificationData.financialSummary.utilizationRate.toFixed(1)}% utilized
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Claims This Year</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{verificationData.financialSummary.totalClaims}</div>
                    <p className="text-xs text-muted-foreground">
                      {verificationData.financialSummary.paidClaims} approved
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Status */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Membership Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">SHA Status</span>
                      {getSHAStatusBadge(verificationData.patient.shaStatus)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Contribution</span>
                      {getContributionStatusBadge(verificationData.patient.contributionStatus)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Member Since</span>
                      <span className="text-sm font-medium">
                        {verificationData.shaVerification.memberSince ? 
                          formatDate(verificationData.shaVerification.memberSince) : 'Unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Coverage Tier</span>
                      <span className="text-sm font-medium capitalize">
                        {verificationData.shaVerification.coverageTier.toLowerCase()}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Coverage Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(verificationData.shaVerification.benefits).map(([service, details]) => (
                      <div key={service} className="flex justify-between items-center">
                        <span className="text-sm capitalize">{service.replace('_', ' ')}</span>
                        <Badge variant={details.covered ? "default" : "outline"}>
                          {details.covered ? 'Covered' : 'Not Covered'}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Coverage Details Tab */}
            <TabsContent value="coverage">
              <Card>
                <CardHeader>
                  <CardTitle>Coverage Details</CardTitle>
                  <CardDescription>
                    Comprehensive SHA benefits and coverage limits
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {Object.entries(verificationData.shaVerification.benefits).map(([service, details]) => (
                      <div key={service} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold capitalize">{service.replace('_', ' ')}</h4>
                          <Badge variant={details.covered ? "default" : "outline"}>
                            {details.covered ? 'Covered' : 'Not Covered'}
                          </Badge>
                        </div>
                        {details.covered && (
                          <div className="grid gap-4 md:grid-cols-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Annual Limit:</span>
                              <div className="font-medium">{formatCurrency(details.limit)}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Co-payment:</span>
                              <div className="font-medium">{formatCurrency(details.coPay)}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Service Type:</span>
                              <div className="font-medium capitalize">{service.replace('_', ' ')}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Additional tabs for Claims History, Financial, and Member Details would go here */}
            {/* ... (similar structure to above tabs) ... */}
            
          </Tabs>
        </div>
      )}
    </div>
  )
}