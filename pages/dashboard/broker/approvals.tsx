import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../lib/hooks/useAuth';
import { API, CONTENT_TYPE, LISTING_STATUSES, UI } from '../../../lib/constants';
import { getMockBrokerPendingListings } from '../../../lib/mockData';
import DashboardLayout from '../../../components/DashboardLayout';

export default function BrokerApprovals() {
  const { isBroker } = useAuth();
  const [selectedListing, setSelectedListing] = useState(null);
  const queryClient = useQueryClient();
  const { register, handleSubmit } = useForm<{ rejectionReason: string }>();

  const { data: pendingListings = [] } = useQuery({
    queryKey: ['broker-pending'],
    queryFn: async () => {
      try {
        const res = await fetch(API.BROKER_PENDING_LISTINGS);
        if (res.ok) return res.json();
        return getMockBrokerPendingListings();
      } catch {
        return getMockBrokerPendingListings();
      }
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => fetch(API.BROKER_APPROVE_LISTING, { method: 'POST', body: JSON.stringify({ id, status: LISTING_STATUSES[2] }), headers: { 'Content-Type': CONTENT_TYPE.JSON } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['broker-pending'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, rejectionReason }: { id: string; rejectionReason: string }) => fetch(API.BROKER_APPROVE_LISTING, { method: 'POST', body: JSON.stringify({ id, status: LISTING_STATUSES[3], rejectionReason }), headers: { 'Content-Type': CONTENT_TYPE.JSON } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['broker-pending'] }),
  });

  if (!isBroker) {
    return (
      <DashboardLayout>
        <div className="py-20 flex items-center justify-center">
          <p className="text-slate-600 font-medium">{UI.ACCESS_DENIED}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-slate-900 mb-8">{UI.PENDING_APPROVALS}</h1>

        <div className="space-y-6">
          {pendingListings.map((listing: any) => (
            <div key={listing.id} className="bg-white rounded-lg shadow-card border border-slate-200 p-6">
              <div className="flex flex-wrap justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900">{listing.title}</h3>
                  <p className="text-sm text-slate-600">By {listing.user?.name ?? '—'}</p>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => approveMutation.mutate(listing.id)} className="btn-primary bg-emerald-600 hover:bg-emerald-700">
                    Approve
                  </button>
                  <button type="button" onClick={() => setSelectedListing(listing)} className="btn-secondary border-red-300 text-red-700 hover:border-red-500 hover:text-red-800">
                    Reject
                  </button>
                </div>
              </div>
              <p className="text-slate-700">{listing.description}</p>
            </div>
          ))}
        </div>

        {selectedListing && (
          <form onSubmit={handleSubmit((data) => rejectMutation.mutate({ id: selectedListing.id, rejectionReason: data.rejectionReason }))} className="mt-8 bg-white rounded-lg shadow-card border border-slate-200 p-6">
            <label className="label">Rejection reason</label>
            <textarea {...register('rejectionReason')} placeholder="Rejection reason" className="input-field min-h-[100px] mb-4" required />
            <div className="flex flex-wrap gap-3">
              <button type="submit" className="btn-primary bg-red-600 hover:bg-red-700">Submit Rejection</button>
              <button type="button" onClick={() => setSelectedListing(null)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        )}
    </DashboardLayout>
  );
}
