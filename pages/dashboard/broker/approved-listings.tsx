import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../lib/hooks/useAuth';
import { useUnitToggle } from '../../../lib/hooks/useUnitToggle';
import { API, UI } from '../../../lib/constants';
import { listingToListingBasic } from '../../../lib/listings/listingResponse';
import { getMockBrokerApprovedListings } from '../../../lib/mockData';
import DashboardLayout from '../../../components/DashboardLayout';
import ListingCard from '../../../components/ListingCard';

export default function BrokerApprovedListings() {
  const { isBroker } = useAuth();
  const { isMetric } = useUnitToggle();

  const { data: approvedListings = [] } = useQuery({
    queryKey: ['broker-approved'],
    queryFn: async () => {
      try {
        const res = await fetch(API.BROKER_APPROVED_LISTINGS, { credentials: 'include' });
        if (res.ok) return res.json();
        return getMockBrokerApprovedListings();
      } catch {
        return getMockBrokerApprovedListings();
      }
    },
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
      <h1 className="text-3xl font-bold text-slate-900 mb-2">{UI.APPROVED_LISTINGS}</h1>
      <p className="text-slate-600 text-sm mb-8 max-w-3xl">
        Listings you have approved. They appear on the public site once office has filed them on MLS and sync has run. Open a card for full details.
      </p>

      {approvedListings.length === 0 ? (
        <p className="text-slate-600 text-sm">No approved listings yet.</p>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {approvedListings.map(
            (
              listing: Record<string, unknown> & {
                id: string;
                mlsId?: string | null;
                user?: { name?: string | null };
              }
            ) => {
              const hasMls = listing.mlsId != null && String(listing.mlsId).trim() !== '';
              return (
                <div key={listing.id} className="flex flex-col gap-3">
                  <p className="text-sm text-slate-600">
                    Listed by <span className="font-medium text-slate-800">{listing.user?.name ?? '—'}</span>
                  </p>
                  <ListingCard listing={listingToListingBasic(listing)} isMetric={isMetric} />
                  <p className={`text-xs font-medium ${hasMls ? 'text-green-700' : 'text-amber-800'}`}>
                    {hasMls ? `On MLS · ${String(listing.mlsId).trim()}` : 'Awaiting MLS filing / sync'}
                  </p>
                </div>
              );
            }
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
