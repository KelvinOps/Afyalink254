'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Users, 
  Ambulance, 
  MapPin,
  Phone,
  User,
  Calendar
} from 'lucide-react';

interface Emergency {
  id: string;
  emergencyNumber: string;
  type: string;
  severity: string;
  status: string;
  location: string;
  coordinates: any;
  description: string;
  cause: string;
  estimatedCasualties: number;
  confirmedCasualties: number;
  injuredCount: number;
  criticalCount: number;
  deaths: number;
  minorInjuries: number;
  reportedAt: string;
  verifiedAt: string;
  respondedAt: string;
  underControlAt: string;
  resolvedAt: string;
  incidentCommander: string;
  incidentCommanderPhone: string;
  commandCenterLocation: string;
  policeNotified: boolean;
  fireServiceNotified: boolean;
  redCrossNotified: boolean;
  militaryInvolved: boolean;
  mediaAlertIssued: boolean;
  county: {
    name: string;
    governorName: string;
    healthCECName: string;
    countyHealthDirector: string;
  };
  responses: Array<{
    id: string;
    status: string;
    dispatchedAt: string;
    arrivedAt: string;
    completedAt: string;
    patientsTriaged: number;
    patientsTransported: number;
    ambulance: {
      registrationNumber: string;
      type: string;
    } | null;
    staffDeployed: Array<{
      id: string;
      firstName: string;
      lastName: string;
      role: string;
    }>;
    hospital: {
      name: string;
      level: string;
    };
  }>;
  patients: Array<{
    id: string;
    patientNumber: string;
    firstName: string;
    lastName: string;
    triageEntries: Array<{
      triageLevel: string;
      status: string;
    }>;
  }>;
  affectedHospitals: Array<{
    id: string;
    name: string;
    level: string;
    availableBeds: number;
    availableIcuBeds: number;
  }>;
}

export default function EmergencyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [emergency, setEmergency] = useState<Emergency | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchEmergency();
    }
  }, [params.id]);

  const fetchEmergency = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/emergencies/${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch emergency');
      const data = await response.json();
      setEmergency(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const config = {
      REPORTED: { color: 'text-blue-600 bg-blue-100', icon: Clock },
      CONFIRMED: { color: 'text-orange-600 bg-orange-100', icon: AlertTriangle },
      RESPONDING: { color: 'text-yellow-600 bg-yellow-100', icon: AlertTriangle },
      ON_SCENE: { color: 'text-red-600 bg-red-100', icon: AlertTriangle },
      UNDER_CONTROL: { color: 'text-green-600 bg-green-100', icon: CheckCircle },
      RESOLVED: { color: 'text-gray-600 bg-gray-100', icon: CheckCircle },
      ARCHIVED: { color: 'text-gray-400 bg-gray-100', icon: CheckCircle }
    };
    return config[status as keyof typeof config] || config.REPORTED;
  };

  const getSeverityConfig = (severity: string) => {
    const config = {
      MINOR: 'text-green-800 bg-green-100',
      MODERATE: 'text-blue-800 bg-blue-100',
      SEVERE: 'text-yellow-800 bg-yellow-100',
      MAJOR: 'text-orange-800 bg-orange-100',
      CATASTROPHIC: 'text-red-800 bg-red-100'
    };
    return config[severity as keyof typeof config] || 'text-gray-800 bg-gray-100';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !emergency) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error || 'Emergency not found'}
        </AlertDescription>
      </Alert>
    );
  }

  const statusConfig = getStatusConfig(emergency.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {emergency.emergencyNumber}
            </h1>
            <Badge className={statusConfig.color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {emergency.status.replace('_', ' ')}
            </Badge>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityConfig(emergency.severity)}`}>
              {emergency.severity}
            </span>
          </div>
          <p className="text-muted-foreground text-lg">
            {emergency.type.replace('_', ' ')} • {emergency.location} • {emergency.county.name} County
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => router.push(`/emergencies/${emergency.id}/response`)}
          >
            Manage Response
          </Button>
          <Button onClick={() => router.push('/emergencies')}>
            Back to List
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="responses">Response Teams</TabsTrigger>
          <TabsTrigger value="patients">Patients</TabsTrigger>
          <TabsTrigger value="hospitals">Hospitals</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Casualty Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Casualty Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Estimated:</span>
                    <span className="font-medium">{emergency.estimatedCasualties || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Confirmed:</span>
                    <span className="font-medium">{emergency.confirmedCasualties || 0}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Deaths:</span>
                    <span className="font-medium">{emergency.deaths || 0}</span>
                  </div>
                  <div className="flex justify-between text-orange-600">
                    <span>Critical:</span>
                    <span className="font-medium">{emergency.criticalCount || 0}</span>
                  </div>
                  <div className="flex justify-between text-yellow-600">
                    <span>Injured:</span>
                    <span className="font-medium">{emergency.injuredCount || 0}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Minor:</span>
                    <span className="font-medium">{emergency.minorInjuries || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Response Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Ambulance className="h-5 w-5" />
                  Response Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Response Teams:</span>
                    <span className="font-medium">{emergency.responses.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Patients Involved:</span>
                    <span className="font-medium">{emergency.patients.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hospitals Affected:</span>
                    <span className="font-medium">{emergency.affectedHospitals.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location & Contact */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location & Contact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-muted-foreground">Location</div>
                    <div className="font-medium">{emergency.location}</div>
                  </div>
                  {emergency.incidentCommander && (
                    <div>
                      <div className="text-sm text-muted-foreground">Incident Commander</div>
                      <div className="font-medium">{emergency.incidentCommander}</div>
                      {emergency.incidentCommanderPhone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {emergency.incidentCommanderPhone}
                        </div>
                      )}
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-muted-foreground">County Health Director</div>
                    <div className="font-medium">{emergency.county.countyHealthDirector}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Description & Details */}
          <Card>
            <CardHeader>
              <CardTitle>Emergency Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-muted-foreground">{emergency.description}</p>
              </div>
              {emergency.cause && (
                <div>
                  <h4 className="font-medium mb-2">Cause</h4>
                  <p className="text-muted-foreground">{emergency.cause}</p>
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{emergency.policeNotified ? '✓' : '✗'}</div>
                  <div className="text-sm text-muted-foreground">Police</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{emergency.fireServiceNotified ? '✓' : '✗'}</div>
                  <div className="text-sm text-muted-foreground">Fire Service</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{emergency.redCrossNotified ? '✓' : '✗'}</div>
                  <div className="text-sm text-muted-foreground">Red Cross</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{emergency.mediaAlertIssued ? '✓' : '✗'}</div>
                  <div className="text-sm text-muted-foreground">Media Alert</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Responses Tab */}
        <TabsContent value="responses">
          <Card>
            <CardHeader>
              <CardTitle>Response Teams</CardTitle>
              <CardDescription>
                Emergency response teams deployed to the incident
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hospital</TableHead>
                    <TableHead>Ambulance</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dispatched</TableHead>
                    <TableHead>Patients</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emergency.responses.map((response) => (
                    <TableRow key={response.id}>
                      <TableCell>
                        <div className="font-medium">{response.hospital.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {response.hospital.level}
                        </div>
                      </TableCell>
                      <TableCell>
                        {response.ambulance ? (
                          <div>
                            <div className="font-medium">{response.ambulance.registrationNumber}</div>
                            <div className="text-sm text-muted-foreground">
                              {response.ambulance.type}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No ambulance</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {response.staffDeployed.slice(0, 2).map(staff => (
                            <div key={staff.id}>
                              {staff.firstName} {staff.lastName} ({staff.role})
                            </div>
                          ))}
                          {response.staffDeployed.length > 2 && (
                            <div className="text-muted-foreground">
                              +{response.staffDeployed.length - 2} more
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          response.status === 'COMPLETED' ? 'default' :
                          response.status === 'ON_SCENE' ? 'destructive' :
                          'secondary'
                        }>
                          {response.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(response.dispatchedAt).toLocaleTimeString()}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {new Date(response.dispatchedAt).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Triaged: {response.patientsTriaged || 0}</div>
                          <div>Transported: {response.patientsTransported || 0}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {emergency.responses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No response teams deployed yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Patients Tab */}
        <TabsContent value="patients">
          <Card>
            <CardHeader>
              <CardTitle>Patients Involved</CardTitle>
              <CardDescription>
                Patients associated with this emergency incident
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Triage Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emergency.patients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">{patient.patientNumber}</TableCell>
                      <TableCell>
                        {patient.firstName} {patient.lastName}
                      </TableCell>
                      <TableCell>
                        {patient.triageEntries[0] && (
                          <Badge variant={
                            patient.triageEntries[0].triageLevel === 'IMMEDIATE' ? 'destructive' :
                            patient.triageEntries[0].triageLevel === 'URGENT' ? 'default' :
                            'secondary'
                          }>
                            {patient.triageEntries[0].triageLevel}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {patient.triageEntries[0] && (
                          <span className="text-sm">
                            {patient.triageEntries[0].status.replace('_', ' ')}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          View Patient
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {emergency.patients.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No patients associated with this emergency
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hospitals Tab */}
        <TabsContent value="hospitals">
          <Card>
            <CardHeader>
              <CardTitle>Affected Hospitals</CardTitle>
              <CardDescription>
                Hospitals receiving patients from this emergency
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {emergency.affectedHospitals.map((hospital) => (
                  <Card key={hospital.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{hospital.name}</CardTitle>
                      <CardDescription>{hospital.level}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Available Beds:</span>
                          <span className={
                            hospital.availableBeds < 5 ? 'text-red-600 font-medium' :
                            hospital.availableBeds < 10 ? 'text-orange-600' : 'text-green-600'
                          }>
                            {hospital.availableBeds}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>ICU Beds:</span>
                          <span className={
                            hospital.availableIcuBeds === 0 ? 'text-red-600 font-medium' :
                            hospital.availableIcuBeds < 3 ? 'text-orange-600' : 'text-green-600'
                          }>
                            {hospital.availableIcuBeds}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {emergency.affectedHospitals.length === 0 && (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    No hospitals currently affected
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Emergency Timeline</CardTitle>
              <CardDescription>
                Key events and milestones in the emergency response
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-blue-600 rounded-full" />
                    <div className="w-0.5 h-16 bg-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">Emergency Reported</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(emergency.reportedAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                {emergency.verifiedAt && (
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-green-600 rounded-full" />
                      <div className="w-0.5 h-16 bg-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">Emergency Verified</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(emergency.verifiedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}

                {emergency.respondedAt && (
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-orange-600 rounded-full" />
                      <div className="w-0.5 h-16 bg-orange-600" />
                    </div>
                    <div>
                      <div className="font-medium">Response Initiated</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(emergency.respondedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}

                {emergency.underControlAt && (
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-purple-600 rounded-full" />
                      <div className="w-0.5 h-16 bg-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium">Situation Under Control</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(emergency.underControlAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}

                {emergency.resolvedAt && (
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-gray-600 rounded-full" />
                    </div>
                    <div>
                      <div className="font-medium">Emergency Resolved</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(emergency.resolvedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}