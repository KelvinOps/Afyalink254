'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { 
  AlertTriangle, 
  Ambulance, 
  Users, 
  Plus,
  MapPin,
  Clock
} from 'lucide-react';

interface Emergency {
  id: string;
  emergencyNumber: string;
  location: string;
  county: {
    name: string;
  };
}

interface Hospital {
  id: string;
  name: string;
  level: string;
}

interface Ambulance {
  id: string;
  registrationNumber: string;
  type: string;
  status: string;
}

interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  specialization: string;
}

interface Response {
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
}

export default function EmergencyResponsePage() {
  const params = useParams();
  const router = useRouter();
  const [emergency, setEmergency] = useState<Emergency | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewResponse, setShowNewResponse] = useState(false);
  const [newResponse, setNewResponse] = useState({
    hospitalId: '',
    ambulanceId: '',
    staffDeployed: [] as string[],
    equipmentDeployed: [] as any[],
    suppliesDeployed: [] as any[]
  });

  useEffect(() => {
    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [emergencyRes, responsesRes] = await Promise.all([
        fetch(`/api/emergencies/${params.id}`),
        fetch(`/api/emergencies/${params.id}/response`)
      ]);

      if (!emergencyRes.ok || !responsesRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const emergencyData = await emergencyRes.json();
      const responsesData = await responsesRes.json();

      setEmergency(emergencyData);
      setResponses(responsesData);

      // In a real app, you would fetch hospitals, ambulances, and staff based on the emergency's county
      // This is mock data for demonstration
      setHospitals([
        { id: 'hosp-1', name: 'Nairobi General Hospital', level: 'LEVEL_6' },
        { id: 'hosp-2', name: 'Kenyatta National Hospital', level: 'LEVEL_6' },
        { id: 'hosp-3', name: 'Mbagathi County Hospital', level: 'LEVEL_4' }
      ]);

      setAmbulances([
        { id: 'amb-1', registrationNumber: 'KAA 123A', type: 'ALS', status: 'AVAILABLE' },
        { id: 'amb-2', registrationNumber: 'KBB 456B', type: 'BLS', status: 'AVAILABLE' },
        { id: 'amb-3', registrationNumber: 'KCC 789C', type: 'CRITICAL_CARE', status: 'DISPATCHED' }
      ]);

      setStaff([
        { id: 'staff-1', firstName: 'John', lastName: 'Kamau', role: 'PARAMEDIC', specialization: 'Emergency Medicine' },
        { id: 'staff-2', firstName: 'Mary', lastName: 'Wanjiku', role: 'NURSE', specialization: 'Critical Care' },
        { id: 'staff-3', firstName: 'David', lastName: 'Ochieng', role: 'DOCTOR', specialization: 'Emergency Medicine' }
      ]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateResponse = async () => {
    try {
      const response = await fetch(`/api/emergencies/${params.id}/response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newResponse),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create response');
      }

      setShowNewResponse(false);
      setNewResponse({
        hospitalId: '',
        ambulanceId: '',
        staffDeployed: [],
        equipmentDeployed: [],
        suppliesDeployed: []
      });
      fetchData(); // Refresh the responses list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      DISPATCHED: 'bg-blue-100 text-blue-800',
      EN_ROUTE: 'bg-yellow-100 text-yellow-800',
      ON_SCENE: 'bg-orange-100 text-orange-800',
      TREATING: 'bg-purple-100 text-purple-800',
      TRANSPORTING: 'bg-indigo-100 text-indigo-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config[status as keyof typeof config] || 'bg-gray-100'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Emergency Response - {emergency.emergencyNumber}
          </h1>
          <p className="text-muted-foreground text-lg">
            Coordinate response teams for {emergency.location}, {emergency.county.name} County
          </p>
        </div>
        <Button onClick={() => setShowNewResponse(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Deploy Response Team
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Active Responses */}
      <Card>
        <CardHeader>
          <CardTitle>Active Response Teams</CardTitle>
          <CardDescription>
            Teams currently responding to the emergency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hospital</TableHead>
                <TableHead>Ambulance</TableHead>
                <TableHead>Staff Deployed</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dispatched</TableHead>
                <TableHead>Patients</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {responses.map((response) => (
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
                    {getStatusBadge(response.status)}
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
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Update
                      </Button>
                      <Button variant="outline" size="sm">
                        Details
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {responses.length === 0 && (
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

      {/* New Response Form */}
      {showNewResponse && (
        <Card>
          <CardHeader>
            <CardTitle>Deploy New Response Team</CardTitle>
            <CardDescription>
              Assign resources and personnel to respond to the emergency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Hospital *</label>
                  <Select
                    value={newResponse.hospitalId}
                    onValueChange={(value) => setNewResponse(prev => ({ ...prev, hospitalId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select hospital" />
                    </SelectTrigger>
                    <SelectContent>
                      {hospitals.map(hospital => (
                        <SelectItem key={hospital.id} value={hospital.id}>
                          {hospital.name} ({hospital.level})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Ambulance</label>
                  <Select
                    value={newResponse.ambulanceId}
                    onValueChange={(value) => setNewResponse(prev => ({ ...prev, ambulanceId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ambulance (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No ambulance</SelectItem>
                      {ambulances
                        .filter(amb => amb.status === 'AVAILABLE')
                        .map(ambulance => (
                          <SelectItem key={ambulance.id} value={ambulance.id}>
                            {ambulance.registrationNumber} - {ambulance.type}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Staff to Deploy *</label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {staff.map(person => (
                    <div key={person.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`staff-${person.id}`}
                        checked={newResponse.staffDeployed.includes(person.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewResponse(prev => ({
                              ...prev,
                              staffDeployed: [...prev.staffDeployed, person.id]
                            }));
                          } else {
                            setNewResponse(prev => ({
                              ...prev,
                              staffDeployed: prev.staffDeployed.filter(id => id !== person.id)
                            }));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor={`staff-${person.id}`} className="text-sm">
                        {person.firstName} {person.lastName}
                        <br />
                        <span className="text-muted-foreground">
                          {person.role} • {person.specialization}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewResponse(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateResponse}
                  disabled={!newResponse.hospitalId || newResponse.staffDeployed.length === 0}
                >
                  Deploy Response Team
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resource Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              Staff Deployed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {responses.reduce((total, response) => total + response.staffDeployed.length, 0)}
            </div>
            <p className="text-sm text-muted-foreground">
              Healthcare professionals on site
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Ambulance className="h-4 w-4" />
              Ambulances
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {responses.filter(r => r.ambulance).length}
            </div>
            <p className="text-sm text-muted-foreground">
              Vehicles deployed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" />
              Hospitals Involved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(responses.map(r => r.hospital.id)).size}
            </div>
            <p className="text-sm text-muted-foreground">
              Facilities providing support
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}