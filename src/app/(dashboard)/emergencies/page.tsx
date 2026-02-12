'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { Search, Plus, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';

// Define proper types instead of using any
type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

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
  confirmedCasualties: number | null;
  deaths: number | null;
  responses: Array<{
    id: string;
    status: string;
  }>;
  _count: {
    patients: number;
    responses: number;
  };
}

interface StatusConfig {
  variant: BadgeVariant;
  icon: React.ElementType;
}

interface SeverityConfig {
  [key: string]: string;
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

  // Memoize fetchEmergencies to prevent unnecessary re-renders
  const fetchEmergencies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.severity) queryParams.append('severity', filters.severity);
      if (filters.search) queryParams.append('search', filters.search);

      const response = await fetch(`/api/emergencies?${queryParams}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch emergencies');
      }
      
      const data = await response.json();
      setEmergencies(data.emergencies || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching emergencies');
      console.error('Error fetching emergencies:', err);
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.type, filters.severity, filters.search]);

  useEffect(() => {
    fetchEmergencies();
  }, [fetchEmergencies]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, StatusConfig> = {
      REPORTED: { variant: 'secondary', icon: Clock },
      CONFIRMED: { variant: 'default', icon: AlertTriangle },
      RESPONDING: { variant: 'default', icon: AlertTriangle },
      ON_SCENE: { variant: 'destructive', icon: AlertTriangle },
      UNDER_CONTROL: { variant: 'default', icon: CheckCircle },
      RESOLVED: { variant: 'outline', icon: CheckCircle },
      ARCHIVED: { variant: 'outline', icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig.REPORTED;
    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {status.replace(/_/g, ' ')}
      </Badge>
    );
  };

  const getSeverityBadge = (severity: string) => {
    const severityConfig: SeverityConfig = {
      MINOR: 'bg-green-100 text-green-800 border border-green-200',
      MODERATE: 'bg-blue-100 text-blue-800 border border-blue-200',
      SEVERE: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      MAJOR: 'bg-orange-100 text-orange-800 border border-orange-200',
      CATASTROPHIC: 'bg-red-100 text-red-800 border border-red-200'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityConfig[severity] || 'bg-gray-100 text-gray-800 border border-gray-200'}`}>
        {severity.replace(/_/g, ' ')}
      </span>
    );
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      type: '',
      severity: '',
      search: ''
    });
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return {
        date: date.toLocaleDateString(),
        time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    } catch {
      return { date: 'Invalid date', time: '' };
    }
  };

  if (loading && emergencies.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
          </div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
        </div>
        <Card>
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-1/5 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-2/5 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Active Emergencies</CardTitle>
              <CardDescription>
                Filter and search through emergency incidents
              </CardDescription>
            </div>
            {(filters.status || filters.type || filters.severity || filters.search) && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search emergencies..."
                className="pl-8"
                value={filters.search}
                onChange={handleSearchChange}
              />
            </div>
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
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
              onValueChange={(value) => handleFilterChange('type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="TRAFFIC_ACCIDENT">Traffic Accident</SelectItem>
                <SelectItem value="MASS_CASUALTY">Mass Casualty</SelectItem>
                <SelectItem value="NATURAL_DISASTER">Natural Disaster</SelectItem>
                <SelectItem value="FIRE">Fire</SelectItem>
                <SelectItem value="MEDICAL">Medical</SelectItem>
                <SelectItem value="TRAUMA">Trauma</SelectItem>
                <SelectItem value="OBSTETRIC">Obstetric</SelectItem>
                <SelectItem value="PEDIATRIC">Pediatric</SelectItem>
                <SelectItem value="CARDIAC">Cardiac</SelectItem>
                <SelectItem value="STROKE">Stroke</SelectItem>
                <SelectItem value="RESPIRATORY">Respiratory</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.severity}
              onValueChange={(value) => handleFilterChange('severity', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="MINOR">Minor</SelectItem>
                <SelectItem value="MODERATE">Moderate</SelectItem>
                <SelectItem value="SEVERE">Severe</SelectItem>
                <SelectItem value="MAJOR">Major</SelectItem>
                <SelectItem value="CATASTROPHIC">Catastrophic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Emergency #</TableHead>
                  <TableHead className="whitespace-nowrap">Type</TableHead>
                  <TableHead className="whitespace-nowrap">Severity</TableHead>
                  <TableHead className="whitespace-nowrap">Location</TableHead>
                  <TableHead className="whitespace-nowrap">County</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Casualties</TableHead>
                  <TableHead className="whitespace-nowrap">Responses</TableHead>
                  <TableHead className="whitespace-nowrap">Reported</TableHead>
                  <TableHead className="whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emergencies.map((emergency) => {
                  const formattedDate = formatDate(emergency.reportedAt);
                  return (
                    <TableRow 
                      key={emergency.id} 
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50"
                      onClick={() => router.push(`/emergencies/${emergency.id}`)}
                    >
                      <TableCell className="font-medium whitespace-nowrap">
                        {emergency.emergencyNumber}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="whitespace-nowrap">
                          {emergency.type.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{getSeverityBadge(emergency.severity)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {emergency.location || 'N/A'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {emergency.county?.name || 'N/A'}
                      </TableCell>
                      <TableCell>{getStatusBadge(emergency.status)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm whitespace-nowrap">
                          <span>Confirmed: {emergency.confirmedCasualties || 0}</span>
                          <span className="text-red-600 dark:text-red-400">
                            Deaths: {emergency.deaths || 0}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm whitespace-nowrap">
                          <span>Teams: {emergency._count?.responses || 0}</span>
                          <span>Patients: {emergency._count?.patients || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col whitespace-nowrap">
                          <span>{formattedDate.date}</span>
                          <span className="text-xs text-muted-foreground">
                            {formattedDate.time}
                          </span>
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
                          className="whitespace-nowrap"
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {emergencies.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <AlertTriangle className="h-8 w-8 text-muted-foreground/50" />
                        <p>No emergencies found matching your criteria</p>
                        <Button variant="link" onClick={clearFilters}>
                          Clear all filters
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {emergencies.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {emergencies.length} emergency {emergencies.length === 1 ? 'incident' : 'incidents'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}