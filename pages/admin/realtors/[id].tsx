import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { API, CONTENT_TYPE, UI } from '../../../lib/constants';
import { getMockBrokers } from '../../../lib/mockData';
import { useAuth } from '../../../lib/hooks/useAuth';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import BottomNav from '../../../components/ui/BottomNav';

type RealtorProfileForm = {
  name: string;
  email: string;
  bio: string;
  image: string;
  phone: string;
  availableHours: string;
  brokerId: string;
  isTeamLead: boolean;
};

export default function AdminRealtorProfilePage() {
  const router = useRouter();
  const id = router.query.id as string | undefined;
  const queryClient = useQueryClient();
  const { isAuthenticated, canEditRealtorProfiles, isAdmin, status, user: sessionUser } = useAuth();
  const sessionUserId = (sessionUser as { id?: string; brokerId?: string | null } | undefined)?.id;
  const sessionBrokerId = (sessionUser as { brokerId?: string | null } | undefined)?.brokerId;

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const res = await fetch(`${API.USERS}/${id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load user');
      return res.json();
    },
    enabled: !!id && isAuthenticated && canEditRealtorProfiles,
  });

  const { data: brokers = [] } = useQuery({
    queryKey: ['brokers'],
    queryFn: async () => {
      try {
        const res = await fetch(API.ADMIN_BROKERS, { credentials: 'include' });
        if (res.ok) return res.json();
        return getMockBrokers();
      } catch {
        return getMockBrokers();
      }
    },
    enabled: !!id && canEditRealtorProfiles && isAdmin,
  });

  const role = (sessionUser as { role?: string } | undefined)?.role;
  const canEditThisUser = !!user && (
    isAdmin
    || (role === 'BROKER' && user.brokerId === sessionUserId)
    || (role === 'REALTOR' && (sessionUser as { isTeamLead?: boolean })?.isTeamLead && user.brokerId === sessionBrokerId)
  );
  const isTeamLeadOnly = canEditRealtorProfiles && !isAdmin && role === 'REALTOR';

  const { register, handleSubmit, reset } = useForm<RealtorProfileForm>({
    defaultValues: {
      name: '',
      email: '',
      bio: '',
      image: '',
      phone: '',
      availableHours: '',
      brokerId: '',
      isTeamLead: false,
    },
  });

  useEffect(() => {
    if (!user) return;
    reset({
      name: user.name ?? '',
      email: user.email ?? '',
      bio: user.bio ?? '',
      image: user.image ?? '',
      phone: user.phone ?? '',
      availableHours: user.availableHours ?? '',
      brokerId: user.brokerId ?? '',
      isTeamLead: !!user.isTeamLead,
    });
  }, [user, reset]);

  const mutation = useMutation({
    mutationFn: async (data: RealtorProfileForm) => {
      const res = await fetch(`${API.USERS}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': CONTENT_TYPE.JSON },
        credentials: 'include',
        body: JSON.stringify({
          name: data.name || null,
          email: data.email || undefined,
          bio: data.bio || null,
          image: data.image || null,
          phone: data.phone || null,
          availableHours: data.availableHours || null,
          brokerId: data.brokerId || null,
          ...(isAdmin && { isTeamLead: data.isTeamLead }),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      queryClient.invalidateQueries({ queryKey: ['realtors'] });
      setSuccessMessage(UI.PROFILE_SAVED);
      setTimeout(() => setSuccessMessage(''), 3000);
    },
  });

  const [successMessage, setSuccessMessage] = React.useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/api/auth/signin');
      return;
    }
    if (status === 'authenticated' && !canEditRealtorProfiles) {
      router.replace('/admin');
      return;
    }
  }, [status, canEditRealtorProfiles, router]);

  if (!id || status === 'loading' || (isAuthenticated && !canEditRealtorProfiles)) {
    return (
      <div className="page-container">
        <Header />
        <main className="content-width max-w-2xl pb-16 md:pb-8">
          <p className="text-slate-500 py-8">{UI.LOADING}</p>
        </main>
        <Footer />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="page-container">
      <Header />
      <main className="content-width max-w-2xl pb-16 md:pb-8">
        <div className="py-6">
          <Link href="/admin" className="text-accent-600 hover:underline font-medium text-sm">
            ← {UI.BACK_TO_ADMIN}
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-6">{UI.EDIT_REALTOR_PROFILE}</h1>
        {userLoading && <p className="text-slate-500 py-4">{UI.LOADING}</p>}
        {!userLoading && !user && <p className="text-slate-500 py-4">Realtor not found.</p>}
        {!userLoading && user && !canEditThisUser && <p className="text-red-600 py-4">{UI.ACCESS_DENIED} — You can only edit profiles in your team.</p>}
        {!userLoading && user && canEditThisUser && (
          <form
            onSubmit={handleSubmit((data) => mutation.mutate(data))}
            className="bg-white rounded-lg shadow-card border border-slate-200 p-6 space-y-4"
          >
            <div>
              <label className="label">{UI.NAME}</label>
              <input {...register('name')} className="input-field w-full" />
            </div>
            {!isTeamLeadOnly && (
            <div>
              <label className="label">{UI.EMAIL}</label>
              <input {...register('email')} type="email" className="input-field w-full" required />
            </div>
            )}
            <div>
              <label className="label">{UI.PHONE}</label>
              <input {...register('phone')} type="tel" className="input-field w-full" placeholder="e.g. (705) 555-0100" />
            </div>
            <div>
              <label className="label">{UI.AVAILABLE_HOURS}</label>
              <input {...register('availableHours')} className="input-field w-full" placeholder="e.g. Mon–Fri 9am–5pm" />
            </div>
            <div>
              <label className="label">{UI.BIO}</label>
              <textarea {...register('bio')} className="input-field w-full min-h-[100px]" rows={4} />
            </div>
            <div>
              <label className="label">{UI.PROFILE_IMAGE_URL}</label>
              <input {...register('image')} type="url" className="input-field w-full" placeholder="https://..." />
            </div>
            {!isTeamLeadOnly && (
            <div>
              <label className="label">{UI.BROKER}</label>
              <select {...register('brokerId')} className="input-field w-full">
                <option value="">— None —</option>
                {brokers.map((b: { id: string; name?: string }) => (
                  <option key={b.id} value={b.id}>{b.name ?? b.id}</option>
                ))}
              </select>
            </div>
            )}
            {isAdmin && (
            <div className="flex items-center gap-2">
              <input {...register('isTeamLead')} type="checkbox" id="isTeamLead" className="rounded border-slate-300" />
              <label htmlFor="isTeamLead" className="label mb-0">{UI.TEAM_LEAD}</label>
            </div>
            )}
            {successMessage && <p className="text-green-600 text-sm font-medium">{successMessage}</p>}
            {mutation.isError && <p className="text-red-600 text-sm">Failed to save. Try again.</p>}
            <button type="submit" className="btn-primary" disabled={mutation.isLoading}>
              {mutation.isLoading ? UI.LOADING : UI.SAVE_PROFILE}
            </button>
          </form>
        )}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
