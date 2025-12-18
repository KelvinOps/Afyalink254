// app/components/hospitals/HospitalStats.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Building, Activity, Users, MapPin } from 'lucide-react'

// Mock data - replace with actual API calls
const mockStats = {
  totalHospitals: 247,
  operational: 215,
  acceptingPatients: 189,
  countiesCovered: 42
}

export function HospitalStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Hospitals</CardTitle>
          <Building className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{mockStats.totalHospitals}</div>
          <p className="text-xs text-muted-foreground">
            Across {mockStats.countiesCovered} counties
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Operational</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{mockStats.operational}</div>
          <p className="text-xs text-muted-foreground">
            {Math.round((mockStats.operational / mockStats.totalHospitals) * 100)}% of total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Accepting Patients</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{mockStats.acceptingPatients}</div>
          <p className="text-xs text-muted-foreground">
            Ready for admissions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Counties Covered</CardTitle>
          <MapPin className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{mockStats.countiesCovered}</div>
          <p className="text-xs text-muted-foreground">
            Out of 47 counties
          </p>
        </CardContent>
      </Card>
    </div>
  )
}