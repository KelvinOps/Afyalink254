'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { Search, Plus, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Emergency {
  id: string;
  emergencyNumber: string;
  type: string;
  severity: string;
  status: string;
  location: string;
  county: {
    name: string;
    code: string;
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

export default function EmergenciesPage() {
  const router = useRouter();
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    severity: '',
    search: ''
  });

  useEffect(() => {
    fetchEmergencies();
  }, [filters]);

  const fetchEmergencies = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.severity) queryParams.append('severity', filters.severity);
      if (filters.search) queryParams.append('search', filters.search);

      const response = await fetch(`/api/emergencies?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch emergencies');
      
      const data = await response.json();
      setEmergencies(data.emergencies);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      REPORTED: { variant: 'secondary', icon: Clock },
      CONFIRMED: { variant: 'default', icon: AlertTriangle },
      RESPONDING: { variant: 'default', icon: AlertTriangle },
      ON_SCENE: { variant: 'destructive', icon: AlertTriangle },
      UNDER_CONTROL: { variant: 'default', icon: CheckCircle },
      RESOLVED: { variant: 'outline', icon: CheckCircle },
      ARCHIVED: { variant: 'outline', icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.REPORTED;
    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getSeverityBadge = (severity: string) => {
    const severityConfig = {
      MINOR: 'bg-green-100 text-green-800',
      MODERATE: 'bg-blue-100 text-blue-800',
      SEVERE: 'bg-yellow-100 text-yellow-800',
      MAJOR: 'bg-orange-100 text-orange-800',
      CATASTROPHIC: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityConfig[severity as keyof typeof severityConfig] || 'bg-gray-100'}`}>
        {severity}
      </span>
    );
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Emergency Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage emergency situations across counties
          </p>
        </div>
        <Button onClick={() => router.push('/emergencies/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Emergency
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Active Emergencies</CardTitle>
          <CardDescription>
            Filter and search through emergency incidents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search emergencies..."
                className="pl-8"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="REPORTED">Reported</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="RESPONDING">Responding</SelectItem>
                <SelectItem value="ON_SCENE">On Scene</SelectItem>
                <SelectItem value="UNDER_CONTROL">Under Control</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.type}
              onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="TRAFFIC_ACCIDENT">Traffic Accident</SelectItem>
                <SelectItem value="MASS_CASUALTY">Mass Casualty</SelectItem>
                <SelectItem value="NATURAL_DISASTER">Natural Disaster</SelectItem>
                <SelectItem value="FIRE">Fire</SelectItem>
                <SelectItem value="MEDICAL">Medical</SelectItem>
                <SelectItem value="TRAUMA">Trauma</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.severity}
              onValueChange={(value) => setFilters(prev => ({ ...prev, severity: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Severities</SelectItem>
                <SelectItem value="MINOR">Minor</SelectItem>
                <SelectItem value="MODERATE">Moderate</SelectItem>
                <SelectItem value="SEVERE">Severe</SelectItem>
                <SelectItem value="MAJOR">Major</SelectItem>
                <SelectItem value="CATASTROPHIC">Catastrophic</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
                <TableHead>Responses</TableHead>
                <TableHead>Reported</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {emergencies.map((emergency) => (
                <TableRow key={emergency.id} className="cursor-pointer hover:bg-gray-50">
                  <TableCell className="font-medium">{emergency.emergencyNumber}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {emergency.type.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{getSeverityBadge(emergency.severity)}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{emergency.location}</TableCell>
                  <TableCell>{emergency.county.name}</TableCell>
                  <TableCell>{getStatusBadge(emergency.status)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span>Confirmed: {emergency.confirmedCasualties || 0}</span>
                      <span className="text-red-600">Deaths: {emergency.deaths || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span>Teams: {emergency._count.responses}</span>
                      <span>Patients: {emergency._count.patients}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(emergency.reportedAt).toLocaleDateString()}
                    <br />
                    <span className="text-xs text-muted-foreground">
                      {new Date(emergency.reportedAt).toLocaleTimeString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/emergencies/${emergency.id}`)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {emergencies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    No emergencies found matching your criteria
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