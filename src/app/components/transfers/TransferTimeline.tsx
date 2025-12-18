import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Transfer } from '@/app/types/transfer.types';

interface TransferTimelineProps {
  transfer: Transfer;
}

export function TransferTimeline({ transfer }: TransferTimelineProps) {
  const timelineEvents = [
    {
      event: 'Transfer Requested',
      timestamp: transfer.requestedAt,
      status: 'completed',
      description: `Requested by ${transfer.initiatedBy.firstName} ${transfer.initiatedBy.lastName}`,
    },
    ...(transfer.approvedAt ? [{
      event: 'Transfer Approved',
      timestamp: transfer.approvedAt,
      status: 'completed',
      description: transfer.approvedBy 
        ? `Approved by ${transfer.approvedBy.firstName} ${transfer.approvedBy.lastName}`
        : 'Approved by destination hospital',
    }] : []),
    ...(transfer.rejectedAt ? [{
      event: 'Transfer Rejected',
      timestamp: transfer.rejectedAt,
      status: 'completed',
      description: transfer.rejectionReason 
        ? `Rejected: ${transfer.rejectionReason}`
        : 'Rejected by destination hospital',
    }] : []),
    ...(transfer.departureTime ? [{
      event: 'Departed Origin',
      timestamp: transfer.departureTime,
      status: 'completed',
      description: 'Patient departed from origin hospital',
    }] : []),
    ...(transfer.arrivalTime ? [{
      event: 'Arrived at Destination',
      timestamp: transfer.arrivalTime,
      status: 'completed',
      description: 'Patient arrived at destination hospital',
    }] : []),
    ...(transfer.completedAt ? [{
      event: 'Transfer Completed',
      timestamp: transfer.completedAt,
      status: 'completed',
      description: 'Transfer process completed',
    }] : []),
    ...(transfer.cancelledAt ? [{
      event: 'Transfer Cancelled',
      timestamp: transfer.cancelledAt,
      status: 'completed',
      description: transfer.cancellationReason 
        ? `Cancelled: ${transfer.cancellationReason}`
        : 'Transfer was cancelled',
    }] : []),
  ].filter(Boolean);

  const getCurrentStep = () => {
    if (transfer.cancelledAt) return timelineEvents.length - 1;
    if (transfer.completedAt) return timelineEvents.length - 1;
    if (transfer.arrivalTime) return timelineEvents.findIndex(event => event.event === 'Arrived at Destination');
    if (transfer.departureTime) return timelineEvents.findIndex(event => event.event === 'Departed Origin');
    if (transfer.approvedAt) return timelineEvents.findIndex(event => event.event === 'Transfer Approved');
    if (transfer.rejectedAt) return timelineEvents.findIndex(event => event.event === 'Transfer Rejected');
    return 0; // Requested
  };

  const currentStep = getCurrentStep();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transfer Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {timelineEvents.map((event, index) => (
            <div key={event.event} className="flex items-start space-x-4">
              <div className="flex flex-col items-center">
                <div
                  className={`w-3 h-3 rounded-full ${
                    index <= currentStep ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
                {index < timelineEvents.length - 1 && (
                  <div
                    className={`w-0.5 h-8 ${
                      index < currentStep ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
              <div className="flex-1 space-y-1 pb-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{event.event}</p>
                  <Badge
                    variant={index <= currentStep ? 'default' : 'outline'}
                    className="text-xs"
                  >
                    {index <= currentStep ? 'Completed' : 'Pending'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(event.timestamp).toLocaleString()}
                </p>
                {event.description && (
                  <p className="text-sm text-muted-foreground">
                    {event.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}