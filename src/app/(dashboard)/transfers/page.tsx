'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { MoreHorizontal, Plus, Search, Filter } from 'lucide-react';

interface Patient {
  id: string;
  patientNumber: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
}

interface Hospital {
  id: string;
  name: string;
  code: string;
}

interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Ambulance {
  id: string;
  registrationNumber: string;
}

interface Transfer {
  id: string;
  transferNumber: string;
  patientId: string;
  patient: Patient;
  originHospitalId: string;
  originHospital: Hospital;
  destinationHospitalId: string;
  destinationHospital: Hospital;
  reason: string;
  urgency: string;
  diagnosis: string;
  transportMode: string;
  status: string;
  requestedAt: string;
  ambulance?: Ambulance;
  initiatedBy: Staff;
}

interface TransfersResponse {
  transfers: Transfer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Extended session type to include permissions
interface ExtendedSession {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    permissions?: string[];
    role?: string;
  };
}

export default function TransfersPage() {
  const { data: session, status } = useSession() as { data: ExtendedSession | null; status: string };
  const router = useRouter();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    if (status === 'authenticated') {
      fetchTransfers();
    }
  }, [status, pagination.page, statusFilter]);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/transfers?${params}`);
      if (response.ok) {
        const data: TransfersResponse = await response.json();
        setTransfers(data.transfers);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching transfers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fixed badge variants - only use supported ones
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "destructive" | "outline" | "secondary"; label: string }> = {
      REQUESTED: { variant: 'secondary', label: 'Requested' },
      APPROVED: { variant: 'default', label: 'Approved' },
      REJECTED: { variant: 'destructive', label: 'Rejected' },
      IN_TRANSIT: { variant: 'secondary', label: 'In Transit' }, // Changed from 'warning'
      COMPLETED: { variant: 'default', label: 'Completed' }, // Changed from 'success'
      CANCELLED: { variant: 'outline', label: 'Cancelled' },
    };

    const config = statusConfig[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getUrgencyBadge = (urgency: string) => {
    const urgencyConfig: Record<string, { variant: "default" | "destructive" | "outline" | "secondary"; label: string }> = {
      IMMEDIATE: { variant: 'destructive', label: 'Immediate' },
      URGENT: { variant: 'default', label: 'Urgent' }, // Changed from 'warning'
      SCHEDULED: { variant: 'default', label: 'Scheduled' },
      ROUTINE: { variant: 'secondary', label: 'Routine' },
    };

    const config = urgencyConfig[urgency] || { variant: 'secondary', label: urgency };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Safe permission check
  const canWriteTransfers = session?.user?.permissions?.includes('transfers.write') || 
                           session?.user?.permissions?.includes('*') ||
                           session?.user?.role === 'SUPER_ADMIN' ||
                           session?.user?.role === 'HOSPITAL_ADMIN' ||
                           session?.user?.role === 'DOCTOR';

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patient Transfers</h1>
          <p className="text-muted-foreground">
            Manage inter-facility patient transfers and referrals
          </p>
        </div>
        <Button onClick={() => router.push('/transfers/new')}>
          <Plus className="w-4 h-4 mr-2" />
          New Transfer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Transfer Requests</CardTitle>
              <CardDescription>
                View and manage all patient transfer requests
              </CardDescription>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transfers..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="REQUESTED">Requested</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transfer #</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.map((transfer) => (
                <TableRow key={transfer.id}>
                  <TableCell className="font-medium">
                    {transfer.transferNumber}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {transfer.patient.firstName} {transfer.patient.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {transfer.patient.patientNumber}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {transfer.originHospital.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {transfer.originHospital.code}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {transfer.destinationHospital.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {transfer.destinationHospital.code}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getUrgencyBadge(transfer.urgency)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(transfer.status)}
                  </TableCell>
                  <TableCell>
                    {new Date(transfer.requestedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/transfers/${transfer.id}`)}
                        >
                          View Details
                        </DropdownMenuItem>
                        {canWriteTransfers && (
                          <>
                            {transfer.status === 'REQUESTED' && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => router.push(`/transfers/${transfer.id}?action=edit`)}
                                >
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => router.push(`/transfers/${transfer.id}?action=cancel`)}
                                  className="text-red-600"
                                >
                                  Cancel
                                </DropdownMenuItem>
                              </>
                            )}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {transfers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="text-muted-foreground">
                      No transfer requests found
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