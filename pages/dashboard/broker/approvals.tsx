import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../lib/hooks/useAuth';
import { API, CONTENT_TYPE, LISTING_STATUSES, UI } from '../../../lib/constants';
import Header from '../../../components/Header';
import BottomNav from '../../../components/ui/BottomNav';

export default function BrokerApprovals() {
  const { isBroker } = useAuth();
  const [selectedListing, setSelectedListing] = useState(null);
  const queryClient = useQueryClient();
  const { register, handleSubmit } = useForm<{ rejectionReason: string }>();

  const { data: pendingListings = [] } = useQuery({
    queryKey: ['broker-pending'],
    queryFn: () => fetch(API.BROKER_PENDING_LISTINGS).then(r => r.json()),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => fetch(API.BROKER_APPROVE_LISTING, { method: 'POST', body: JSON.stringify({ id, status: LISTING_STATUSES[2] }), headers: { 'Content-Type': CONTENT_TYPE.JSON } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['broker-pending'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, rejectionReason }: { id: string; rejectionReason: string }) => fetch(API.BROKER_APPROVE_LISTING, { method: 'POST', body: JSON.stringify({ id, status: LISTING_STATUSES[3], rejectionReason }), headers: { 'Content-Type': CONTENT_TYPE.JSON } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['broker-pending'] }),
  });

  if (!isBroker) return <div>{UI.ACCESS_DENIED}</div>;

  return (
    <div>
      <Header />
      <main className="p-6 max-w-5xl mx-auto pb-16 md:pb-0">
        <h1 className="text-3xl font-bold mb-8">{UI.PENDING_APPROVALS}</h1>

        <div className="space-y-6">
          {pendingListings.map((listing: any) => (
            <div key={listing.id} className="border rounded-3xl p-6">
              <div className="flex justify-between mb-4">
                <div>
                  <h3 className="font-semibold">{listing.title}</h3>
                  <p className="text-sm text-gray-600">By {listing.user.name}</p>
                </div>
                <div className="space-x-3">
                  <button onClick={() => approveMutation.mutate(listing.id)} className="bg-green-600 text-white px-4 py-2 rounded">Approve</button>
                  <button onClick={() => setSelectedListing(listing)} className="bg-red-600 text-white px-4 py-2 rounded">Reject</button>
                </div>
              </div>
              <p className="text-gray-700">{listing.description}</p>
            </div>
          ))}
        </div>

        {selectedListing && (
          <form onSubmit={handleSubmit((data) => rejectMutation.mutate({ id: selectedListing.id, rejectionReason: data.rejectionReason }))}>
            <textarea {...register('rejectionReason')} placeholder="Rejection reason" className="w-full p-4 border rounded mb-4" required />
            <button type="submit" className="bg-red-600 text-white px-6 py-3 rounded">Submit Rejection</button>
            <button type="button" onClick={() => setSelectedListing(null)} className="ml-3 border px-6 py-3 rounded">Cancel</button>
          </form>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
