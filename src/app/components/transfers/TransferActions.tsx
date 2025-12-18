'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Transfer } from '@/app/types/transfer.types';

interface TransferActionsProps {
  transfer: Transfer;
  session: any;
  onUpdate: () => void;
  action?: string | null;
}

export function TransferActions({ transfer, session, onUpdate, action }: TransferActionsProps) {
  const [currentAction, setCurrentAction] = useState<string | null>(action || null);
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/transfers/${transfer.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bedReserved: true,
          acceptedByName: session?.user.name,
        }),
      });

      if (response.ok) {
        onUpdate();
        setCurrentAction(null);
      }
    } catch (error) {
      console.error('Error approving transfer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (rejectionReason: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/transfers/${transfer.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rejectionReason,
        }),
      });

      if (response.ok) {
        onUpdate();
        setCurrentAction(null);
      }
    } catch (error) {
      console.error('Error rejecting transfer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (confirm('Are you sure you want to cancel this transfer?')) {
      try {
        setLoading(true);
        const response = await fetch(`/api/transfers/${transfer.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          onUpdate();
          setCurrentAction(null);
        }
      } catch (error) {
        console.error('Error cancelling transfer:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <>
      <Dialog open={currentAction !== null} onOpenChange={() => setCurrentAction(null)}>
        <DialogContent>
          {currentAction === 'approve' && (
            <>
              <DialogHeader>
                <DialogTitle>Approve Transfer</DialogTitle>
                <DialogDescription>
                  Are you sure you want to approve this transfer request?
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentAction(null)}
                >
                  Cancel
                </Button>
                <Button onClick={handleApprove} disabled={loading}>
                  {loading ? 'Approving...' : 'Approve Transfer'}
                </Button>
              </div>
            </>
          )}

          {currentAction === 'reject' && (
            <>
              <DialogHeader>
                <DialogTitle>Reject Transfer</DialogTitle>
                <DialogDescription>
                  Please provide a reason for rejecting this transfer request.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <textarea
                  className="w-full h-24 p-2 border rounded-md"
                  placeholder="Enter rejection reason..."
                  id="rejectionReason"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentAction(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      const reason = (document.getElementById('rejectionReason') as HTMLTextAreaElement)?.value;
                      if (reason.trim()) {
                        handleReject(reason);
                      } else {
                        alert('Please enter a rejection reason');
                      }
                    }}
                    disabled={loading}
                  >
                    {loading ? 'Rejecting...' : 'Reject Transfer'}
                  </Button>
                </div>
              </div>
            </>
          )}

          {currentAction === 'cancel' && (
            <>
              <DialogHeader>
                <DialogTitle>Cancel Transfer</DialogTitle>
                <DialogDescription>
                  Are you sure you want to cancel this transfer? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentAction(null)}
                >
                  Keep Transfer
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  {loading ? 'Cancelling...' : 'Cancel Transfer'}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}