// app/components/hospitals/HospitalOverview.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { MapPin, Phone, Mail, Users, Activity, Building, Shield, AlertTriangle } from 'lucide-react'
import type { Hospital } from '@/app/lib/types'

// Define User type locally since it's not exported from your types
interface User {
  id: string
  email: string
  name: string
  role: string
  facilityId?: string
  countyId?: string
  permissions: string[]
}

interface HospitalOverviewProps {
  hospital: Hospital
  user?: User | null
  showDetailedView?: boolean
}

export function HospitalOverview({ hospital, user, showDetailedView = true }: HospitalOverviewProps) {
  const [activeTab, setActiveTab] = useState('details')

  // Helper function to convert Date to string if needed
  const normalizeHospitalData = (hospital: Hospital): Hospital => {
    return {
      ...hospital,
      lastBedUpdate: typeof hospital.lastBedUpdate === 'string' 
        ? hospital.lastBedUpdate 
        : (hospital.lastBedUpdate as any)?.toISOString?.() || new Date().toISOString()
    }
  }

  const normalizedHospital = normalizeHospitalData(hospital)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPERATIONAL': return 'bg-green-100 text-green-800 border-green-200'
      case 'LIMITED_CAPACITY': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'OVERWHELMED': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'CLOSED': return 'bg-red-100 text-red-800 border-red-200'
      case 'EMERGENCY_ONLY': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'LEVEL_6': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'LEVEL_5': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'LEVEL_4': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Simplified view when showDetailedView is false
  const renderSimplifiedView = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Building className="h-6 w-6 text-blue-600" />
                <CardTitle className="text-2xl">{normalizedHospital.name}</CardTitle>
              </div>
              <CardDescription className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {normalizedHospital.address}, {normalizedHospital.subCounty}, {normalizedHospital.county?.name}
                </span>
                <Badge variant="secondary" className={getLevelColor(normalizedHospital.level)}>
                  {normalizedHospital.level.replace('_', ' ')}
                </Badge>
                <Badge variant="outline" className={getStatusColor(normalizedHospital.operationalStatus)}>
                  {normalizedHospital.operationalStatus.replace(/_/g, ' ')}
                </Badge>
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {normalizedHospital.acceptingPatients ? (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  Accepting Patients
                </Badge>
              ) : (
                <Badge variant="destructive">Not Accepting Patients</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total Beds</p>
              <p className="font-medium">{normalizedHospital.totalBeds}</p>
            </div>
            <div>
              <p className="text-muted-foreground">ICU Beds</p>
              <p className="font-medium">{normalizedHospital.icuBeds}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Emergency Beds</p>
              <p className="font-medium">{normalizedHospital.emergencyBeds}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Contact</p>
              <p className="font-medium">{normalizedHospital.phone}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  if (!showDetailedView) {
    return renderSimplifiedView()
  }

  return (
    <div className="space-y-6">
      {/* Hospital Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Building className="h-6 w-6 text-blue-600" />
                <CardTitle className="text-2xl">{normalizedHospital.name}</CardTitle>
              </div>
              <CardDescription className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {normalizedHospital.address}, {normalizedHospital.subCounty}, {normalizedHospital.county?.name}
                </span>
                <Badge variant="secondary" className={getLevelColor(normalizedHospital.level)}>
                  {normalizedHospital.level.replace('_', ' ')}
                </Badge>
                <Badge variant="outline" className={getStatusColor(normalizedHospital.operationalStatus)}>
                  {normalizedHospital.operationalStatus.replace(/_/g, ' ')}
                </Badge>
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {normalizedHospital.acceptingPatients ? (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  Accepting Patients
                </Badge>
              ) : (
                <Badge variant="destructive">Not Accepting Patients</Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="capacity">Capacity</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Type</p>
                    <p className="font-medium">{normalizedHospital.type.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ownership</p>
                    <p className="font-medium">{normalizedHospital.ownership.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">MFL Code</p>
                    <p className="font-medium">{normalizedHospital.mflCode || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Hospital Code</p>
                    <p className="font-medium">{normalizedHospital.code}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Main Phone</p>
                      <p className="font-medium">{normalizedHospital.phone}</p>
                    </div>
                  </div>
                  {normalizedHospital.emergencyPhone && (
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Emergency</p>
                        <p className="font-medium">{normalizedHospital.emergencyPhone}</p>
                      </div>
                    </div>
                  )}
                  {normalizedHospital.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Email</p>
                        <p className="font-medium">{normalizedHospital.email}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Capacity Tab */}
        <TabsContent value="capacity" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Beds
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{normalizedHospital.totalBeds}</div>
                <p className="text-xs text-muted-foreground">
                  {normalizedHospital.functionalBeds} functional
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">ICU Beds</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{normalizedHospital.icuBeds}</div>
                <p className="text-xs text-muted-foreground">
                  {normalizedHospital.availableIcuBeds} available
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Emergency Beds</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{normalizedHospital.emergencyBeds}</div>
                <p className="text-xs text-muted-foreground">
                  {normalizedHospital.availableEmergencyBeds} available
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Maternity Beds</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{normalizedHospital.maternityBeds}</div>
                <p className="text-xs text-muted-foreground">Specialized care</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {normalizedHospital.has24HourService && (
                  <Badge variant="secondary" className="justify-center">24/7 Service</Badge>
                )}
                {normalizedHospital.hasAmbulance && (
                  <Badge variant="secondary" className="justify-center">Ambulance</Badge>
                )}
                {normalizedHospital.hasBloodBank && (
                  <Badge variant="secondary" className="justify-center">Blood Bank</Badge>
                )}
                {normalizedHospital.hasLaboratory && (
                  <Badge variant="secondary" className="justify-center">Laboratory</Badge>
                )}
                {normalizedHospital.hasRadiology && (
                  <Badge variant="secondary" className="justify-center">Radiology</Badge>
                )}
                {normalizedHospital.hasCTScan && (
                  <Badge variant="secondary" className="justify-center">CT Scan</Badge>
                )}
                {normalizedHospital.hasMRI && (
                  <Badge variant="secondary" className="justify-center">MRI</Badge>
                )}
                {normalizedHospital.hasDialysis && (
                  <Badge variant="secondary" className="justify-center">Dialysis</Badge>
                )}
                {normalizedHospital.hasPharmacy && (
                  <Badge variant="secondary" className="justify-center">Pharmacy</Badge>
                )}
                {normalizedHospital.hasOxygenPlant && (
                  <Badge variant="secondary" className="justify-center">Oxygen Plant</Badge>
                )}
                {normalizedHospital.hasMortuary && (
                  <Badge variant="secondary" className="justify-center">Mortuary</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Infrastructure Tab */}
        <TabsContent value="infrastructure" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Infrastructure Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Power</span>
                    <Badge variant="outline">{normalizedHospital.powerStatus}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Water</span>
                    <Badge variant="outline">{normalizedHospital.waterStatus}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Oxygen</span>
                    <Badge variant="outline">{normalizedHospital.oxygenStatus}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Internet</span>
                    <Badge variant="outline">{normalizedHospital.internetStatus}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Backup Power</span>
                    <Badge variant={normalizedHospital.backupPower ? "default" : "secondary"}>
                      {normalizedHospital.backupPower ? "Available" : "Not Available"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Telemedicine</span>
                    <Badge variant={normalizedHospital.telemedicineEnabled ? "default" : "secondary"}>
                      {normalizedHospital.telemedicineEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">SHA Contracted</span>
                    <Badge variant={normalizedHospital.shaContracted ? "default" : "secondary"}>
                      {normalizedHospital.shaContracted ? "Yes" : "No"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}