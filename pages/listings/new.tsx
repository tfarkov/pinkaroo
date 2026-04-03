import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/hooks/useAuth';
import DashboardLayout from '../../components/DashboardLayout';
import ListingForm from '../../components/ListingForm';

export default function NewListingPage() {
  const router = useRouter();
  const { isRealtor, isBroker, isOfficeAdmin, isSystemAdmin, status } = useAuth();
  const canAddListing = isRealtor || isBroker || isOfficeAdmin || isSystemAdmin;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/signin?callbackUrl=/listings/new');
      return;
    }
    if (status === 'authenticated' && !canAddListing) {
      router.replace('/');
    }
  }, [status, canAddListing, router]);

  if (status === 'loading') {
    return (
      <DashboardLayout>
        <p className="text-slate-500 py-8">Loading…</p>
      </DashboardLayout>
    );
  }

  if (!canAddListing) {
    return (
      <DashboardLayout>
        <p className="text-slate-500 py-8">Access denied.</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-slate-900 py-8">Add Listing</h1>
      <ListingForm />
    </DashboardLayout>
  );
}
