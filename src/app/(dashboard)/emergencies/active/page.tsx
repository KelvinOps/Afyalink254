'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Users,
  Ambulance,
  Eye
} from 'lucide-react';

interface Emergency {
  id: string;
  emergencyNumber: string;
  type: string;
  severity: string;
  status: string;
  location: string;
  county: {
    name: string;
  };
  reportedAt: string;
  confirmedCasualties: number;
  deaths: number;
  responses: Array<{
    id: string;
    status: string;
  }>;
  _count: {
    patients: number;
    responses: number;
  };
}

export default function ActiveEmergenciesPage() {
  const router = useRouter();
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActiveEmergencies();
  }, []);

  const fetchActiveEmergencies = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/emergencies?status=REPORTED,CONFIRMED,RESPONDING,ON_SCENE');
      if (!response.ok) throw new Error('Failed to fetch active emergencies');
      
      const data = await response.json();
      setEmergencies(data.emergencies);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const config = {
      REPORTED: { color: 'text-blue-600 bg-blue-100', label: 'Reported' },
      CONFIRMED: { color: 'text-orange-600 bg-orange-100', label: 'Confirmed' },
      RESPONDING: { color: 'text-yellow-600 bg-yellow-100', label: 'Responding' },
      ON_SCENE: { color: 'text-red-600 bg-red-100', label: 'On Scene' }
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
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Active Emergencies</h1>
        <p className="text-muted-foreground">
          Real-time monitoring of ongoing emergency situations
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4" />
              Total Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emergencies.length}</div>
            <p className="text-sm text-muted-foreground">Ongoing emergencies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              Total Casualties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {emergencies.reduce((sum, e) => sum + (e.confirmedCasualties || 0), 0)}
            </div>
            <p className="text-sm text-muted-foreground">Confirmed affected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Ambulance className="h-4 w-4" />
              Response Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {emergencies.reduce((sum, e) => sum + e._count.responses, 0)}
            </div>
            <p className="text-sm text-muted-foreground">Teams deployed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" />
              Counties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(emergencies.map(e => e.county.name)).size}
            </div>
            <p className="text-sm text-muted-foreground">Counties affected</p>
          </CardContent>
        </Card>
      </div>

      {/* Emergencies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Emergency Incidents</CardTitle>
          <CardDescription>
            Click on any emergency to view details and manage response
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Emergency #</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>County</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Casualties</TableHead>
                <TableHead>Teams</TableHead>
                <TableHead>Reported</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {emergencies.map((emergency) => {
                const statusConfig = getStatusConfig(emergency.status);
                return (
                  <TableRow 
                    key={emergency.id} 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push(`/emergencies/${emergency.id}`)}
                  >
                    <TableCell className="font-medium">{emergency.emergencyNumber}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {emergency.type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityConfig(emergency.severity)}`}>
                        {emergency.severity}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {emergency.location}
                      </div>
                    </TableCell>
                    <TableCell>{emergency.county.name}</TableCell>
                    <TableCell>
                      <Badge className={statusConfig.color}>
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <span>Confirmed: {emergency.confirmedCasualties || 0}</span>
                        <span className="text-red-600">Deaths: {emergency.deaths || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Ambulance className="h-3 w-3" />
                        {emergency._count.responses} teams
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3" />
                        {new Date(emergency.reportedAt).toLocaleTimeString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(emergency.reportedAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/emergencies/${emergency.id}`);
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {emergencies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                      <div>No active emergencies</div>
                      <div className="text-sm">All emergency situations are currently under control</div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}