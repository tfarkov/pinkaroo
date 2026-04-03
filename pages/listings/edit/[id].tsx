import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../lib/hooks/useAuth';
import DashboardLayout from '../../../components/DashboardLayout';
import ListingForm from '../../../components/ListingForm';
import { API, UI } from '../../../lib/constants';

export default function EditListingDraftPage() {
  const router = useRouter();
  const { id } = router.query;
  const { isRealtor, isBroker, isOfficeAdmin, isSystemAdmin, status, user } = useAuth();
  const canEdit = isRealtor || isBroker || isOfficeAdmin || isSystemAdmin;
  const idStr = typeof id === 'string' ? id : '';
  const sessionUserId = (user as { id?: string } | undefined)?.id;

  const { data: listing, isFetched } = useQuery({
    queryKey: ['listing', idStr],
    queryFn: async () => {
      const res = await fetch(`${API.LISTINGS}/${idStr}`, { credentials: 'include' });
      if (!res.ok) return undefined;
      return res.json();
    },
    enabled: !!idStr,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(`/signin?callbackUrl=${encodeURIComponent(`/listings/edit/${idStr}`)}`);
    }
  }, [status, router, idStr]);

  useEffect(() => {
    if (status === 'authenticated' && !canEdit) {
      router.replace('/');
    }
  }, [status, canEdit, router]);

  useEffect(() => {
    if (!isFetched || !listing || !sessionUserId) return;
    if (listing.userId !== sessionUserId) {
      router.replace('/');
      return;
    }
    if (listing.status !== 'DRAFT') {
      router.replace(`/listings/${listing.id}`);
    }
  }, [isFetched, listing, sessionUserId, router]);

  if (status === 'loading' || !router.isReady) {
    return (
      <DashboardLayout>
        <p className="text-slate-500 py-8">{UI.LOADING}</p>
      </DashboardLayout>
    );
  }

  if (!canEdit) {
    return (
      <DashboardLayout>
        <p className="text-slate-500 py-8">{UI.ACCESS_DENIED}</p>
      </DashboardLayout>
    );
  }

  if (!idStr || !isFetched) {
    return (
      <DashboardLayout>
        <p className="text-slate-500 py-8">{UI.LOADING}</p>
      </DashboardLayout>
    );
  }

  if (!listing) {
    return (
      <DashboardLayout>
        <p className="text-slate-500 py-8">Listing not found.</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-wrap items-center justify-between gap-4 py-8">
        <h1 className="text-3xl font-bold text-slate-900">{UI.EDIT_DRAFT_LISTING}</h1>
        <Link href={`/listings/${listing.id}`} className="text-sm font-semibold text-accent-600 hover:underline">
          Preview as buyer
        </Link>
      </div>
      <ListingForm listing={listing} hideHeading />
    </DashboardLayout>
  );
}
